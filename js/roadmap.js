// ============================================================
// roadmap.js — Explorer Kiri ke Kanan (Versi 1 Style)
// Tampilan: rm-explorer, rm-column, rm-card, rm-detail
// Data: Supabase (requires supabase.js)
//
// Di roadmap.html pastikan urutan script:
// <script src="js/supabase.js"></script>
// <script src="js/roadmap.js"></script>
// ============================================================

let rmPhases = [];

const RM_LEVELS = [
  { id:'dasar',    label:'Dasar',           color:'var(--L1)', orders:[0,1,2] },
  { id:'menengah', label:'Menengah',         color:'var(--L2)', orders:[3,4,5] },
  { id:'tinggi',   label:'Tinggi',           color:'var(--L3)', orders:[6,7,8] },
  { id:'ahli',     label:'Ahli / Spesialis', color:'var(--L4)', orders:[9]     },
];

const TAB_LABELS = {
  0:'Pra-Fondasi', 1:'Fondasi', 2:'Kriptografi',
  3:'Serangan & Pertahanan', 4:'Infrastruktur', 5:'Komunikasi',
  6:'Governance', 7:'SOC', 8:'AI Security', 9:'Spesialisasi'
};

// ── Shortcut elemen ──────────────────────────────────────────
const elEx  = () => document.getElementById('roadmapExplorer');
const elDet = () => document.getElementById('roadmapDetail');
const elBc  = () => document.getElementById('roadmapBreadcrumb');

// ── Normalisasi data Supabase ────────────────────────────────
function normPhase(p) {
  return {
    id:     p.code,
    so:     p.sort_order,
    label:  TAB_LABELS[p.sort_order] || p.title,
    lvl:    p.levels?.name  || 'Dasar',
    color:  p.levels?.color || '#22d3ee',
    title:  p.title,
    dur:    p.duration      || '',
    target: p.target        || '',
    desc:   p.description   || '',
    qw:     p.quick_win     || '',
    fw: (p.phase_frameworks||[])
          .sort((a,b)=>a.sort_order-b.sort_order)
          .map(x=>({ c:x.frameworks?.code||'cy', l:x.frameworks?.name||'' })),
    nodes: (p.modules||[])
          .sort((a,b)=>a.sort_order-b.sort_order)
          .map(m=>({
            icon:   m.icon||'📌',
            lv:     m.priority||'must',
            lvl:    (m.priority||'must').toUpperCase(),
            t:      m.title,
            ref:    m.reference||'',
            topics: (m.topics||[])
                      .sort((a,b)=>a.sort_order-b.sort_order)
                      .map(t=>t.content),
            tools:  (m.module_resources||[])
                      .sort((a,b)=>a.sort_order-b.sort_order)
                      .map(mr=>({ name:mr.resources?.name||'', url:mr.resources?.url||'' }))
                      .filter(t=>t.name)
          })),
    gate: {
      title: 'Siap lanjut ke fase berikutnya jika kamu bisa…',
      items: (p.gate_items||[])
               .sort((a,b)=>a.sort_order-b.sort_order)
               .map(g=>g.content)
    }
  };
}

function getPhasesByLevel(lvlId) {
  const lv = RM_LEVELS.find(l=>l.id===lvlId);
  return lv ? rmPhases.filter(p=>lv.orders.includes(p.so)) : [];
}

function getLevelByPhase(so) {
  return RM_LEVELS.find(l=>l.orders.includes(so));
}

function getPhase(id) {
  return rmPhases.find(p=>p.id===id);
}

// ── Breadcrumb ───────────────────────────────────────────────
function setBc(parts) {
  const el = elBc();
  if (!el) return;
  el.innerHTML = parts.map((p,i) => {
    const last = i === parts.length-1;
    return last
      ? `<span style="color:var(--white)">${p.label}</span>`
      : `<span style="color:var(--L1);cursor:pointer"
               onclick="${p.fn}">${p.label}</span>
         <span class="rm-breadcrumb-sep">›</span>`;
  }).join('');
}

// ── Hapus kolom mulai dari index ─────────────────────────────
function trimCols(from) {
  elEx().querySelectorAll('.rm-column').forEach((col,i)=>{ if(i>=from) col.remove(); });
}

