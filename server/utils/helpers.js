function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function generateCSV(rows, columns) {
  const bom = '\uFEFF';
  const header = columns.map(c => c.label || c.key).join(',');
  const body = rows.map(row =>
    columns.map(c => {
      let val = row[c.key];
      if (val === null || val === undefined) val = '';
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')
  ).join('\n');
  return bom + header + '\n' + body;
}

function paginate(query, page = 1, limit = 50) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (safePage - 1) * safeLimit;
  return { query: `${query} LIMIT ? OFFSET ?`, params: [safeLimit, offset] };
}

module.exports = { formatDate, generateCSV, paginate };
