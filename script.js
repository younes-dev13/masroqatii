const KEY = 'masruqati_reports_v2';

const starterReports = [
  {id:id(), type:'phone', title:'Samsung Galaxy أسود', serial:'IMEI123456789', city:'وهران', date:'2026-04-20', image:'', desc:'مثال تجريبي: هاتف أسود مع خدش صغير بجانب الكاميرا.', createdAt:Date.now()-300000},
  {id:id(), type:'bike', title:'دراجة جبلية حمراء', serial:'BIKE-7788', city:'الجزائر', date:'2026-04-18', image:'', desc:'مثال تجريبي: دراجة حمراء بعجلات سوداء.', createdAt:Date.now()-600000},
  {id:id(), type:'car', title:'سيارة بيضاء', serial:'VIN-TEST-2026', city:'قسنطينة', date:'2026-04-10', image:'', desc:'مثال تجريبي لبلاغ سيارة.', createdAt:Date.now()-900000}
];

function id(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function clean(v){ return String(v || '').trim().toUpperCase().replace(/\s+/g,''); }
function esc(v){ return String(v || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
function icon(type){ return {phone:'📱',car:'🚗',bike:'🚲',laptop:'💻',other:'📦'}[type] || '📦'; }

function getReports(){
  const data = localStorage.getItem(KEY);
  if(!data){ localStorage.setItem(KEY, JSON.stringify(starterReports)); return starterReports; }
  try { return JSON.parse(data); } catch { return []; }
}
function saveReports(reports){ localStorage.setItem(KEY, JSON.stringify(reports)); }

function showPage(pageId){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  window.scrollTo({top:0, behavior:'smooth'});
  render();
}

function searchItem(){
  const serial = clean(document.getElementById('searchInput').value);
  const result = document.getElementById('searchResult');
  if(!serial){
    result.className = 'result show danger';
    result.textContent = 'اكتب الرقم أولًا.';
    return;
  }
  const found = getReports().find(r => clean(r.serial) === serial);
  if(found){
    result.className = 'result show danger';
    result.innerHTML = `⚠️ يوجد بلاغ مطابق: <b>${esc(found.title)}</b><br><button class="submit" style="margin-top:10px" onclick="openDetails('${found.id}')">عرض التفاصيل</button>`;
  } else {
    result.className = 'result show safe';
    result.textContent = '✅ لا توجد بلاغات مطابقة في قاعدة بيانات الموقع الحالية.';
  }
}

function addReport(e){
  e.preventDefault();
  const reports = getReports();
  const serial = clean(document.getElementById('itemSerial').value);
  if(reports.some(r => clean(r.serial) === serial)){
    alert('هذا الرقم موجود مسبقًا.');
    return;
  }
  const report = {
    id:id(),
    type:document.getElementById('itemType').value,
    title:document.getElementById('itemTitle').value.trim(),
    serial,
    city:document.getElementById('itemCity').value.trim(),
    date:document.getElementById('itemDate').value,
    image:document.getElementById('itemImage').value.trim(),
    desc:document.getElementById('itemDesc').value.trim(),
    createdAt:Date.now()
  };
  reports.unshift(report);
  saveReports(reports);
  e.target.reset();
  alert('تم نشر البلاغ بنجاح.');
  showPage('home');
}

function card(report){
  const img = report.image ? `<img src="${esc(report.image)}" onerror="this.parentElement.textContent='${icon(report.type)}'" alt="">` : icon(report.type);
  return `<article class="card" onclick="openDetails('${report.id}')"><div class="card-img">${img}</div><div class="card-body"><h3>${esc(report.title)}</h3><div class="meta">${esc(report.city)} • ${esc(report.date)}</div><div class="meta">الرقم: ${esc(report.serial)}</div><span class="badge">مبلغ عنه</span></div></article>`;
}

function openDetails(reportId){
  const report = getReports().find(r => r.id === reportId);
  if(!report) return;
  document.getElementById('modalTitle').textContent = report.title;
  document.getElementById('modalBody').innerHTML = `<div class="card-img" style="border-radius:18px;overflow:hidden;margin-bottom:16px">${report.image ? `<img src="${esc(report.image)}" alt="">` : icon(report.type)}</div><p><b>الحالة:</b> مبلغ عنه من مستخدم</p><p><b>النوع:</b> ${esc(report.type)}</p><p><b>الرقم:</b> ${esc(report.serial)}</p><p><b>المدينة:</b> ${esc(report.city)}</p><p><b>التاريخ:</b> ${esc(report.date)}</p><p><b>الوصف:</b><br>${esc(report.desc)}</p><div class="warning">هذا بلاغ مستخدم فقط، وليس حكمًا قانونيًا.</div>`;
  document.getElementById('detailsModal').showModal();
}
function closeModal(){ document.getElementById('detailsModal').close(); }
function toggleTheme(){ document.body.classList.toggle('light'); }

function render(){
  const reports = getReports().sort((a,b)=>b.createdAt-a.createdAt);
  const empty = '<div class="hero-card" style="grid-column:1/-1;text-align:center">لا توجد بلاغات بعد.</div>';
  document.getElementById('recentReports').innerHTML = reports.slice(0,6).map(card).join('') || empty;
  document.getElementById('allReports').innerHTML = reports.map(card).join('') || empty;
}
render();
