// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
/* ================================================================
   First-run questionnaire (#onb) — shown once, the first time someone opens their plan
   ================================================================ */
const ACTIVITY_LEVELS = [[1.3, 'Sedentary', 'Desk job, under 5k steps a day'], [1.4, 'Lightly active', 'Desk job plus 5–8k steps'], [1.5, 'Moderately active', '8–12k steps, or a job with some walking'], [1.6, 'Very active', 'On your feet most of the day, 12k+ steps']];
const OB_STEPS = ['About you', 'Your body', 'Your goal', 'Meal planning'];
let OB = null;
// Deurenberg (1991): body fat % from BMI, age and sex (1 = male, 0 = female)
function deurenbergBF(lb, heightIn, age, male) {
  if (!(lb > 0 && heightIn > 0 && age > 0)) return null;
  const bmi = 703 * lb / (heightIn * heightIn);
  return Math.round(clamp(1.2 * bmi + 0.23 * age - 10.8 * (male ? 1 : 0) - 5.4, 5, 60) * 10) / 10;
}
function obNum(v) { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return Number.isFinite(n) ? n : null; }
function obBF() { return OB.bf != null && OB.bf !== '' ? obNum(OB.bf) : deurenbergBF(obNum(OB.w), (obNum(OB.hFt) || 0) * 12 + (obNum(OB.hIn) || 0), obNum(OB.age), OB.sex === 'm'); }
function obEstimated() { return !(OB.bf != null && String(OB.bf).trim() !== ''); }
function showOnboarding(done) {
  const u = AUTH.user || {}; const parts = String(u.name || '').trim().split(/\s+/);
  const looksLikeEmail = !u.name || (u.email && u.name === u.email.split('@')[0]);
  OB = { step: 0, done, error: null,
    first: u.firstName || (looksLikeEmail ? '' : parts[0] || ''), last: u.lastName || (looksLikeEmail ? '' : parts.slice(1).join(' ')), nick: u.firstName || (looksLikeEmail ? '' : parts[0] || ''),
    w: '', bf: '', hFt: '', hIn: '', sex: '', age: '', goal: '', rate: 1, mode: 'cut', bulkPct: 0.35, activity: 1.4, share: true };
  document.body.className = 'auth-page onb-page'; bgCurrent = null; document.body.dataset.sec = 'auth';
  document.body.innerHTML = `<div class="auth-split"><section class="auth-hero" aria-hidden="true"><div class="auth-photo" style="background-image:url('${AUTH_PHOTO.url}'), ${AUTH_PHOTO.fallback}"></div>
      <div class="auth-hero-copy"><div class="auth-brand">${LOGO}<b class="wm">FORGE<em>90</em></b></div><p>A few questions and your training plan, calorie targets and meals are built around you.</p></div>
      <a class="auth-credit" href="${AUTH_PHOTO.page}" target="_blank" rel="noopener noreferrer">Photo · ${AUTH_PHOTO.who} / Unsplash</a></section>
    <main id="onb" class="auth-wrap"></main></div><div id="tip"></div><div id="toast"></div>`;
  applyTheme(); document.title = appTitle() + ' · Welcome'; renderOnboarding();
}
function obApplyDraft() {           // live preview uses the real engine, so push the answers into settings (saved only on finish)
  const st = S.settings; const w = obNum(OB.w), bf = obBF(), g = obNum(OB.goal);
  if (w) st.startWeight = w; if (bf) st.startBF = bf; if (g) st.goalWeight = g;
  st.rate = +OB.rate; st.activity = +OB.activity; st.shareIngredients = !!OB.share;
  st.goal = OB.mode === 'bulk' || OB.mode === 'maintain' ? OB.mode : 'cut'; st.bulkPct = +OB.bulkPct || 0.35;
  if (bf && st.goalBF >= bf) st.goalBF = Math.max(5, Math.round(bf - 3));
  invalidate();
}
function obSummaryHTML() {
  obApplyDraft(); const st = S.settings; const tT = targetsFor(st.startWeight, st.startBF, true), tR = targetsFor(st.startWeight, st.startBF, false);
  const pr = Math.abs(planRate(st.startWeight)) || 0.0001;
  const weeks = Math.abs(st.startWeight - st.goalWeight) / pr; const when = addDays(maxISO(todayISO(), st.startDate), Math.round(weeks * 7));
  return `<div class="onb-sum"><div><span class="tiny muted">Calories · training / rest day</span><b class="num">${fmt(tT.kcal)} / ${fmt(tR.kcal)}</b></div><div><span class="tiny muted">Protein</span><b class="num">${fmt(tT.protein)} g</b></div><div><span class="tiny muted">Reach ${fmt(st.goalWeight, st.goalWeight % 1 ? 1 : 0)} lb</span><b>${fmtDate(when, { month: 'short', day: 'numeric', year: 'numeric' })}</b></div></div>`;
}
function renderOnboarding() {
  const s = OB; const el = $('#onb'); if (!el) return;
  const msg = s.error ? `<div class="auth-msg err" role="alert">${icon('info')}<span>${esc(s.error)}</span></div>` : '';
  const dots = `<div class="onb-steps" aria-label="Step ${s.step + 1} of ${OB_STEPS.length}">${OB_STEPS.map((l, i) => `<span class="${i < s.step ? 'done' : i === s.step ? 'on' : ''}"><i>${i < s.step ? icon('check') : i + 1}</i><em>${l}</em></span>`).join('')}</div>`;
  const fld = (label, name, val, attrs = '', hint = '') => `<div class="field"><label for="ob-${name}">${label}</label><input class="inp" id="ob-${name}" name="${name}" value="${esc(val)}" ${attrs}>${hint ? `<span class="tiny muted">${hint}</span>` : ''}</div>`;
  let body = '';
  if (s.step === 0) body = `<h1>Welcome${s.first ? ', ' + esc(s.first) : ''}!</h1><p class="sub">Let’s set up your plan. It takes about a minute, and you can change any of this later in Settings.</p>${msg}
    <div class="grid g2" style="gap:12px">${fld('First name', 'first', s.first, 'autocomplete="given-name" maxlength="40" required')}${fld('Last name', 'last', s.last, 'autocomplete="family-name" maxlength="40" required')}</div>
    ${fld('Nickname', 'nick', s.nick, 'autocomplete="nickname" maxlength="40" required', 'Your display name — shown in the app and to anyone you sync meal plans with.')}`;
  if (s.step === 1) { const est = obEstimated(); const bf = obBF();
    body = `<h1>Your body today</h1><p class="sub">Your calorie and protein targets are built from your weight and lean mass.</p>${msg}
    <div class="grid g2" style="gap:12px">${fld('Current weight (lb)', 'w', s.w, 'type="number" inputmode="decimal" step="0.1" min="70" max="700" required')}
      ${fld('Body fat % <span class="muted" style="font-weight:500">— optional</span>', 'bf', s.bf, 'type="number" inputmode="decimal" step="0.1" min="3" max="70" placeholder="Leave blank if unknown"')}</div>
    <div class="onb-est ${est ? '' : 'hidden'}" id="ob-est"><div class="tiny muted" style="margin:4px 0 8px">No body-fat number? We’ll estimate it from your height, age and sex.</div>
      <div class="grid g3" style="gap:10px"><div class="field"><label>Height</label><div class="row" style="gap:6px;flex-wrap:nowrap"><input class="inp" name="hFt" value="${esc(s.hFt)}" type="number" inputmode="numeric" min="3" max="8" placeholder="ft" aria-label="Height, feet"><input class="inp" name="hIn" value="${esc(s.hIn)}" type="number" inputmode="numeric" min="0" max="11.9" step="0.5" placeholder="in" aria-label="Height, inches"></div></div>
        <div class="field"><label>Sex</label><select class="inp" name="sex"><option value="">Choose…</option><option value="m" ${s.sex === 'm' ? 'selected' : ''}>Male</option><option value="f" ${s.sex === 'f' ? 'selected' : ''}>Female</option></select></div>
        ${fld('Age', 'age', s.age, 'type="number" inputmode="numeric" min="16" max="99"')}</div>
      <div class="note warn" style="margin-top:12px">${icon('info')}<span>${bf ? `Estimated body fat: <b>${fmt(bf, 1)}%</b>. ` : ''}This estimate (the Deurenberg formula, from BMI, age and sex) is <b>less accurate than a measured body-fat %</b> — it can be off by 5 points or more, especially if you carry a lot of muscle. When you can, measure it with a smart scale, calipers or a DEXA scan and add it to a weigh-in; your targets update automatically.</span></div></div>`; }
  if (s.step === 2) { const w = obNum(s.w) || S.settings.startWeight;
    const gk = s.mode === 'bulk' || s.mode === 'maintain' ? s.mode : 'cut';
    const sub = gk === 'bulk' ? 'FORGE 90 plans a measured surplus — enough to build, slow enough that most of it is muscle.'
      : gk === 'maintain' ? 'FORGE 90 holds you at maintenance calories while you train.'
      : 'FORGE 90 plans a steady cut with enough protein to keep your muscle.';
    const rateCtl = gk === 'maintain' ? ''
      : gk === 'bulk' ? `<div class="field" style="margin-top:12px"><label>Weekly gain: <b id="ob-rate-v">${fmt(+s.bulkPct, 2)} % of body weight</b></label><input type="range" name="bulkPct" min="0.15" max="0.6" step="0.05" value="${s.bulkPct}" aria-label="Weekly gain, percent of body weight">
        <div class="row" style="justify-content:space-between"><span class="tiny muted">0.15</span><span class="tiny muted">0.35</span><span class="tiny muted">0.6 %/wk</span></div></div>`
      : `<div class="field" style="margin-top:12px"><label>Target loss rate: <b id="ob-rate-v">${fmt(+s.rate, 2)} lb / week</b></label><input type="range" name="rate" min="0.25" max="2" step="0.05" value="${s.rate}" aria-label="Target loss rate, pounds per week">
        <div class="row" style="justify-content:space-between"><span class="tiny muted">0.25</span><span class="tiny muted">1.0</span><span class="tiny muted">2.0 lb/wk</span></div></div>`;
    body = `<h1>Your goal</h1><p class="sub">${sub}</p>${msg}
    <div class="field"><label>What are you after?</label><div class="seg seg-goal">${[['cut', 'Lose fat'], ['maintain', 'Maintain'], ['bulk', 'Build muscle']].map(([v, l]) => `<button type="button" class="${gk === v ? 'on' : ''}" data-act="ob-mode" data-v="${v}">${l}</button>`).join('')}</div></div>
    <div class="grid g2" style="gap:12px;margin-top:12px">${fld(gk === 'bulk' ? 'Goal weight (lb)' : 'Goal weight (lb)', 'goal', s.goal, `type="number" inputmode="decimal" step="0.1" ${gk === 'bulk' ? `min="${fmt(w, 1)}" max="600"` : `min="70" max="${fmt(w, 1)}"`} ${gk === 'maintain' ? '' : 'required'}`)}
      <div class="field"><label for="ob-activity">Activity level <span class="muted" style="font-weight:500">— outside the gym</span></label><select class="inp" id="ob-activity" name="activity">${ACTIVITY_LEVELS.map(([v, l, d]) => `<option value="${v}" ${+s.activity === v ? 'selected' : ''}>${l} — ${d}</option>`).join('')}</select></div></div>
    ${rateCtl}
    <div id="ob-rate-info" style="margin-top:6px">${obRateInfo()}</div>`; }
  if (s.step === 3) body = `<h1>Meal planning</h1><p class="sub">One last choice. Every meal is portioned to your targets either way.</p>${msg}
    <label class="onb-share ${s.share ? 'on' : ''}"><input type="checkbox" name="share" ${s.share ? 'checked' : ''}><i class="switch ${s.share ? 'on' : ''}" aria-hidden="true"><i></i></i>
      <span><b>Money-saving meal planning</b><span class="small sub">Plans each week so your recipes <b>share fresh ingredients</b> — the rest of a bag of spinach or a pack of chicken goes into another meal that week instead of going bad. You buy fewer packages and waste less. Your variety and ★ favorites stay the same; only the order of meals within the week changes, and meals you place yourself are never moved.</span></span></label>
    <h3 style="margin:18px 0 8px">Your starting targets</h3><div id="ob-sum">${obSummaryHTML()}</div>
    <div class="tiny muted" style="margin-top:8px">Your plan starts ${fmtDate(S.settings.startDate, { weekday: 'long', month: 'long', day: 'numeric' })} with 3 training days a week — change the start date and training days any time in Settings.</div>`;
  el.innerHTML = `<form class="auth-card onb-card" data-form="onb" novalidate><div class="auth-brand">${LOGO}<b class="wm">FORGE<em>90</em></b></div>${dots}${body}
    <div class="onb-nav">${s.step ? `<button type="button" class="btn ghost" data-act="onb-back">${icon('left')}Back</button>` : '<span></span>'}<button class="btn primary big" type="submit">${s.step < OB_STEPS.length - 1 ? `Continue ${icon('right')}` : `${icon('check')}Start my plan`}</button></div></form>`;
  const f = el.querySelector('input:not([type=checkbox]):not([type=range]), select'); if (f && !s.noFocus) setTimeout(() => { const e = el.querySelector('input:invalid, input[value=""]:not([type=range]):not([name=bf])') || f; e.focus(); }, 30);
  s.noFocus = false;
}
function obRateInfo() { obApplyDraft(); const k = goalKind();
  return k === 'bulk' ? bulkInfoHTML(+OB.bulkPct) : k === 'maintain' ? `<div class="tiny muted">Calories sit at maintenance — no deficit, no surplus.</div>` : rateInfoHTML(+OB.rate); }
