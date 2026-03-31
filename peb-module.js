// ============================================
// PEB MODULE — Full functionality ported from PEB system
// Integrated into HRMS overlay for MD role
// ============================================

var _pebSectionMap = {
  'md-peb-dash':'dashboard','md-inv-stock':'stock-items','md-inv-grn':'grn',
  'md-inv-requests':'material-requests','md-inv-returns':'returns-scrap',
  'md-proc-vendors':'vendors','md-proc-indents':'purchase-indents',
  'md-proc-orders':'purchase-orders','md-proc-transport':'transport'
};
var _pebSection = 'dashboard';
var _pebTitles = {'dashboard':'PEB Dashboard','stock-items':'Stock Items','grn':'Goods Receipt Notes','material-requests':'Material Requests','returns-scrap':'Returns & Scrap','vendors':'Vendors','purchase-indents':'Purchase Indents','purchase-orders':'Purchase Orders','transport':'Transport Requests'};

// ========== API HELPERS ==========
function _pebToken() { try { return JWT_TOKEN || safeStorage.get('hrms_jwt') || localStorage.getItem('token') || JSON.parse(localStorage.getItem('hrms_session')||'{}').token; } catch(e) { return ''; } }
async function _pebApi(path) {
  var r = await fetch(path, { headers: { 'Authorization': 'Bearer ' + _pebToken() } });
  if (!r.ok) { var e = await r.json(); throw new Error(e.error || 'Request failed'); } return r.json();
}
async function _pebPost(path, data) {
  var r = await fetch(path, { method: 'POST', headers: { 'Authorization': 'Bearer ' + _pebToken(), 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  var j = await r.json(); if (!r.ok) throw new Error(j.error || 'Request failed'); return j;
}
async function _pebPut(path, data) {
  var r = await fetch(path, { method: 'PUT', headers: { 'Authorization': 'Bearer ' + _pebToken(), 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  var j = await r.json(); if (!r.ok) throw new Error(j.error || 'Request failed'); return j;
}

// ========== UI HELPERS ==========
function _p(el) { return document.getElementById('pebContent'); }
function _pebDate(d) { if (!d) return '-'; try { return new Date(d).toLocaleDateString('en-IN'); } catch(e) { return d; } }
function _pebCurr(n) { return 'Rs.' + Number(n||0).toLocaleString('en-IN'); }
function _pebBadge(t, color) {
  var c = {green:'#22c55e',red:'#ef4444',orange:'#f59e0b',blue:'#3b82f6',gray:'#9ca3af',purple:'#8b5cf6'};
  return '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:.6rem;font-weight:600;color:#fff;background:'+(c[color]||c.gray)+';text-transform:uppercase">'+escapeHTML(t||'')+'</span>';
}
function _pebStatus(s) {
  var map = {PASSED:'green',APPROVED:'green',DELIVERED:'green',VERIFIED:'green',ACTIVE:'green',SENT:'green',MD_APPROVED:'green',PO_CREATED:'purple',GM_APPROVED:'blue',COMPLETE:'green',OK:'green',
    REQUESTED:'orange',PENDING:'orange',PARTIAL:'orange',QUOTATION_PENDING:'orange',COMPARISON_READY:'blue',SUBMITTED:'orange',IN_TRANSIT:'purple',DRAFT:'gray',
    REJECTED:'red',CANCELLED:'red',LOW:'red',URGENT:'red',CRITICAL:'red',OVERDUE:'red',BLACKLISTED:'red',
    DISPATCHED:'purple',CLOSED:'gray',NORMAL:'gray',ROUTINE:'gray',COLLECTED:'orange',QUOTED:'blue',SOLD:'green'};
  return _pebBadge((s||'').replace(/_/g,' '), map[(s||'').toUpperCase()]||'gray');
}
function _pebStat(label, val, color) {
  return '<div class="card" style="padding:14px;text-align:center"><div style="font-size:1.4rem;font-weight:700;color:'+(color||'var(--primary)')+'">'+val+'</div><div style="font-size:.65rem;color:var(--gray-500);text-transform:uppercase;font-weight:600;margin-top:2px">'+escapeHTML(label)+'</div></div>';
}
function _pebTbl(cols, rows, minW) {
  var h='<div class="card" style="border-radius:10px;overflow:hidden;border:1px solid #e5e7eb"><div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table style="width:100%;border-collapse:collapse;font-size:.78rem;min-width:'+(minW||'600px')+'">';
  h+='<thead><tr style="background:linear-gradient(135deg,#1e293b,#334155)">';
  cols.forEach(function(c){h+='<th style="padding:10px 14px;text-align:left;font-weight:600;font-size:.7rem;text-transform:uppercase;letter-spacing:.5px;color:#e2e8f0;white-space:nowrap">'+c+'</th>';});
  h+='</tr></thead><tbody>';
  if(!rows.length) h+='<tr><td colspan="'+cols.length+'" style="padding:28px;text-align:center;color:var(--gray-400);font-size:.8rem">No records found</td></tr>';
  rows.forEach(function(r,idx){h+='<tr style="border-bottom:1px solid #f0f0f0;background:'+(idx%2===0?'#fff':'#fafbfc')+';transition:background .15s" onmouseover="this.style.background=\'#f0f7ff\'" onmouseout="this.style.background=\''+(idx%2===0?'#fff':'#fafbfc')+'\'">';r.forEach(function(c){h+='<td style="padding:10px 14px;vertical-align:middle">'+c+'</td>';});h+='</tr>';});
  h+='</tbody></table></div></div>'; return h;
}

// Form helper
function _pebForm(fields) {
  var h='<div style="display:grid;gap:10px">';
  fields.forEach(function(f) {
    if (f.type === 'row') { h += '<div style="display:grid;grid-template-columns:' + (f.cols || '1fr 1fr') + ';gap:8px">'; f.fields.forEach(function(sf) { h += _pebField(sf); }); h += '</div>'; }
    else { h += _pebField(f); }
  });
  return h + '</div>';
}
function _pebField(f) {
  var lbl = '<label style="font-size:.7rem;font-weight:600;display:block;margin-bottom:3px">' + escapeHTML(f.label) + (f.required ? ' *' : '') + '</label>';
  var inp;
  if (f.type === 'select') inp = '<select id="' + f.id + '" style="width:100%;padding:8px;border:1px solid var(--gray-200);border-radius:6px;font-size:.78rem"' + (f.required ? ' required' : '') + '>' + (f.options || '') + '</select>';
  else if (f.type === 'textarea') inp = '<textarea id="' + f.id + '" rows="' + (f.rows||2) + '" style="width:100%;padding:8px;border:1px solid var(--gray-200);border-radius:6px;font-size:.8rem;resize:vertical"' + (f.required ? ' required' : '') + ' placeholder="' + escapeHTML(f.placeholder||'') + '">' + escapeHTML(f.value||'') + '</textarea>';
  else inp = '<input type="' + (f.type||'text') + '" id="' + f.id + '" value="' + escapeHTML(f.value||'') + '" style="width:100%;padding:8px;border:1px solid var(--gray-200);border-radius:6px;font-size:.8rem" placeholder="' + escapeHTML(f.placeholder||'') + '"' + (f.required ? ' required' : '') + (f.step ? ' step="'+f.step+'"' : '') + '>';
  return '<div>' + lbl + inp + '</div>';
}

// ========== MAIN RENDER ==========
function renderPebOverlay() {
  _pebSection = _pebSectionMap[_activeNavId] || 'dashboard';
  var titleEl = document.getElementById('pebOverlayTitle');
  if (titleEl) titleEl.textContent = _pebTitles[_pebSection] || 'PEB';
  var el = _p();
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--gray-400)">Loading...</div>';
  var fn = {
    'dashboard':_pebDashboard,'stock-items':_pebStockItems,'grn':_pebGRN,
    'material-requests':_pebMaterialRequests,'returns-scrap':_pebReturnsScrap,
    'vendors':_pebVendors,'purchase-indents':_pebIndents,
    'purchase-orders':_pebOrders,'transport':_pebTransport
  }[_pebSection];
  if (fn) fn(el); else el.innerHTML = '<div class="card" style="padding:20px;text-align:center">Section not found</div>';
}

// ========== DASHBOARD ==========
async function _pebDashboard(el) {
  try {
    var d = await _pebApi('/api/peb/store/dashboard');
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:16px">';
    html += _pebStat('Stock Items', d.totalItems||0, '#000');
    html += _pebStat('Low Stock Alerts', d.lowStock||0, '#ef4444');
    html += _pebStat('Material Requests', d.pendingRequests||0, '#3b82f6');
    html += _pebStat('Pending Approvals', d.pendingTransport||0, '#8b5cf6');
    html += '</div>';

    // Pending Transport Approvals
    if ((d.pendingTransportList||[]).length > 0) {
      html += '<div class="card" style="padding:14px;margin-bottom:12px"><h3 style="font-size:.82rem;font-weight:700;margin-bottom:10px">Pending Approvals</h3>';
      html += _pebTbl(['Type','Code','Details','Action'], d.pendingTransportList.map(function(t) {
        return ['<span style="font-weight:600">TRANSPORT</span>', escapeHTML(t.request_code),
          escapeHTML(t.origin_name||'') + ' &rarr; ' + escapeHTML(t.destination_name||''),
          '<button class="btn btn-golden" style="font-size:.6rem;padding:3px 10px" onclick="_pebViewTransport('+t.id+')">Review</button>'];
      }), '500px') + '</div>';
    }

    // Low Stock
    if ((d.lowStockItems||[]).length > 0) {
      html += '<div class="card" style="padding:14px;margin-bottom:12px"><h3 style="font-size:.82rem;font-weight:700;margin-bottom:10px">Low Stock Alerts</h3>';
      html += _pebTbl(['Item','Current','Min Level','Unit'], d.lowStockItems.map(function(i) {
        return [escapeHTML(i.item_name), '<span style="color:#ef4444;font-weight:600">'+i.current_stock+'</span>', ''+i.min_stock_level, escapeHTML(i.unit)];
      }), '400px') + '</div>';
    }

    // Recent Transactions
    html += '<div class="card" style="padding:14px"><h3 style="font-size:.82rem;font-weight:700;margin-bottom:10px">Recent Transactions</h3>';
    html += _pebTbl(['Type','Item','Qty','Date'], (d.recentTransactions||[]).map(function(t) {
      return [_pebStatus(t.type), escapeHTML(t.item_name||''), t.quantity + ' ' + (t.unit||''), _pebDate(t.created_at)];
    }), '400px') + '</div>';

    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div class="card" style="padding:20px;text-align:center;color:var(--danger)">'+escapeHTML(e.message)+'</div>'; }
}

// ========== STOCK ITEMS (full CRUD + detail + transaction) ==========
async function _pebStockItems(el) {
  try {
    var items = await _pebApi('/api/peb/store/items');
    var lowCount = items.filter(function(i) { return i.min_stock_level > 0 && i.current_stock <= i.min_stock_level; }).length;
    var totalValue = items.reduce(function(s, i) { return s + (i.current_stock * i.unit_price); }, 0);

    // Summary cards
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px">';
    html += _pebStat('Total Items', items.length, '#1e293b');
    html += _pebStat('Low Stock', lowCount, lowCount > 0 ? '#ef4444' : '#22c55e');
    html += _pebStat('Stock Value', _pebCurr(totalValue), '#3b82f6');
    html += '</div>';

    // Action bar
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">' +
      '<div style="display:flex;gap:6px"><button class="btn btn-golden" style="font-size:.72rem;padding:6px 14px;border-radius:8px" onclick="_pebShowAddItem()">+ Add Item</button>' +
      '<button class="btn btn-white-outline" style="font-size:.72rem;padding:6px 14px;border-radius:8px" onclick="_pebShowStockTxn()">+ Stock Entry</button></div></div>';

    // Filters
    html += '<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">' +
      '<select id="pebCatF" style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:.78rem;background:#fff;color:#374151" onchange="_pebFilterStock()">' +
        '<option value="">All Categories</option><option>RAW MATERIAL</option><option>CONSUMABLE</option><option>TOOL</option><option>HARDWARE</option><option>SAFETY</option><option>OTHER</option></select>' +
      '<input id="pebSrch" placeholder="Search items..." style="flex:1;min-width:180px;padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:.78rem;background:#fff" oninput="_pebFilterStock()"></div>';

    html += '<div id="pebStockTbl">' + _pebStockRows(items) + '</div>';
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div class="card" style="padding:20px;text-align:center;color:var(--danger)">'+escapeHTML(e.message)+'</div>'; }
}

function _pebStockRows(items) {
  return _pebTbl(['Code','Name','Category','Stock','Unit','Min','Status','Actions'], items.map(function(i) {
    var low = i.min_stock_level > 0 && i.current_stock <= i.min_stock_level;
    var stockColor = low ? '#ef4444' : '#16a34a';
    return [
      '<span style="font-family:monospace;font-weight:600;font-size:.72rem;color:#475569">' + escapeHTML(i.item_code) + '</span>',
      '<span style="font-weight:600;color:#1e293b">' + escapeHTML(i.item_name) + '</span>',
      '<span style="font-size:.7rem;padding:3px 8px;border-radius:6px;background:#f1f5f9;color:#475569">' + escapeHTML(i.category) + '</span>',
      '<span style="font-weight:700;font-size:.85rem;color:'+stockColor+'">' + Number(i.current_stock).toLocaleString('en-IN') + '</span>',
      escapeHTML(i.unit),
      '<span style="color:#6b7280">' + Number(i.min_stock_level).toLocaleString('en-IN') + '</span>',
      low ? _pebBadge('LOW','red') : _pebBadge('OK','green'),
      '<div style="display:flex;gap:6px"><button onclick="_pebViewItem('+i.id+')" style="font-size:.68rem;padding:4px 10px;border:1px solid #3b82f6;color:#3b82f6;background:transparent;border-radius:6px;cursor:pointer;transition:all .15s" onmouseover="this.style.background=\'#3b82f6\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'transparent\';this.style.color=\'#3b82f6\'">View</button>' +
      '<button onclick="_pebEditItem('+i.id+')" style="font-size:.68rem;padding:4px 10px;border:1px solid #6b7280;color:#6b7280;background:transparent;border-radius:6px;cursor:pointer;transition:all .15s" onmouseover="this.style.background=\'#6b7280\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'transparent\';this.style.color=\'#6b7280\'">Edit</button></div>'
    ];
  }), '750px');
}

async function _pebFilterStock() {
  var cat = (document.getElementById('pebCatF')||{}).value;
  var srch = (document.getElementById('pebSrch')||{}).value;
  try {
    var url = '/api/peb/store/items?';
    if (cat) url += 'category='+encodeURIComponent(cat)+'&';
    if (srch) url += 'search='+encodeURIComponent(srch);
    var items = await _pebApi(url);
    document.getElementById('pebStockTbl').innerHTML = _pebStockRows(items);
  } catch(e) {}
}

async function _pebViewItem(id) {
  try {
    var data = await _pebApi('/api/peb/store/items/'+id);
    var el = _p();
    var html = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebStockItems(_p())">&#8592; Back to Items</button>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:12px">';
    html += _pebStat(data.unit+' in stock', Number(data.current_stock).toLocaleString('en-IN'), data.current_stock<=data.min_stock_level?'#ef4444':'#22c55e');
    html += _pebStat('Min Level', data.min_stock_level);
    html += _pebStat('Max Level', data.max_stock_level);
    html += '</div>';
    html += '<div class="card" style="padding:12px;margin-bottom:12px"><p style="font-size:.75rem;color:var(--gray-500)"><strong>Code:</strong> '+escapeHTML(data.item_code)+' | <strong>Category:</strong> '+escapeHTML(data.category)+' | <strong>HSN:</strong> '+escapeHTML(data.hsn_code||'-')+' | <strong>Location:</strong> '+escapeHTML(data.location||'-')+'</p></div>';
    html += '<h3 style="font-size:.82rem;font-weight:700;margin-bottom:8px">Transaction History</h3>';
    var ledger = data.ledger || [];
    html += _pebTbl(['Type','Qty','Cost','Date','Notes'], ledger.map(function(t) {
      return [_pebStatus(t.type), t.quantity, t.unit_cost ? _pebCurr(t.unit_cost) : '-', _pebDate(t.created_at), escapeHTML(t.notes||'-')];
    }), '450px');
    el.innerHTML = html;
  } catch(e) { showToast(e.message,'error'); }
}

function _pebShowAddItem(editData) {
  var d = editData || {};
  var el = _p();
  el.innerHTML = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebStockItems(_p())">&#8592; Back</button>' +
    '<div class="card" style="padding:16px"><h3 style="font-size:.85rem;font-weight:600;margin-bottom:12px">'+(d.id?'Edit Item':'Add New Stock Item')+'</h3>' +
    _pebForm([
      {label:'Item Name',id:'pF_name',value:d.item_name,required:true},
      {type:'row',fields:[
        {label:'Category',id:'pF_cat',type:'select',required:true,options:'<option value="">Select</option><option'+(d.category==='RAW MATERIAL'?' selected':'')+'>RAW MATERIAL</option><option'+(d.category==='CONSUMABLE'?' selected':'')+'>CONSUMABLE</option><option'+(d.category==='TOOL'?' selected':'')+'>TOOL</option><option'+(d.category==='HARDWARE'?' selected':'')+'>HARDWARE</option><option'+(d.category==='SAFETY'?' selected':'')+'>SAFETY</option><option'+(d.category==='OTHER'?' selected':'')+'>OTHER</option>'},
        {label:'Unit',id:'pF_unit',type:'select',required:true,options:'<option value="">Select</option><option'+(d.unit==='KG'?' selected':'')+'>KG</option><option'+(d.unit==='METER'?' selected':'')+'>METER</option><option'+(d.unit==='PIECE'?' selected':'')+'>PIECE</option><option'+(d.unit==='BUNDLE'?' selected':'')+'>BUNDLE</option><option'+(d.unit==='SQ_METER'?' selected':'')+'>SQ_METER</option><option'+(d.unit==='TON'?' selected':'')+'>TON</option><option'+(d.unit==='SET'?' selected':'')+'>SET</option><option'+(d.unit==='LITER'?' selected':'')+'>LITER</option>'}
      ]},
      {type:'row',fields:[{label:'Min Stock',id:'pF_min',type:'number',value:d.min_stock_level||''},{label:'Max Stock',id:'pF_max',type:'number',value:d.max_stock_level||''}]},
      {type:'row',fields:[{label:'HSN Code',id:'pF_hsn',value:d.hsn_code||''},{label:'Unit Price',id:'pF_price',type:'number',value:d.unit_price||'',step:'0.01'}]},
      {label:'Location',id:'pF_loc',value:d.location||'',placeholder:'Warehouse, Rack'}
    ]) +
    '<button class="btn btn-golden" style="margin-top:12px" onclick="_pebSaveItem('+(d.id||'null')+')">'+(d.id?'Update':'Create Item')+'</button></div>';
}

async function _pebSaveItem(id) {
  var data = {item_name:document.getElementById('pF_name').value,category:document.getElementById('pF_cat').value,unit:document.getElementById('pF_unit').value,
    min_stock_level:+(document.getElementById('pF_min').value)||0,max_stock_level:+(document.getElementById('pF_max').value)||0,
    hsn_code:document.getElementById('pF_hsn').value||null,unit_price:+(document.getElementById('pF_price').value)||0,location:document.getElementById('pF_loc').value||null};
  if (!data.item_name||!data.category||!data.unit) { showToast('Name, category, unit required','error'); return; }
  try {
    if (id) await _pebPut('/api/peb/store/items/'+id, data);
    else await _pebPost('/api/peb/store/items', data);
    showToast(id?'Updated':'Item created','success');
    _pebStockItems(_p());
  } catch(e) { showToast(e.message,'error'); }
}

async function _pebEditItem(id) {
  try { var data = await _pebApi('/api/peb/store/items/'+id); _pebShowAddItem(data); } catch(e) { showToast(e.message,'error'); }
}

async function _pebShowStockTxn() {
  var items = await _pebApi('/api/peb/store/items');
  var opts = items.map(function(i){return '<option value="'+i.id+'">'+escapeHTML(i.item_code)+' — '+escapeHTML(i.item_name)+' ('+i.current_stock+' '+i.unit+')</option>';}).join('');
  var el = _p();
  el.innerHTML = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebStockItems(_p())">&#8592; Back</button>' +
    '<div class="card" style="padding:16px"><h3 style="font-size:.85rem;font-weight:600;margin-bottom:12px">Stock Entry / Adjustment</h3>' +
    _pebForm([
      {type:'row',fields:[
        {label:'Type',id:'pST_type',type:'select',required:true,options:'<option value="OPB">Opening Balance</option><option value="ADJ">Adjustment (+)</option><option value="GRN">Goods Receipt</option><option value="MIS">Material Issue (-)</option><option value="MRT">Material Return</option>'},
        {label:'Item',id:'pST_item',type:'select',required:true,options:opts}
      ]},
      {type:'row',fields:[{label:'Quantity',id:'pST_qty',type:'number',required:true,step:'0.01'},{label:'Unit Cost',id:'pST_cost',type:'number',step:'0.01'}]},
      {label:'Notes',id:'pST_notes',placeholder:'Reason for adjustment'}
    ]) +
    '<button class="btn btn-golden" style="margin-top:12px" onclick="_pebSaveStockTxn()">Record Transaction</button></div>';
}

async function _pebSaveStockTxn() {
  var d = {type:document.getElementById('pST_type').value,item_id:+document.getElementById('pST_item').value,quantity:+document.getElementById('pST_qty').value,unit_cost:+(document.getElementById('pST_cost').value)||0,notes:document.getElementById('pST_notes').value||null};
  if (!d.item_id||!d.quantity) { showToast('Item and quantity required','error'); return; }
  try { await _pebPost('/api/peb/store/transactions', d); showToast('Transaction recorded','success'); _pebStockItems(_p()); } catch(e) { showToast(e.message,'error'); }
}

// ========== GRN (with dynamic item rows + vendor dropdown) ==========
async function _pebGRN(el) {
  try {
    var grns = await _pebApi('/api/peb/store/grn');
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-size:.75rem;color:var(--gray-500)">'+grns.length+' records</span>' +
      '<button class="btn btn-golden" style="font-size:.7rem;padding:5px 12px" onclick="_pebShowAddGRN()">+ Create GRN</button></div>';
    html += _pebTbl(['GRN #','Vendor','Invoice','Received','Quality','Actions'], grns.map(function(g) {
      return [escapeHTML(g.grn_number), escapeHTML(g.vendor_name||'-'), escapeHTML(g.invoice_number||'-'), _pebDate(g.received_date), _pebStatus(g.quality_status),
        '<a href="#" onclick="_pebViewGRN('+g.id+');return false" style="font-size:.7rem;color:var(--primary)">View</a>'];
    }));
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div class="card" style="padding:20px;text-align:center;color:var(--danger)">'+escapeHTML(e.message)+'</div>'; }
}

async function _pebViewGRN(id) {
  try {
    var data = await _pebApi('/api/peb/store/grn/'+id);
    var el = _p();
    var html = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebGRN(_p())">&#8592; Back</button>';
    html += '<div class="card" style="padding:14px;margin-bottom:12px"><h3 style="font-size:.85rem;font-weight:600;margin-bottom:8px">'+escapeHTML(data.grn_number)+'</h3>';
    html += '<p style="font-size:.75rem;color:var(--gray-500)"><strong>Vendor:</strong> '+escapeHTML(data.vendor_name||'-')+' | <strong>Invoice:</strong> '+escapeHTML(data.invoice_number||'-')+' | <strong>Date:</strong> '+_pebDate(data.received_date)+' | <strong>Quality:</strong> '+_pebStatus(data.quality_status)+'</p></div>';
    html += '<h3 style="font-size:.82rem;font-weight:700;margin-bottom:8px">Items Received</h3>';
    html += _pebTbl(['Item','Code','Received','Accepted','Unit Cost','Quality'], (data.items||[]).map(function(i) {
      return [escapeHTML(i.item_name), escapeHTML(i.item_code), ''+i.received_qty, ''+i.accepted_qty, _pebCurr(i.unit_cost), _pebStatus(i.quality_status)];
    }), '500px');
    el.innerHTML = html;
  } catch(e) { showToast(e.message,'error'); }
}

async function _pebShowAddGRN() {
  try {
    var vendors = await _pebApi('/api/peb/purchase/vendors');
    var items = await _pebApi('/api/peb/store/items');
    window._pebGRNItems = items;
    var vendorOpts = vendors.map(function(v){return '<option value="'+v.id+'">'+escapeHTML(v.company_name)+'</option>';}).join('');
    var el = _p();
    el.innerHTML = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebGRN(_p())">&#8592; Back</button>' +
      '<div class="card" style="padding:16px"><h3 style="font-size:.85rem;font-weight:600;margin-bottom:12px">Create GRN</h3>' +
      _pebForm([
        {type:'row',fields:[{label:'Vendor',id:'pGRN_vnd',type:'select',required:true,options:'<option value="">Select</option>'+vendorOpts},{label:'Received Date',id:'pGRN_date',type:'date',value:new Date().toISOString().split('T')[0]}]},
        {type:'row',fields:[{label:'Invoice Number',id:'pGRN_inv'},{label:'Quality Status',id:'pGRN_qual',type:'select',options:'<option value="PASSED">Passed</option><option value="PARTIAL">Partial</option><option value="REJECTED">Rejected</option>'}]}
      ]) +
      '<div style="margin:10px 0"><label style="font-size:.7rem;font-weight:600;display:block;margin-bottom:4px">Invoice Photo</label>' +
      '<div style="display:flex;gap:8px;align-items:center"><button class="btn btn-white-outline" style="font-size:.68rem;padding:5px 10px" onclick="scanAndUploadGeneric(function(url){document.getElementById(\'pGRN_invoiceUrl\').value=url;document.getElementById(\'pGRN_invoicePreview\').innerHTML=\'<a href=\\\'\'+url+\'\\\' target=\\\'_blank\\\' style=\\\'font-size:.7rem;color:var(--primary)\\\'>View uploaded</a>\';})"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:3px"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>Scan Invoice</button><span id="pGRN_invoicePreview" style="font-size:.7rem;color:var(--gray-400)">No file</span><input type="hidden" id="pGRN_invoiceUrl"></div></div>' +
      '<h4 style="margin:14px 0 8px;font-size:.78rem;font-weight:600">Items</h4>' +
      '<div id="pGRN_items"></div>' +
      '<button class="btn btn-white-outline" style="font-size:.65rem;padding:4px 10px;margin-bottom:12px" onclick="_pebAddGRNRow()">+ Add Item</button>' +
      '<button class="btn btn-golden" style="display:block;width:100%" onclick="_pebSaveGRN()">Create GRN</button></div>';
    _pebAddGRNRow();
  } catch(e) { showToast(e.message,'error'); }
}

function _pebAddGRNRow() {
  var items = window._pebGRNItems || [];
  var opts = items.map(function(i){return '<option value="'+i.id+'">'+escapeHTML(i.item_code)+' — '+escapeHTML(i.item_name)+'</option>';}).join('');
  var div = document.createElement('div');
  div.className = 'peb-grn-row';
  div.style.cssText = 'display:flex;gap:6px;margin-bottom:8px;align-items:end;flex-wrap:wrap';
  div.innerHTML = '<div style="flex:3;min-width:150px"><label style="font-size:.65rem;font-weight:600">Item</label><select class="pGRN_sel" style="width:100%;padding:6px;border:1px solid var(--gray-200);border-radius:6px;font-size:.75rem">'+opts+'</select></div>' +
    '<div style="flex:1;min-width:60px"><label style="font-size:.65rem;font-weight:600">Qty</label><input class="pGRN_qty" type="number" step="0.01" style="width:100%;padding:6px;border:1px solid var(--gray-200);border-radius:6px;font-size:.75rem"></div>' +
    '<div style="flex:1;min-width:70px"><label style="font-size:.65rem;font-weight:600">Unit Cost</label><input class="pGRN_cost" type="number" step="0.01" style="width:100%;padding:6px;border:1px solid var(--gray-200);border-radius:6px;font-size:.75rem"></div>' +
    '<button class="btn" style="font-size:.6rem;padding:4px 8px;background:var(--danger);color:#fff;margin-bottom:1px" onclick="this.parentElement.remove()">X</button>';
  document.getElementById('pGRN_items').appendChild(div);
}

async function _pebSaveGRN() {
  var rows = document.querySelectorAll('.peb-grn-row');
  var items = [];
  rows.forEach(function(r) {
    var id = r.querySelector('.pGRN_sel').value;
    var qty = +r.querySelector('.pGRN_qty').value;
    var cost = +r.querySelector('.pGRN_cost').value;
    if (id && qty) items.push({item_id:+id, received_qty:qty, accepted_qty:qty, unit_cost:cost||0});
  });
  if (items.length === 0) { showToast('Add at least one item','error'); return; }
  try {
    await _pebPost('/api/peb/store/grn', {vendor_id:+document.getElementById('pGRN_vnd').value, received_date:document.getElementById('pGRN_date').value, invoice_number:document.getElementById('pGRN_inv').value||null, quality_status:document.getElementById('pGRN_qual').value, invoice_photo_url:(document.getElementById('pGRN_invoiceUrl')||{}).value||null, items:items});
    showToast('GRN created — stock updated','success');
    _pebGRN(_p());
  } catch(e) { showToast(e.message,'error'); }
}

// ========== MATERIAL REQUESTS (full workflow: create→approve→dispatch) ==========
async function _pebMaterialRequests(el) {
  try {
    var reqs = await _pebApi('/api/peb/store/material-requests');
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">' +
      '<div style="display:flex;gap:6px;align-items:center"><span style="font-size:.75rem;color:var(--gray-500)">'+reqs.length+' requests</span>' +
        '<select id="pMR_stageF" style="padding:5px 8px;border:1px solid var(--gray-200);border-radius:6px;font-size:.7rem" onchange="_pebFilterMR()"><option value="">All Stages</option><option>REQUESTED</option><option>APPROVED</option><option>DISPATCHED</option><option>CLOSED</option><option>REJECTED</option></select></div>' +
      '<button class="btn btn-golden" style="font-size:.7rem;padding:5px 12px" onclick="_pebShowAddMR()">+ New Request</button></div>';
    html += '<div id="pMR_tbl">' + _pebMRRows(reqs) + '</div>';
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div class="card" style="padding:20px;text-align:center;color:var(--danger)">'+escapeHTML(e.message)+'</div>'; }
}

function _pebMRRows(reqs) {
  return _pebTbl(['Code','Site','Urgency','Stage','Date','Actions'], reqs.map(function(r) {
    return [escapeHTML(r.request_code), escapeHTML(r.site_name||'-'), _pebStatus(r.urgency), _pebStatus(r.stage), _pebDate(r.created_at),
      '<a href="#" onclick="_pebViewMR('+r.id+');return false" style="font-size:.7rem;color:var(--primary);margin-right:4px">View</a>' +
      (r.stage==='REQUESTED' ? '<button class="btn btn-golden" style="font-size:.6rem;padding:2px 8px;margin-right:3px" onclick="_pebApproveMR('+r.id+',\'APPROVED\')">Approve</button><button class="btn" style="font-size:.6rem;padding:2px 8px;background:var(--danger);color:#fff" onclick="_pebApproveMR('+r.id+',\'REJECTED\')">Reject</button>' : '') +
      (r.stage==='APPROVED' ? '<button class="btn btn-golden" style="font-size:.6rem;padding:2px 8px" onclick="_pebDispatchMR('+r.id+')">Dispatch</button>' : '')];
  }));
}

async function _pebFilterMR() {
  var stage = (document.getElementById('pMR_stageF')||{}).value;
  try { var reqs = await _pebApi('/api/peb/store/material-requests'+(stage?'?status='+stage:'')); document.getElementById('pMR_tbl').innerHTML = _pebMRRows(reqs); } catch(e) {}
}

async function _pebViewMR(id) {
  try {
    var data = await _pebApi('/api/peb/store/material-requests/'+id);
    var el = _p();
    var html = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebMaterialRequests(_p())">&#8592; Back</button>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:12px">';
    html += '<div class="card" style="padding:10px;text-align:center"><div style="font-size:.6rem;color:var(--gray-500)">Stage</div>'+_pebStatus(data.stage)+'</div>';
    html += '<div class="card" style="padding:10px;text-align:center"><div style="font-size:.6rem;color:var(--gray-500)">Urgency</div>'+_pebStatus(data.urgency)+'</div>';
    html += '<div class="card" style="padding:10px;text-align:center"><div style="font-size:.6rem;color:var(--gray-500)">Site</div><div style="font-size:.75rem;font-weight:600">'+escapeHTML(data.site_name||'-')+'</div></div>';
    html += '</div>';
    html += '<div class="card" style="padding:12px;margin-bottom:12px;font-size:.75rem"><p><strong>Purpose:</strong> '+escapeHTML(data.purpose||'-')+'</p>' +
      (data.project_name?'<p><strong>Project:</strong> '+escapeHTML(data.project_name)+'</p>':'') +
      (data.store_remarks?'<p><strong>Store Remarks:</strong> '+escapeHTML(data.store_remarks)+'</p>':'') +
      '</div>';
    html += '<h3 style="font-size:.82rem;font-weight:700;margin-bottom:8px">Items</h3>';
    html += _pebTbl(['Item','Code','Requested','Approved','Issued','In Stock'], (data.items||[]).map(function(i) {
      return [escapeHTML(i.item_name), escapeHTML(i.item_code), ''+i.requested_qty, ''+(i.approved_qty??'-'), ''+(i.issued_qty||'-'), i.current_stock+' '+escapeHTML(i.unit)];
    }), '500px');

    if (data.stage==='REQUESTED') html += '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-golden" onclick="_pebApproveMR('+id+',\'APPROVED\')">Approve</button><button class="btn" style="background:var(--danger);color:#fff" onclick="_pebApproveMR('+id+',\'REJECTED\')">Reject</button></div>';
    if (data.stage==='APPROVED') html += '<button class="btn btn-golden" style="margin-top:12px" onclick="_pebDispatchMR('+id+')">Dispatch Materials</button>';
    el.innerHTML = html;
  } catch(e) { showToast(e.message,'error'); }
}

async function _pebApproveMR(id, action) {
  var remarks = action==='REJECTED' ? prompt('Rejection reason:') : '';
  if (action==='REJECTED' && remarks===null) return;
  try { await _pebPost('/api/peb/store/material-requests/'+id+'/approve', {action:action,remarks:remarks}); showToast('Request '+action.toLowerCase(),'success'); _pebMaterialRequests(_p()); } catch(e) { showToast(e.message,'error'); }
}

async function _pebDispatchMR(id) {
  try {
    var data = await _pebApi('/api/peb/store/material-requests/'+id);
    var items = data.items||[];
    var el = _p();
    var html = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebMaterialRequests(_p())">&#8592; Back</button>';
    html += '<div class="card" style="padding:16px"><h3 style="font-size:.85rem;font-weight:600;margin-bottom:12px">Dispatch: '+escapeHTML(data.request_code)+'</h3>';
    html += '<p style="font-size:.75rem;margin-bottom:12px;color:var(--gray-500)">Enter issued quantities for each item (stock will be deducted):</p>';
    items.forEach(function(i,idx) {
      html += '<div style="display:flex;gap:8px;align-items:end;margin-bottom:8px;flex-wrap:wrap">' +
        '<div style="flex:3;min-width:150px"><label style="font-size:.65rem;font-weight:600">'+escapeHTML(i.item_name)+' (Stock: '+i.current_stock+')</label>' +
        '<input disabled value="Requested: '+i.requested_qty+' | Approved: '+(i.approved_qty??i.requested_qty)+'" style="width:100%;padding:6px;border:1px solid var(--gray-200);border-radius:6px;font-size:.72rem;background:#f8f9fa"></div>' +
        '<div style="flex:1;min-width:70px"><label style="font-size:.65rem;font-weight:600">Issue Qty</label><input id="pDisp_qty_'+idx+'" type="number" step="0.01" value="'+(i.approved_qty??i.requested_qty)+'" style="width:100%;padding:6px;border:1px solid var(--gray-200);border-radius:6px;font-size:.75rem"></div>' +
        '<input type="hidden" id="pDisp_id_'+idx+'" value="'+i.id+'">' +
        '<input type="hidden" id="pDisp_item_'+idx+'" value="'+i.item_id+'"></div>';
    });
    html += '<div style="margin-top:8px"><label style="font-size:.7rem;font-weight:600">Store Remarks</label><input id="pDisp_rem" style="width:100%;padding:8px;border:1px solid var(--gray-200);border-radius:6px;font-size:.8rem"></div>';
    html += '<button class="btn btn-golden" style="margin-top:12px;width:100%" onclick="_pebSaveDispatch('+id+','+items.length+')">Confirm Dispatch</button></div>';
    el.innerHTML = html;
  } catch(e) { showToast(e.message,'error'); }
}

async function _pebSaveDispatch(id, count) {
  var items = [];
  for (var i=0; i<count; i++) {
    items.push({id:+document.getElementById('pDisp_id_'+i).value, item_id:+document.getElementById('pDisp_item_'+i).value, issued_qty:+document.getElementById('pDisp_qty_'+i).value});
  }
  try { await _pebPost('/api/peb/store/material-requests/'+id+'/dispatch', {items:items, store_remarks:document.getElementById('pDisp_rem').value||null}); showToast('Dispatched — stock updated','success'); _pebMaterialRequests(_p()); } catch(e) { showToast(e.message,'error'); }
}

async function _pebShowAddMR() {
  try {
    var items = await _pebApi('/api/peb/store/items');
    window._pebMRItems = items;
    var el = _p();
    el.innerHTML = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebMaterialRequests(_p())">&#8592; Back</button>' +
      '<div class="card" style="padding:16px"><h3 style="font-size:.85rem;font-weight:600;margin-bottom:12px">New Material Request</h3>' +
      _pebForm([
        {type:'row',fields:[{label:'Site',id:'pMR_site',required:true,placeholder:'e.g. Site A - Chennai'},{label:'Urgency',id:'pMR_urg',type:'select',options:'<option value="NORMAL">Normal</option><option value="URGENT">Urgent</option>'}]},
        {type:'row',fields:[{label:'Project',id:'pMR_proj'},{label:'Required By',id:'pMR_date',type:'date'}]},
        {label:'Purpose',id:'pMR_purpose',type:'textarea',rows:2}
      ]) +
      '<h4 style="margin:14px 0 8px;font-size:.78rem;font-weight:600">Items</h4><div id="pMR_items"></div>' +
      '<button class="btn btn-white-outline" style="font-size:.65rem;padding:4px 10px;margin-bottom:12px" onclick="_pebAddMRRow()">+ Add Item</button>' +
      '<button class="btn btn-golden" style="display:block;width:100%" onclick="_pebSaveMR()">Submit Request</button></div>';
    _pebAddMRRow();
  } catch(e) { showToast(e.message,'error'); }
}

function _pebAddMRRow() {
  var items = window._pebMRItems || [];
  var opts = items.map(function(i){return '<option value="'+i.id+'">'+escapeHTML(i.item_code)+' — '+escapeHTML(i.item_name)+' ('+i.current_stock+' '+i.unit+')</option>';}).join('');
  var div = document.createElement('div');
  div.className = 'peb-mr-row';
  div.style.cssText = 'display:flex;gap:6px;margin-bottom:8px;align-items:end';
  div.innerHTML = '<div style="flex:3;min-width:150px"><label style="font-size:.65rem;font-weight:600">Item</label><select class="pMR_sel" style="width:100%;padding:6px;border:1px solid var(--gray-200);border-radius:6px;font-size:.75rem">'+opts+'</select></div>' +
    '<div style="flex:1;min-width:60px"><label style="font-size:.65rem;font-weight:600">Qty</label><input class="pMR_qty" type="number" step="0.01" style="width:100%;padding:6px;border:1px solid var(--gray-200);border-radius:6px;font-size:.75rem"></div>' +
    '<button class="btn" style="font-size:.6rem;padding:4px 8px;background:var(--danger);color:#fff;margin-bottom:1px" onclick="this.parentElement.remove()">X</button>';
  document.getElementById('pMR_items').appendChild(div);
}

async function _pebSaveMR() {
  var rows = document.querySelectorAll('.peb-mr-row');
  var items = [];
  rows.forEach(function(r) { var id=r.querySelector('.pMR_sel').value; var qty=+r.querySelector('.pMR_qty').value; if(id&&qty) items.push({item_id:+id,requested_qty:qty}); });
  if (items.length===0) { showToast('Add at least one item','error'); return; }
  try {
    await _pebPost('/api/peb/store/material-requests', {site_name:document.getElementById('pMR_site').value, project_name:document.getElementById('pMR_proj').value||null, required_by:document.getElementById('pMR_date').value||null, urgency:document.getElementById('pMR_urg').value, purpose:document.getElementById('pMR_purpose').value||null, items:items});
    showToast('Request submitted','success'); _pebMaterialRequests(_p());
  } catch(e) { showToast(e.message,'error'); }
}

// ========== RETURNS & SCRAP (with condition + verification) ==========
async function _pebReturnsScrap(el) {
  try {
    var returns = await _pebApi('/api/peb/store/returns');
    var scrap = await _pebApi('/api/peb/store/scrap');
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3 style="font-size:.85rem;font-weight:700">Material Returns</h3>' +
      '<button class="btn btn-golden" style="font-size:.7rem;padding:5px 12px" onclick="_pebShowAddReturn()">+ Create Return</button></div>';
    html += _pebTbl(['MRN Code','Site','By','Date','Status','Actions'], returns.map(function(r) {
      return [escapeHTML(r.mrn_code), escapeHTML(r.site_name||'-'), escapeHTML(r.returned_by_name||'-'), _pebDate(r.return_date), _pebStatus(r.status),
        r.status!=='VERIFIED' ? '<button class="btn btn-golden" style="font-size:.6rem;padding:2px 8px" onclick="_pebVerifyReturn('+r.id+')">Verify & Restock</button>' : '-'];
    }));
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin:20px 0 10px"><h3 style="font-size:.85rem;font-weight:700">Scrap Batches</h3>' +
      '<button class="btn btn-golden" style="font-size:.7rem;padding:5px 12px" onclick="_pebShowAddScrap()">+ New Batch</button></div>';
    html += _pebTbl(['Batch','Weight (Kg)','Status','Sale Amount','Actions'], scrap.map(function(s) {
      return [escapeHTML(s.batch_code), Number(s.total_weight).toLocaleString('en-IN'), _pebStatus(s.status),
        s.sale_amount ? _pebCurr(s.sale_amount) : '-',
        s.status!=='SOLD'&&s.status!=='CLOSED' ? '<button class="btn btn-golden" style="font-size:.6rem;padding:2px 8px" onclick="_pebSellScrap('+s.id+')">Sell Scrap</button>' : '-'];
    }), '450px');
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div class="card" style="padding:20px;text-align:center;color:var(--danger)">'+escapeHTML(e.message)+'</div>'; }
}

async function _pebVerifyReturn(id) {
  if (!confirm('Verify this return and restock usable items?')) return;
  try { await _pebPost('/api/peb/store/returns/'+id+'/verify', {}); showToast('Return verified — usable items restocked','success'); _pebReturnsScrap(_p()); } catch(e) { showToast(e.message,'error'); }
}

async function _pebSellScrap(id) {
  var amount = prompt('Enter sale amount (Rs.):');
  if (!amount) return;
  var receipt = prompt('Receipt number (optional):') || '';
  try { await _pebPost('/api/peb/store/scrap/'+id+'/sell', {sale_amount:+amount,receipt_number:receipt||null}); showToast('Scrap sold','success'); _pebReturnsScrap(_p()); } catch(e) { showToast(e.message,'error'); }
}

async function _pebShowAddReturn() {
  var items = await _pebApi('/api/peb/store/items');
  window._pebRetItems = items;
  var el = _p();
  el.innerHTML = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebReturnsScrap(_p())">&#8592; Back</button>' +
    '<div class="card" style="padding:16px"><h3 style="font-size:.85rem;font-weight:600;margin-bottom:12px">Create Material Return</h3>' +
    _pebForm([{type:'row',fields:[{label:'Site',id:'pRet_site',required:true},{label:'Return Date',id:'pRet_date',type:'date',value:new Date().toISOString().split('T')[0]}]}]) +
    '<h4 style="margin:14px 0 8px;font-size:.78rem;font-weight:600">Items (with condition)</h4><div id="pRet_items"></div>' +
    '<button class="btn btn-white-outline" style="font-size:.65rem;padding:4px 10px;margin-bottom:12px" onclick="_pebAddRetRow()">+ Add Item</button>' +
    '<button class="btn btn-golden" style="display:block;width:100%" onclick="_pebSaveReturn()">Create Return</button></div>';
  _pebAddRetRow();
}

function _pebAddRetRow() {
  var items = window._pebRetItems||[];
  var opts = items.map(function(i){return '<option value="'+i.id+'">'+escapeHTML(i.item_code)+' — '+escapeHTML(i.item_name)+'</option>';}).join('');
  var div = document.createElement('div');
  div.className = 'peb-ret-row';
  div.style.cssText = 'display:flex;gap:5px;margin-bottom:8px;align-items:end;flex-wrap:wrap';
  div.innerHTML = '<div style="flex:2;min-width:140px"><label style="font-size:.6rem;font-weight:600">Item</label><select class="pRet_sel" style="width:100%;padding:5px;border:1px solid var(--gray-200);border-radius:6px;font-size:.72rem">'+opts+'</select></div>' +
    '<div style="flex:1;min-width:55px"><label style="font-size:.6rem;font-weight:600">Returned</label><input class="pRet_qty" type="number" style="width:100%;padding:5px;border:1px solid var(--gray-200);border-radius:6px;font-size:.72rem"></div>' +
    '<div style="flex:1;min-width:55px"><label style="font-size:.6rem;font-weight:600">Usable</label><input class="pRet_usable" type="number" value="0" style="width:100%;padding:5px;border:1px solid var(--gray-200);border-radius:6px;font-size:.72rem"></div>' +
    '<div style="flex:1;min-width:55px"><label style="font-size:.6rem;font-weight:600">Scrap</label><input class="pRet_scrap" type="number" value="0" style="width:100%;padding:5px;border:1px solid var(--gray-200);border-radius:6px;font-size:.72rem"></div>' +
    '<div style="flex:1;min-width:70px"><label style="font-size:.6rem;font-weight:600">Condition</label><select class="pRet_cond" style="width:100%;padding:5px;border:1px solid var(--gray-200);border-radius:6px;font-size:.72rem"><option>GOOD</option><option>FAIR</option><option>POOR</option><option>DAMAGED</option><option>SCRAP</option></select></div>' +
    '<button class="btn" style="font-size:.55rem;padding:3px 6px;background:var(--danger);color:#fff" onclick="this.parentElement.remove()">X</button>';
  document.getElementById('pRet_items').appendChild(div);
}

async function _pebSaveReturn() {
  var rows = document.querySelectorAll('.peb-ret-row');
  var items = [];
  rows.forEach(function(r) {
    var id=r.querySelector('.pRet_sel').value; var qty=+r.querySelector('.pRet_qty').value;
    if(id&&qty) items.push({item_id:+id, returned_qty:qty, usable_qty:+r.querySelector('.pRet_usable').value||0, scrap_qty:+r.querySelector('.pRet_scrap').value||0, condition:r.querySelector('.pRet_cond').value});
  });
  if(items.length===0){showToast('Add at least one item','error');return;}
  try { await _pebPost('/api/peb/store/returns', {site_name:document.getElementById('pRet_site').value, returned_by_name:'MD', return_date:document.getElementById('pRet_date').value, items:items}); showToast('Return created','success'); _pebReturnsScrap(_p()); } catch(e){showToast(e.message,'error');}
}

function _pebShowAddScrap() {
  var el = _p();
  el.innerHTML = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebReturnsScrap(_p())">&#8592; Back</button>' +
    '<div class="card" style="padding:16px"><h3 style="font-size:.85rem;font-weight:600;margin-bottom:12px">New Scrap Batch</h3>' +
    _pebForm([{label:'Total Weight (Kg)',id:'pScr_wt',type:'number',required:true,step:'0.01'}]) +
    '<button class="btn btn-golden" style="margin-top:12px" onclick="_pebSaveScrap()">Create Batch</button></div>';
}

async function _pebSaveScrap() {
  var wt = +document.getElementById('pScr_wt').value;
  if(!wt){showToast('Weight required','error');return;}
  try{await _pebPost('/api/peb/store/scrap',{total_weight:wt});showToast('Scrap batch created','success');_pebReturnsScrap(_p());}catch(e){showToast(e.message,'error');}
}

// ========== VENDORS (with GST/PAN qualification + blacklist) ==========
async function _pebVendors(el) {
  try {
    var vendors = await _pebApi('/api/peb/purchase/vendors');
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-size:.75rem;color:var(--gray-500)">'+vendors.length+' vendors</span>' +
      '<button class="btn btn-golden" style="font-size:.7rem;padding:5px 12px" onclick="_pebShowAddVendor()">+ Add Vendor</button></div>';
    html += _pebTbl(['Code','Company','Contact','Phone','GST','Rating','Status','Actions'], vendors.map(function(v) {
      return [escapeHTML(v.vendor_code), escapeHTML(v.company_name), escapeHTML(v.contact_person||'-'), escapeHTML(v.phone||'-'),
        escapeHTML(v.gst_number||'-'), v.rating ? v.rating+'/5' : '-',
        v.is_blacklisted ? _pebBadge('Blacklisted','red') : _pebBadge('Active','green'),
        '<button class="btn btn-white-outline" style="font-size:.6rem;padding:2px 8px" onclick="_pebToggleBlacklist('+v.id+','+v.is_blacklisted+')">'+(v.is_blacklisted?'Unblock':'Blacklist')+'</button>'];
    }));
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div class="card" style="padding:20px;text-align:center;color:var(--danger)">'+escapeHTML(e.message)+'</div>'; }
}

function _pebShowAddVendor() {
  var el = _p();
  el.innerHTML = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebVendors(_p())">&#8592; Back</button>' +
    '<div class="card" style="padding:16px"><h3 style="font-size:.85rem;font-weight:600;margin-bottom:12px">Add Vendor</h3>' +
    '<div style="padding:8px 12px;background:#f0f9ff;border-left:3px solid #3b82f6;margin-bottom:12px;font-size:.72rem;border-radius:4px"><strong>Note:</strong> GST and PAN are mandatory for vendor qualification. Only qualified vendors can provide quotations.</div>' +
    _pebForm([
      {label:'Company Name',id:'pV_name',required:true},
      {type:'row',fields:[{label:'Contact Person',id:'pV_contact'},{label:'Phone',id:'pV_phone'}]},
      {type:'row',fields:[{label:'GST Number',id:'pV_gst',required:true,placeholder:'33AABCZ1234A1Z5'},{label:'PAN Number',id:'pV_pan',required:true,placeholder:'ABCDE1234F'}]},
      {label:'Address',id:'pV_addr',type:'textarea',rows:2},
      {type:'row',fields:[{label:'Payment Terms',id:'pV_terms',placeholder:'Net 30'},{label:'Rating (1-5)',id:'pV_rating',type:'number',step:'0.5'}]}
    ]) +
    '<button class="btn btn-golden" style="margin-top:12px" onclick="_pebSaveVendor()">Create Vendor</button></div>';
}

async function _pebSaveVendor() {
  var name = document.getElementById('pV_name').value;
  var gst = document.getElementById('pV_gst').value;
  var pan = document.getElementById('pV_pan').value;
  if(!name){showToast('Company name required','error');return;}
  if(!gst||!pan){showToast('GST and PAN are mandatory for qualification','error');return;}
  try {
    await _pebPost('/api/peb/purchase/vendors', {company_name:name, contact_person:document.getElementById('pV_contact').value||null, phone:document.getElementById('pV_phone').value||null, gst_number:gst, pan_number:pan, address:document.getElementById('pV_addr').value||null, payment_terms:document.getElementById('pV_terms').value||null, rating:+(document.getElementById('pV_rating').value)||0});
    showToast('Vendor created & qualified','success'); _pebVendors(_p());
  } catch(e){showToast(e.message,'error');}
}

async function _pebToggleBlacklist(id, current) {
  var reason = !current ? prompt('Blacklist reason:') : '';
  if (!current && reason===null) return;
  try { await _pebPut('/api/peb/purchase/vendors/'+id, {is_blacklisted:!current, blacklist_reason:reason||null}); showToast(current?'Vendor unblocked':'Vendor blacklisted','success'); _pebVendors(_p()); } catch(e){showToast(e.message,'error');}
}

// ========== PURCHASE INDENTS (full L1/L2/L3 workflow) ==========
async function _pebIndents(el) {
  try {
    var indents = await _pebApi('/api/peb/purchase/indents');
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">' +
      '<div style="display:flex;gap:6px;align-items:center"><span style="font-size:.75rem;color:var(--gray-500)">'+indents.length+' indents</span>' +
        '<select id="pPI_stF" style="padding:5px 8px;border:1px solid var(--gray-200);border-radius:6px;font-size:.7rem" onchange="_pebFilterIndents()"><option value="">All Status</option><option>QUOTATION_PENDING</option><option>COMPARISON_READY</option><option>GM_APPROVED</option><option>MD_APPROVED</option><option>PO_CREATED</option><option>REJECTED</option></select></div>' +
      '<button class="btn btn-golden" style="font-size:.7rem;padding:5px 12px" onclick="_pebShowAddIndent()">+ New Indent</button></div>';
    html += '<div id="pPI_tbl">' + _pebIndentRows(indents) + '</div>';
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div class="card" style="padding:20px;text-align:center;color:var(--danger)">'+escapeHTML(e.message)+'</div>'; }
}

function _pebIndentRows(indents) {
  return _pebTbl(['Code','By','Urgency','Quotations','Status','Date','Actions'], indents.map(function(r) {
    var qCnt = r.quotation_count||0;
    return [escapeHTML(r.indent_code), escapeHTML(r.requested_by_name||'-'), _pebStatus(r.urgency),
      '<strong>'+qCnt+'</strong>/3 '+(qCnt>=3?_pebBadge('COMPLETE','green'):_pebBadge('PENDING','orange')),
      _pebStatus(r.status), _pebDate(r.created_at),
      '<a href="#" onclick="_pebViewIndent('+r.id+');return false" style="font-size:.7rem;color:var(--primary);margin-right:4px">View</a>' +
      (r.status==='QUOTATION_PENDING'?'<button class="btn btn-golden" style="font-size:.6rem;padding:2px 8px" onclick="_pebAddQuotation('+r.id+')">+ Quote</button>':'') +
      (r.status==='COMPARISON_READY'?'<button class="btn btn-golden" style="font-size:.6rem;padding:2px 8px" onclick="_pebGMReview('+r.id+')">GM Review</button>':'') +
      (r.status==='GM_APPROVED'?'<button class="btn btn-golden" style="font-size:.6rem;padding:2px 8px" onclick="_pebMDApprove('+r.id+')">MD Approve</button>':'')
    ];
  }));
}

async function _pebFilterIndents() {
  var st=(document.getElementById('pPI_stF')||{}).value;
  try{var data=await _pebApi('/api/peb/purchase/indents'+(st?'?status='+st:''));document.getElementById('pPI_tbl').innerHTML=_pebIndentRows(data);}catch(e){}
}

async function _pebViewIndent(id) {
  try {
    var data = await _pebApi('/api/peb/purchase/indents/'+id);
    var quots = data.quotations||[];
    var el = _p();
    var html = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebIndents(_p())">&#8592; Back</button>';

    // Status cards
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:12px">';
    html += '<div class="card" style="padding:10px;text-align:center"><div style="font-size:.6rem;color:var(--gray-500)">Status</div>'+_pebStatus(data.status)+'</div>';
    html += '<div class="card" style="padding:10px;text-align:center"><div style="font-size:.6rem;color:var(--gray-500)">Urgency</div>'+_pebStatus(data.urgency)+'</div>';
    html += '<div class="card" style="padding:10px;text-align:center"><div style="font-size:.6rem;color:var(--gray-500)">Quotations</div><strong>'+quots.length+'/3</strong></div>';
    html += '</div>';

    html += '<div class="card" style="padding:12px;margin-bottom:12px;font-size:.75rem"><p><strong>Reason:</strong> '+escapeHTML(data.reason||'-')+'</p>' +
      (data.project_reference?'<p><strong>Project:</strong> '+escapeHTML(data.project_reference)+'</p>':'') + '</div>';

    // Items
    html += '<h3 style="font-size:.82rem;font-weight:700;margin-bottom:8px">Items</h3>';
    html += _pebTbl(['Item','Spec','Qty','Est. Cost','In Stock','Last Price'], (data.items||[]).map(function(i) {
      return [escapeHTML(i.item_name||''), escapeHTML(i.specification||'-'), ''+i.qty, i.estimated_cost?_pebCurr(i.estimated_cost):'-', ''+(i.current_stock_qty??'-'), i.last_purchase_price?_pebCurr(i.last_purchase_price):'-'];
    }), '550px');

    // Quotations L1/L2/L3
    if (quots.length > 0) {
      html += '<h3 style="font-size:.82rem;font-weight:700;margin:16px 0 8px">Vendor Quotations (L1/L2/L3 by Landed Cost)</h3>';
      html += _pebTbl(['Rank','Vendor','Material','Transport','Landed Cost','Lead','Terms','Bill'], quots.map(function(q,idx) {
        return ['<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:.6rem;font-weight:600;color:#fff;background:'+(idx===0?'#22c55e':idx===1?'#3b82f6':'#f59e0b')+'">L'+(idx+1)+'</span>',
          escapeHTML(q.vendor_name), _pebCurr(q.total_value), q.transport_included?'FREE':_pebCurr(q.transport_cost||0),
          '<strong>'+_pebCurr(q.landed_cost)+'</strong>', (q.delivery_lead_days||'-')+' days', escapeHTML(q.payment_terms||'-'),
          q.document_url?'<a href="'+q.document_url+'" target="_blank" style="font-size:.7rem;color:var(--primary)">View</a>':_pebBadge('MISSING','red')];
      }));
      if (quots.length>=3) {
        var l1=quots[0], savings = quots[1] ? _pebCurr(quots[1].landed_cost-l1.landed_cost) : '-';
        html += '<div class="card" style="padding:10px;margin-top:8px;background:#f0fdf4;border-left:3px solid #22c55e;font-size:.75rem"><strong>L1 Recommendation:</strong> '+escapeHTML(l1.vendor_name)+' at '+_pebCurr(l1.landed_cost)+' | Savings over L2: '+savings+'</div>';
      }
    }

    // Approval timeline
    html += '<h3 style="font-size:.82rem;font-weight:700;margin:16px 0 8px">Approval Timeline</h3><div style="padding-left:14px;border-left:2px solid var(--gray-200);font-size:.75rem">';
    html += '<p style="margin:6px 0">'+_pebStatus('CREATED')+' Created on '+_pebDate(data.created_at)+'</p>';
    html += '<p style="margin:6px 0">'+(quots.length>=3?_pebStatus('COMPLETE'):_pebStatus('PENDING'))+' Quotations: '+quots.length+'/3</p>';
    if(data.gm_approved_by) html += '<p style="margin:6px 0">'+_pebStatus('GM_APPROVED')+' GM approved on '+_pebDate(data.gm_approved_at)+(data.gm_remarks?' — "'+escapeHTML(data.gm_remarks)+'"':'')+'</p>';
    if(data.md_approved_by) html += '<p style="margin:6px 0">'+_pebStatus('MD_APPROVED')+' MD approved on '+_pebDate(data.md_approved_at)+(data.md_remarks?' — "'+escapeHTML(data.md_remarks)+'"':'')+'</p>';
    if(data.needs_special_approval) html += '<p style="margin:6px 0;color:#ef4444"><strong>SPECIAL APPROVAL:</strong> Non-L1 vendor. '+escapeHTML(data.selection_justification||'')+'</p>';
    if(data.status==='REJECTED') html += '<p style="margin:6px 0;color:#ef4444">'+_pebStatus('REJECTED')+' '+escapeHTML(data.rejection_reason||'')+'</p>';
    html += '</div>';

    // Action buttons
    html += '<div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">';
    if(data.status==='QUOTATION_PENDING') html += '<button class="btn btn-golden" onclick="_pebAddQuotation('+id+')">+ Add Quotation</button>';
    if(data.status==='COMPARISON_READY') html += '<button class="btn btn-golden" onclick="_pebGMReview('+id+')">GM Review & Approve</button>';
    if(data.status==='GM_APPROVED') html += '<button class="btn btn-golden" onclick="_pebMDApprove('+id+')">MD Final Approve</button>';
    if(['COMPARISON_READY','QUOTATION_PENDING'].indexOf(data.status)>=0) html += '<button class="btn" style="background:var(--danger);color:#fff" onclick="_pebRejectIndent('+id+')">Reject</button>';
    html += '</div>';

    el.innerHTML = html;
  } catch(e) { showToast(e.message,'error'); }
}

// Add quotation to existing indent
async function _pebAddQuotation(indentId) {
  try {
    var vendors = await _pebApi('/api/peb/purchase/vendors?qualified=true');
    var el = _p();
    var vendorOpts = vendors.map(function(v){return '<option value="'+v.id+'">'+escapeHTML(v.company_name)+' (GST: '+v.gst_number+')</option>';}).join('');
    el.innerHTML = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebViewIndent('+indentId+')">&#8592; Back</button>' +
      '<div class="card" style="padding:10px 14px;background:#f0f9ff;border-left:3px solid #3b82f6;margin-bottom:12px;font-size:.72rem"><strong>Rules:</strong> 3 quotations from 3 different qualified vendors. Upload bill mandatory.</div>' +
      '<div class="card" style="padding:16px"><h3 style="font-size:.85rem;font-weight:600;margin-bottom:12px">Add Vendor Quotation</h3>' +
      _pebForm([
        {type:'row',fields:[{label:'Vendor (qualified only)',id:'pQ_vnd',type:'select',required:true,options:'<option value="">Select</option>'+vendorOpts},{label:'Quotation Date',id:'pQ_date',type:'date',value:new Date().toISOString().split('T')[0]}]},
        {type:'row',fields:[{label:'Material Cost (excl transport)',id:'pQ_mat',type:'number',required:true,step:'0.01'},{label:'Transport Cost',id:'pQ_trans',type:'number',step:'0.01',value:'0'}]},
        {type:'row',fields:[{label:'Delivery Lead Days',id:'pQ_lead',type:'number'},{label:'Payment Terms',id:'pQ_terms',placeholder:'Net 30, Advance...'}]},
        {label:'Valid Until',id:'pQ_valid',type:'date'},
        {label:'Notes',id:'pQ_notes',type:'textarea',rows:2}
      ]) +
      '<button class="btn btn-golden" style="margin-top:12px" onclick="_pebSaveQuotation('+indentId+')">Submit Quotation</button></div>';
  } catch(e) { showToast(e.message,'error'); }
}

async function _pebSaveQuotation(indentId) {
  var matCost = +document.getElementById('pQ_mat').value;
  var transCost = +document.getElementById('pQ_trans').value||0;
  if(!document.getElementById('pQ_vnd').value||!matCost){showToast('Vendor and material cost required','error');return;}
  try {
    var r = await _pebPost('/api/peb/purchase/quotations', {indent_id:indentId, vendor_id:+document.getElementById('pQ_vnd').value, quotation_date:document.getElementById('pQ_date').value||null, valid_until:document.getElementById('pQ_valid').value||null, delivery_lead_days:+document.getElementById('pQ_lead').value||null, payment_terms:document.getElementById('pQ_terms').value||null, transport_included:transCost===0, transport_cost:transCost, total_value:matCost, notes:document.getElementById('pQ_notes').value||null});
    showToast(r.message,'success');
    _pebViewIndent(indentId);
  } catch(e){showToast(e.message,'error');}
}

// GM Review with L1/L2/L3 comparison
async function _pebGMReview(indentId) {
  try {
    var data = await _pebApi('/api/peb/purchase/indents/'+indentId);
    var comp = await _pebApi('/api/peb/purchase/comparison/'+indentId);
    var quots = comp.quotations||[];
    if(quots.length<3){showToast('3 quotations required','error');return;}
    var l1 = quots[0];
    var el = _p();
    var html = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebViewIndent('+indentId+')">&#8592; Back</button>';
    html += '<div class="card" style="padding:10px 14px;background:#fffbeb;border-left:3px solid #f59e0b;margin-bottom:12px;font-size:.72rem"><strong>Review Rules:</strong> L1 (lowest landed cost) recommended. If selecting L2/L3, price matched to L1. Non-L1 needs MD special approval.</div>';
    html += '<h3 style="font-size:.82rem;font-weight:700;margin-bottom:8px">L1/L2/L3 Comparison</h3>';
    html += _pebTbl(['Rank','Vendor','Material','Transport','Landed Cost','Lead','Terms'], quots.map(function(q,idx) {
      return ['<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:.6rem;font-weight:600;color:#fff;background:'+(idx===0?'#22c55e':idx===1?'#3b82f6':'#f59e0b')+'">L'+(idx+1)+'</span>',
        escapeHTML(q.company_name), _pebCurr(q.total_value), q.transport_included?'FREE':_pebCurr(q.transport_cost||0), '<strong>'+_pebCurr(q.landed_cost)+'</strong>', (q.delivery_lead_days||'-')+'d', escapeHTML(q.payment_terms||'-')];
    }));

    var vendorOpts = quots.map(function(q,idx){return '<option value="'+q.vendor_id+'">'+escapeHTML(q.company_name)+' (L'+(idx+1)+' — '+_pebCurr(q.landed_cost)+')</option>';}).join('');
    html += '<div class="card" style="padding:16px;margin-top:12px">' +
      '<div style="margin-bottom:10px"><label style="font-size:.7rem;font-weight:600;display:block;margin-bottom:3px">Select Vendor *</label><select id="pGM_vnd" style="width:100%;padding:8px;border:1px solid var(--gray-200);border-radius:6px;font-size:.78rem" onchange="_pebGMVendorChanged('+l1.vendor_id+')">'+vendorOpts+'</select></div>' +
      '<div id="pGM_warn" style="display:none;padding:10px;background:#fef2f2;border-left:3px solid #ef4444;margin-bottom:10px;border-radius:4px;font-size:.72rem"><p style="color:#ef4444;font-weight:600">Non-L1 vendor selected!</p><p>Price will be adjusted to L1: <strong>'+_pebCurr(l1.landed_cost)+'</strong>. MD special approval required.</p></div>' +
      '<div id="pGM_justWrap" style="display:none"><label style="font-size:.7rem;font-weight:600;display:block;margin-bottom:3px">Justification for non-L1 *</label><textarea id="pGM_just" rows="3" style="width:100%;padding:8px;border:1px solid var(--gray-200);border-radius:6px;font-size:.8rem;resize:vertical;margin-bottom:10px" placeholder="Why is L1 not suitable?"></textarea></div>' +
      '<div><label style="font-size:.7rem;font-weight:600;display:block;margin-bottom:3px">GM Remarks</label><textarea id="pGM_rem" rows="2" style="width:100%;padding:8px;border:1px solid var(--gray-200);border-radius:6px;font-size:.8rem;resize:vertical"></textarea></div>' +
      '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-golden" onclick="_pebSaveGMApprove('+indentId+','+l1.vendor_id+')">Approve & Forward to MD</button>' +
      '<button class="btn" style="background:var(--danger);color:#fff" onclick="_pebRejectIndent('+indentId+')">Reject</button></div></div>';
    el.innerHTML = html;
  } catch(e){showToast(e.message,'error');}
}

function _pebGMVendorChanged(l1VendorId) {
  var sel = +document.getElementById('pGM_vnd').value;
  var isL1 = sel === l1VendorId;
  document.getElementById('pGM_warn').style.display = isL1?'none':'block';
  document.getElementById('pGM_justWrap').style.display = isL1?'none':'block';
}

async function _pebSaveGMApprove(indentId, l1VendorId) {
  var selected = +document.getElementById('pGM_vnd').value;
  var isL1 = selected === l1VendorId;
  var justify = document.getElementById('pGM_just')? document.getElementById('pGM_just').value : '';
  if(!isL1 && !justify){showToast('Justification required for non-L1','error');return;}
  try {
    await _pebPost('/api/peb/purchase/indents/'+indentId+'/gm-approve', {action:'APPROVED', remarks:document.getElementById('pGM_rem').value||null, selected_vendor_id:selected, selection_justification:isL1?null:justify});
    showToast('GM approved — forwarded to MD','success'); _pebIndents(_p());
  } catch(e){showToast(e.message,'error');}
}

// MD Final Approval
async function _pebMDApprove(indentId) {
  try {
    var data = await _pebApi('/api/peb/purchase/indents/'+indentId);
    var comp = await _pebApi('/api/peb/purchase/comparison/'+indentId);
    var quots = comp.quotations||[];
    var isSpecial = data.needs_special_approval;
    var el = _p();
    var html = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebViewIndent('+indentId+')">&#8592; Back</button>';

    if(isSpecial) html += '<div class="card" style="padding:10px 14px;background:#fef2f2;border-left:3px solid #ef4444;margin-bottom:12px;font-size:.72rem"><p style="font-weight:700;color:#ef4444">SPECIAL APPROVAL REQUIRED</p><p>Non-L1 vendor selected. Your remarks are mandatory.</p><p><strong>GM Justification:</strong> '+escapeHTML(data.selection_justification||'-')+'</p></div>';

    html += '<h3 style="font-size:.82rem;font-weight:700;margin-bottom:8px">L1/L2/L3 Comparison</h3>';
    html += _pebTbl(['Rank','Vendor','Landed Cost','Selected'], quots.map(function(q,idx) {
      return ['<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:.6rem;font-weight:600;color:#fff;background:'+(idx===0?'#22c55e':idx===1?'#3b82f6':'#f59e0b')+'">L'+(idx+1)+'</span>',
        escapeHTML(q.company_name), '<strong>'+_pebCurr(q.landed_cost)+'</strong>', q.vendor_id===data.selected_vendor_id?'<strong style="color:#22c55e">SELECTED</strong>':''];
    }), '450px');

    if(data.gm_remarks) html += '<p style="margin-top:10px;font-size:.75rem"><strong>GM Remarks:</strong> '+escapeHTML(data.gm_remarks)+'</p>';

    html += '<div class="card" style="padding:16px;margin-top:12px">' +
      '<div><label style="font-size:.7rem;font-weight:600;display:block;margin-bottom:3px">MD Remarks'+(isSpecial?' *':'')+'</label><textarea id="pMD_rem" rows="3" style="width:100%;padding:8px;border:1px solid var(--gray-200);border-radius:6px;font-size:.8rem;resize:vertical" placeholder="'+(isSpecial?'Mandatory: explain why non-L1 is acceptable...':'Optional remarks...')+'"></textarea></div>' +
      '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-golden" style="flex:1" onclick="_pebSaveMDApprove('+indentId+','+isSpecial+')">MD Approve — Final</button>' +
      '<button class="btn" style="background:var(--danger);color:#fff" onclick="_pebRejectIndent('+indentId+')">Reject</button></div></div>';
    el.innerHTML = html;
  } catch(e){showToast(e.message,'error');}
}

async function _pebSaveMDApprove(indentId, isSpecial) {
  var remarks = document.getElementById('pMD_rem').value;
  if(isSpecial && !remarks){showToast('MD remarks required for special approval','error');return;}
  try { await _pebPost('/api/peb/purchase/indents/'+indentId+'/md-approve', {action:'APPROVED',remarks:remarks||null}); showToast('MD approved — ready for PO','success'); _pebIndents(_p()); } catch(e){showToast(e.message,'error');}
}

async function _pebRejectIndent(id) {
  var remarks = prompt('Rejection reason:');
  if(remarks===null) return;
  try { await _pebPost('/api/peb/purchase/indents/'+id+'/gm-approve', {action:'REJECTED',remarks:remarks}); showToast('Indent rejected','success'); _pebIndents(_p()); } catch(e){showToast(e.message,'error');}
}

function _pebShowAddIndent() {
  // Simplified — indent + items (quotations added separately)
  _pebApi('/api/peb/store/items').then(function(items) {
    window._pebIndItems = items;
    var el = _p();
    el.innerHTML = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebIndents(_p())">&#8592; Back</button>' +
      '<div class="card" style="padding:16px"><h3 style="font-size:.85rem;font-weight:600;margin-bottom:12px">New Purchase Indent</h3>' +
      _pebForm([
        {type:'row',fields:[{label:'Site',id:'pInd_site',placeholder:'Site name'},{label:'Urgency',id:'pInd_urg',type:'select',options:'<option value="ROUTINE">Routine</option><option value="URGENT">Urgent</option><option value="CRITICAL">Critical</option>'}]},
        {type:'row',fields:[{label:'Required By',id:'pInd_date',type:'date'},{label:'Project Ref',id:'pInd_proj'}]},
        {label:'Reason / Purpose',id:'pInd_reason',type:'textarea',required:true,rows:2,placeholder:'Why is this purchase needed?'}
      ]) +
      '<h4 style="margin:14px 0 8px;font-size:.78rem;font-weight:600">Items Required</h4><div id="pInd_items"></div>' +
      '<button class="btn btn-white-outline" style="font-size:.65rem;padding:4px 10px;margin-bottom:12px" onclick="_pebAddIndentRow()">+ Add Item</button>' +
      '<div class="card" style="padding:10px;background:#f0f9ff;border-left:3px solid #3b82f6;margin-bottom:12px;font-size:.72rem"><strong>Next step:</strong> After creating, add 3 vendor quotations. System auto-ranks L1/L2/L3.</div>' +
      '<button class="btn btn-golden" style="display:block;width:100%" onclick="_pebSaveIndent()">Create Indent</button></div>';
    _pebAddIndentRow();
  });
}

function _pebAddIndentRow() {
  var items = window._pebIndItems||[];
  var opts = items.map(function(i){return '<option value="'+i.id+'">'+escapeHTML(i.item_code)+' — '+escapeHTML(i.item_name)+'</option>';}).join('');
  var div = document.createElement('div');
  div.className = 'peb-ind-row';
  div.style.cssText = 'display:flex;gap:5px;margin-bottom:8px;align-items:end;flex-wrap:wrap';
  div.innerHTML = '<div style="flex:2;min-width:140px"><label style="font-size:.6rem;font-weight:600">Item</label><select class="pInd_sel" style="width:100%;padding:5px;border:1px solid var(--gray-200);border-radius:6px;font-size:.72rem">'+opts+'</select></div>' +
    '<div style="flex:1;min-width:55px"><label style="font-size:.6rem;font-weight:600">Qty</label><input class="pInd_qty" type="number" style="width:100%;padding:5px;border:1px solid var(--gray-200);border-radius:6px;font-size:.72rem"></div>' +
    '<div style="flex:1;min-width:80px"><label style="font-size:.6rem;font-weight:600">Spec</label><input class="pInd_spec" placeholder="Size, grade" style="width:100%;padding:5px;border:1px solid var(--gray-200);border-radius:6px;font-size:.72rem"></div>' +
    '<div style="flex:1;min-width:65px"><label style="font-size:.6rem;font-weight:600">Est Cost</label><input class="pInd_cost" type="number" style="width:100%;padding:5px;border:1px solid var(--gray-200);border-radius:6px;font-size:.72rem"></div>' +
    '<button class="btn" style="font-size:.55rem;padding:3px 6px;background:var(--danger);color:#fff" onclick="this.parentElement.remove()">X</button>';
  document.getElementById('pInd_items').appendChild(div);
}

async function _pebSaveIndent() {
  var rows = document.querySelectorAll('.peb-ind-row');
  var items = [];
  rows.forEach(function(r){var id=r.querySelector('.pInd_sel').value;var qty=+r.querySelector('.pInd_qty').value;if(id&&qty)items.push({item_id:+id,qty:qty,specification:r.querySelector('.pInd_spec').value||null,estimated_cost:+r.querySelector('.pInd_cost').value||null});});
  if(items.length===0){showToast('Add at least one item','error');return;}
  if(!document.getElementById('pInd_reason').value){showToast('Reason required','error');return;}
  try {
    var r = await _pebPost('/api/peb/purchase/indents', {site_name:document.getElementById('pInd_site').value||null, urgency:document.getElementById('pInd_urg').value, required_by:document.getElementById('pInd_date').value||null, project_reference:document.getElementById('pInd_proj').value||null, reason:document.getElementById('pInd_reason').value, items:items});
    showToast('Indent created. Now add 3 quotations.','success');
    _pebViewIndent(r.id);
  } catch(e){showToast(e.message,'error');}
}

// ========== PURCHASE ORDERS (with payment tracking) ==========
async function _pebOrders(el) {
  try {
    var pos = await _pebApi('/api/peb/purchase/orders');
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-size:.75rem;color:var(--gray-500)">'+pos.length+' orders</span></div>';
    html += _pebTbl(['PO #','Vendor','Amount','Paid','Balance','Status','Actions'], pos.map(function(p) {
      return [escapeHTML(p.po_number), escapeHTML(p.vendor_name||'-'), _pebCurr(p.total_amount), _pebCurr(p.total_paid), _pebCurr(p.balance_due), _pebStatus(p.status),
        '<a href="#" onclick="_pebViewPO('+p.id+');return false" style="font-size:.7rem;color:var(--primary);margin-right:4px">View</a>' +
        (p.status==='DRAFT'?'<button class="btn btn-golden" style="font-size:.6rem;padding:2px 8px;margin-right:3px" onclick="_pebApprovePO('+p.id+')">Approve</button>':'') +
        (p.balance_due>0?'<button class="btn btn-golden" style="font-size:.6rem;padding:2px 8px" onclick="_pebShowPayment('+p.id+')">Pay</button>':'')];
    }));
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div class="card" style="padding:20px;text-align:center;color:var(--danger)">'+escapeHTML(e.message)+'</div>'; }
}

async function _pebViewPO(id) {
  try {
    var data = await _pebApi('/api/peb/purchase/orders/'+id);
    var el = _p();
    var html = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebOrders(_p())">&#8592; Back</button>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:12px">';
    html += _pebStat('Total', _pebCurr(data.total_amount));
    html += _pebStat('Paid', _pebCurr(data.total_paid), '#22c55e');
    html += _pebStat('Balance', _pebCurr(data.balance_due), data.balance_due>0?'#ef4444':'#22c55e');
    html += '</div>';
    html += '<div class="card" style="padding:12px;margin-bottom:12px;font-size:.75rem"><p><strong>Vendor:</strong> '+escapeHTML(data.vendor_name||'-')+' | <strong>Status:</strong> '+_pebStatus(data.status)+' | <strong>MD Approved:</strong> '+(data.approved_by_md?'Yes':'No')+'</p>' +
      '<p><strong>Delivery:</strong> '+_pebDate(data.delivery_deadline)+' | <strong>Terms:</strong> '+escapeHTML(data.payment_terms||'-')+'</p></div>';
    html += '<h3 style="font-size:.82rem;font-weight:700;margin-bottom:8px">Items</h3>';
    html += _pebTbl(['Item','Qty','Unit Price','Total','Received'], (data.items||[]).map(function(i) {
      return [escapeHTML(i.item_name), i.qty+' '+escapeHTML(i.unit||''), _pebCurr(i.unit_price), _pebCurr(i.total_price), ''+(i.received_qty||0)];
    }), '450px');
    if((data.payments||[]).length>0) {
      html += '<h3 style="font-size:.82rem;font-weight:700;margin:16px 0 8px">Payments</h3>';
      html += _pebTbl(['Date','Amount','Mode','Reference'], data.payments.map(function(p) {
        return [_pebDate(p.payment_date), _pebCurr(p.amount), escapeHTML(p.mode), escapeHTML(p.reference||'-')];
      }), '400px');
    }
    html += '<div style="display:flex;gap:8px;margin-top:12px">';
    if(data.status==='DRAFT') html += '<button class="btn btn-golden" onclick="_pebApprovePO('+id+')">Approve PO</button>';
    if(data.balance_due>0) html += '<button class="btn btn-golden" onclick="_pebShowPayment('+id+')">Record Payment</button>';
    html += '</div>';
    el.innerHTML = html;
  } catch(e){showToast(e.message,'error');}
}

async function _pebApprovePO(id) {
  if(!confirm('Approve this PO?')) return;
  try{await _pebPost('/api/peb/purchase/orders/'+id+'/approve',{});showToast('PO approved','success');_pebOrders(_p());}catch(e){showToast(e.message,'error');}
}

function _pebShowPayment(poId) {
  var el = _p();
  el.innerHTML = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebViewPO('+poId+')">&#8592; Back</button>' +
    '<div class="card" style="padding:16px"><h3 style="font-size:.85rem;font-weight:600;margin-bottom:12px">Record Payment</h3>' +
    _pebForm([
      {type:'row',fields:[{label:'Amount',id:'pPay_amt',type:'number',required:true,step:'0.01'},{label:'Date',id:'pPay_date',type:'date',required:true,value:new Date().toISOString().split('T')[0]}]},
      {type:'row',fields:[{label:'Mode',id:'pPay_mode',type:'select',required:true,options:'<option value="BANK_TRANSFER">Bank Transfer</option><option value="CHEQUE">Cheque</option><option value="UPI">UPI</option><option value="CASH">Cash</option>'},{label:'Reference (UTR/Cheque)',id:'pPay_ref'}]}
    ]) +
    '<button class="btn btn-golden" style="margin-top:12px" onclick="_pebSavePayment('+poId+')">Record Payment</button></div>';
}

async function _pebSavePayment(poId) {
  try{await _pebPost('/api/peb/purchase/orders/'+poId+'/payment',{amount:+document.getElementById('pPay_amt').value,payment_date:document.getElementById('pPay_date').value,mode:document.getElementById('pPay_mode').value,reference:document.getElementById('pPay_ref').value||null}); showToast('Payment recorded','success'); _pebViewPO(poId);}catch(e){showToast(e.message,'error');}
}

// ========== TRANSPORT (full approve + complete) ==========
async function _pebTransport(el) {
  try {
    var reqs = await _pebApi('/api/peb/purchase/transport');
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-size:.75rem;color:var(--gray-500)">'+reqs.length+' requests</span>' +
      '<button class="btn btn-golden" style="font-size:.7rem;padding:5px 12px" onclick="_pebShowAddTransport()">+ New Request</button></div>';
    html += _pebTbl(['Code','Type','From','To','Date','Vehicle','Status','Actions'], reqs.map(function(t) {
      return [escapeHTML(t.request_code), _pebStatus(t.type), escapeHTML(t.origin_name||'-'), escapeHTML(t.destination_name||'-'), _pebDate(t.scheduled_date), escapeHTML(t.vehicle_number||'-'), _pebStatus(t.status),
        '<a href="#" onclick="_pebViewTransport('+t.id+');return false" style="font-size:.7rem;color:var(--primary);margin-right:4px">View</a>' +
        (t.status==='REQUESTED'?'<button class="btn btn-golden" style="font-size:.6rem;padding:2px 8px;margin-right:3px" onclick="_pebApproveTransport('+t.id+')">Approve</button><button class="btn" style="font-size:.6rem;padding:2px 8px;background:var(--danger);color:#fff" onclick="_pebRejectTransport('+t.id+')">Reject</button>':'') +
        (t.status==='APPROVED'?'<button class="btn btn-golden" style="font-size:.6rem;padding:2px 8px" onclick="_pebStartTransit('+t.id+')">Start Transit</button>':'') +
        (t.status==='IN_TRANSIT'?'<button class="btn btn-golden" style="font-size:.6rem;padding:2px 8px" onclick="_pebCompleteTransport('+t.id+')">Complete</button>':'')];
    }));
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div class="card" style="padding:20px;text-align:center;color:var(--danger)">'+escapeHTML(e.message)+'</div>'; }
}

async function _pebViewTransport(id) {
  try {
    var t = await _pebApi('/api/peb/purchase/transport/'+id);
    var el = _p();
    var html = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebTransport(_p())">&#8592; Back</button>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:12px">';
    html += '<div class="card" style="padding:10px;text-align:center"><div style="font-size:.6rem;color:var(--gray-500)">Status</div>'+_pebStatus(t.status)+'</div>';
    html += '<div class="card" style="padding:10px;text-align:center"><div style="font-size:.6rem;color:var(--gray-500)">Type</div><div style="font-size:.7rem;font-weight:600">'+escapeHTML((t.type||'').replace(/_/g,' '))+'</div></div>';
    html += '<div class="card" style="padding:10px;text-align:center"><div style="font-size:.6rem;color:var(--gray-500)">Urgency</div>'+_pebStatus(t.urgency||'NORMAL')+'</div>';
    html += '</div>';
    html += '<div class="card" style="padding:12px;margin-bottom:12px;font-size:.75rem">' +
      '<p><strong>From:</strong> '+escapeHTML(t.origin_name||'-')+' &rarr; <strong>To:</strong> '+escapeHTML(t.destination_name||'-')+'</p>' +
      '<p><strong>Date:</strong> '+_pebDate(t.scheduled_date)+' | <strong>Vehicle:</strong> '+escapeHTML(t.vehicle_type||'-')+'</p>' +
      (t.reason?'<p><strong>Reason:</strong> '+escapeHTML(t.reason)+'</p>':'') +
      (t.vehicle_number?'<p style="margin-top:6px"><strong>Vehicle #:</strong> '+escapeHTML(t.vehicle_number)+' | <strong>Driver:</strong> '+escapeHTML(t.driver_name||'-')+' | <strong>Phone:</strong> '+escapeHTML(t.driver_phone||'-')+'</p>':'') +
      (t.transport_cost?'<p><strong>Cost:</strong> '+_pebCurr(t.transport_cost)+' | <strong>KM:</strong> '+(t.actual_km||'-')+' | <strong>Condition:</strong> '+_pebStatus(t.delivery_condition||'')+'</p>':'') +
      '</div>';
    html += '<div style="display:flex;gap:8px">';
    if(t.status==='REQUESTED') html += '<button class="btn btn-golden" onclick="_pebApproveTransport('+id+')">Approve</button><button class="btn" style="background:var(--danger);color:#fff" onclick="_pebRejectTransport('+id+')">Reject</button>';
    if(t.status==='APPROVED') html += '<button class="btn btn-golden" onclick="_pebStartTransit('+id+')">Start Transit</button>';
    if(t.status==='IN_TRANSIT') html += '<button class="btn btn-golden" onclick="_pebCompleteTransport('+id+')">Complete</button>';
    html += '</div>';
    el.innerHTML = html;
  } catch(e){showToast(e.message,'error');}
}

function _pebApproveTransport(id) {
  var el = _p();
  el.innerHTML = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebTransport(_p())">&#8592; Back</button>' +
    '<div class="card" style="padding:16px"><h3 style="font-size:.85rem;font-weight:600;margin-bottom:12px">Approve Transport</h3>' +
    _pebForm([
      {label:'Vehicle Number',id:'pTR_veh',placeholder:'TN-01-AB-1234'},
      {type:'row',fields:[{label:'Driver Name',id:'pTR_drv'},{label:'Driver Phone',id:'pTR_drvPh'}]}
    ]) +
    '<button class="btn btn-golden" style="margin-top:12px" onclick="_pebSaveApproveTransport('+id+')">Approve</button></div>';
}

async function _pebSaveApproveTransport(id) {
  try{await _pebPost('/api/peb/purchase/transport/'+id+'/approve',{action:'APPROVED',vehicle_number:document.getElementById('pTR_veh').value||null,driver_name:document.getElementById('pTR_drv').value||null,driver_phone:document.getElementById('pTR_drvPh').value||null}); showToast('Transport approved','success'); _pebTransport(_p());}catch(e){showToast(e.message,'error');}
}

async function _pebRejectTransport(id) {
  if(!confirm('Reject this transport?')) return;
  try{await _pebPost('/api/peb/purchase/transport/'+id+'/approve',{action:'REJECTED'});showToast('Rejected','success');_pebTransport(_p());}catch(e){showToast(e.message,'error');}
}

async function _pebStartTransit(id) {
  try{await _pebPost('/api/peb/purchase/transport/'+id+'/start',{});showToast('In transit','success');_pebTransport(_p());}catch(e){showToast(e.message,'error');}
}

function _pebCompleteTransport(id) {
  var el = _p();
  el.innerHTML = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebTransport(_p())">&#8592; Back</button>' +
    '<div class="card" style="padding:16px"><h3 style="font-size:.85rem;font-weight:600;margin-bottom:12px">Complete Transport</h3>' +
    _pebForm([
      {type:'row',fields:[{label:'Actual KM',id:'pTC_km',type:'number',step:'0.1'},{label:'Transport Cost (Rs)',id:'pTC_cost',type:'number',step:'0.01'}]},
      {label:'Delivery Condition',id:'pTC_cond',type:'select',options:'<option value="GOOD">Good</option><option value="DAMAGED">Damaged</option><option value="PARTIAL">Partial</option>'},
      {label:'Damage Notes (if any)',id:'pTC_dmg',type:'textarea',rows:2}
    ]) +
    '<button class="btn btn-golden" style="margin-top:12px" onclick="_pebSaveCompleteTransport('+id+')">Mark Delivered</button></div>';
}

async function _pebSaveCompleteTransport(id) {
  try{await _pebPost('/api/peb/purchase/transport/'+id+'/complete',{actual_km:+document.getElementById('pTC_km').value||null,transport_cost:+document.getElementById('pTC_cost').value||null,delivery_condition:document.getElementById('pTC_cond').value,damage_notes:document.getElementById('pTC_dmg').value||null}); showToast('Transport completed','success'); _pebTransport(_p());}catch(e){showToast(e.message,'error');}
}

function _pebShowAddTransport() {
  var el = _p();
  el.innerHTML = '<button class="btn btn-white-outline" style="font-size:.7rem;margin-bottom:12px" onclick="_pebTransport(_p())">&#8592; Back</button>' +
    '<div class="card" style="padding:16px"><h3 style="font-size:.85rem;font-weight:600;margin-bottom:12px">New Transport Request</h3>' +
    _pebForm([
      {label:'Type',id:'pTR_type',type:'select',required:true,options:'<option value="COMPANY_TO_SITE">Company to Site</option><option value="SITE_TO_COMPANY">Site to Company</option><option value="SITE_TO_SITE">Site to Site</option><option value="SITE_TO_SCRAP">Site to Scrap</option>'},
      {type:'row',fields:[{label:'From',id:'pTR_from',required:true,placeholder:'e.g. Head Office Store'},{label:'To',id:'pTR_to',required:true,placeholder:'e.g. Site A'}]},
      {type:'row',fields:[{label:'Scheduled Date',id:'pTR_date',type:'date',required:true},{label:'Vehicle Type',id:'pTR_vtype',type:'select',options:'<option value="PICKUP">Pickup</option><option value="MINI_TRUCK">Mini Truck</option><option value="LORRY">Lorry</option><option value="TRAILER">Trailer</option>'}]},
      {type:'row',fields:[{label:'Urgency',id:'pTR_urg',type:'select',options:'<option value="NORMAL">Normal</option><option value="URGENT">Urgent</option>'},{label:'Est. Weight (Kg)',id:'pTR_wt',type:'number',step:'0.1'}]},
      {label:'Reason',id:'pTR_reason',type:'textarea',rows:2}
    ]) +
    '<button class="btn btn-golden" style="margin-top:12px" onclick="_pebSaveTransport()">Submit Request</button></div>';
}

async function _pebSaveTransport() {
  var type=document.getElementById('pTR_type').value;
  var date=document.getElementById('pTR_date').value;
  if(!type||!date){showToast('Type and date required','error');return;}
  try{
    await _pebPost('/api/peb/purchase/transport',{type:type,origin_name:document.getElementById('pTR_from').value||null,destination_name:document.getElementById('pTR_to').value||null,scheduled_date:date,urgency:document.getElementById('pTR_urg').value,vehicle_type:document.getElementById('pTR_vtype').value||null,estimated_weight:+document.getElementById('pTR_wt').value||null,reason:document.getElementById('pTR_reason').value||null});
    showToast('Transport request created','success');_pebTransport(_p());
  }catch(e){showToast(e.message,'error');}
}

