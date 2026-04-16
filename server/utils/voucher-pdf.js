// Voucher PDF generator for expense reimbursements and advance requests.
// Produces a one-page A4 voucher with branding, employee details, amount,
// approval chain, and (when present) the receipt image embedded.
//
// Usage:
//   const { generateVoucherPDF } = require('../utils/voucher-pdf');
//   const buf = await generateVoucherPDF({ kind: 'expense'|'advance', record, receiptPath });

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const COMPANY_NAME = 'Swetha Structures Pvt Ltd';
const COMPANY_TAGLINE = 'Pre-Engineered Building Solutions';
const COLOR_PRIMARY = '#1d4ed8';
const COLOR_TEXT = '#111827';
const COLOR_MUTED = '#6b7280';
const COLOR_BORDER = '#e5e7eb';

function fmtINR(n) {
  if (n === null || n === undefined || n === '') return '-';
  const num = Number(n);
  if (isNaN(num)) return String(n);
  return 'Rs. ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return '-';
  try { return new Date(d).toISOString().slice(0, 10); } catch (e) { return String(d); }
}

// Resolve a stored URL like '/uploads/xyz.png' to an absolute fs path under server/uploads.
// Returns null when the file is missing or the URL points outside the uploads dir
// (defence in depth — refuse to embed arbitrary paths).
function resolveReceiptPath(receiptUrl) {
  if (!receiptUrl) return null;
  const filename = path.basename(String(receiptUrl));
  if (!filename || filename.startsWith('.')) return null;
  const uploadsDir = path.resolve(path.join(__dirname, '..', 'uploads'));
  const fullPath = path.join(uploadsDir, filename);
  // Confirm the resolved path is still inside uploadsDir
  if (!fullPath.startsWith(uploadsDir + path.sep) && fullPath !== uploadsDir) return null;
  if (!fs.existsSync(fullPath)) return null;
  return fullPath;
}

function isImage(filePath) {
  const ext = (path.extname(filePath) || '').toLowerCase();
  return ext === '.png' || ext === '.jpg' || ext === '.jpeg';
}

function drawHeader(doc) {
  doc.fillColor(COLOR_PRIMARY).fontSize(18).font('Helvetica-Bold').text(COMPANY_NAME, { align: 'left' });
  doc.fillColor(COLOR_MUTED).fontSize(9).font('Helvetica').text(COMPANY_TAGLINE);
  doc.moveDown(0.5);
  doc.strokeColor(COLOR_BORDER).lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.6);
}

function drawTitleBlock(doc, title, voucherNo, generatedAt) {
  doc.fillColor(COLOR_TEXT).fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.moveDown(0.2);
  doc.fillColor(COLOR_MUTED).fontSize(9).font('Helvetica')
    .text('Voucher No: ' + voucherNo + '   |   Generated: ' + generatedAt, { align: 'center' });
  doc.moveDown(0.8);
}

function drawKeyValueGrid(doc, pairs) {
  // Two-column key:value grid.
  const startX = 40;
  const colWidth = 257;
  const rowHeight = 20;
  let x = startX;
  let y = doc.y;
  pairs.forEach((p, idx) => {
    doc.fillColor(COLOR_MUTED).fontSize(8).font('Helvetica').text(p.label.toUpperCase(), x, y, { width: colWidth - 10 });
    doc.fillColor(COLOR_TEXT).fontSize(11).font('Helvetica-Bold').text(p.value || '-', x, y + 9, { width: colWidth - 10 });
    if (idx % 2 === 0) {
      x = startX + colWidth + 1;
    } else {
      x = startX;
      y += rowHeight + 12;
    }
  });
  // Move pen below the grid
  if (pairs.length % 2 !== 0) y += rowHeight + 12;
  doc.y = y + 6;
}

function drawSectionTitle(doc, text) {
  doc.moveDown(0.6);
  doc.fillColor(COLOR_PRIMARY).fontSize(11).font('Helvetica-Bold').text(text);
  doc.strokeColor(COLOR_BORDER).lineWidth(0.5).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
  doc.moveDown(0.4);
}

function drawApprovalChain(doc, record, kind) {
  drawSectionTitle(doc, 'Approval Chain');
  // Build chain steps based on actual stored fields.
  const steps = [];
  steps.push({ label: 'Submitted by Employee', who: record.emp_name || record.emp_code || '-', when: kind === 'advance' ? fmtDate(record.applied_date) : fmtDate(record.submitted_at) });
  if (record.reviewed_by && record.review_date) {
    // First review = Accounts (in the new flow). Approve audit trail simplified by using
    // the stored reviewed_by who was the latest actor — for legacy hr_accepted rows this
    // may have been HR, but the migration relabels them as accounts_accepted.
    steps.push({ label: 'Accounts Accepted', who: record.reviewed_by, when: fmtDate(record.review_date) });
  }
  if (record.status === 'Approved' || record.status === 'Paid' || record.status === 'approved' || record.status === 'paid') {
    steps.push({ label: 'MD Approved', who: record.reviewed_by || 'MD', when: fmtDate(record.review_date) });
  }
  if (record.paid_by && record.paid_date) {
    steps.push({ label: 'Paid by Accounts', who: record.paid_by, when: fmtDate(record.paid_date) });
  }
  if (String(record.status).toLowerCase() === 'rejected') {
    steps.push({ label: 'REJECTED', who: record.reviewed_by || '-', when: fmtDate(record.review_date) });
  }
  steps.forEach(s => {
    doc.fillColor(COLOR_TEXT).fontSize(10).font('Helvetica-Bold').text(s.label, { continued: true });
    doc.fillColor(COLOR_MUTED).font('Helvetica').text('  -  ' + s.who + (s.when !== '-' ? '  on  ' + s.when : ''));
  });
}