// ── Tandai card aktif di kolom tertentu ──────────────────────
function markActive(colIdx, activeFn) {
  const cols = elEx().querySelectorAll('.rm-column');
  if (!cols[colIdx]) return;
  cols[colIdx].querySelectorAll('.rm-card, .rm-root-btn').forEach(btn => {
    btn.classList.toggle('rm-card-active', activeFn(btn));
  });
}

// ── Tambah kolom baru ────────────────────────────────────────
function addCol(head, stackHtml) {
  const col = document.createElement('div');
  col.className = 'rm-column';
  col.innerHTML = `
    <div class="rm-column-head">${head}</div>
    <div class="rm-stack">${stackHtml}</div>`;
  elEx().appendChild(col);
  setTimeout(()=>{ const ex=elEx(); if(ex) ex.scrollLeft=ex.scrollWidth; }, 60);
}

// ── Detail panel helpers ─────────────────────────────────────
function setDetail(html) {
  const el = elDet();
  if (el) el.innerHTML = html;
}

function emptyDetail(title, text) {
  setDetail(`<div class="rm-empty-detail">
    <div class="rm-empty-title">${title}</div>
    <div class="rm-empty-text">${text}</div>
  </div>`);
}


// ============================================================
// INIT
// ============================================================
async function renderRoadmap() {
  const ex = elEx();
  if (!ex) return;

  ex.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;
                width:100%;min-height:300px;color:var(--text2)">
      <div style="text-align:center">
        <div style="font-size:28px;margin-bottom:12px;
                    display:inline-block;animation:spin 1s linear infinite">⟳</div>
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase">
          Memuat roadmap dari database…
        </div>
      </div>
    </div>`;
  elDet().innerHTML = '';

  const raw = await getPhases();
  if (!raw || !raw.length) {
    ex.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;
                  width:100%;min-height:300px;color:var(--red)">
        <div style="text-align:center">
          <div style="font-size:28px;margin-bottom:12px">⚠</div>
          <div style="font-size:12px;margin-bottom:16px">Gagal memuat data. Coba refresh.</div>
          <button onclick="renderRoadmap()"
                  style="padding:8px 20px;font-size:10px;font-family:var(--mono);
                         letter-spacing:1px;text-transform:uppercase;cursor:pointer;
                         border:1px solid var(--L1);background:transparent;color:var(--L1)">
            Coba Lagi
          </button>
        </div>
      </div>`;
    return;
  }

  rmPhases = raw.map(normPhase).sort((a,b)=>a.so-b.so);
  showRoot();
}


// ============================================================
// KOLOM 1 — Root button
// ============================================================
function showRoot() {
  elEx().innerHTML = `
    <div class="rm-column rm-column-root">
      <div class="rm-column-head">Mulai</div>
      <div class="rm-stack">
        <button class="rm-root-btn" style="--rm-accent:var(--L1)"
                onclick="showLevels()">
          <div style="font-size:32px;margin-bottom:8px">🛡️</div>
          <div class="rm-card-title" style="text-align:center;font-size:1rem">
            Roadmap Belajar<br>Cybersecurity
          </div>
          <div class="rm-card-meta" style="text-align:center;margin-top:6px">
            ${rmPhases.length} fase · Klik untuk mulai
          </div>
        </button>
      </div>
    </div>`;

  emptyDetail(
    'Selamat Datang',
    'Klik tombol di kiri untuk mulai menjelajahi roadmap.<br><br>' +
    'Alur: <strong style="color:var(--white)">Level → Fase → Modul → Materi → Sumber Belajar</strong>'
  );
  setBc([{ label:'🛡️ Roadmap' }]);
}


// ============================================================
// KOLOM 2 — Level
// ============================================================
function showLevels() {
  showRoot();
  markActive(0, btn => btn.classList.contains('rm-root-btn'));

  addCol('Level',
    RM_LEVELS.map(lv => `
      <button class="rm-card" style="--rm-accent:${lv.color}"
              onclick="showPhases('${lv.id}')">
        <div class="rm-card-kicker" style="color:${lv.color}">${lv.label}</div>
        <div class="rm-card-title rm-card-title-sm">${lv.label}</div>
        <div class="rm-card-meta">${getPhasesByLevel(lv.id).length} fase</div>
      </button>`).join('')
  );

  emptyDetail('Pilih Level', 'Pilih level belajar untuk melihat fase yang tersedia.');
  setBc([
    { label:'🛡️ Roadmap', fn:'showRoot()' },
    { label:'Level' }
  ]);
}


