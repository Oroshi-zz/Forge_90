// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
Object.assign(IC, { today: '<path d="M3 10h18M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="m9 16 2 2 4-4"/>' });
if (PHONE_MQ && PHONE_MQ.addEventListener) PHONE_MQ.addEventListener('change', () => { if (!$('#view')) return; closeModal(); render(); });

/* ---------------- bottom tabs and the Plan / Kitchen tabs ---------------- */
const HUBS = { plan: [['calendar', 'Calendar'], ['workouts', 'Training'], ['diet', 'Nutrition']], kitchen: [['grocery', 'List'], ['pantry', 'Pantry'], ['foods', 'Recipes'], ['prep', 'Prep']] };
function hubOf(page) { if (['calendar', 'workouts', 'diet'].includes(page)) return 'plan'; if (['grocery', 'pantry', 'foods', 'recipe', 'recipe-edit', 'prep'].includes(page)) return 'kitchen'; return null; }
function phoneTab(page) { if (!page || page === 'day') return 'today'; return hubOf(page) || 'you'; }
function hubSegHTML(page) {
  const hub = hubOf(page); const cur = page === 'recipe' ? 'foods' : page;
  return `<div class="hub-top"><h1>${hub === 'plan' ? 'Plan' : 'Kitchen'}</h1></div><nav class="hub-seg" aria-label="${hub === 'plan' ? 'Plan' : 'Kitchen'}">${HUBS[hub].map(([k, l]) => `<a href="#/${k}" class="${cur === k ? 'on' : ''}" ${cur === k ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
}
function tabbarRender(page) {
  const el = $('#tabbar'); if (!el) return; const cur = phoneTab(page); const soon = S ? pantrySoon().length : 0;
  const href = k => k === 'today' ? '#/' : k === 'plan' ? '#/' + (UI.lastPlan || 'calendar') : k === 'kitchen' ? '#/' + (UI.lastKit || 'grocery') : '#/you';
  el.innerHTML = [['today', 'Today', 'today'], ['plan', 'Plan', 'cal'], ['add'], ['kitchen', 'Kitchen', 'cart'], ['you', 'You', 'user']].map(([k, l, ic]) => k === 'add'
    ? `<button type="button" class="tb-add" data-act="plus-sheet" aria-label="Quick add"><span>${icon('plus')}</span></button>`
    : `<a class="tb ${cur === k ? 'on' : ''}" data-tour="tab-${k}" href="${href(k)}" ${cur === k ? 'aria-current="page"' : ''}>${icon(ic)}<span>${l}</span>${k === 'kitchen' && soon ? `<i class="tb-badge" title="${soon} pantry item${soon === 1 ? '' : 's'} expiring soon">${soon}</i>` : ''}</a>`).join('');
}

let SHD = null;
document.addEventListener('pointerdown', e => {
  const h = e.target.closest && e.target.closest('.sh-hdl'); if (!h) return; const m = h.closest('.modal'); if (!m) return;
  e.preventDefault(); SHD = { y: e.clientY, dy: 0, m }; m.style.transition = 'none'; try { h.setPointerCapture(e.pointerId); } catch (x) { }
});
document.addEventListener('pointermove', e => { if (!SHD) return; SHD.dy = Math.max(0, e.clientY - SHD.y); SHD.m.style.transform = `translateY(${SHD.dy}px)`; });
document.addEventListener('pointerup', () => { if (!SHD) return; const { m, dy } = SHD; SHD = null; m.style.transition = ''; if (dy > 90 || dy < 6) closeModal(); else m.style.transform = ''; });
document.addEventListener('pointercancel', () => { if (SHD) { SHD.m.style.transition = ''; SHD.m.style.transform = ''; SHD = null; } });

/* ---------------- the + sheet ---------------- */
function plusSheet() {
  const t = todayISO(); const e = S.plan[t]; const c = gymActive();
  const b = (ic, l, attrs, cls = '') => `<button type="button" class="${cls}" ${attrs}>${icon(ic)}<span>${l}</span></button>`;
  const woL = e && e.w ? (loggedSets(t, sessionRows(e.w)).done ? 'Resume workout' : 'Start workout') : 'Workout';
  modal(`<div class="plus-m"><div class="row"><h2 style="flex:1">Quick add</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div class="qa-grid">${canScan() ? b('scan', 'Scan food', 'data-act="scan" data-v="today"', 'hot') : ''}${b('plus', 'Add food', 'data-act="qa-pick"', canScan() ? '' : 'hot')}${b('scale', 'Log weight', 'data-act="weigh-sheet"')}
      ${b('dumbbell', woL, `data-act="wo-open" data-d="${t}"`)}${c ? b('scan', 'Gym card', `data-act="gym-full" data-id="${c.id}"`) : b('scan', 'Add gym card', 'data-act="gym-add"')}${canScan() ? b('box', 'Scan into pantry', 'data-act="scan" data-v="pantry"') : b('box', 'Add to pantry', 'data-act="pan-add"')}</div></div>`, 'sm plus-modal', true);
}

/* ---------------- weigh-in sheet ---------------- */
let WS = null;
function weighSheet(date) {
  const d = date || todayISO(); const ex = S.weights.find(x => x.d === d); const last = sortedWeights().filter(x => x.d <= d).slice(-1)[0];
  WS = { d, v: wNum(ex ? +ex.w : last ? +last.w : +S.settings.startWeight, 1), bf: ex && ex.bf != null && ex.bf !== '' ? ex.bf : '' }; renderWeigh();
}
function renderWeigh() {
  const t = todayISO(); const last = sortedWeights().filter(x => x.d < WS.d).slice(-1)[0];
  modal(`<div class="ws-m"><div class="row"><h2 style="flex:1">Log weight</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div class="tiny muted" style="text-align:center">${WS.d === t ? 'This morning' : esc(fmtDate(WS.d))}${last ? ` · last ${wTxt(last.w, 1)} on ${esc(fmtDate(last.d, { weekday: 'short', month: 'short', day: 'numeric' }))}` : ''}</div>
    <div class="big-num"><button type="button" data-act="ws-step" data-v="-0.1" aria-label="0.1 ${wU()} less">−</button><input id="ws-v" class="num" type="number" inputmode="decimal" step="0.1" min="${wNum(80)}" max="${wNum(500)}" value="${fmt(WS.v, 1).replace(/,/g, '')}" data-input="ws-v" aria-label="Weight in ${wU()}"><button type="button" data-act="ws-step" data-v="0.1" aria-label="0.1 ${wU()} more">+</button></div>
    <div class="row wrap ws-chips">${(isMetric() ? [-0.5, -0.2, 0.2, 0.5] : [-1, -0.5, 0.5, 1]).map(v => `<button type="button" class="btn sm" data-act="ws-step" data-v="${v}">${v > 0 ? '+' : '−'}${Math.abs(v)} ${wU()}</button>`).join('')}</div>
    <div class="grid g2" style="gap:10px"><div class="field"><label for="ws-bf">Body fat % (optional)</label><input id="ws-bf" class="inp" type="number" inputmode="decimal" step="0.1" min="3" max="60" value="${esc(WS.bf)}" placeholder="Estimated if blank" data-input="ws-bf"></div>
      <div class="field"><label for="ws-d">Date</label><input id="ws-d" class="inp" type="date" value="${WS.d}" max="${t}" data-input="ws-d"></div></div>
    <button type="button" class="btn primary block big" id="ws-save" data-act="ws-save">${icon('check')}Save ${fmt(WS.v, 1)} ${wU()}</button></div>`, 'sm ws-modal');
}
function wsSync() { const i = $('#ws-v'), b = $('#ws-save'); if (i && document.activeElement !== i) i.value = fmt(WS.v, 1).replace(/,/g, ''); if (b) b.innerHTML = `${icon('check')}Save ${fmt(WS.v, 1)} ${wU()}`; }
function wsSave() {
  const w = Math.round(frW(WS.v) * 100) / 100; if (!(w >= 80 && w <= 500)) { toast(`Enter a weight between ${wNum(80)} and ${wNum(500)} ${wU()}`); return; }
  const bf = WS.bf === '' || WS.bf == null ? null : +WS.bf; if (bf != null && !(bf >= 3 && bf <= 60)) { toast('Body fat should be between 3 and 60 %'); return; }
  S.weights = S.weights.filter(x => x.d !== WS.d); S.weights.push({ d: WS.d, w, bf }); saveState(); closeModal(); render();
  const t = latestStats(); toast(`Logged ${wTxt(w, 1)}${bf != null ? ' · ' + bf + '%' : ''} — targets now ${targetsFor(t.w, t.bf, true).kcal}/${targetsFor(t.w, t.bf, false).kcal} kcal`); WS = null;
}

/* ---------------- meal swap sheet: searchable, favorites first, macros shown ---------------- */
let MS = null;
const slotCat = s => /^snack/.test(s) ? 'snack' : s;
function mealSwap(d, slot) { if (!S.plan[d]) return; MS = { d, slot, q: '', all: false }; renderMealSwap(); }
function renderMealSwap() {
  const cur = (S.plan[MS.d].m || {})[MS.slot]; const r = cur && RECIPE[cur]; const cat = r ? r.cat : slotCat(MS.slot);
  modal(`<div class="ms-m"><div class="row"><h2 style="flex:1">${r ? 'Swap' : 'Pick'} ${esc(SLOT_LABEL[MS.slot].toLowerCase())}</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div class="tiny muted">${r ? `Now: ${esc(r.emoji)} ${esc(r.name)} · ` : ''}${esc(fmtDate(MS.d, { weekday: 'long', month: 'short', day: 'numeric' }))} · portions resize to your targets either way</div>
    <div class="rec-search">${icon('search')}<input class="inp" type="search" id="ms-q" data-input="ms-q" value="${esc(MS.q)}" placeholder="Search recipes or ingredients…" aria-label="Search recipes" autocomplete="off"></div>
    <div class="row" style="gap:6px"><button type="button" class="btn sm ${MS.all ? '' : 'primary'}" data-act="ms-all" data-v="0">${esc(cat[0].toUpperCase() + cat.slice(1))}</button><button type="button" class="btn sm ${MS.all ? 'primary' : ''}" data-act="ms-all" data-v="1">Everything</button></div>
    <div class="ms-list" id="ms-list">${msListHTML()}</div>
    ${r ? `<button type="button" class="btn sm ghost danger" data-act="ms-none">${icon('x')}Remove this meal</button>` : ''}</div>`, 'ms-modal', true);
}
function msListHTML() {
  const cur = (S.plan[MS.d].m || {})[MS.slot]; const r = cur && RECIPE[cur]; const cat = r ? r.cat : slotCat(MS.slot);
  const words = String(MS.q || '').toLowerCase().split(/\s+/).filter(Boolean);
  const hay = x => [x.name, x.cat, (x.tags || []).join(' '), x.ing.map(([id]) => ING[id] ? ING[id].n : '').join(' ')].join(' ').toLowerCase();
  const list = RECIPES.filter(x => x.id !== cur && recipeAllowed(x) && (MS.all || x.cat === cat) && words.every(w => hay(x).includes(w))).sort((a, b) => (isFav(b.id) ? 1 : 0) - (isFav(a.id) ? 1 : 0) || a.name.localeCompare(b.name));
  return list.map(x => { const m = RPS(x.id); return `<button type="button" class="ms-opt" data-act="ms-pick" data-rid="${x.id}"><span class="em">${esc(x.emoji || '🍽️')}</span><span class="t"><b>${esc(x.name)}</b><small class="num">${MS.all ? x.cat + ' · ' : ''}${fmt(m.k)} kcal · ${fmt(m.p)} g protein · ${x.time} min</small></span>${isFav(x.id) ? `<span class="ms-star" title="Favorite">${icon('star')}</span>` : ''}</button>`; }).join('')
    || `<div class="muted small" style="padding:12px 4px">No recipes match${MS.all ? '' : ' — try Everything'}.</div>`;
}
function msSet(rid) {
  const e = S.plan[MS.d]; if (!e) return; const slot = MS.slot; pushUndo('change meal');
  e.m[slot] = rid || null; markMealEdit(MS.d, slot); MS = null; closeModal();
  commitPlan(rid ? `${SLOT_LABEL[slot]} → ${RECIPE[rid].name}` : `${SLOT_LABEL[slot]} removed`);
}

/* ---------------- TODAY (phone): the dashboard and the day view in one page ---------------- */
const TODAY_PANELS = [
  ['workout', 'Workout', 'full', 'Today’s session and the Start workout button'],
  ['progress', 'Progress', 'full', 'Weight, trend, body fat, distance to goal and your latest PR — tap for the full page'],
  ['nutrition', 'Calories & macros', 'full', 'Calories, protein, carbs and fat against today’s targets'],
  ['meals', 'Meals', 'full', 'The day’s meals — tap one for the recipe, or swap it'],
  ['week', 'This week', 'full', 'The days around this one; tap a day to open it'],
  ['gym', 'Gym card', 'full', 'Your membership barcode (Check in at the top shows it too)']
];
const dayHref = d => d === todayISO() ? '#/' : '#/day/' + d;
function dayWord(d) { const n = dayDiff(todayISO(), d); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : fmtDate(d, { weekday: 'long' }); }
function viewToday(date) {
  const t = todayISO(); date = date || t; const st = S.settings;
  if (date >= st.startDate) ensurePlanThrough(addDays(date, 3));
  const c = gymActive();
  const checkin = c ? `<button type="button" class="btn ph-checkin" data-act="gym-full" data-id="${c.id}">${icon('scan')}Check in</button>` : '';
  const idx = planIndex(date);
  const head = `<div class="ph-head"><div class="ph-day"><a class="btn icon ghost" href="${dayHref(addDays(date, -1))}" aria-label="Previous day">${icon('left')}</a>
      <div class="d"><small>${esc(dayWord(date))}${idx >= 0 ? ` · Day ${idx + 1}${idx < LAUNCH_DAYS ? ' of 90' : ''}` : ''}</small><b>${esc(fmtDate(date, { weekday: 'short', month: 'short', day: 'numeric' }))}</b></div>
      <a class="btn icon ghost" href="${dayHref(addDays(date, 1))}" aria-label="Next day">${icon('right')}</a></div>${checkin}</div>`;
  const frac = idx < 0 ? 0 : Math.min(1, (idx + 1) / (idx < LAUNCH_DAYS ? LAUNCH_DAYS : 91));
  const bar = `<div class="ph-cyc" title="${idx >= 0 ? `Day ${idx + 1}` : 'Before Day 1'}"><i style="width:${frac * 100}%"></i></div>`;
  const weighed = S.weights.some(x => x.d === t); const last = sortedWeights().slice(-1)[0];
  const prompt = date === t && !weighed ? `<button type="button" class="ph-prompt" data-act="weigh-sheet">${icon('scale')}<span><b>Log this morning’s weight</b><small class="num">${last ? `Last: ${wTxt(last.w, 1)} on ${esc(fmtDate(last.d, { weekday: 'short' }))}` : 'Your first weigh-in sets the trend line'}</small></span><span class="go">Log</span></button>` : '';
  if (!inPlan(date)) {
    const before = date < st.startDate;
    return head + bar + prompt + `<div class="card empty-state">${icon('cal')}<h2 style="margin:8px 0 4px">${before ? `Your plan starts ${esc(fmtDate(st.startDate, { weekday: 'long', month: 'long', day: 'numeric' }))}` : 'That day isn’t in the plan'}</h2>
      <a class="btn primary" href="${dayHref(before ? st.startDate : t)}">${before ? 'See Day 1' : 'Back to today'}</a></div><div style="height:16px"></div>${progressCardHTML()}`;
  }
  const A = computeAll(); const day = A.days[date];
  const panels = { workout: todayWorkoutHTML(date), progress: progressCardHTML(), nutrition: todayMacroHTML(day), meals: todayMealsHTML(date, day, A), week: todayWeekHTML(date, A), gym: gymPanelHTML() };
  const vis = dashOrder('today').filter(id => !dashHidden(id, 'today') && panels[id]); const nHid = dashOrder('today').filter(id => dashHidden(id, 'today')).length;
  return head + bar + `<div class="ph-stack">${syncInviteNote()}${bfEstimateNote()}${prompt}${vis.map(id => `<section class="ph-p" data-panel="${id}">${panels[id]}</section>`).join('')}
    <div class="ph-cust"><button type="button" class="btn sm ghost" data-act="dash-edit" data-l="today">${icon('grid')}Customize Today</button>${nHid ? `<span class="tiny muted">${nHid} panel${nHid === 1 ? '' : 's'} hidden</span>` : ''}</div></div>`;
}
function phCardioHTML(date, e) {
  const c = dayCardio(e); if (!c) return '';
  const k = CARDIO[c.k]; const kc = cardioKcal(c.k, c.min, statsOn(date).w);
  return `<div class="card ph-wo ph-cd"><div class="row" style="gap:8px"><span class="pill cd-pill">${icon('heart')}Cardio</span><span class="muted small">${c.min} min · about ${fmt(kc)} kcal</span>${c.doneMin ? `<span class="pill acc">${icon('check')}Done</span>` : ''}</div>
    <h2>${esc(k.name)}</h2><div class="small sub" style="margin-top:2px">${esc(k.how)}</div>
    <button type="button" class="btn primary block big" data-act="cw-open" data-d="${date}">${icon('stopwatch')}${c.doneMin ? 'Cardio again' : 'Start cardio'}</button>
    <div class="tiny muted" style="margin-top:8px">Estimated from your weight and the clock. It does not change today's calorie target.</div></div>`;
}
function todayWorkoutHTML(date) {
  const e = S.plan[date]; const t0 = todayISO();
  if (!e.w && dayCardio(e)) return phCardioHTML(date, e);
  if (!e.w) return `<div class="card ph-rest"><span class="pill">Rest day</span><h2>Walk 8–10k steps</h2><p class="muted small">No lifting today. Get 7–9 hours of sleep and keep protein on target; calories are ~${fmt(S.settings.sessionKcal)} kcal lower and portions resize to match.</p>
      <button type="button" class="btn sm" data-act="qe" data-d="${date}" data-f="wo">${icon('plus')}Add a session</button></div>`;
  const t = TEMPLATES[e.w.t]; const rows = sessionRows(e.w); const c = loggedSets(date, rows);
  const groups = [...new Set(rows.map(r => exGroupOf(r.ex)).filter(Boolean))].slice(0, 4);
  const lbl = S.done[date] ? 'Workout done — view' : c.done ? 'Resume workout' : date > t0 ? 'Preview workout' : 'Start workout';
  const kind = { push: 'Push', pull: 'Pull', legs: 'Legs', deload: 'Deload', test: 'PR test', upper: 'Upper', lower: 'Lower', full: 'Full body', mixed: 'Mixed' }[t.kind] || t.short;
  return `<div class="card ph-wo"><div class="row" style="gap:8px"><span class="pill" style="background:${KIND_VAR(t.kind)};color:#fff">${esc(kind)}</span><span class="muted small">${rows.length} exercises · ${c.total} sets · ~${estMinutes(rows)} min</span>${S.done[date] ? `<span class="pill acc">${icon('check')}Done</span>` : ''}</div>
    <h2>${esc(t.name)}</h2>${groups.length ? `<div class="row wrap" style="gap:6px">${groups.map(g => `<span class="pill">${esc(g)}</span>`).join('')}</div>` : ''}
    <div class="ph-prog"><div class="track"><i style="width:${c.total ? c.done / c.total * 100 : 0}%"></i></div><span class="num small muted">${c.done}/${c.total} sets</span></div>
    <button type="button" class="btn primary block big" data-act="wo-open" data-d="${date}">${icon('play')}${lbl}</button>
    ${dayCardio(e) ? `<button type="button" class="btn block" data-act="cw-open" data-d="${date}">${icon('heart')}Also today: ${esc(CARDIO[e.c.k].name)} · ${e.c.min} min</button>` : ''}
    <div class="row wrap ph-wo-links"><button type="button" class="btn sm ghost" data-act="qe" data-d="${date}" data-f="wo">${icon('edit')}Change session</button><button type="button" class="btn sm ghost" data-act="print-wo" data-d="${date}">${icon('print')}Print</button>${date < t0 ? `<button type="button" class="btn sm ghost" data-act="wo-open" data-d="${date}">${icon('edit')}Log or fix sets</button>` : ''}${date <= t0 && !S.done[date] && c.done ? `<button type="button" class="btn sm ghost" data-act="toggle-done" data-date="${date}">${icon('check')}Mark complete</button>` : ''}</div></div>`;
}
function progressCardHTML() {
  const st = S.settings; const ws = sortedWeights(); const cur = latestStats(); const trend = weightTrend(); const hasW = ws.length > 0;
  const dW = cur.w - st.startWeight; const sign = (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '±') + fmt(Math.abs(v), d);
  let spark = '';
  if (ws.length > 1) {
    const lastD = ws[ws.length - 1].d; const pts = movingAvg(ws).filter(x => x.d >= addDays(lastD, -13)); const P = pts.length > 1 ? pts : movingAvg(ws).slice(-2);
    const ys = P.map(p => p.v), mn = Math.min(...ys), mx = Math.max(...ys), sp = Math.max(mx - mn, 1), x0 = P[0].d, span = Math.max(1, dayDiff(x0, P[P.length - 1].d));
    const X = d => 5 + dayDiff(x0, d) / span * 128, Y = v => 7 + (mx - v) / sp * 34; const L = P[P.length - 1];
    spark = `<svg class="pc-spark" viewBox="0 0 140 48" aria-hidden="true"><polyline points="${P.map(p => X(p.d).toFixed(1) + ',' + Y(p.v).toFixed(1)).join(' ')}" fill="none" stroke="var(--prot)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${X(L.d).toFixed(1)}" cy="${Y(L.v).toFixed(1)}" r="4" fill="var(--prot)" stroke="var(--solid)" stroke-width="2"/></svg>`;
  }
  const pr = recentPRs(1)[0];
  const mon = mondayOf(todayISO()); const wk = Array.from({ length: 7 }, (_, i) => addDays(mon, i)).filter(d => S.plan[d] && S.plan[d].w);
  const done = wk.filter(d => S.done[d]).length;
  return `<a class="card pcard" href="#/progress" aria-label="Progress: ${wTxt(cur.w, 1)}${hasW ? `, ${sign(toW(dW))} ${wU()} since the start` : ''}. Open the progress page">
    <span class="pc-top"><span class="h">Progress</span><span class="see">See all${icon('right')}</span></span>
    <span class="pc-main"><span><small>Weight</small><b class="num">${fmt(toW(cur.w), 1)} <span>${wU()}</span></b><small class="num ${hasW ? (dW <= 0 ? 'good' : '') : ''}">${hasW ? `${sign(toW(dW))} ${wU()} since the start` : 'Log a weigh-in to start the trend'}</small></span>${spark}</span>
    <span class="pc-mini"><span><small>Body fat</small><b class="num">${fmt(cur.bf, 1)}<span class="u">%${cur.est ? ' est.' : ''}</span></b></span><span><small>Trend</small><b class="num">${trend && trend.rate != null ? sign(toW(-trend.rate), 2) : '—'}<span class="u"> ${wU()}/wk</span></b></span><span><small>To goal</small><b class="num">${fmt(toW(Math.max(0, cur.w - st.goalWeight)), 1)}<span class="u"> ${wU()}</span></b></span></span>
    <span class="pc-foot"><span class="pc-pr">${icon('trophy')}<span>${pr ? `${esc(EX[pr.ex].name)} ${fmt(+pr.set.w || 0, (+pr.set.w || 0) % 1 ? 1 : 0)} × ${pr.set.r} · ${esc(fmtDate(pr.d, { weekday: 'short' }))}` : 'Log sets to start your PR board'}</span></span>${wk.length ? `<span class="wkdots">${wk.map(d => `<i class="${S.done[d] ? 'done' : ''}"></i>`).join('')}<span class="num">${done}/${wk.length} this week</span></span>` : ''}</span></a>`;
}
function todayMacroHTML(day) {
  return `<div class="card ph-macro"><div class="kc"><b class="num">${fmt(day.totals.k)}</b><small>of ${fmt(day.tg.kcal)} kcal${(day.extras || []).length ? ' · incl. added food' : ''}</small><span class="pill ${day.isTrain ? 'acc' : ''}">${day.isTrain ? 'Training' : 'Rest'} day</span></div><div class="mb">${macroBars(day.totals, day.tg)}</div></div>`;
}
function todayMealsHTML(date, day, A) {
  const rows = DAY_SLOTS.map(slot => {
    const m = day.meals.find(x => x.slot === slot); const b = A.batches.info[date + '|' + slot];
    const swp = `<button type="button" class="ph-swp" data-act="meal-swap" data-d="${date}" data-slot="${slot}" aria-label="Swap ${esc(SLOT_LABEL[slot].toLowerCase())}" title="Swap">${icon('loop')}</button>`;
    if (!m && slot === 'dessert' && !dayHasExtras(day, slot)) return '';   // never planned for you; it shows once you add one
    if (!m) return `<div class="ph-meal empty"><button type="button" class="ph-mb" data-act="meal-swap" data-d="${date}" data-slot="${slot}"><span class="em">+</span><span class="t"><span class="slot">${SLOT_LABEL[slot]}</span><b class="muted">Nothing planned — pick a meal</b></span></button></div>${extrasHTML(day, slot)}`;
    return `<div class="ph-meal"><button type="button" class="ph-mb" data-act="recipe" data-rid="${m.r.id}"><span class="em">${esc(m.r.emoji)}</span><span class="t"><span class="slot">${SLOT_LABEL[slot]} ${batchBadge(b)}${shareBadge(date, slot)}</span><b>${esc(m.r.name)}</b><small class="num">${fmt(m.m.k)} kcal · ${fmt(m.m.p)} g protein</small></span></button>${swp}</div>${extrasHTML(day, slot)}`;
  }).join('');
  return `<div class="ph-sec"><h2>Meals</h2><span class="spacer"></span>${canScan() ? `<button type="button" class="btn icon ghost" data-act="scan" data-v="today" data-d="${date}" aria-label="Scan food" title="Scan food">${icon('scan')}</button>` : ''}<button type="button" class="btn sm ghost" data-act="qa-pick" data-d="${date}">${icon('plus')}Add food</button></div>
    <div class="card pad0 ph-meals">${rows}</div>${dessertAddHTML(date, day)}<div class="tiny muted ph-hint">Tap a meal for the recipe and this day’s portions. ${icon('loop')} swaps it.</div>`;
}
function todayWeekHTML(date, A) {
  const t = todayISO(); const days = Array.from({ length: 7 }, (_, k) => addDays(date, k - 3));
  return `<div class="ph-sec"><h2>This week</h2><span class="spacer"></span><a class="btn sm ghost" href="#/calendar">Calendar ${icon('right')}</a></div><div class="ph-week">${days.map(d => {
    const e = inPlan(d) ? S.plan[d] : null; const tp = e && e.w ? TEMPLATES[e.w.t] : null; const dd = parseISO(d);
    return `<a class="w7 ${d === date ? 'on' : ''} ${d === t ? 'today' : ''} ${inPlan(d) ? '' : 'off'}" href="${dayHref(d)}" aria-label="${esc(fmtDate(d, { weekday: 'long', month: 'short', day: 'numeric' }))}${tp ? ' · ' + esc(tp.short) : ''}"><small>${DOW[dd.getDay()]}</small><b class="num">${dd.getDate()}</b><i style="${tp ? `background:${KIND_VAR(tp.kind)}` : ''}"></i>${S.done[d] ? '<span class="dn">' + icon('check') + '</span>' : ''}</a>`; }).join('')}</div>`;
}

/* ---------------- KITCHEN · List (phone): To buy / In the cart / At home ---------------- */
const groStateOf = (r, got) => { const s = groRowState(r, got); return s.covered && s.checked ? 'home' : s.checked ? 'cart' : 'buy'; };
function groceryPhoneHTML(G) {
  const { GL, got, opts } = G; const tab = ['buy', 'cart', 'home'].includes(UI.groTab) ? UI.groTab : 'buy';
  const n = { buy: 0, cart: 0, home: 0 }; GL.rows.forEach(r => n[groStateOf(r, got)]++); const all = GL.rows.length;
  const show = GL.rows.filter(r => groStateOf(r, got) === tab);
  const aisles = {}; show.forEach(r => { const ai = ING[r.id].a; (aisles[ai] = aisles[ai] || []).push(r); });
  const order = AISLES.concat(Object.keys(aisles).filter(a => !AISLES.includes(a)));
  const unitOf = id => ING[id].u ? ING[id].u + 's' : ING[id].ml ? 'ml' : 'g';
  const row = r => { const { id, total, have } = r; const g = groceryText(id, total); const st = groStateOf(r, got); const pi = packInfo(id); const npk = Math.ceil(total / pi.P - 1e-9);
    const pk = pi.w >= .3 && pi.P > 1 ? `≈ ${npk} pack${npk === 1 ? '' : 's'}` : '';
    const note = st === 'home' ? `<small class="at">${icon('box')}In your pantry${have > total * 1.01 ? ' · ' + esc(pantryQtyText(id, have)) : ''}</small>` : have > 0 ? `<small class="at">${icon('box')}${esc(pantryQtyText(id, have))} at home</small>` : pk ? `<small>${pk} · ${fmt(pi.P)} ${unitOf(id)} each</small>` : '';
    return `<div class="pg-row ${st}"><button type="button" class="pg-it" data-act="gro-tap" data-id="${id}" aria-pressed="${st !== 'buy'}"><span class="ck">${icon('check')}</span><span class="t"><b>${esc(g.name)}</b>${note}</span><span class="q num">${esc(g.qty)}${g.sub ? `<small>${esc(g.sub)}</small>` : ''}</span></button>${st === 'home' ? `<button type="button" class="btn sm pg-need" data-act="gro-need" data-id="${id}">Need it</button>` : ''}</div>`; };
  const list = order.filter(a => aisles[a]).map(a => `<section class="pg-aisle"><h3>${esc(a)}</h3><div class="card pad0">${aisles[a].sort((x, y) => ING[x.id].n.localeCompare(ING[y.id].n)).map(row).join('')}</div></section>`).join('');
  const empty = { buy: all ? 'Everything’s in the cart or at home.' : 'Nothing planned this week.', cart: 'Tap items on To buy as you shop — they land here.', home: 'Nothing your pantry covers this week.' }[tab];
  return `<div class="row pg-tools"><select class="inp" data-input="gro-week" aria-label="Week">${opts}</select><button type="button" class="btn icon" data-act="copy-list-ph" aria-label="Copy the list" title="Copy the list">${icon('list')}</button><button type="button" class="btn icon" data-act="print-gro" aria-label="Print the list" title="Print the list">${icon('print')}</button></div>
    ${syncGroceryNote(G.wd, G.A)}
    <div class="pg-chips" role="group" aria-label="Show">${[['buy', 'To buy'], ['cart', 'In the cart'], ['home', 'At home']].map(([k, l]) => `<button type="button" class="chipb ${tab === k ? 'on' : ''}" data-act="gro-tab" data-v="${k}" aria-pressed="${tab === k}">${l}<span class="n num">${n[k]}</span></button>`).join('')}</div>
    ${all ? `<div class="ph-prog"><div class="track"><i style="width:${(n.cart + n.home) / all * 100}%"></i></div><span class="num small muted">${n.cart + n.home} of ${all} sorted</span></div>
      <div class="row pg-all"><button type="button" class="btn sm ghost" data-act="gro-all" data-v="1" ${n.buy ? '' : 'disabled'}>${icon('check')}Check all</button><button type="button" class="btn sm ghost" data-act="gro-all" data-v="0" ${n.cart + n.home ? '' : 'disabled'}>${icon('x')}Uncheck all</button></div>` : ''}
    ${GL.note}
    ${tab === 'home' && n.home ? `<div class="tiny muted" style="margin:0 2px 10px">Your pantry already covers these, so they’re ticked for you. Tap <b>Need it</b> if the pantry is behind.</div>` : ''}
    ${list || `<div class="card empty-state">${icon('cart')}<div>${empty}</div></div>`}
    <div class="tiny muted" style="margin-top:12px">Rice & quinoa are listed uncooked (~⅓ of cooked weight). Seasonings, garlic, lemon/lime and cooking spray aren’t listed.</div>
    ${n.cart ? `<div class="pg-dock"><button type="button" class="btn primary big block" data-act="gro-pantry">${icon('box')}Put ${n.cart} item${n.cart === 1 ? '' : 's'} in the pantry</button></div>` : ''}`;
}
function viewPrep() {
  const G = groceryWeek();
  return `<div class="row pg-tools"><select class="inp" data-input="gro-week" aria-label="Week">${G.opts}</select><button type="button" class="btn icon" data-act="print-prep" aria-label="Print the prep schedule" title="Print the prep schedule">${icon('print')}</button></div>
    ${prepScheduleHTML(G)}<div style="height:16px"></div>${moneySaverHTML(G.wd)}`;
}

/* ---------------- YOU (phone) ---------------- */
const SET_GROUPS = {
  training: ['Training style & days', () => trainingCardHTML() + '<div style="height:16px"></div>' + restSettingsHTML()],
  targets: ['Targets & loss rate', () => lossRateCardHTML() + nutritionCardHTML()],
  body: ['Body & goals', () => bodyGoalsCardHTML()],
  gym: ['Gym cards', () => gymSettingsHTML()],
  food: ['Food preferences', () => foodPrefsCardHTML()],
  money: ['Money saver', () => moneyCardHTML()],
  app: ['Appearance & data', () => appearanceCardHTML()],
  api: ['API connections', () => apiCardHTML()]
};
function settingsGroupHTML(g) {
  const [title, f] = SET_GROUPS[g];
  return `<div class="page-head"><div class="t"><a class="back-lnk" href="${isPhone() ? '#/you' : '#/settings'}">${icon('left')}${isPhone() ? 'You' : 'Settings'}</a><h1>${esc(title)}</h1></div></div><div class="set-group">${f()}</div>`;
}
function viewYou() {
  const st = S.settings; const u = AUTH.user; const srv = AUTH.mode === 'server';
  const name = (u && u.name) || (S.profile && (S.profile.nick || S.profile.first)) || 'You';
  const cur = latestStats(); const tT = targetsFor(cur.w, cur.bf, true), tR = targetsFor(cur.w, cur.bf, false);
  const row = (ic, l, sub, attrs) => `<a class="yrow" ${attrs}><span class="yi">${icon(ic)}</span><span class="t"><b>${l}</b><small>${sub}</small></span>${icon('right')}</a>`;
  const group = (title, rows) => rows.filter(Boolean).length ? `<section class="ygroup"><h3>${title}</h3><div class="card pad0">${rows.filter(Boolean).join('')}</div></section>` : '';
  const seen = new Set(); const prs = recentPRs(20).filter(p => !seen.has(p.ex) && seen.add(p.ex)).slice(0, 3);
  const cards = gymCards();
  return `<div class="you-top"><div class="me">${avatarHTML(u || { name })}<div><b>${esc(name)}</b><div class="tiny muted">${srv && u ? (u.role === 'admin' ? 'Administrator · ' : '') + esc(u.email || '') : 'Saved in this browser'}${syncActive() ? ` · meals synced with ${esc(syncName())}` : ''}</div></div></div>${srv && u ? `<button type="button" class="btn icon ghost" data-act="logout" aria-label="Sign out" title="Sign out">${icon('logout')}</button>` : ''}</div>
    ${progressCardHTML()}
    <section class="ygroup"><div class="ph-sec"><h2>Recent PRs</h2><span class="spacer"></span><a class="btn sm ghost" href="#/progress">All progress ${icon('right')}</a></div>
      ${prs.length ? `<div class="card pad0">${prs.map(p => `<a class="yrow" href="#/progress"><span class="yi pr">${icon('trophy')}</span><span class="t"><b>${esc(EX[p.ex].name)}</b><small class="num">${loadTxt(p.set.w)} ${wU()} × ${p.set.r} · ${esc(fmtDate(p.d))}</small></span>${icon('right')}</a>`).join('')}</div>` : `<div class="card empty-state">${icon('trophy')}<div>Log your sets in a workout and personal records show up here.</div></div>`}</section>
    <section class="ygroup"><div class="ph-sec"><h2>Gym cards</h2><span class="spacer"></span><a class="btn sm ghost" href="#/settings/gym">Manage</a></div>
      ${cards.length ? `<div class="card pad0">${cards.map(c => `<button type="button" class="yrow" data-act="gym-full" data-id="${c.id}"><span class="gcy ${c.fmt === 'qr' ? 'qr' : ''}">${barcodeSVG(c.code, c.fmt, { h: 40 })}</span><span class="t"><b>${esc(c.name)}</b><small class="num">${esc(gymHuman(c))}</small></span>${icon('expand')}</button>`).join('')}</div>`
        : `<button type="button" class="btn block" data-act="gym-add">${icon('plus')}Add your gym card</button>`}</section>
    ${group('Plan', [row('dumbbell', 'Workout plan', 'Sessions, swaps and the exercise library', 'href="#/workouts"'), row('clock', 'Training days & rest timer', `${st.trainDays.length} days a week · rest ${mmss((+st.restDef || 90) * 1000)} · ${esc(restSoundOf(st.restSound).n)}`, 'href="#/settings/training"'),
      row('target', 'Targets & loss rate', `${rateTxt(st.rate, 2)} · ${fmt(tT.kcal)} / ${fmt(tR.kcal)} kcal`, 'href="#/settings/targets"'), row('scale', 'Body & goals', `Goal ${wTxt(st.goalWeight)} · ${st.goalBF}%`, 'href="#/settings/body"')])}
    ${group('Food', [row('food', 'Food preferences', esc(fpCountText()), 'href="#/settings/food"'), row('book', 'Foods & macros', `${Object.keys(ING).length} foods`, 'href="#/foods" data-act="go-foods" data-v="foods"'), row('flame', 'Money saver', st.shareIngredients !== false ? 'On · recipes share ingredients' : 'Off', 'href="#/settings/money"')])}
    ${group('App', [row(effTheme() === 'light' ? 'sun' : 'moon', 'Appearance & data', `${st.theme[0].toUpperCase() + st.theme.slice(1)} theme · backup and restore`, 'href="#/settings/app"'), srv ? row('users', 'Meal sync', syncActive() ? `Synced with ${esc(syncName())}` : 'Share meals and a shopping list with someone', 'href="#/account" data-act="go-acc-sync"') : '', srv && isAdmin() ? row('link', 'API connections', 'Mealie recipe import', 'href="#/settings/api"') : ''])}
    ${srv ? group('Account', [row('user', 'Profile & password', esc((u && u.email) || ''), 'href="#/account"'), isAdmin() ? row('shield', 'Admin console', 'Users, email, security', 'href="#/admin"') : '']) : ''}
    <div class="you-foot"><button type="button" class="btn sm ghost" data-act="theme-toggle">${icon(effTheme() === 'light' ? 'moon' : 'sun')}${effTheme() === 'light' ? 'Dark' : 'Light'} mode</button>${settingsFootHTML()}</div>`;
}
function copyListPhone() {
  const G = GRO_ROWS; if (!G) return; const got = groGot();
  const txt = G.rows.map(r => { const g = groceryText(r.id, r.total); return `${groStateOf(r, got) === 'buy' ? '[ ]' : '[x]'} ${g.name} — ${g.qty}`; }).join('\n');
  (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Shopping list copied'), () => toast('Copy isn’t available in this browser'));
}

Object.assign(ACT, {
  'plus-sheet': () => plusSheet(),
  'weigh-sheet': el => weighSheet(el.dataset.d),
  'ws-step': el => { WS.v = Math.max(wNum(80), Math.min(wNum(500), Math.round((+WS.v + +el.dataset.v) * 10) / 10)); wsSync(); },
  'ws-save': () => wsSave(),
  'meal-swap': el => mealSwap(el.dataset.d, el.dataset.slot),
  'dessert-add': el => mealSwap(el.dataset.d, 'dessert'),
  'ms-all': el => { MS.all = el.dataset.v === '1'; renderMealSwap(); },
  'ms-pick': el => msSet(el.dataset.rid),
  'ms-none': () => msSet(null),
  'gro-tab': el => { UI.groTab = el.dataset.v; saveUI(); render(); },
  'gro-tap': el => { const G = GRO_ROWS; if (!G) return; const r = G.rows.find(x => x.id === el.dataset.id); if (!r) return; const st = groRowState(r, groGot());
    groSetMany([[r.id, st.covered ? (st.checked ? 0 : null) : (st.checked ? null : 1)]]); },
  'gro-need': el => { groSetMany([[el.dataset.id, 0]]); toast('Moved to To buy'); },
  'copy-list-ph': () => copyListPhone(),
  'go-foods': el => { UI.foodsTab = el.dataset.v; saveUI(); location.hash = '#/foods'; render(); },
  'go-acc-sync': () => { UI._scrollTo = 'acc-sync'; location.hash = '#/account'; }
});
document.addEventListener('input', e => { const t = e.target; if (!t || !t.dataset) return;
  if (t.dataset.input === 'ws-v' && WS) { WS.v = +t.value || 0; const b = $('#ws-save'); if (b) b.innerHTML = `${icon('check')}Save ${fmt(WS.v, 1)} ${wU()}`; }
  if (t.dataset.input === 'ws-bf' && WS) WS.bf = t.value;
  if (t.dataset.input === 'ws-d' && WS && t.value) { WS.d = t.value > todayISO() ? todayISO() : t.value; }
  if (t.dataset.input === 'ms-q' && MS) { MS.q = t.value; const l = $('#ms-list'); if (l) l.innerHTML = msListHTML(); }
});
