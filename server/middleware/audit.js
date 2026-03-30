const pool = require('../config/db');

const SENSITIVE_KEYS = ['password', 'oldPassword', 'newPassword', 'password_hash', 'token', 'secret'];

function sanitizeBody(body) {
  const sanitized = { ...body };
  for (const key of SENSITIVE_KEYS) {
    if (key in sanitized) sanitized[key] = '[REDACTED]';
  }
  return sanitized;
}

/**
 * Audit logging middleware — logs mutations (POST/PUT/PATCH/DELETE) to audit_log table.
 * Usage: router.post('/route', verifyToken, auditLog('create', 'leave'), handler)
 */
function auditLog(action, entity) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Only log successful mutations
      if (res.statusCode < 400) {
        const empCode = req.user ? req.user.empCode : null;
        const entityId = req.params.id || req.params.code || (data && data.id) || null;
        const ip = req.ip || req.connection.remoteAddress;
        pool.query(
          'INSERT INTO audit_log (emp_code, action, entity, entity_id, new_value, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
          [empCode, action, entity, entityId, JSON.stringify(sanitizeBody(req.body || {})), ip]
        ).catch(err => console.error('Audit log error:', err.message));
      }
      return originalJson(data);
    };
    next();
  };
}

module.exports = { auditLog };