// ============================================================
// KOLOM 3 — Fase
// ============================================================
function showPhases(lvlId) {
  trimCols(2);
  const lv     = RM_LEVELS.find(l=>l.id===lvlId);
  const phases = getPhasesByLevel(lvlId);

  markActive(1, btn => btn.getAttribute('onclick') === `showPhases('${lvlId}')`);

  addCol('Fase',
    phases.map(p => `
      <button class="rm-card" style="--rm-accent:${p.color}"
              onclick="showModules('${p.id}')">
        <div class="rm-card-kicker" style="color:${p.color}">Fase ${p.so}</div>
        <div class="rm-card-title rm-card-title-sm">${p.label}</div>
        <div class="rm-card-meta">⏱ ${p.dur} · ${p.nodes.length} modul</div>
      </button>`).join('')
  );

  emptyDetail(lv.label, 'Pilih fase untuk melihat modul yang tersedia.');
  setBc([
    { label:'🛡️ Roadmap', fn:'showRoot()' },
    { label:'Level',       fn:'showLevels()' },
    { label: lv.label }
  ]);
}


// ============================================================
// KOLOM 4 — Modul
// ============================================================
function showModules(phaseId) {
  trimCols(3);
  const p  = getPhase(phaseId);
  if (!p) return;
  const lv = getLevelByPhase(p.so);

  markActive(2, btn => btn.getAttribute('onclick') === `showModules('${phaseId}')`);

  addCol('Modul',
    p.nodes.map((n,ni) => `
      <button class="rm-card" style="--rm-accent:${p.color}"
              onclick="showTopics('${phaseId}',${ni})">
        <div class="rm-card-kicker" style="color:${p.color}">
          ${n.icon}
          <span class="must-t ${n.lv}" style="margin-left:6px;vertical-align:middle">${n.lvl}</span>
        </div>
        <div class="rm-card-title rm-card-title-sm">${n.t}</div>
        <div class="rm-card-meta">${n.topics.length} materi</div>
      </button>`).join('')
  );

  // Detail: info fase
  setDetail(`
    <div class="rm-detail-card">
      <div class="rm-detail-kicker">Fase ${p.so} — ${p.lvl}</div>
      <div class="rm-detail-title">${p.title}</div>
      <div class="rm-detail-desc">${p.desc}</div>
      ${p.fw.length ? `
        <div class="rm-detail-tags">
          ${p.fw.map(f=>`<span class="rm-tag">${f.l}</span>`).join('')}
        </div>` : ''}
      ${p.qw ? `
        <div class="rm-detail-list-head">⚡ Quick Win</div>
        <div class="rm-quick-win">${p.qw}</div>` : ''}
      <div class="rm-detail-list-head">⏱ Durasi & Target</div>
      <ul class="rm-detail-list">
        <li>${p.dur}</li>
        <li>${p.target}</li>
      </ul>
    </div>`);

  setBc([
    { label:'🛡️ Roadmap',  fn:'showRoot()' },
    { label:'Level',        fn:'showLevels()' },
    { label: lv?.label||'', fn:`showPhases('${lv?.id}')` },
    { label: p.label }
  ]);
}


