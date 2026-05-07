// pages.js — Frameworks, Resources, Certifications, Careers
// Dipakai oleh: fw.html, res.html, cert.html, career.html

// ── FRAMEWORKS ───────────────────────────────────────────────
async function initFW() {
  const grid = document.getElementById('fwGrid');
  if (!grid) return;
  grid.innerHTML = loadingHTML();
  const data = await getFrameworks();
  if (!data||!data.length) { grid.innerHTML = errorHTML(); return; }
  grid.innerHTML = data.map(f=>`
    <div class="fw-card" style="border-top-color:${f.color||'var(--L1)'}">
      <div class="fw-icon">${f.icon||'📋'}</div>
      <div class="fw-type" style="color:${f.color||'var(--L1)'}">${f.type||''}</div>
      <div class="fw-name">${f.name}</div>
      <div class="fw-desc">${f.description||''}</div>
      <div class="fw-tags">${(f.tags||[]).map(t=>`<span class="fw-tag">${t}</span>`).join('')}</div>
    </div>`).join('');
}

// ── RESOURCES ────────────────────────────────────────────────
async function initRes() {
  const cnt = document.getElementById('resContent');
  if (!cnt) return;
  cnt.innerHTML = loadingHTML();
  const data = await getResources();
  if (!data||!data.length) { cnt.innerHTML = errorHTML(); return; }

  // Group by category
  const grouped = {};
  data.forEach(r => {
    const cat = r.category || 'Lainnya';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(r);
  });

  cnt.innerHTML = Object.entries(grouped).map(([cat,items])=>`
    <div class="res-sec">
      <div class="res-sec-hd">${cat} <span>${items.length} resources</span></div>
      <div class="res-grid">
        ${items.map(r=>`
          <div class="res-card">
            <div class="res-icon">${r.icon||'📌'}</div>
            <div>
              <div class="res-type">${r.type||''}</div>
              <div class="res-name">${r.url
                ? `<a href="${r.url}" target="_blank" rel="noopener" style="color:var(--white);text-decoration:none">${r.name}</a>`
                : r.name}</div>
              <div class="res-desc">${r.description||''}</div>
              <span class="res-pr rp-${r.price_type==='free'?'free':r.price_type==='paid'?'paid':'mix'}">
                ${r.price_label||''}
              </span>
            </div>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

// ── CERTIFICATIONS ───────────────────────────────────────────
let allCerts = [], cf = 'all';
const CF_OPTS = [
  {v:'all',l:'Semua'},{v:'dasar',l:'Dasar'},{v:'menengah',l:'Menengah'},
  {v:'tinggi',l:'Tinggi'},{v:'ahli',l:'Ahli'},{v:'free',l:'Gratis'},
  {v:'pentest',l:'Red Team'},{v:'soc',l:'Blue Team'},{v:'ai',l:'AI Security'},
  {v:'cloud',l:'Cloud'},{v:'grc',l:'GRC'},{v:'appsec',l:'AppSec'},
  {v:'dfir',l:'DFIR'},{v:'cti',l:'CTI'},{v:'devsecops',l:'DevSecOps'}
];
const LVL_COLORS = {
  dasar:'var(--L1)',menengah:'var(--L2)',tinggi:'var(--L3)',ahli:'var(--L4)'
};

async function initCerts() {
  const grid = document.getElementById('certGrid');
  if (!grid) return;
  grid.innerHTML = loadingHTML();
  allCerts = await getCertifications();
  if (!allCerts||!allCerts.length) { grid.innerHTML = errorHTML(); return; }
  renderCertFilter();
  renderCerts();
}

function renderCertFilter() {
  const bar = document.getElementById('certFilter');
  if (!bar) return;
  bar.innerHTML = CF_OPTS.map(o=>`
    <button class="cf-btn ${cf===o.v?'on':''}" onclick="setCF('${o.v}')">${o.l}</button>`).join('');
}

function setCF(v) { cf=v; renderCertFilter(); renderCerts(); }

function renderCerts() {
  const grid = document.getElementById('certGrid');
  if (!grid) return;
  let list = allCerts;
  if (cf==='free')  list = allCerts.filter(c=>c.price_type==='free');
  else if (['dasar','menengah','tinggi','ahli'].includes(cf))
    list = allCerts.filter(c=>c.level===cf);
  else if (cf!=='all')
    list = allCerts.filter(c=>(c.certification_tracks||[]).some(t=>t.track_code===cf));

  if (!list.length) {
    grid.innerHTML = '<div style="color:var(--text2);padding:20px;font-size:12px">Tidak ada sertifikasi untuk filter ini.</div>';
    return;
  }
  grid.innerHTML = list.map(c=>{
    const cc  = LVL_COLORS[c.level] || 'var(--L1)';
    const tracks = (c.certification_tracks||[]).map(t=>t.track_code);
    return `
      <div class="cert-card" style="border-top-color:${cc}">
        <div class="cert-top">
          <div>
            <div class="cert-vendor">${c.vendor}</div>
            <div class="cert-name">${c.name}</div>
          </div>
          <div class="cert-price ${c.price_type==='free'?'c-free':c.price_type==='mix'?'c-mix':'c-paid'}">
            ${c.price_label||''}
          </div>
        </div>
        <div class="cert-desc">${c.description||''}</div>
        <div class="cert-meta">
          <span class="cert-lvl" style="border-color:${cc};color:${cc}">
            ${c.level?c.level[0].toUpperCase()+c.level.slice(1):''}
          </span>
          ${tracks.map(t=>`<span class="cert-track">${t}</span>`).join('')}
        </div>
      </div>`;
  }).join('');
}

// ── CAREERS ──────────────────────────────────────────────────
async function initCareers() {
  const grid = document.getElementById('careerGrid');
  if (!grid) return;
  grid.innerHTML = loadingHTML();
  const data = await getCareers();
  if (!data||!data.length) { grid.innerHTML = errorHTML(); return; }
  grid.innerHTML = data.map(c=>{
    const skills = (c.career_skills||[]).sort((a,b)=>a.sort_order-b.sort_order);
    const certs  = (c.career_certifications||[])
      .sort((a,b)=>a.sort_order-b.sort_order)
      .map(cc=>cc.certifications).filter(Boolean);
    return `
      <div class="career-card" style="border-top-color:${c.color||'var(--L1)'}">
        <div class="cc-icon">${c.icon||'🔒'}</div>
        <div class="demand-tag" style="border-color:${c.color};color:${c.color}">
          Demand: ${c.demand_label||''}
        </div>
        <div class="cc-title">${c.title}</div>
        <div class="cc-en" style="color:${c.color}">${c.title_en||''}</div>
        <div class="cc-desc">${c.description||''}</div>
        <div class="cc-skills">
          ${skills.map(s=>`
            <div class="cs-row" style="color:${c.color}">
              <span style="min-width:125px;font-size:9px;color:var(--text2)">${s.name}</span>
              <div class="cs-bar"><div class="cs-fill" style="width:${s.percentage}%;background:${c.color}"></div></div>
              <span style="min-width:25px;text-align:right;font-size:9px">${s.percentage}%</span>
            </div>`).join('')}
        </div>
        <div class="cc-certs">
          ${certs.map(ct=>`<span class="cc-cert">${ct.name}</span>`).join('')}
        </div>
      </div>`;
  }).join('');
}

// ── Helpers ───────────────────────────────────────────────────
function loadingHTML() {
  return `<div class="state-box" style="grid-column:1/-1">
    <div class="state-icon spin">⟳</div>
    <div class="state-msg">Memuat data…</div></div>`;
}
function errorHTML() {
  return `<div class="state-box err" style="grid-column:1/-1">
    <div class="state-icon">⚠</div>
    <div class="state-msg">Gagal memuat data. Coba refresh.</div></div>`;
}

// ── Auto-init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', ()=>{
  initFW();
  initRes();
  initCerts();
  initCareers();
});