function drawFooter(doc, kind) {
  // Place footer near page bottom (Y ~ 760 on A4 595x842 with 40 margins)
  doc.fillColor(COLOR_MUTED).fontSize(8).font('Helvetica');
  doc.text('This is a system-generated ' + kind + ' voucher. Signatures below indicate physical confirmation if required.',
    40, 760, { width: 515, align: 'center' });
  // Signature blocks
  const yLine = 800;
  doc.strokeColor(COLOR_BORDER).lineWidth(0.5);
  ['Employee', 'Accounts', 'MD'].forEach((label, i) => {
    const x = 40 + i * 175;
    doc.moveTo(x, yLine).lineTo(x + 150, yLine).stroke();
    doc.fillColor(COLOR_MUTED).fontSize(8).text(label, x, yLine + 4, { width: 150, align: 'center' });
  });
}

async function generateVoucherPDF({ kind, record }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      drawHeader(doc);

      const isExpense = kind === 'expense';
      const title = isExpense ? 'EXPENSE REIMBURSEMENT VOUCHER' : 'ADVANCE REQUEST VOUCHER';
      const voucherPrefix = isExpense ? 'EXP' : 'ADV';
      const voucherNo = voucherPrefix + '-' + String(record.id).padStart(6, '0');
      drawTitleBlock(doc, title, voucherNo, fmtDate(new Date()));

      // Key/value pairs differ slightly between expense and advance.
      const pairs = [
        { label: 'Employee Name', value: record.emp_name || '-' },
        { label: 'Employee Code', value: record.emp_code || '-' },
        { label: 'Department',    value: record.dept || '-' },
        { label: isExpense ? 'Category' : 'Type', value: (isExpense ? record.category : record.type) || '-' },
        { label: 'Amount',        value: fmtINR(record.amount) },
        { label: 'Status',        value: String(record.status || '-').toUpperCase() }
      ];
      if (isExpense) {
        pairs.push({ label: 'Expense Date',  value: fmtDate(record.expense_date) });
        pairs.push({ label: 'Expense Type',  value: record.expense_type || '-' });
        if (record.project) pairs.push({ label: 'Project', value: record.project });
        if (record.travel_from || record.travel_to) {
          pairs.push({ label: 'Travel Route', value: (record.travel_from || '?') + ' → ' + (record.travel_to || '?') });
          pairs.push({ label: 'Travel KM',    value: String(record.travel_km || '-') });
        }
      } else {
        pairs.push({ label: 'Applied Date', value: fmtDate(record.applied_date) });
        pairs.push({ label: 'Urgency',      value: record.urgency || 'normal' });
        if (record.project)  pairs.push({ label: 'Project',  value: record.project });
        if (record.category) pairs.push({ label: 'Category', value: record.category });
        if (record.travel_from || record.travel_to) {
          pairs.push({ label: 'Travel Route', value: (record.travel_from || '?') + ' → ' + (record.travel_to || '?') });
          pairs.push({ label: 'Travel KM',    value: String(record.travel_km || '-') });
        }
        if (record.emi_amount && record.emi_months) {
          pairs.push({ label: 'EMI',          value: fmtINR(record.emi_amount) + ' x ' + record.emi_months + ' months' });
        }
      }
      drawKeyValueGrid(doc, pairs);

      // Description / reason
      const desc = isExpense ? record.description : (record.reason || record.details);
      if (desc) {
        drawSectionTitle(doc, isExpense ? 'Description' : 'Reason / Details');
        doc.fillColor(COLOR_TEXT).fontSize(10).font('Helvetica').text(String(desc), { width: 515 });
      }

      drawApprovalChain(doc, record, kind);

      // Embed receipt image if it exists and is an image (jpg/png).
      const receiptUrl = isExpense ? (record.receipt_url || record.bill_url) : null;
      const receiptPath = resolveReceiptPath(receiptUrl);
      if (receiptPath && isImage(receiptPath)) {
        drawSectionTitle(doc, 'Attached Receipt');
        try {
          // Constrain width so it fits page; let height auto-scale
          doc.image(receiptPath, { fit: [515, 350], align: 'center' });
        } catch (imgErr) {
          doc.fillColor(COLOR_MUTED).fontSize(9).text('(Could not embed receipt: ' + imgErr.message + ')');
        }
      } else if (receiptUrl) {
        drawSectionTitle(doc, 'Attached Receipt');
        doc.fillColor(COLOR_MUTED).fontSize(9).text('Non-image receipt — see ' + receiptUrl);
      }

      drawFooter(doc, kind);
      doc.end();
    } catch (e) { reject(e); }
  });
}

module.exports = { generateVoucherPDF };