function obRead(form) {
  const fd = new FormData(form);
  ['first', 'last', 'nick', 'w', 'bf', 'hFt', 'hIn', 'sex', 'age', 'goal', 'rate', 'bulkPct', 'activity'].forEach(k => { if (fd.has(k)) OB[k] = String(fd.get(k)).trim(); });
  if (form.elements.share) OB.share = form.elements.share.checked;
}
function obValidate() {
  const s = OB;
  if (s.step === 0) { if (!s.first || !s.last) return 'Enter your first and last name.'; if (!s.nick) return 'Choose a nickname — it’s how you’ll show up in the app.'; }
  if (s.step === 1) { const w = obNum(s.w); if (!w || w < 70 || w > 700) return 'Enter your current weight in pounds.';
    if (!obEstimated()) { const b = obNum(s.bf); if (!b || b < 3 || b > 70) return 'Body fat should be between 3 and 70% — or leave it blank.'; }
    else { const h = (obNum(s.hFt) || 0) * 12 + (obNum(s.hIn) || 0); if (h < 48 || h > 96) return 'Enter your height so we can estimate body fat (or type a body-fat %).';
      if (!s.sex) return 'Choose male or female for the body-fat estimate.'; const a = obNum(s.age); if (!a || a < 16 || a > 99) return 'Enter your age (16–99) for the body-fat estimate.'; } }
  if (s.step === 2) { const g = obNum(s.goal), w = obNum(s.w); if (!g || g < 70) return 'Enter your goal weight in pounds.'; if (g >= w) return `Your goal should be below your current weight (${fmt(w, 1)} lb).`; }
  return null;
}
async function obSubmit(form) {
  obRead(form); const bad = obValidate(); if (bad) { OB.error = bad; OB.noFocus = true; renderOnboarding(); return; }
  OB.error = null;
  if (OB.step < OB_STEPS.length - 1) { OB.step++; renderOnboarding(); return; }
  const btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.classList.add('loading');
  obApplyDraft(); const est = obEstimated();
  S.profile = { first: OB.first, last: OB.last, nick: OB.nick, heightIn: (obNum(OB.hFt) || 0) * 12 + (obNum(OB.hIn) || 0) || null, sex: OB.sex || null, age: obNum(OB.age), at: todayISO() };
  S.settings.bfEstimated = est; S.onboarded = true;
  S.plan = {}; S.planEnd = null; ensureHorizon();                         // meals depend on the money-saver choice
  if (AUTH.mode === 'server' && AUTH.user) { try { const r = await api('PATCH', '/api/account', { firstName: OB.first, lastName: OB.last, name: OB.nick }); AUTH.user = r.user; } catch (e) { btn.disabled = false; btn.classList.remove('loading'); OB.error = e.message; renderOnboarding(); return; } }
  saveState(); const done = OB.done; OB = null;
  toast(`You’re all set, ${S.profile.nick}! Your plan is ready. 💪`);
  if (done) done();
}
document.addEventListener('submit', e => { const f = e.target; if (f.dataset && f.dataset.form === 'onb') { e.preventDefault(); obSubmit(f); } });
document.addEventListener('input', e => {
  const t = e.target; if (!OB || !t.closest || !t.closest('form[data-form="onb"]')) return;
  const form = t.closest('form'); obRead(form); if (OB.error) { OB.error = null; const m = form.querySelector('.auth-msg'); if (m) m.remove(); }
  if (t.name === 'bf' || t.name === 'w' || t.name === 'hFt' || t.name === 'hIn' || t.name === 'age') {
    const box = $('#ob-est'); if (box) { box.classList.toggle('hidden', !obEstimated()); const n = box.querySelector('.note span'); const bf = obBF();
      if (n) n.innerHTML = n.innerHTML.replace(/^Estimated body fat: <b>[^<]*<\/b>\. /, '').replace(/^/, bf ? `Estimated body fat: <b>${fmt(bf, 1)}%</b>. ` : ''); } }
  if (t.name === 'rate') { const v = $('#ob-rate-v'); if (v) v.textContent = fmt(+t.value, 2) + ' lb / week'; const i = $('#ob-rate-info'); if (i) i.innerHTML = obRateInfo(); }
  if (t.name === 'bulkPct') { const v = $('#ob-rate-v'); if (v) v.textContent = fmt(+t.value, 2) + ' % of body weight'; const i = $('#ob-rate-info'); if (i) i.innerHTML = obRateInfo(); }
  if (t.name === 'goal') { const i = $('#ob-rate-info'); if (i) i.innerHTML = obRateInfo(); }
});
document.addEventListener('change', e => {
  const t = e.target; if (!OB || !t.closest || !t.closest('form[data-form="onb"]')) return; obRead(t.closest('form'));
  if (t.name === 'sex') { const box = $('#ob-est'); const n = box && box.querySelector('.note span'); const bf = obBF(); if (n) n.innerHTML = n.innerHTML.replace(/^Estimated body fat: <b>[^<]*<\/b>\. /, '').replace(/^/, bf ? `Estimated body fat: <b>${fmt(bf, 1)}%</b>. ` : ''); }
  if (t.name === 'activity') { const i = $('#ob-rate-info'); if (i) i.innerHTML = obRateInfo(); }
  if (t.name === 'share') { const l = t.closest('.onb-share'); l.classList.toggle('on', t.checked); l.querySelector('.switch').classList.toggle('on', t.checked); const s = $('#ob-sum'); if (s) s.innerHTML = obSummaryHTML(); }
});
Object.assign(ACT, { 'onb-back': () => { const f = $('form[data-form="onb"]'); if (f) obRead(f); OB.error = null; OB.step = Math.max(0, OB.step - 1); renderOnboarding(); },
  'ob-mode': el => { const f = $('form[data-form="onb"]'); if (f) obRead(f); OB.mode = el.dataset.v; OB.error = null; OB.noFocus = true; renderOnboarding(); } });
