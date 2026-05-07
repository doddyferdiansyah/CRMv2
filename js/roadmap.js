// roadmap.js — fetch from Supabase, render sama persis dengan versi lama

const LVL_BANNERS = {
  0:{ t:'DASAR',          c:'var(--L1)' },
  1:{ t:'DASAR',          c:'var(--L1)' },
  2:{ t:'DASAR',          c:'var(--L1)' },
  3:{ t:'MENENGAH',       c:'var(--L2)' },
  4:{ t:'MENENGAH',       c:'var(--L2)' },
  5:{ t:'MENENGAH',       c:'var(--L2)' },
  6:{ t:'TINGGI',         c:'var(--L3)' },
  7:{ t:'TINGGI',         c:'var(--L3)' },
  8:{ t:'TINGGI',         c:'var(--L3)' },
  9:{ t:'AHLI / SPESIALIS',c:'var(--L4)' },
};

const TAB_LABELS = {
  0:'L0 Pra-Fondasi', 1:'L1 Fondasi', 2:'L1 Kriptografi',
  3:'L2 Serangan & Pertahanan', 4:'L2 Infrastruktur', 5:'L2 Komunikasi',
  6:'L3 Governance', 7:'L3 SOC', 8:'L3 AI Security', 9:'L4 Spesialisasi'
};

function normPhase(p) {
  const color = p.levels?.color || '#22d3ee';
  return {
    id:    p.code,
    label: TAB_LABELS[p.sort_order] || p.title,
    lvl:   p.levels?.name || 'Dasar',
    color,
    title: p.title,
    dur:   p.duration || '',
    target:p.target   || '',
    desc:  p.description || '',
    qw:    p.quick_win   || '',
    fw: (p.phase_frameworks||[])
          .sort((a,b)=>a.sort_order-b.sort_order)
          .map(x=>({ c: x.frameworks?.code||'cy', l: x.frameworks?.name||'' })),
    nodes:(p.modules||[])
          .sort((a,b)=>a.sort_order-b.sort_order)
          .map(m=>({
            icon:   m.icon||'📌',
            lv:     m.priority||'must',
            lvl:    (m.priority||'must').toUpperCase(),
            t:      m.title,
            ref:    m.reference||'',
            topics: (m.topics||[]).sort((a,b)=>a.sort_order-b.sort_order).map(t=>t.content),
            tools:  (m.module_resources||[]).sort((a,b)=>a.sort_order-b.sort_order)
                      .map(mr=>mr.resources?.name||'').filter(Boolean)
          })),
    gate:{
      title:'Siap lanjut ke fase berikutnya jika kamu bisa…',
      items:(p.gate_items||[]).sort((a,b)=>a.sort_order-b.sort_order).map(g=>g.content)
    },
    so: p.sort_order
  };
}

async function renderRoadmap() {
  const nav = document.getElementById('phaseNav');
  const cnt = document.getElementById('phaseContent');
  if (!nav||!cnt) return;

  cnt.innerHTML = `<div class="state-box">
    <div class="state-icon spin">⟳</div>
    <div class="state-msg">Memuat roadmap dari database…</div></div>`;

  const raw = await getPhases();
  if (!raw||!raw.length) {
    cnt.innerHTML = `<div class="state-box err">
      <div class="state-icon">⚠</div>
      <div class="state-msg">Gagal memuat data. Coba refresh halaman.</div></div>`;
    return;
  }

  const phases = raw.map(normPhase).sort((a,b)=>a.so-b.so);

  // Tab nav
  nav.innerHTML = phases.map((p,i)=>`
    <button class="ptab ${i===0?'on':''}" onclick="switchPhase('${p.id}',this)">
      <span class="ptab-pip" style="background:${p.color}"></span>${p.label}
    </button>`).join('');

  // Content
  cnt.innerHTML = phases.map((p,i)=>{
    const bv = LVL_BANNERS[p.so];
    const banner = bv ? `
      <div class="lvl-banner" style="background:${bv.c}15;border-color:${bv.c}44;color:${bv.c}">
        <div class="lvl-line" style="background:${bv.c};opacity:.4"></div>
        ● ${bv.t}
        <div class="lvl-line" style="background:${bv.c};opacity:.4"></div>
      </div>` : '';

    const fwHtml = p.fw.map(f=>`<span class="fwr ${f.c}">${f.l}</span>`).join('');

    const nodesHtml = p.nodes.map(n=>`
      <div class="node" style="border-top-color:${p.color}">
        <div class="nt">
          <div class="ni">${n.icon}</div>
          <span class="must-t ${n.lv}">${n.lvl}</span>
        </div>
        <h3>${n.t}</h3>
        <div class="node-ref">${n.ref}</div>
        <ul class="node-topics">${n.topics.map(t=>`<li>${t}</li>`).join('')}</ul>
        <div class="node-tools">${n.tools.map(t=>`<span class="tool">${t}</span>`).join('')}</div>
      </div>`).join('');

    return `
      <div class="pmap ${i===0?'on':''}" id="map-${p.id}">
        ${banner}
        <div class="ph" style="border-left-color:${p.color}">
          <div class="ph-n" style="color:${p.color}">${String(i).padStart(2,'0')}</div>
          <div class="ph-info">
            <h2>${p.title}</h2>
            <div class="ph-meta">
              <span class="ph-tag">⏱ ${p.dur}</span>
              <span class="ph-tag">👤 ${p.target}</span>
              <span class="ph-tag" style="border-color:${p.color};color:${p.color}">● ${p.lvl}</span>
            </div>
            <div class="ph-desc">${p.desc}</div>
          </div>
        </div>
        <div class="fw-row">${fwHtml}</div>
        ${p.qw?`<div class="qw-box"><div class="qw-em">⚡</div><div>
          <div class="qw-lbl">Quick Win — Bisa Dicapai Hari Ini</div>
          <div class="qw-txt">${p.qw}</div></div></div>`:''}
        <div class="nodes">${nodesHtml}</div>
        ${p.gate.items.length?`
        <div class="gate">
          <div class="gate-head"><span style="font-size:20px">🔒</span><div>
            <div class="gate-lbl">Gerbang Kompetensi</div>
            <div class="gate-title">${p.gate.title}</div>
          </div></div>
          <ul class="gate-list">${p.gate.items.map(it=>`<li><span class="gc">□</span>${it}</li>`).join('')}</ul>
          <div class="gate-foot" style="color:${p.color}">Centang semua sebelum lanjut ke fase berikutnya</div>
        </div>`:''}
      </div>`;
  }).join('');
}

function switchPhase(id,btn){
  document.querySelectorAll('.ptab').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.pmap').forEach(m=>m.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('map-'+id).classList.add('on');
}

document.addEventListener('DOMContentLoaded', renderRoadmap);
