const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');

// --- Job Postings ---

// GET /api/recruitment/jobs
router.get('/jobs', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM job_postings ORDER BY posted_date DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/recruitment/jobs
router.post('/jobs', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { title, dept, location, type, experience, salaryRange, description, requirements } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const [result] = await pool.query(
      `INSERT INTO job_postings (title, dept, location, type, experience, salary_range, description, requirements, posted_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [title, dept || '', location || '', type || 'Full-time', experience || '', salaryRange || '', description || '', requirements || '']
    );
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('job:created', { id: result.insertId, title });
    }
    res.status(201).json({ message: 'Job posted', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/recruitment/jobs/:id
router.put('/jobs/:id', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { title, dept, location, type, experience, salaryRange, description, requirements, status } = req.body;
    await pool.query(
      `UPDATE job_postings SET title=?, dept=?, location=?, type=?, experience=?, salary_range=?, description=?, requirements=?, status=? WHERE id=?`,
      [title, dept, location, type, experience, salaryRange, description, requirements, status || 'Open', req.params.id]
    );
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('job:updated', { id: parseInt(req.params.id), title, status: status || 'Open' });
    }
    res.json({ message: 'Job updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Candidates ---

// GET /api/recruitment/candidates
router.get('/candidates', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, j.title as job_title FROM candidates c LEFT JOIN job_postings j ON c.job_id = j.id ORDER BY c.applied_date DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/recruitment/candidates
router.post('/candidates', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { name, email, phone, jobId, rating, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const [result] = await pool.query(
      'INSERT INTO candidates (name, email, phone, job_id, rating, notes, applied_date) VALUES (?, ?, ?, ?, ?, ?, CURDATE())',
      [name, email || '', phone || '', jobId || null, rating || null, notes || '']
    );
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('candidate:created', { id: result.insertId, name, jobId: jobId || null });
    }
    res.status(201).json({ message: 'Candidate added', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/recruitment/candidates/:id/move — move pipeline stage
router.patch('/candidates/:id/move', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { stage } = req.body;
    const validStages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }
    await pool.query('UPDATE candidates SET stage = ? WHERE id = ?', [stage, req.params.id]);
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('candidate:moved', { id: parseInt(req.params.id), stage });
    }
    res.json({ message: `Candidate moved to ${stage}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- AI Resume Screening ---

// Shared screening logic (avoids SSRF via internal HTTP fetch)
async function screenCandidate(candidateId) {
  const [candidates] = await pool.query(
    `SELECT c.*, j.title as job_title, j.dept as job_dept, j.requirements as job_requirements,
            j.experience as job_experience, j.salary_range as job_salary_range, j.description as job_description
     FROM candidates c LEFT JOIN job_postings j ON c.job_id = j.id WHERE c.id = ?`,
    [candidateId]
  );
  if (candidates.length === 0) return null;
  const candidate = candidates[0];

  const client = new Anthropic();
  const response = await client.messages.create({
    model: process.env.AI_MODEL || 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `You are an HR screening assistant for Swetha Structures, a steel building and PEB fabrication company in Coimbatore, Tamil Nadu. Evaluate candidates for construction/manufacturing roles. Return ONLY valid JSON with no markdown.`,
    messages: [{
      role: 'user',
      content: `Screen this candidate for the job posting:

JOB: ${candidate.job_title || 'General'}
Department: ${candidate.job_dept || 'Not specified'}
Requirements: ${candidate.job_requirements || 'Not specified'}
Experience needed: ${candidate.job_experience || 'Not specified'}
Salary range: ${candidate.job_salary_range || 'Not specified'}
Description: ${candidate.job_description || 'Not specified'}

CANDIDATE: ${candidate.name}
Email: ${candidate.email || 'N/A'}
Phone: ${candidate.phone || 'N/A'}
Notes/Skills: ${candidate.notes || 'No details provided'}
Current stage: ${candidate.stage}
Manual rating: ${candidate.rating || 'Not rated'}

Return JSON: {"score":0-100,"strengths":["..."],"concerns":["..."],"recommendation":"Advance|Hold|Reject","summary":"2-3 sentence summary"}`
    }]
  });

  let result;
  const text = response.content[0].text.trim();
  try {
    result = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    result = match ? JSON.parse(match[0]) : { score: 50, strengths: [], concerns: ['Could not parse AI response'], recommendation: 'Hold', summary: text.substring(0, 200) };
  }

  await pool.query(
    'UPDATE candidates SET ai_score = ?, ai_summary = ?, ai_screened_at = NOW() WHERE id = ?',
    [result.score, JSON.stringify(result), candidateId]
  );

  return { candidateId: candidate.id, candidateName: candidate.name, ...result };
}

// POST /api/recruitment/candidates/:id/ai-screen
router.post('/candidates/:id/ai-screen', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({ error: 'ANTHROPIC_API_KEY not configured in server/.env' });
    }
    const result = await screenCandidate(req.params.id);
    if (!result) return res.status(404).json({ error: 'Candidate not found' });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/recruitment/jobs/:id/ai-screen-all — batch screen all candidates for a job
router.post('/jobs/:id/ai-screen-all', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({ error: 'ANTHROPIC_API_KEY not configured in server/.env' });
    }

    const [candidates] = await pool.query('SELECT id FROM candidates WHERE job_id = ?', [req.params.id]);
    if (candidates.length === 0) return res.status(404).json({ error: 'No candidates for this job' });

    const results = [];
    for (const c of candidates) {
      try {
        const data = await screenCandidate(c.id);
        if (data) results.push(data);
      } catch (err) {
        console.error(err);
        results.push({ candidateId: c.id, error: 'Screening failed' });
      }
    }

    results.sort((a, b) => (b.score || 0) - (a.score || 0));
    res.json({ jobId: parseInt(req.params.id, 10), screened: results.length, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