// ============================================================
// KOLOM 5 — Materi
// ============================================================
function showTopics(phaseId, nodeIdx) {
  trimCols(4);
  const p  = getPhase(phaseId);
  if (!p) return;
  const n  = p.nodes[nodeIdx];
  const lv = getLevelByPhase(p.so);

  // Tandai modul aktif di kolom 4
  const cols = elEx().querySelectorAll('.rm-column');
  if (cols[3]) {
    cols[3].querySelectorAll('.rm-card').forEach((btn,i) => {
      btn.classList.toggle('rm-card-active', i === nodeIdx);
    });
  }

  addCol('Materi',
    n.topics.map((t,ti) => `
      <button class="rm-card" style="--rm-accent:${p.color}"
              onclick="showSources('${phaseId}',${nodeIdx})">
        <div class="rm-card-kicker" style="color:${p.color}">
          ${String(ti+1).padStart(2,'0')}
        </div>
        <div class="rm-card-title rm-card-title-sm">${t}</div>
      </button>`).join('')
  );

  // Detail: info modul lengkap
  setDetail(`
    <div class="rm-detail-card">
      <div class="rm-detail-kicker">${n.icon} ${n.lvl}</div>
      <div class="rm-detail-title">${n.t}</div>
      ${n.ref ? `<div class="rm-detail-desc" style="font-size:10px;color:var(--text2);margin-bottom:4px">${n.ref}</div>` : ''}

      <div class="rm-detail-list-head">Materi yang Dipelajari</div>
      <ul class="rm-detail-list">
        ${n.topics.map(t=>`<li>${t}</li>`).join('')}
      </ul>

      ${n.tools.length ? `
        <div class="rm-detail-list-head">Sumber Belajar</div>
        <div class="rm-detail-actions rm-resource-wrap">
          ${n.tools.map(tool => tool.url
            ? `<a href="${tool.url}" target="_blank" rel="noopener"
                  class="rm-resource-link">${tool.name}</a>`
            : `<span class="rm-resource-link" style="cursor:default;opacity:.7">${tool.name}</span>`
          ).join('')}
        </div>` : ''}

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
        ${nodeIdx > 0
          ? `<button class="rm-detail-link" onclick="showTopics('${phaseId}',${nodeIdx-1})">← Modul Sebelumnya</button>`
          : ''}
        ${nodeIdx < p.nodes.length-1
          ? `<button class="rm-detail-link" onclick="showTopics('${phaseId}',${nodeIdx+1})">Modul Berikutnya →</button>`
          : ''}
      </div>

      ${p.gate.items.length ? `
        <div class="rm-detail-list-head" style="margin-top:18px">🔒 Gerbang Kompetensi</div>
        <ul class="rm-detail-list">
          ${p.gate.items.map(it=>`<li>□ ${it}</li>`).join('')}
        </ul>` : ''}
    </div>`);

  setBc([
    { label:'🛡️ Roadmap',   fn:'showRoot()' },
    { label:'Level',         fn:'showLevels()' },
    { label: lv?.label||'',  fn:`showPhases('${lv?.id}')` },
    { label: p.label,        fn:`showModules('${phaseId}')` },
    { label: n.t }
  ]);
}


// ============================================================
// KOLOM 6 — Sumber Belajar
// ============================================================
function showSources(phaseId, nodeIdx) {
  trimCols(5);
  const p  = getPhase(phaseId);
  if (!p) return;
  const n  = p.nodes[nodeIdx];
  const lv = getLevelByPhase(p.so);

  if (!n.tools.length) return;

  addCol('Sumber Belajar',
    n.tools.map(tool =>
      tool.url
        ? `<a href="${tool.url}" target="_blank" rel="noopener"
              class="rm-card rm-resource-card" style="--rm-accent:${p.color}">
             <div class="rm-card-kicker" style="color:${p.color}">Kunjungi →</div>
             <div class="rm-resource-title rm-card-title-sm">${tool.name}</div>
           </a>`
        : `<div class="rm-card rm-resource-card is-disabled" style="--rm-accent:${p.color}">
             <div class="rm-resource-title rm-card-title-sm">${tool.name}</div>
           </div>`
    ).join('')
  );

  setBc([
    { label:'🛡️ Roadmap',    fn:'showRoot()' },
    { label:'Level',          fn:'showLevels()' },
    { label: lv?.label||'',   fn:`showPhases('${lv?.id}')` },
    { label: p.label,         fn:`showModules('${phaseId}')` },
    { label: n.t,             fn:`showTopics('${phaseId}',${nodeIdx})` },
    { label:'Sumber Belajar' }
  ]);
}


// ============================================================
// AUTO INIT
// ============================================================
document.addEventListener('DOMContentLoaded', renderRoadmap);