/* Reminder to replace an estimated body-fat % with a measured one */
function bfEstimateNote() {
  if (!S.settings.bfEstimated || S.weights.some(x => x.bf != null && x.bf !== '')) return '';
  return `<div class="note warn bf-est-note">${icon('info')}<span>Your body fat (${fmt(S.settings.startBF, 1)}%) is an <b>estimate</b> from height, age and sex, so your calorie targets are approximate. When you can, measure it (smart scale, calipers or DEXA) and add it to a weigh-in — targets update automatically.</span><a class="btn sm" href="#/progress">Add a weigh-in</a></div>`;
}

/* ================================================================
   Meal-plan sync with another account
   ================================================================ */
const SY = { data: null, rev: 0, snap: null, snapAt: null, pollT: null, diffT: null, snapT: null, busy: false, started: false };
const syncActive = () => AUTH.mode === 'server' && !!AUTH.user && !!SY.data && SY.data.status === 'active';
const syncName = () => (SY.data && SY.data.partner && SY.data.partner.name) || 'your partner';
function syncSlotOn(slot) { return syncActive() && !!SY.data.slots[slot]; }
function syncKeyOn(date, slot) { return syncSlotOn(slot) && !!SY.data.since && date >= SY.data.since; }
function partnerMeal(date, slot) { const d = SY.snap && SY.snap.days && SY.snap.days[date]; return (d && d.m && d.m[slot]) || null; }
function myMeal(date, slot) { const e = S.plan[date]; return (e && e.m && e.m[slot]) || null; }
function isSharedMeal(date, slot) {
  if (!syncKeyOn(date, slot)) return false; const mine = myMeal(date, slot); if (!mine) return false;
  const p = partnerMeal(date, slot); if (p) return p.rid === mine;
  const k = date + '|' + slot; return SY.data.agreed[k] === mine && !SY.data.changesOut.concat(SY.data.changesIn).some(c => c.date === date && c.slot === slot);
}
// computeAll hook: the partner's scaled portions ride along on shared meals (combined batches and shopping list)
function attachPartner(days) {
  if (!syncActive() || !SY.snap) return;
  Object.keys(days).forEach(d => days[d].meals.forEach(m => { if (isSharedMeal(d, m.slot)) { const p = partnerMeal(d, m.slot); if (p && p.items) m.partner = { items: p.items.filter(([id]) => ING[id]) }; } }));
}
function shareBadge(date, slot, compact) {             // compact (calendar chips): only flag meals that need attention
  if (!syncKeyOn(date, slot) || !myMeal(date, slot)) return '';
  const k = date + '|' + slot; const inc = SY.data.changesIn.find(c => c.date === date && c.slot === slot), out = SY.data.changesOut.find(c => c.date === date && c.slot === slot);
  if (inc) return `<span class="bd shr pend" data-tip="${esc(syncName())} changed this to ${esc(inc.name || inc.rid)} — open Sync to accept or decline">${icon('users')}?</span>`;
  if (out) return `<span class="bd shr pend" data-tip="Waiting for ${esc(syncName())} to accept this change">${icon('users')}…</span>`;
  if (compact) return '';
  if (isSharedMeal(date, slot)) return `<span class="bd shr" data-tip="Shared with ${esc(syncName())} — on both plans and one shopping list">${icon('users')}</span>`;
  return `<span class="bd shr off" data-tip="${SY.data.div[k] ? esc(syncName()) + ' declined this change, so you eat different meals here' : 'Not the same meal as ' + esc(syncName()) + ' today'}">${icon('users')}</span>`;
}
function syncBtnHTML(cls = '') {
  if (!syncActive()) return '';
  const n = SY.data.changesIn.length + (SY.data.slotReq && SY.data.slotReq.by !== AUTH.user.id ? 1 : 0);
  return `<button class="btn sync-btn ${cls} ${n ? 'has' : ''}" data-act="sync-open" title="Meal plan synced with ${esc(syncName())}${n ? ` — ${n} change${n === 1 ? '' : 's'} to review` : ''}">${icon('users')}<span>Sync</span>${n ? `<b class="sync-badge">${n}</b>` : ''}</button>`;
}
function refreshSyncUI() {
  $$('.sync-btn').forEach(b => { const cls = [...b.classList].filter(c => !['btn', 'sync-btn', 'has'].includes(c)).join(' '); const h = syncBtnHTML(cls); if (h) b.outerHTML = h; else b.remove(); });
  if ($('#modal .sync-modal')) syncPanel();
  const card = $('#acc-sync'); if (card) card.innerHTML = syncCardHTML();
}
/* ---------- talking to the server ---------- */
async function syncFetch(force) {
  if (AUTH.mode !== 'server' || !AUTH.user || !S) return;
  let r; try { r = await api('GET', '/api/sync' + (force || !SY.rev ? '' : '?rev=' + SY.rev)); } catch (e) { return; }
  if (r.unchanged) return;
  syncTake(r.sync);
}
function syncTake(next) {
  const prev = SY.data; SY.data = next || null; SY.rev = next ? next.rev : 0;
  if (prev && !next) { SY.snap = null; SY.snapAt = null; invalidate(); if (prev.status === 'active' && !SY.leaving) toast(`${prev.partner ? prev.partner.name : 'Your partner'} stopped syncing meal plans. Your meals stay as they are.`); else if (prev.status === 'pending' && prev.role === 'requester' && !SY.leaving) toast(`${prev.partner ? prev.partner.name : 'Your partner'} declined your meal-sync request.`); SY.leaving = false; syncRerender(); return; }
  if (!next) { syncRerender(); return; }
  if (prev && prev.status === 'pending' && next.status === 'active' && next.role === 'requester') toast(`${syncName()} accepted — your meal plans are synced.`);
  if (prev && next.status === 'active') {
    const nIn = next.changesIn.length - prev.changesIn.length; if (nIn > 0) toast(`${syncName()} changed ${nIn} shared meal${nIn === 1 ? '' : 's'} — tap Sync to review.`);
    const seen = new Set(prev.events.map(e => e.id)); next.events.filter(e => !seen.has(e.id) && e.by !== AUTH.user.id && (e.type === 'decline' || e.type === 'slots' || e.type === 'accept')).slice(-2).forEach(e => toast(e.text));
  }
  if (next.status === 'active') {
    const seen = S.syncSeen || {};
    if (seen.id !== next.id || next.baseRev > (seen.baseRev || 0)) { const first = seen.id !== next.id || !seen.baseRev; const n = syncApplyAgreed(); S.syncSeen = { id: next.id, baseRev: next.baseRev }; saveState(); if (n && first && next.baseRev > 0) toast(`Your shared meals are now planned together with ${syncName()} from ${fmtDate(next.since)}.`); }
    if (next.partnerSnapAt && next.partnerSnapAt !== SY.snapAt) syncLoadPartner(next.partnerSnapAt);
  }
  syncRerender();
}
function syncRerender() {
  const h = location.hash; invalidate(); if (typeof pantrySyncReconcile === 'function') pantrySyncReconcile();
  if (($('#view')) && (/^#\/(calendar|day|diet|grocery|pantry)(\/|$)/.test(h) || h === '' || h === '#/' || h === '#')) {
    const ae = document.activeElement; if (ae && ae.closest && ae.closest('#view input, #view select, #view textarea')) SY.needRender = true; else render();
  }
  refreshSyncUI();
}
async function syncLoadPartner(at) { try { const r = await api('GET', '/api/sync/partner'); SY.snap = r.snap; SY.snapAt = at; invalidate(); syncRerender(); syncMaybeExtend(); } catch (e) { /* retry on next poll */ } }
// Pull the agreed shared meals into my plan (start of sync, new weeks, newly shared meals). Meals with a pending or declined change stay mine.
function syncApplyAgreed() {
  const sy = SY.data; const t = todayISO(); let n = 0;
  Object.entries(sy.agreed).forEach(([k, rid]) => { const [d, sl] = k.split('|'); if (d < t || !S.plan[d] || !sy.slots[sl]) return;
    if (sy.changesOut.some(c => c.date === d && c.slot === sl)) return; const mine = myMeal(d, sl); if (mine === rid || (sy.div[k] && sy.div[k] === mine)) return;
    if (rid && !RECIPE[rid]) return; S.plan[d].m = S.plan[d].m || {}; S.plan[d].m[sl] = rid; n++; });
  if (n) invalidate(); return n;
}
function syncPoll() { clearTimeout(SY.pollT); SY.pollT = setTimeout(async () => { if (document.visibilityState === 'visible') await syncFetch(); syncPoll(); }, syncActive() ? 20000 : 45000); }
function syncStart() { if (AUTH.mode !== 'server' || !AUTH.user) return; SY.data = null; SY.rev = 0; SY.snap = null; SY.snapAt = null; syncFetch(true).then(() => { if (syncActive() || (SY.data && SY.data.status === 'pending')) syncPublish(); }); syncPoll(); }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && AUTH.user && S) syncFetch(); });
/* ---------- after every save: send my edits of shared meals, publish my portions ---------- */
function syncOnSave() {
  if (!SY.data) return;
  if (syncActive()) { clearTimeout(SY.diffT); SY.diffT = setTimeout(syncSendChanges, 900); }
  clearTimeout(SY.snapT); SY.snapT = setTimeout(syncPublish, 2500);
}
function syncSnapshot() {
  const A = computeAll(); const sy = SY.data; const from = addDays(todayISO(), -7), to = addDays(todayISO(), 70); const days = {}, train = [];
  planDates().forEach(d => { const day = A.days[d]; if (day.isTrain && d >= from) train.push(d); if (d < from || d > to) return;
    const m = {}; day.meals.forEach(ml => { if (!sy.slots[ml.slot]) return; m[ml.slot] = { rid: ml.r.id, items: ml.items.map(it => [it.id, Math.round(it.amt * 100) / 100]) }; }); days[d] = { t: day.isTrain ? 1 : 0, m }; });
  return { name: AUTH.user.name, planEnd: planEnd(), share: S.settings.shareIngredients !== false, days, train, allowed: RECIPES.filter(r => recipeAllowed(r)).map(r => r.id), favs: Object.keys(S.favRecipes || {}).filter(k => S.favRecipes[k]) };
}
async function syncPublish() { if (!SY.data || !S || !AUTH.user) return; try { await api('PUT', '/api/sync/snapshot', { snap: syncSnapshot() }); } catch (e) { /* next save retries */ } }
function syncDiff() {
  const sy = SY.data; const out = []; const t = todayISO();
  Object.keys(sy.agreed).forEach(k => { const [d, sl] = k.split('|'); if (d < t || d < sy.since || !sy.slots[sl] || !S.plan[d]) return;
    const mine = myMeal(d, sl), ag = sy.agreed[k]; const pend = sy.changesOut.find(c => c.date === d && c.slot === sl);
    if (mine === ag) { if (pend) out.push({ date: d, slot: sl, rid: mine }); return; }
    if (pend && pend.rid === mine) return; if (!pend && sy.div[k] === mine) return;
    const r = mine && RECIPE[mine]; const c = { date: d, slot: sl, rid: mine, name: r ? r.name : 'Nothing', emoji: r ? r.emoji : '', prevName: ag && RECIPE[ag] ? RECIPE[ag].name : (ag ? ag : 'Nothing') };
    if (r && r.custom && S.customRecipes[mine]) { c.recipe = S.customRecipes[mine]; const foods = {}; (c.recipe.ing || []).forEach(([id]) => { if (S.customFoods[id]) foods[id] = S.customFoods[id]; }); if (Object.keys(foods).length) c.foods = foods; }
    out.push(c); });
  return out;
}
async function syncSendChanges() {
  if (!syncActive() || SY.busy) return; SY.busy = true; await syncFetch(); if (!syncActive()) { SY.busy = false; return; }   // diff against the latest shared plan
  const list = syncDiff(); if (!list.length) { SY.busy = false; return; }
  try { const r = await api('POST', '/api/sync/changes', { changes: list }); const had = SY.data.changesOut.length; SY.data = r.sync; SY.rev = r.sync.rev;
    const nNew = r.sync.changesOut.length - had; if (nNew > 0) toast(`Sent ${nNew} meal change${nNew === 1 ? '' : 's'} to ${syncName()} to accept.`); syncRerender(); }
  catch (e) { /* keep for next save */ } SY.busy = false;
}
/* ---------- planning shared meals together ---------- */
function jointMeals(from, through, slots) {
  const snap = SY.snap || {}; const ptrain = new Set(snap.train || []); const meals = {};
  PLAN_CTX = { allowed: snap.allowed ? new Set(snap.allowed) : null, favs: new Set(snap.favs || []), people: 2 };
  try {
    const P = makePlanner(S.settings.shareIngredients !== false || !!snap.share); let first = true;
    planDates().forEach(d => { if (d < from || d > through) return; if (first || planIndex(d) % 7 === 0) P.newWeek(); first = false;
      const m = planDay(P, !!(S.plan[d] && S.plan[d].w) || ptrain.has(d)); MEAL_SLOTS.forEach(sl => { if (slots[sl]) meals[d + '|' + sl] = m[sl] || null; }); });
  } finally { PLAN_CTX = null; }
  return meals;
}
async function syncPostBaseline(meals, through) {
  const r = await api('POST', '/api/sync/baseline', { meals, through, baseRev: SY.data.baseRev });
  SY.data = r.sync; SY.rev = r.sync.rev; const n = syncApplyAgreed(); S.syncSeen = { id: r.sync.id, baseRev: r.sync.baseRev }; saveState(); return n;
}
async function syncMaybeExtend() {                  // plan new weeks together once both plans reach further than the shared plan
  if (!syncActive() || !SY.snap || SY.extending) return; const sy = SY.data;
  const end = [planEnd(), SY.snap.planEnd].filter(Boolean).sort()[0]; const from = sy.through ? addDays(sy.through, 1) : maxISO(sy.since, addDays(todayISO(), 1));
  if (!end || from > end) return;
  SY.extending = true; try { await syncPostBaseline(jointMeals(from, end, sy.slots), end); render(); } catch (e) { if (e.status === 409) syncFetch(true); } SY.extending = false;
}
/* ---------- the Sync panel ---------- */
const chgLabel = c => `${fmtDate(c.date, { weekday: 'short', month: 'short', day: 'numeric' })} · ${SLOT_LABEL[c.slot]}`;
const chgMeal = (rid, name, emoji) => { const r = rid && RECIPE[rid]; return rid ? `${esc(r ? r.emoji : emoji || '🍽️')} ${esc(r ? r.name : name || rid)}` : '<span class="muted">nothing</span>'; };
function syncPanel() {
  if (!syncActive()) { closeModal(); return; }
  const sy = SY.data; const inc = sy.changesIn.slice().sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : MEAL_SLOTS.indexOf(a.slot) - MEAL_SLOTS.indexOf(b.slot));
  const out = sy.changesOut.slice().sort((a, b) => a.date < b.date ? -1 : 1);
  const slotsTxt = MEAL_SLOTS.filter(k => sy.slots[k]).map(k => SLOT_LABEL[k]).join(', ');
  const req = sy.slotReq && sy.slotReq.by !== AUTH.user.id ? `<div class="note warn" style="margin-bottom:12px">${icon('users')}<span style="flex:1"><b>${esc(syncName())}</b> wants to share: ${MEAL_SLOTS.filter(k => sy.slotReq.slots[k]).map(k => SLOT_LABEL[k]).join(', ')}.</span><button class="btn sm primary" data-act="sync-slots-ok" data-v="1">Approve</button><button class="btn sm ghost" data-act="sync-slots-ok" data-v="0">Keep as is</button></div>` : '';
  const shared = computeAll(); let nShared = 0; const wk = [todayISO()]; for (let i = 1; i < 7; i++) wk.push(addDays(todayISO(), i));
  wk.forEach(d => MEAL_SLOTS.forEach(sl => { if (shared.days[d] && isSharedMeal(d, sl)) nShared++; }));
  modal(`<div class="sync-modal"><div class="row" style="align-items:flex-start"><span class="lk-ic">${icon('users')}</span><div style="flex:1;min-width:0"><h2 style="margin:0">Synced with ${esc(syncName())}</h2><div class="small muted">Sharing ${esc(slotsTxt)} since ${fmtDate(sy.since, { month: 'short', day: 'numeric' })} · ${nShared} shared meal${nShared === 1 ? '' : 's'} in the next 7 days</div></div><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div style="height:14px"></div>${req}
    <div class="card-h" style="margin-bottom:6px"><h3>Waiting on you <span class="pill ${inc.length ? 'warn-pill' : ''}">${inc.length}</span></h3>${inc.length > 1 ? `<button class="btn sm primary" data-act="sync-resolve" data-v="accept" data-ids="${inc.map(c => c.id).join(',')}">${icon('check')}Accept all</button><button class="btn sm ghost" data-act="sync-resolve" data-v="decline" data-ids="${inc.map(c => c.id).join(',')}">Decline all</button>` : ''}</div>
    ${inc.map(c => `<div class="sync-row"><div class="sync-when">${chgLabel(c)}</div><div class="sync-chg">${chgMeal(c.prev, c.prevName)} <span class="arr">${icon('right')}</span> <b>${chgMeal(c.rid, c.name, c.emoji)}</b></div><div class="sync-acts"><button class="btn sm primary" data-act="sync-resolve" data-v="accept" data-ids="${c.id}">Accept</button><button class="btn sm ghost" data-act="sync-resolve" data-v="decline" data-ids="${c.id}">Decline</button></div></div>`).join('') || `<div class="muted small" style="padding:4px 0 8px">Nothing to review. When ${esc(syncName())} changes a shared meal, it shows up here.</div>`}
    <div class="card-h" style="margin:14px 0 6px"><h3>Waiting on ${esc(syncName())} <span class="pill">${out.length}</span></h3></div>
    ${out.map(c => `<div class="sync-row"><div class="sync-when">${chgLabel(c)}</div><div class="sync-chg">${chgMeal(c.prev, c.prevName)} <span class="arr">${icon('right')}</span> <b>${chgMeal(c.rid, c.name, c.emoji)}</b></div><div class="sync-acts"><button class="btn sm ghost" data-act="sync-resolve" data-v="cancel" data-ids="${c.id}" title="Put the shared meal back on your plan">Undo</button></div></div>`).join('') || `<div class="muted small" style="padding:4px 0 8px">Your changes to shared meals are sent automatically. They show up here until ${esc(syncName())} accepts or declines them.</div>`}
    ${sy.events.length ? `<div class="card-h" style="margin:14px 0 6px"><h3>Recent</h3></div><div class="ev-list">${sy.events.slice(-6).reverse().map(e => `<div class="ev-row"><span class="ev-dot ${e.type === 'decline' ? 'bad' : ''}"></span><div style="flex:1;min-width:0">${esc(e.text)}<div class="tiny muted">${ago(e.t)}</div></div></div>`).join('')}</div>` : ''}
    <div class="note" style="margin-top:14px">${icon('info')}<span>When you accept, the meal on your plan changes to match. If you decline, you each keep your own meal that day and the shopping list counts them separately. Your portions are always sized to your own targets.</span></div>
    <div class="row" style="justify-content:space-between;margin-top:12px"><a class="btn ghost" href="#/account" data-act="close-modal">${icon('user')}Sync settings</a><button class="btn" data-act="sync-refresh">${icon('loop')}Refresh</button></div></div>`, 'sync-m');
}
// A partner's own recipe (and any foods it needs) joins my recipes when I accept it — copied field by field, never trusted as-is
const cleanStr = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const cleanNum = (v, lo, hi, d) => { const n = +v; return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
function cleanFood(f) {
  return { n: cleanStr(f.n, 80) || 'Food', sub: SUB_CAT[f.sub] ? f.sub : 'sauces', a: AISLES.includes(f.a) ? f.a : 'Pantry', r: ['P', 'C', 'F', 'V', 'X'].includes(f.r) ? f.r : 'V',
    k: cleanNum(f.k, 0, 2000, 0), p: cleanNum(f.p, 0, 200, 0), c: cleanNum(f.c, 0, 200, 0), f: cleanNum(f.f, 0, 200, 0), pk: f.pk == null ? null : cleanNum(f.pk, 0, 100000, null),
    u: f.u ? cleanStr(f.u, 20) : null, g: f.u ? cleanNum(f.g, 1, 5000, 100) : null, ml: !f.u && !!f.ml };
}
function cleanRecipe(r, id) {
  const cats = ['breakfast', 'lunch', 'dinner', 'snack'];
  return { id, custom: true, name: cleanStr(r.name, 80) || 'Shared recipe', emoji: cleanStr(r.emoji, 8) || '🍽️', cat: cats.includes(r.cat) ? r.cat : 'dinner', yield: Math.round(cleanNum(r.yield, 1, 12, 1)),
    storage: ['fridge', 'freezer', 'none'].includes(r.storage) ? r.storage : 'fridge', time: cleanNum(r.time, 0, 600, 0), fixed: !!r.fixed, rotate: false,
    tags: (Array.isArray(r.tags) ? r.tags : []).slice(0, 12).map(t => cleanStr(t, 30)).filter(Boolean),
    links: (Array.isArray(r.links) ? r.links : []).filter(l => l && /^https?:\/\/[^\s]+$/i.test(String(l.url || ''))).slice(0, 4).map(l => ({ url: cleanStr(l.url, 500), label: cleanStr(l.label, 60) })),
    steps: (Array.isArray(r.steps) ? r.steps : []).slice(0, 30).map(s => cleanStr(s, 400)).filter(Boolean),
    ing: (Array.isArray(r.ing) ? r.ing : []).slice(0, 40).filter(x => Array.isArray(x) && typeof x[0] === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(x[0])).map(([i, a]) => [i, cleanNum(a, 0, 10000, 0)]).filter(([, a]) => a > 0) };
}
function importRecipe(c) {
  if (!c.recipe || RECIPE[c.rid] || !/^[A-Za-z0-9_-]{1,80}$/.test(c.rid || '')) return;
  Object.entries(c.foods || {}).forEach(([id, f]) => { if (/^[A-Za-z0-9_-]{1,80}$/.test(id) && f && typeof f === 'object' && !ING[id] && !S.customFoods[id]) S.customFoods[id] = cleanFood(f); });
  rebuildCatalog(); const rec = cleanRecipe(c.recipe, c.rid); rec.ing = rec.ing.filter(([i]) => ING[i]); if (!rec.ing.length) return;
  S.customRecipes[c.rid] = rec; rebuildCatalog();
}
async function syncResolve(ids, action) {
  try { const r = await api('POST', '/api/sync/resolve', { ids, action }); const before = SY.data;
    r.done.forEach(c => { if (!S.plan[c.date]) return; S.plan[c.date].m = S.plan[c.date].m || {};
      if (action === 'accept') { importRecipe(c); if (!c.rid || RECIPE[c.rid]) S.plan[c.date].m[c.slot] = c.rid; markMealEdit(c.date, c.slot); }
      if (action === 'cancel') { const ag = before.agreed[c.date + '|' + c.slot]; if (ag === null || RECIPE[ag]) S.plan[c.date].m[c.slot] = ag === undefined ? S.plan[c.date].m[c.slot] : ag; } });
    SY.data = r.sync; SY.rev = r.sync.rev; invalidate(); if (action !== 'decline') saveState(); else syncOnSave(); render();
    toast(action === 'accept' ? `Accepted ${r.done.length} change${r.done.length === 1 ? '' : 's'} — your plan and shopping list are updated.` : action === 'decline' ? `Declined ${r.done.length === 1 ? 'the change' : r.done.length + ' changes'} — you’ll each have your own meal there.` : 'Change withdrawn — the shared meal is back on your plan.');
    refreshSyncUI(); }
  catch (e) { toast(e.message); }
}
/* ---------- Account → Meal-plan sync card ---------- */
function syncCardHTML() {
  const sy = SY.data; const slotBoxes = (sel, dis) => `<div class="sync-slots">${MEAL_SLOTS.map(k => `<label class="chk-pill ${sel[k] ? 'on' : ''}"><input type="checkbox" name="slot" value="${k}" ${sel[k] ? 'checked' : ''} ${dis ? 'disabled' : ''}><span>${SLOT_LABEL[k]}</span></label>`).join('')}</div>`;
  const how = `<ul class="small sub sync-how"><li>You share the meals you both pick — they’re re-planned together from foods you both eat, with both your ★ favorites.</li><li>Everyone’s portions stay sized to their own calories and protein; batch cooking and <b>one shopping list</b> cover both of you.</li><li>When one of you changes a shared meal, it changes for them right away and the other accepts or declines it.</li><li>Either of you can unsync at any time — your current meals stay.</li></ul>`;
  let body;
  if (!sy) body = `<p class="small sub" style="margin-top:0">Plan meals and shop together with someone in your household who also uses FORGE 90.</p>${how}
    <form data-form="sync-request" class="grid" style="gap:10px;margin-top:10px"><div class="field"><label>Their FORGE 90 email</label><input class="inp" name="email" type="email" required placeholder="partner@example.com" autocomplete="off"></div>
      <div class="field"><label>Meals to share</label>${slotBoxes({ breakfast: 1, lunch: 1, dinner: 1, snack1: 1, snack2: 1 })}</div>
      <div><button class="btn primary" type="submit">${icon('users')}Send sync request</button></div></form>`;
  else if (sy.status === 'pending' && sy.role === 'requester') body = `<div class="note">${icon('clock')}<span style="flex:1">Waiting for <b>${esc(syncName())}</b> (${esc(sy.partner ? sy.partner.email : '')}) to accept · sent ${ago(sy.createdAt)}</span></div>
    <div class="field" style="margin-top:12px"><label>Meals you asked to share</label>${slotBoxes(sy.slots, true)}</div><div class="row" style="margin-top:12px"><button class="btn" data-act="sync-end">Cancel request</button></div>`;
  else if (sy.status === 'pending') body = `<div class="note warn">${icon('users')}<span><b>${esc(syncName())}</b> (${esc(sy.partner ? sy.partner.email : '')}) wants to sync meal plans with you.</span></div>
    <div class="field" style="margin-top:12px"><label>Meals to share</label>${slotBoxes(sy.slots, true)}</div>${how}
    <div class="tiny muted">If you accept, these meals are re-planned together from ${fmtDate(addDays(todayISO(), 1), { weekday: 'long', month: 'short', day: 'numeric' })} for both of you. You can change which meals are shared later — ${esc(syncName())} will be asked to approve.</div>
    <div class="row" style="margin-top:12px"><button class="btn primary" data-act="sync-accept">${icon('check')}Accept and sync</button><button class="btn ghost" data-act="sync-decline">Decline</button></div>`;
  else { const mineReq = sy.slotReq && sy.slotReq.by === AUTH.user.id, theirReq = sy.slotReq && !mineReq; const n = sy.changesIn.length;
    body = `<div class="row" style="gap:12px">${avatarHTML(Object.assign({}, (SY.data && SY.data.partner) || {}, { name: syncName() }))}<div style="flex:1;min-width:0"><b>Synced with ${esc(syncName())}</b><div class="tiny muted">${esc(sy.partner ? sy.partner.email : '')} · since ${fmtDate(sy.since, { month: 'short', day: 'numeric', year: 'numeric' })}</div></div>${syncBtnHTML('sm')}</div>
    ${theirReq ? `<div class="note warn" style="margin-top:12px">${icon('users')}<span style="flex:1"><b>${esc(syncName())}</b> wants to share: ${MEAL_SLOTS.filter(k => sy.slotReq.slots[k]).map(k => SLOT_LABEL[k]).join(', ')}.</span><button class="btn sm primary" data-act="sync-slots-ok" data-v="1">Approve</button><button class="btn sm ghost" data-act="sync-slots-ok" data-v="0">Keep as is</button></div>` : ''}
    <form data-form="sync-slots" style="margin-top:12px"><div class="field"><label>Shared meals ${mineReq ? `<span class="pill warn-pill">Waiting for ${esc(syncName())} to approve</span>` : ''}</label>${slotBoxes(mineReq ? sy.slotReq.slots : sy.slots, theirReq)}</div>
      <div class="row wrap" style="margin-top:10px"><button class="btn" type="submit" ${theirReq ? 'disabled' : ''}>${mineReq ? 'Update request' : 'Ask to change shared meals'}</button>${n ? `<span class="small">${n} change${n === 1 ? '' : 's'} waiting on you</span>` : ''}</div></form>
    <hr class="sep"><div class="danger-zone sync-pantry"><div><b>${icon('box')}Share the pantry ${sy.pantry && sy.pantry.on ? '<span class="pill acc">On</span>' : ''}</b><div class="tiny muted">${sy.pantry && sy.pantry.on ? `You and ${esc(syncName())} use one pantry — scans, edits and meals eaten update it for both of you. If it’s turned off, you each keep a copy.` : `One pantry for both of you instead of one each. Your pantry items move into it, and ${esc(syncName())}’s do too.`}</div></div><button class="btn ${sy.pantry && sy.pantry.on ? '' : 'primary'}" data-act="pan-share" data-v="${sy.pantry && sy.pantry.on ? 0 : 1}">${sy.pantry && sy.pantry.on ? 'Stop sharing' : 'Share pantry'}</button></div>
    <hr class="sep"><div class="danger-zone"><div><b>Unsync meal plans</b><div class="tiny muted">You both keep your current meals; from then on your plans change independently.</div></div><button class="btn danger" data-act="sync-end">Unsync</button></div>`; }
  return `<div class="card-h"><h2>${icon('users')}Meal-plan sync</h2>${sy && sy.status === 'active' ? '<span class="pill acc">Active</span>' : sy ? '<span class="pill warn-pill">Pending</span>' : ''}</div>${body}`;
}
Object.assign(ACT, {
  'sync-open': () => syncPanel(),
  'sync-refresh': async () => { await syncFetch(true); if (SY.snapAt == null && syncActive()) await syncLoadPartner(SY.data.partnerSnapAt); syncPanel(); toast('Up to date'); },
  'sync-resolve': el => syncResolve(el.dataset.ids.split(','), el.dataset.v),
  'sync-accept': async el => { el.disabled = true; try {
      let r = await api('POST', '/api/sync/respond', { accept: true, since: addDays(todayISO(), 1) }); SY.data = r.sync; SY.rev = r.sync.rev;
      await syncPublish(); try { SY.snap = (await api('GET', '/api/sync/partner')).snap; } catch (e) { SY.snap = null; }
      const sy = SY.data; const end = [planEnd(), SY.snap && SY.snap.planEnd].filter(Boolean).sort()[0];
      const n = await syncPostBaseline(jointMeals(sy.since, end, sy.slots), end); await syncPublish();
      toast(`Synced with ${syncName()} — ${n} shared meals were planned together from ${fmtDate(sy.since)}.`); refreshSyncUI(); render(); }
    catch (e) { toast(e.message); el.disabled = false; syncFetch(true); } },
  'sync-decline': () => confirmBox('Decline the sync request?', `${esc(syncName())} will be told you declined. They can ask again later.`, 'Decline', async () => { try { SY.leaving = true; await api('POST', '/api/sync/respond', { accept: false }); syncTake(null); toast('Request declined'); } catch (e) { SY.leaving = false; toast(e.message); } }),
  'sync-end': () => { const active = syncActive();
    confirmBox(active ? 'Unsync meal plans?' : 'Cancel the sync request?', active ? `You and ${esc(syncName())} both keep your current meals. From now on your plans and shopping lists are separate again.` : `${esc(syncName())} won’t be able to accept it any more.`, active ? 'Unsync' : 'Cancel request', async () => {
      try { SY.leaving = true; await api('DELETE', '/api/sync'); syncTake(null); toast(active ? 'Meal plans unsynced — your meals stay as they are.' : 'Request cancelled'); } catch (e) { SY.leaving = false; toast(e.message); } }, active); },
  'sync-slots-ok': async el => { const ok = el.dataset.v === '1'; const old = Object.assign({}, SY.data.slots);
    try { const r = await api('POST', '/api/sync/slots', { approve: ok }); SY.data = r.sync; SY.rev = r.sync.rev;
      if (ok) { const added = {}; MEAL_SLOTS.forEach(k => { if (SY.data.slots[k] && !old[k]) added[k] = 1; });
        if (Object.keys(added).length) { const from = maxISO(SY.data.since, addDays(todayISO(), 1)); const end = SY.data.through || [planEnd(), SY.snap && SY.snap.planEnd].filter(Boolean).sort()[0]; await syncPostBaseline(jointMeals(from, end, added), end); } }
      toast(ok ? 'Shared meals updated' : 'Kept the shared meals as they were'); refreshSyncUI(); render(); } catch (e) { toast(e.message); } }
});
document.addEventListener('submit', async e => {
  const f = e.target; const k = f.dataset && f.dataset.form; if (k !== 'sync-request' && k !== 'sync-slots') return; e.preventDefault();
  const slots = {}; $$('input[name="slot"]', f).forEach(i => { slots[i.value] = i.checked; }); if (!Object.values(slots).some(Boolean)) return toast('Pick at least one meal to share.');
  const b = f.querySelector('button[type=submit]'); b.disabled = true;
  try {
    if (k === 'sync-request') { const r = await api('POST', '/api/sync/request', { email: f.elements.email.value.trim(), slots }); syncTake(r.sync); await syncPublish(); toast(`Request sent to ${syncName()}. Syncing starts when they accept.`); }
    else { const r = await api('POST', '/api/sync/slots', { slots }); SY.data = r.sync; SY.rev = r.sync.rev; refreshSyncUI(); toast(r.sync.slotReq ? `Asked ${syncName()} to approve the new shared meals` : 'No change'); }
  } catch (x) { toast(x.message); b.disabled = false; }
});
document.addEventListener('change', e => { const t = e.target; if (t.name === 'slot' && t.closest('.sync-slots')) t.closest('.chk-pill').classList.toggle('on', t.checked); });
/* A pending request for me shows on the dashboard */
function syncInviteNote() {
  if (!SY.data || SY.data.status !== 'pending' || SY.data.role !== 'recipient') return '';
  return `<div class="note warn sync-invite">${icon('users')}<span style="flex:1"><b>${esc(syncName())}</b> wants to sync meal plans with you — shared meals and one shopping list.</span><a class="btn sm primary" href="#/account">Review</a></div>`;
}
function syncGroceryNote(wd, A) {
  if (!syncActive()) return '';
  let n = 0, nb = 0; wd.forEach(d => A.days[d].meals.forEach(m => { if (m.partner) n++; })); A.batches.list.forEach(b => { if (b.partnerServ && wd.includes(b.cook)) nb++; });
  return `<div class="note acc sync-gro">${icon('users')}<span>Shopping for two: this list includes <b>${esc(syncName())}’s portions of ${n} shared meal${n === 1 ? '' : 's'}</b>${nb ? ` and ${nb} shared batch-cook${nb === 1 ? '' : 's'}` : ''} this week. Checking an item off checks it off for ${esc(syncName())} too.${SY.snap ? '' : ` <i>Waiting for ${esc(syncName())}’s portions to load…</i>`}</span></div><div style="height:16px"></div>`;
}
// don't re-render under someone's cursor — a sync refresh waits until they leave the field
document.addEventListener('focusout', () => { if (!SY.needRender) return; setTimeout(() => { if (SY.needRender && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('#view input, #view select, #view textarea'))) { SY.needRender = false; invalidate(); if ($('#view')) render(); } }, 250); });
