// lp.js — Learning Path Page

const LP_TRACKS = [
  { code:'pentest',   label:'Penetration Tester', color:'#f43f5e' },
  { code:'soc',       label:'SOC Analyst',         color:'#38bdf8' },
  { code:'ai',        label:'AI Security',         color:'#f43f5e' },
  { code:'cloud',     label:'Cloud Security',      color:'#a855f7' },
  { code:'appsec',    label:'AppSec',              color:'#22c55e' },
  { code:'grc',       label:'GRC',                 color:'#ec4899' },
  { code:'dfir',      label:'DFIR',                color:'#f97316' },
  { code:'cti',       label:'CTI',                 color:'#eab308' },
  { code:'devsecops', label:'DevSecOps',            color:'#06b6d4' },
];

let activeTrack = 'soc';

async function initLP() {
  // Cek URL param track
  const params = new URLSearchParams(window.location.search);
  if (params.get('track')) activeTrack = params.get('track');
  // Cek localStorage dari hasil assessment
  const stored = localStorage.getItem('crm_token');

  renderTrackBar();
  await loadLP(activeTrack);
}

function renderTrackBar() {
  const bar = document.getElementById('lpTrackBar');
  if (!bar) return;
  bar.innerHTML = LP_TRACKS.map(t => `
    <button class="lp-tbtn ${t.code===activeTrack?'on':''}"
            onclick="switchTrack('${t.code}')">${t.label}</button>`).join('');
}

async function switchTrack(code) {
  activeTrack = code;
  renderTrackBar();
  await loadLP(code);
}

async function loadLP(trackCode) {
  const cnt = document.getElementById('lpContent');
  if (!cnt) return;
  cnt.innerHTML = `<div class="state-box">
    <div class="state-icon spin">⟳</div>
    <div class="state-msg">Memuat learning path…</div></div>`;

  const data = await getLearningPath(trackCode);
  if (!data || !data.length) {
    cnt.innerHTML = `<div class="state-box err">
      <div class="state-icon">⚠</div>
      <div class="state-msg">Belum ada data Learning Path untuk track ini.</div></div>`;
    return;
  }

  const track = LP_TRACKS.find(t=>t.code===trackCode);
  const color = track?.color || '#22d3ee';

  const sorted = data.sort((a,b)=>a.sort_order-b.sort_order);

  cnt.innerHTML = sorted.map((item,i)=>{
    const phase = item.phases || {};
    const weeks = (item.lp_weeks||[]).sort((a,b)=>a.sort_order-b.sort_order);
    const c = color;

    const modsHtml = weeks.map(w=>{
      const res = (w.lp_week_resources||[])
        .sort((a,b)=>a.sort_order-b.sort_order)
        .map(wr=>wr.resources).filter(Boolean);
      return `
        <div class="lp-mod" style="border-left-color:${c}88">
          <div class="lp-mod-week">${w.week_label}</div>
          <div class="lp-mod-title">${w.title}</div>
          ${w.tasks?`<div class="lp-mod-tasks">${w.tasks}</div>`:''}
          ${res.length?`<div class="lp-mod-res">${res.map(r=>
            r.url
              ? `<a href="${r.url}" target="_blank" rel="noopener" class="lp-mod-chip" style="color:inherit;text-decoration:none">${r.name}</a>`
              : `<span class="lp-mod-chip">${r.name}</span>`
          ).join('')}</div>`:''}
        </div>`;
    }).join('');

    return `
      <div class="lp-item" style="animation-delay:${i*.06}s">
        <div class="lp-dot" style="color:${c};border-color:${c};box-shadow:0 0 10px ${c}44">
          ${item.emoji||'📌'}
        </div>
        <div class="lp-body" style="border-left-color:${c}">
          <div class="lp-head">
            <div class="lp-title">${item.title||phase.title||''}</div>
            <div class="lp-dur">⏱ ${item.duration||phase.duration||''}</div>
          </div>
          <div class="lp-modules">${modsHtml}</div>
          ${item.outcome?`<div class="lp-out">${item.outcome}</div>`:''}
        </div>
      </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', initLP);
