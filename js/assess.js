// assess.js — Assessment Page
// Soal dari Supabase, hasil disimpan ke Supabase

let Qs = [], answers = {}, curQ = 0;

// ── Load soal dari Supabase ──────────────────────────────────
async function initAssess() {
  const area = document.getElementById('qArea');
  area.innerHTML = `<div class="state-box">
    <div class="state-icon spin">⟳</div>
    <div class="state-msg">Memuat pertanyaan…</div></div>`;

  const data = await getAssessmentQuestions();
  if (!data || !data.length) {
    area.innerHTML = `<div class="state-box err">
      <div class="state-icon">⚠</div>
      <div class="state-msg">Gagal memuat soal. Coba refresh.</div></div>`;
    return;
  }

  // Sort options dalam setiap soal
  Qs = data.map(q => ({
    ...q,
    assessment_options: (q.assessment_options||[]).sort((a,b)=>a.sort_order-b.sort_order)
  }));

  buildAssess();
  updProg();
}

function buildAssess() {
  const area = document.getElementById('qArea');
  area.innerHTML = Qs.map((q,i)=>`
    <div class="qcard ${i===0?'on':''}" id="qc${i}">
      <div class="q-cat">${q.category} · ${i+1}/${Qs.length}</div>
      <div class="q-text">${q.question_text}</div>
      <div class="q-hint">${q.hint_text||''}</div>
      <div class="q-opts">
        ${q.assessment_options.map(o=>`
          <div class="q-opt" onclick="pickOpt(${i},'${o.value}',this)">
            <div class="q-opt-em">${o.emoji||''}</div>
            <div>
              <div class="q-opt-label">${o.label}</div>
              <div class="q-opt-sub">${o.sub_label||''}</div>
            </div>
          </div>`).join('')}
      </div>
      <div class="q-foot">
        <div class="q-ctr">Pertanyaan ${i+1} / ${Qs.length}</div>
        ${i>0?`<button class="btn btn-g" style="padding:5px 14px;font-size:9px" onclick="prevQ(${i})">← Kembali</button>`:'<div></div>'}
      </div>
    </div>`).join('');
}

function pickOpt(qi,val,el){
  answers[qi]=val;
  document.querySelectorAll(`#qc${qi} .q-opt`).forEach(o=>o.classList.remove('sel'));
  el.classList.add('sel');
  setTimeout(()=>nextQ(qi),380);
}
function nextQ(qi){
  if(qi<Qs.length-1){
    document.getElementById('qc'+qi).classList.remove('on');
    document.getElementById('qc'+(qi+1)).classList.add('on');
    curQ=qi+1; updProg();
  } else { updProg(true); showResult(); }
}
function prevQ(qi){
  document.getElementById('qc'+qi).classList.remove('on');
  document.getElementById('qc'+(qi-1)).classList.add('on');
  curQ=qi-1; updProg();
}
function updProg(done=false){
  const total = Qs.length || 12;
  const pct = done ? 100 : Math.round(((curQ+1)/total)*100);
  const fill  = document.getElementById('pFill');
  const label = document.getElementById('pLabel');
  const pct_  = document.getElementById('pPct');
  if(fill)  fill.style.width  = pct+'%';
  if(label) label.textContent = done ? `Selesai — ${total} pertanyaan dijawab` : `Pertanyaan ${curQ+1} dari ${total}`;
  if(pct_)  pct_.textContent  = pct+'%';
}

