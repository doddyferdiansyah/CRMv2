// ============================================================
// supabase.js — Koneksi & Semua Fungsi Fetch
// Muat file ini PERTAMA di setiap halaman HTML
// ============================================================

const SUPA_URL = 'https://ndubaavorwfwreyockkc.supabase.co';
const SUPA_KEY = 'sb_publishable_R0Xpw6Pw52gcTt3yXtLV2w_M60ASBpO';
const SUPA_HDR = {
  'apikey':        SUPA_KEY,
  'Authorization': 'Bearer ' + SUPA_KEY,
  'Content-Type':  'application/json'
};

async function supaFetch(q) {
  try {
    const r = await fetch(SUPA_URL + '/rest/v1/' + q, { headers: SUPA_HDR });
    if (!r.ok) { console.error('[SB]', r.status, q); return null; }
    return r.json();
  } catch(e) { console.error('[SB] fetch error:', e); return null; }
}

async function supaPost(table, data) {
  try {
    const r = await fetch(SUPA_URL + '/rest/v1/' + table, {
      method: 'POST',
      headers: { ...SUPA_HDR, 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    if (!r.ok) { console.error('[SB] post error', r.status, table); return null; }
    return r.json();
  } catch(e) { console.error('[SB] post error:', e); return null; }
}

// ── Roadmap ──────────────────────────────────────────────────
async function getPhases() {
  return supaFetch(
    'phases?select=' +
    'id,code,title,duration,target,description,quick_win,sort_order,' +
    'levels(id,name,color),' +
    'modules(id,title,icon,priority,reference,sort_order,' +
      'topics(id,content,sort_order),' +
      'module_resources(sort_order,resources(id,name,url))),' +
    'phase_frameworks(sort_order,frameworks(id,code,name,color)),' +
    'gate_items(id,content,sort_order)' +
    '&order=sort_order&is_active=eq.true'
  );
}

// ── Frameworks ───────────────────────────────────────────────
async function getFrameworks() {
  return supaFetch('frameworks?select=*&order=sort_order&is_active=eq.true');
}

// ── Resources ────────────────────────────────────────────────
async function getResources() {
  return supaFetch('resources?select=*&order=category,sort_order&is_active=eq.true');
}

// ── Certifications ───────────────────────────────────────────
async function getCertifications() {
  return supaFetch(
    'certifications?select=*,certification_tracks(track_code)' +
    '&order=level,sort_order&is_active=eq.true'
  );
}

// ── Careers ──────────────────────────────────────────────────
async function getCareers() {
  return supaFetch(
    'careers?select=*,' +
    'career_skills(id,name,percentage,sort_order),' +
    'career_certifications(sort_order,certifications(id,vendor,name,level))' +
    '&order=sort_order&is_active=eq.true'
  );
}

// ── Assessment ───────────────────────────────────────────────
async function getAssessmentQuestions() {
  return supaFetch(
    'assessment_questions?select=*,' +
    'assessment_options(id,emoji,label,sub_label,value,sort_order)' +
    '&order=sort_order&is_active=eq.true'
  );
}

async function saveAssessmentResult(result) {
  let token = localStorage.getItem('crm_token');
  if (!token) {
    token = 'crm_' + Date.now() + '_' + Math.random().toString(36).slice(2,9);
    localStorage.setItem('crm_token', token);
  }
  const session = await supaPost('assessment_sessions', {
    session_token:     token,
    recommended_track: result.track      || null,
    recommended_pace:  result.pace       || null,
    skip_prefondasi:   result.skipL0     || false,
    ai_priority:       result.aiPriority || false,
    grc_priority:      result.grcPriority|| false,
    user_agent:        navigator.userAgent
  });
  if (!session || !session.length) return null;
  const sid = session[0].id;
  const rows = Object.entries(result.answers).map(([idx, val]) => ({
    session_id: sid, question_id: parseInt(idx)+1, option_value: val
  }));
  await supaPost('assessment_answers', rows);
  return sid;
}

// ── Learning Path ────────────────────────────────────────────
async function getLearningPath(trackCode) {
  const t = await supaFetch('tracks?code=eq.'+trackCode+'&select=id&limit=1');
  if (!t || !t.length) return null;
  return supaFetch(
    'lp_phases?track_id=eq.'+t[0].id+
    '&select=*,phases(id,code,title,duration,description),' +
    'lp_weeks(id,week_label,title,tasks,sort_order,' +
      'lp_week_resources(sort_order,resources(id,name,url,price_type,price_label)))' +
    '&order=sort_order'
  );
}