// ── Hitung profil ────────────────────────────────────────────
function calcProfile(){
  const a = answers;
  // Indeks jawaban sesuai sort_order DB (0-indexed di sini)
  // 0=bg, 1=cli, 2=know, 3=goal, 4=minat, 5=time, 6=urgency,
  // 7=ai, 8=reg, 9=style, 10=commit, 11=comm
  const v = i => a[i] || '';

  let track='explorer';
  if(v(4)==='int_pentest'||v(4)==='int_red') track='pentest';
  else if(v(4)==='int_soc'||v(4)==='int_blue') track='soc';
  else if(v(4)==='int_ai'||v(3)==='goal_ai') track='ai';
  else if(v(4)==='int_cloud') track='cloud';
  else if(v(4)==='int_grc') track='grc';

  const isIT   = v(0)==='bg_it';
  const skipL0 = isIT && v(2)==='know_high' && v(1)==='cli_yes';
  const pace   = (v(5)==='time_high'&&v(10)==='commit_high') ? 'intensif' :
                 (v(5)==='time_low'||v(10)==='commit_low')   ? 'santai' : 'normal';
  const aiPriority  = v(7)==='ai_high'||v(4)==='int_ai'||v(3)==='goal_ai';
  const grcPriority = v(8)!=='reg_none'||v(4)==='int_grc';
  const needComm = v(11)==='comm_low';
  const urgent   = v(6)==='urgency_fast';

  const profiles = {
    pentest: {emoji:'🔴',color:'var(--L5)',name:'Calon Penetration Tester',badge:'Red Team Track',
      desc:'Kamu punya minat offensif yang kuat. Learning Path-mu fokus pada exploitation, pentesting methodology, dan persiapan OSCP.'},
    soc:    {emoji:'🔵',color:'var(--L1)',name:'Calon SOC Analyst',badge:'Blue Team Track',
      desc:'Posisi SOC Analyst paling banyak tersedia di Indonesia. Learning Path-mu memprioritaskan SIEM, threat hunting, dan incident response.'},
    ai:     {emoji:'🤖',color:'var(--red)',name:'Calon AI Security Engineer',badge:'AI Security Track',
      desc:'Jalur paling langka dan paling dicari. Learning Path-mu memprioritaskan OWASP LLM Top 10, prompt injection, dan agentic AI defense.'},
    cloud:  {emoji:'🟣',color:'var(--L4)',name:'Calon Cloud Security Engineer',badge:'Cloud Security Track',
      desc:'Demand sangat tinggi seiring adopsi cloud massif. Learning Path-mu fokus AWS/Azure/GCP security, IAM, dan DevSecOps.'},
    grc:    {emoji:'⚖️',color:'var(--L4)',name:'Calon GRC / Compliance Analyst',badge:'GRC Track',
      desc:'GRC relevan di era UU PDP dan regulasi AI. Learning Path-mu fokus ISO 27001, manajemen risiko, dan regulasi Indonesia.'},
    explorer:{emoji:'🧭',color:'var(--L2)',name:'Explorer — Full Foundation Track',badge:'Full Exploration Track',
      desc:'Kamu belum punya minat spesifik — dan itu bagus! Learning Path-mu mencakup semua domain secara seimbang.'},
  };

  const paceLabel = {intensif:'Intensif (~15h+/minggu)',normal:'Normal (5–15h/minggu)',santai:'Santai (<5h/minggu)'}[pace];
  const phases = [
    {n:'0',name:'Pra-Fondasi: Literasi Digital',c:'var(--L1)',skip:skipL0,
      dur:pace==='intensif'?'1 mgg':pace==='santai'?'4 mgg':'2–3 mgg'},
    {n:'1',name:'Fondasi Teknis',c:'var(--L1)',skip:false,
      dur:pace==='intensif'?'4 mgg':pace==='santai'?'12 mgg':'6–8 mgg'},
    {n:'2',name:'Kriptografi & Post-Quantum',c:'var(--L1)',skip:false,
      dur:pace==='intensif'?'3 mgg':pace==='santai'?'8 mgg':'4–6 mgg'},
    {n:'3',name:'Serangan & Pertahanan',c:'var(--L2)',skip:false,
      dur:pace==='intensif'?'5 mgg':pace==='santai'?'14 mgg':'8–10 mgg'},
    {n:'4',name:'Infrastruktur & Cloud',c:'var(--L2)',skip:false,
      dur:pace==='intensif'?'4 mgg':pace==='santai'?'10 mgg':'6–8 mgg'},
    {n:'5',name:'Security Communication',c:'var(--L2)',skip:false,
      dur:pace==='intensif'?'2 mgg':pace==='santai'?'5 mgg':'3–4 mgg'},
    {n:'6',name:'Governance, Risk & Regulasi',c:'var(--L3)',skip:track==='pentest'&&!grcPriority,
      dur:pace==='intensif'?'3 mgg':pace==='santai'?'8 mgg':'4–6 mgg'},
    {n:'7',name:'SOC & Operasi Keamanan',c:'var(--L3)',skip:track==='grc'&&!urgent,
      dur:pace==='intensif'?'4 mgg':pace==='santai'?'10 mgg':'6–8 mgg'},
    {n:'8',name:'AI Security & Agentic AI',c:'var(--L3)',skip:!aiPriority&&urgent&&track==='grc',
      dur:pace==='intensif'?'3 mgg':pace==='santai'?'8 mgg':'4–6 mgg'},
    {n:'9',name:'Spesialisasi & Karier',c:'var(--L4)',skip:false,
      dur:pace==='intensif'?'12 mgg':'6–12 bln'},
  ];
  const startIdx = phases.findIndex(p=>!p.skip);
  return {prof:profiles[track]||profiles.explorer, phases, paceLabel, startIdx,
          aiPriority, grcPriority, needComm, urgent, isIT, track, pace, skipL0};
}

async function showResult(){
  document.getElementById('qArea').style.display='none';
  const rArea = document.getElementById('rArea');
  rArea.style.display='block';

  const {prof,phases,paceLabel,startIdx,aiPriority,grcPriority,needComm,urgent,isIT,track,pace,skipL0} = calcProfile();

  const notes=[];
  if(isIT)        notes.push('✓ Background IT-mu memungkinkan melewati beberapa fase awal');
  if(aiPriority)  notes.push('→ Fase AI Security diprioritaskan dalam jalurmu');
  if(grcPriority) notes.push('📋 Fase GRC & Regulasi diprioritaskan berdasarkan konteks kerjamu');
  if(needComm)    notes.push('💬 Security Communication direkomendasikan sebagai fokus tambahan');
  if(urgent)      notes.push('⚡ Mode cepat: fokus pada topik MUST terlebih dahulu');

  rArea.innerHTML=`
    <div class="result-card on" style="border-color:${prof.color}">
      <div class="res-top">
        <div class="res-emoji">${prof.emoji}</div>
        <div>
          <div class="res-badge" style="border-color:${prof.color};color:${prof.color}">${prof.badge}</div>
          <div class="res-name">${prof.name}</div>
          <div class="res-desc">${prof.desc}</div>
          <div style="margin-top:8px;font-size:10px;color:var(--text2)">Tempo: <strong style="color:var(--white)">${paceLabel}</strong></div>
          ${notes.length?`<div style="margin-top:10px;display:flex;flex-direction:column;gap:4px">
            ${notes.map(n=>`<div style="font-size:10px;color:var(--text2)">${n}</div>`).join('')}</div>`:''}
        </div>
      </div>
      <div class="res-path-title">Learning Path Personalisasi Kamu</div>
      <div class="rp-list">
        ${phases.map((p,i)=>`
          <div class="rp-row ${p.skip?'skip':''}">
            <div class="rp-n" style="color:${p.c};border-color:${p.c}">${p.n}</div>
            <div class="rp-name">${p.name}</div>
            <div class="rp-dur">${p.skip?'Dapat dilewati':p.dur}</div>
            ${p.skip
              ? `<span class="rp-tag" style="border-color:var(--text2);color:var(--text2)">SKIP</span>`
              : i===startIdx
                ? `<span class="rp-tag" style="border-color:${p.c};color:${p.c}">MULAI SINI</span>`
                : ''}
          </div>`).join('')}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn btn-p" href="lp.html?track=${track}">Lihat Learning Path Lengkap →</a>
        <a class="btn btn-g" href="roadmap.html">Lihat Roadmap Detail</a>
        <button class="btn btn-g" onclick="resetAssess()">↩ Ulangi</button>
      </div>
    </div>`;

  // Simpan ke Supabase (background)
  saveAssessmentResult({ track, pace, answers, skipL0, aiPriority, grcPriority })
    .catch(e => console.warn('Gagal simpan ke Supabase:', e));
}

function resetAssess(){
  answers={}; curQ=0;
  document.getElementById('qArea').style.display='block';
  document.getElementById('rArea').style.display='none';
  document.querySelectorAll('.qcard').forEach((c,i)=>{
    c.classList.toggle('on',i===0);
    c.querySelectorAll('.q-opt').forEach(o=>o.classList.remove('sel'));
  });
  updProg();
}

document.addEventListener('DOMContentLoaded', initAssess);
