// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
/* ============================================================
   FORGE 90 — Views: dashboard, calendar (drag & drop), day detail
   ============================================================ */
const KIND_VAR = k => `var(--k-${k})`;
function phasePill(wk) { const p = phaseForWeek(wk); return `<span class="pill"><i class="dot" style="background:${KIND_VAR(p.dot)}"></i>Cycle ${p.cycle} · ${p.name}</span>`; }
function woChip(date, e, extraCls = '') {
  const t = TEMPLATES[e.w.t];
  return `<div class="chip wo ${extraCls}" style="--k:${KIND_VAR(t.kind)}" draggable="true" data-drag="workout" data-date="${date}" data-tip-wo="${date}">${icon(t.icon)}<span class="nm">${esc(t.short)}</span></div>`;
}
function batchBadge(b, compact) {
  if (!b) return '';
  if (b.role === 'cook') return `<span class="bd cook">${compact ? '' : 'COOK '}×${b.batch.size}</span>`;
  return `<span class="bd ${b.frozen ? 'frz' : 'left'}">${b.frozen ? '❄' : '↺'}${compact ? '' : ' '}${b.idx}/${b.batch.size}</span>`;
}

/* ---------------- DASHBOARD ---------------- */
function viewDashboard() {
  const A = computeAll(); const st = S.settings; const today = todayISO();
  const idx = planIndex(today); const start = st.startDate;
  const focus = idx < 0 ? start : today; ensurePlanThrough(focus);
  const wk = planWeek(focus); const ph = phaseForWeek(wk); const cyc = ph.cycle;
  const cStartWk = cyc === 1 ? 1 : 14 + (cyc - 2) * 13; const cStart = cycleStartDate(cyc), cEnd = cycleEndDate(cyc);
  const cur = latestStats(); const trend = weightTrend(); const pj = projection();
  const startLBM = st.startWeight * (1 - st.startBF / 100);
  const dW = cur.w - st.startWeight, dBF = cur.bf - st.startBF, dL = cur.lbm - startLBM;
  const eyebrow = idx < 0 ? `Starts ${fmtDate(start, { weekday: 'long', month: 'long', day: 'numeric' })}` : `Cycle ${cyc} · Week ${ph.wic} of 13 · ${ph.name}`;
  const title = idx < 0 ? `${-idx} day${-idx === 1 ? '' : 's'} until Day 1` : cyc === 1 && idx < LAUNCH_DAYS ? `Day ${idx + 1} of 90` : `Day ${idx + 1}`;
  const bars = Array.from({ length: 13 }, (_, i) => { const w = cStartWk + i; const p = phaseForWeek(w); const cw = idx < 0 ? 0 : wk; return `<i class="${p.cls} ${w < cw ? 'done' : ''} ${w === cw && idx >= 0 ? 'now' : ''}" data-tip="Week ${w} · ${p.name}"></i>`; }).join('');
  const barLabels = (cyc === 1 ? CYCLE1 : CYCLEN).map(p => `<span>${p.key === 'test' ? 'Test' : p.name}</span>`).join('');
  const day = A.days[focus];
  const tile = (lbl, ic, val, unit, delta, good, extra = '') => `<div class="card stat"><div class="lbl">${icon(ic)}${lbl}</div><div class="val">${val}<small>${unit}</small></div><div class="delta ${delta == null ? 'neu' : good ? 'good' : 'bad'}">${delta == null ? extra : delta}</div></div>`;
  const sign = (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '±') + fmt(Math.abs(v), d);
  const hasW = S.weights.length > 0;
  const tiles = `<div class="grid g5">
    ${tile('Body weight', 'scale', fmt(cur.w, 1), 'lb', hasW ? `${sign(dW)} lb since start` : null, dW <= 0, 'Log your first weigh-in')}
    ${tile('Body fat', 'target', fmt(cur.bf, 1), '%' + (cur.est ? ' est.' : ''), hasW ? `${sign(dBF)} pts` : null, dBF <= 0, 'Goal ' + st.goalBF + '%')}
    ${tile('Lean mass', 'dumbbell', fmt(cur.lbm, 1), 'lb', hasW ? `${sign(dL)} lb` : null, dL >= -1, 'Weight × (1 − BF%)')}
    ${tile('Weekly trend', 'trend', trend ? fmt(trend.rate, 2) : '—', 'lb/wk', null, true, trend ? `Target ${st.rate} lb/wk` : 'Needs ~1 week of weigh-ins')}
    ${tile('To goal', 'flame', fmt(Math.max(0, cur.w - st.goalWeight), 1), 'lb', null, true, `≈ ${fmt(pj.weeks, 0)} weeks at ${st.rate} lb/wk`)}
  </div>`;

  // today card
  let wo = '';
  if (day.entry.w) {
    const t = TEMPLATES[day.entry.w.t]; const rows = sessionRows(day.entry.w);
    wo = `<div class="row" style="align-items:flex-start;gap:14px">${muscleMap(rows.flatMap(r => r.ex.primary), rows.flatMap(r => r.ex.secondary), 'mm')
      .replace('class="mm"', 'class="mm" style="width:96px;height:96px;flex:none"')}
      <div style="flex:1;min-width:0"><div class="row wrap" style="gap:6px 10px"><span class="pill" style="background:${KIND_VAR(t.kind)};color:#fff">${icon(t.icon).replace('<svg', '<svg style="width:12px;height:12px"')}${esc(t.name)}</span><span class="muted small">${rows.reduce((a, r) => a + r.sets, 0)} sets · ~${estMinutes(rows)} min</span>${S.done[focus] ? '<span class="pill acc">' + icon('check').replace('<svg', '<svg style="width:12px;height:12px"') + 'Done</span>' : ''}</div>
      ${focus === today ? `<div class="tiny muted" style="margin-top:8px">${t.focus ? esc(t.focus) : ''}</div>` : `<div class="sets" style="margin-top:10px;gap:5px">${rows.map(r => `<span class="pill" data-tip-ex="${r.ex.id}" style="cursor:help">${esc(r.ex.name)} <span class="muted">${r.sets}×${esc(r.reps)}</span></span>`).join('')}</div><div class="tiny muted" style="margin-top:8px">Set logging opens here on Day 1.</div>`}</div></div>
      ${focus === today ? todayLogHTML(focus, rows) : ''}`;
  } else wo = `<div class="note">${icon('info')}<span><b>Rest day.</b> Aim for 8–10k steps and 10 minutes of mobility. The calorie target is ~${fmt(S.settings.sessionKcal)} kcal lower since there’s no session.</span></div>`;
  const meals = day.meals.map(m => { const b = A.batches.info[focus + '|' + m.slot];
    return `<div class="row" style="padding:7px 0;border-top:1px solid var(--line)" data-tip-meal="${focus}|${m.slot}"><span style="font-size:20px;width:26px;text-align:center">${esc(m.r.emoji)}</span><div style="flex:1;min-width:0"><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.08em;font-weight:700">${SLOT_LABEL[m.slot]}</div><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.r.name)} ${batchBadge(b)}${shareBadge(focus, m.slot)}</div></div><span class="num small"><b>${fmt(m.m.k)}</b> kcal · <span style="color:var(--prot)">${fmt(m.m.p)}P</span></span><button class="btn icon ghost qe-pen" data-act="qe" data-d="${focus}" data-f="meal:${m.slot}" title="Swap this meal" aria-label="Swap ${SLOT_LABEL[m.slot].toLowerCase()}">${icon('edit')}</button></div>`; }).join('');
  const kfrac = day.totals.k / day.tg.kcal;
  const todayCard = `<div class="card"><div class="card-h"><h2>${focus === today ? 'Today' : fmtDate(focus, { weekday: 'long', month: 'short', day: 'numeric' })}</h2><span class="pill ${day.isTrain ? 'acc' : ''}">${day.isTrain ? 'Training day' : 'Rest day'}</span>${syncBtnHTML('sm')}<a class="btn sm ghost" href="#/day/${focus}">Open day ${icon('right')}</a></div>
    <div class="qe-links"><button class="btn sm" data-act="qe" data-d="${focus}" data-f="wo">${icon('dumbbell')}Edit workout</button><button class="btn sm" data-act="qe" data-d="${focus}" data-f="meals">${icon('food')}Edit meals</button><a class="btn sm ghost" href="#/workouts">${icon('grip')}Workout plan</a><a class="btn sm ghost" href="#/foods">${icon('book')}Recipes</a></div>
    ${wo}<hr class="sep"><div class="grid ring-row" style="grid-template-columns:auto 1fr;gap:20px;align-items:center">
      <div class="ring">${ringSVG(kfrac, 'var(--kcal)')}<div class="c"><b>${fmt(day.totals.k)}</b><span>of ${fmt(day.tg.kcal)} kcal</span></div></div>
      <div>${macroBars(day.totals, day.tg)}<div class="tiny muted" style="margin-top:6px">Portion multipliers: protein ×${day.pF.toFixed(2)} · carbs/fats ×${day.cF.toFixed(2)}</div></div></div>
    <div style="margin-top:12px">${meals}</div></div>`;

  // outlook
  const outlook = `<div class="card"><div class="card-h"><h2>Goal outlook</h2></div>
    <div class="grid g2" style="gap:12px">
      <div><div class="tiny muted">${pj.cyc === 1 ? 'End of 90 days' : 'End of cycle ' + pj.cyc} (${fmtDate(pj.endPlan, { month: 'short', day: 'numeric' })})</div><div style="font-size:22px;font-weight:700" class="num">~${fmt(pj.endW, 0)} lb</div></div>
      <div><div class="tiny muted">Reach ${st.goalWeight} lb</div><div style="font-size:22px;font-weight:700">${pj.reached ? 'Reached 🎉' : fmtDate(pj.goalDate, { month: 'short', year: 'numeric' })}</div></div></div>
    ${pj.reached ? `<div class="note acc" style="margin-top:12px">${icon('target')}<span>Goal reached — calories are now at maintenance. Training continues in 13-week cycles. Change this in Settings.</span></div>` : ''}
    <div class="note acc" style="margin-top:12px">${icon('info')}<span>If you hold your current <b>${fmt(pj.lbm, 0)} lb</b> of lean mass, ${st.goalBF}% body fat lands at about <b>${fmt(pj.wAtGoalBF, 0)} lb</b>. Hitting ${st.goalWeight} lb <i>and</i> ${st.goalBF}% means ending near ${fmt(st.goalWeight * (1 - st.goalBF / 100), 0)} lb lean — so treat ${fmt(pj.wAtGoalBF, 0)} lb as the milestone where you re-assess by body-fat % rather than scale weight.</span></div>
    ${trend ? `<div class="note ${trend.delta ? 'warn' : ''}" style="margin-top:8px">${icon('trend')}<span>${esc(trend.advice)} ${trend.delta ? `<button class="btn sm" data-act="apply-trend" data-delta="${trend.delta}" style="margin-left:6px">Apply ${trend.delta > 0 ? '+' : ''}${trend.delta} kcal</button>` : ''}</span></div>` : ''}
    <hr class="sep"><h3 style="margin-bottom:10px">Quick weigh-in</h3>${weighForm()}</div>`;

  // next 7 days
  const days7 = Array.from({ length: 7 }, (_, i) => addDays(focus, i)).filter(inPlan);
  const strip = `<div class="card"><div class="card-h"><h2>Next 7 days</h2><a class="btn sm ghost" href="#/calendar">Calendar ${icon('right')}</a></div><div class="strip7">
    ${days7.map(d => { const x = A.days[d]; return `<a href="#/day/${d}" class="cell ${x.isTrain ? 'train' : ''} ${d === today ? 'today' : ''}" style="min-height:0;text-decoration:none"><div class="cell-head"><span class="dn">${parseISO(d).getDate()}</span><span class="dt">${DOW[parseISO(d).getDay()]}</span></div>
      ${x.entry.w ? woChip(d, x.entry).replace('draggable="true"', '') : '<div class="rest-lbl">Rest</div>'}<div class="cell-foot"><div class="k">${fmt(x.totals.k)}<span>kcal</span></div></div></a>`; }).join('')}</div></div>`;

  // PRs
  const prs = recentPRs(6);
  const prCard = `<div class="card"><div class="card-h"><h2>Recent PRs</h2><a class="btn sm ghost" href="#/progress">All progress ${icon('right')}</a></div>
    ${prs.length ? `<table class="tbl">${prs.map(p => `<tr><td><span class="prb">${icon('trophy')}PR</span></td><td><span class="ex-name" data-tip-ex="${p.ex}">${esc(EX[p.ex].name)}</span></td><td>${fmt(p.set.w)} lb × ${p.set.r}</td><td class="muted">e1RM ${fmt(p.best)}</td><td class="muted">${fmtDate(p.d)}</td></tr>`).join('')}</table>`
      : `<div class="empty-state">${icon('trophy')}<div>Log your sets on any training day and personal records show up here.</div></div>`}</div>`;

  return `<div class="hero">${heroArt()}<div class="eyebrow">${eyebrow}</div><h1 style="margin-top:6px">${title}</h1><p>${esc(ph.summary)}</p>
      <div class="weekbar">${bars}</div><div class="weekbar-l"><span>${fmtDate(cStart, { month: 'short', day: 'numeric' })}</span>${barLabels}<span>${fmtDate(cEnd, { month: 'short', day: 'numeric' })}</span></div></div>
    <div style="height:16px"></div>${syncInviteNote()}${bfEstimateNote()}${tiles}<div style="height:16px"></div>
    <div class="g-split">${todayCard}${outlook}</div><div style="height:16px"></div>
    ${strip}<div style="height:16px"></div>${prCard}`;
}
function recentPRs(n) {
  const out = [];
  allLoggedExercises().forEach(ex => exerciseHistory(ex).forEach(h => { if (h.pr) out.push({ ex, d: h.d, best: h.best, set: h.bestSet }); }));
  return out.sort((a, b) => a.d < b.d ? 1 : -1).slice(0, n);
}
function weighForm() {
  const last = sortedWeights().slice(-1)[0];
  return `<form class="row wrap" data-form="weigh" style="gap:8px;align-items:flex-end">
    <div class="field" style="width:150px"><label>Date</label><input class="inp" type="date" name="d" value="${todayISO()}" required></div>
    <div class="field" style="width:110px"><label>Weight (lb)</label><input class="inp" type="number" step="0.1" min="80" max="500" name="w" placeholder="${last ? last.w : S.settings.startWeight}" required></div>
    <div class="field" style="width:110px"><label>Body fat %</label><input class="inp" type="number" step="0.1" min="3" max="60" name="bf" placeholder="optional"></div>
    <button class="btn primary" type="submit">${icon('plus')}Log</button></form>`;
}

/* ---------------- CALENDAR ---------------- */
function monthGrid(ym) {
  const [y, m] = ym.split('-').map(Number); const first = new Date(y, m - 1, 1); const last = new Date(y, m, 0);
  const s = new Date(first); s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  const e = new Date(last); e.setDate(e.getDate() + (7 - ((e.getDay() + 6) % 7) - 1));
  const out = []; for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) out.push(iso(d)); return out;
}
function mondayOf(date) { const d = parseISO(date); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); }
function cellHTML(date, A, big, monthNum) {
  const dd = parseISO(date);
  const outMonth = monthNum != null && dd.getMonth() + 1 !== monthNum;
  if (!inPlan(date)) return `<div class="cell out" style="${outMonth ? 'opacity:.3' : ''}"><div class="cell-head"><span class="dn">${dd.getDate()}</span>${big ? `<span class="dt">${DOW[dd.getDay()]}</span>` : ''}</div><div class="tiny muted" style="margin:auto;text-align:center">Outside plan</div></div>`;
  const day = A.days[date]; const e = S.plan[date]; const today = date === todayISO();
  const wo = e.w ? woChip(date, e) : `<div class="rest-lbl">Rest</div>`;
  const meals = MEAL_SLOTS.map(slot => {
    const rid = e.m[slot]; const lbl = big ? `<div class="slot-l">${SLOT_LABEL[slot]}</div>` : '';
    if (!rid) return lbl + `<div class="slot-empty" data-drop="slot" data-date="${date}" data-slot="${slot}">+ ${SLOT_LABEL[slot]}</div>`;
    const r = RECIPE[rid]; const m = day.meals.find(x => x.slot === slot); const b = A.batches.info[date + '|' + slot];
    const attrs = `class="chip meal" draggable="true" data-drag="meal" data-drop="slot" data-date="${date}" data-slot="${slot}" data-tip-meal="${date}|${slot}"`;
    if (big) return lbl + `<div ${attrs}><div class="l1"><span class="em">${esc(r.emoji)}</span><span class="nm">${esc(r.name)}</span></div><div class="l2"><span class="mk">${fmt(m.m.k)} kcal · ${fmt(m.m.p)}P</span>${batchBadge(b, true)}${shareBadge(date, slot, true)}</div></div>`;
    return lbl + `<div ${attrs}><span class="em">${esc(r.emoji)}</span><span class="nm">${esc(r.name)}</span>${batchBadge(b, true)}${shareBadge(date, slot, true)}</div>`;
  }).join('');
  const kf = Math.min(1.1, day.totals.k / day.tg.kcal);
  const off = Math.abs(day.totals.k - day.tg.kcal) > 120;
  return `<div class="cell ${e.w ? 'train' : ''} ${today ? 'today' : ''}" data-drop="cell" data-date="${date}" data-go="${date}">
    <div class="cell-head"><span class="dn">${dd.getDate()}</span><span class="dt">${big ? DOW[dd.getDay()] + ' · ' : ''}D${planIndex(date) + 1}</span>${S.done[date] ? `<span class="ck" data-tip="Workout completed">${icon('check')}</span>` : ''}</div>
    ${wo}${meals}
    <div class="cell-foot"><div class="k">${fmt(day.totals.k)}<span>/ ${fmt(day.tg.kcal)} kcal</span></div><div class="mini"><i style="width:${kf * 100 / 1.1}%;${off ? 'background:var(--warn)' : ''}"></i></div>
    <div class="pcf"><span class="p"><b>${fmt(day.totals.p)}</b>P</span><span class="c"><b>${fmt(day.totals.c)}</b>C</span><span class="f"><b>${fmt(day.totals.f)}</b>F</span></div></div></div>`;
}
// Compact (agenda) layout kicks in when month/week cells would be too narrow to read
function calIsCompact() {
  const v = $('#view'); const w = (v ? v.clientWidth : innerWidth) - 48;
  const lib = UI.showLib && w >= 1130 ? 280 : 0;
  return (w - lib - 36) / 7 < (UI.calView === 'week' ? 124 : 116);
}
function agendaHTML(dates, A) {
  const rows = dates.filter(inPlan).map(date => {
    const dd = parseISO(date); const day = A.days[date]; const e = S.plan[date]; const today = date === todayISO();
    const meals = MEAL_SLOTS.map(slot => {
      const rid = e.m[slot];
      if (!rid || !RECIPE[rid]) return `<div class="slot-empty" data-drop="slot" data-date="${date}" data-slot="${slot}" style="display:block">+ ${SLOT_LABEL[slot]}</div>`;
      const r = RECIPE[rid]; const m = day.meals.find(x => x.slot === slot); const b = A.batches.info[date + '|' + slot];
      return `<div class="chip meal" draggable="true" data-drag="meal" data-drop="slot" data-date="${date}" data-slot="${slot}" data-tip-meal="${date}|${slot}"><span class="em">${esc(r.emoji)}</span><span class="nm">${esc(r.name)}</span>${batchBadge(b, true)}${shareBadge(date, slot, true)}<span class="mk">${m ? fmt(m.m.k) : ''}</span></div>`;
    }).join('');
    return `<div class="ag-day ${e.w ? 'train' : ''} ${today ? 'today' : ''}" data-drop="cell" data-date="${date}" data-go="${date}">
      <div class="ag-date"><span class="dw">${DOW[dd.getDay()]}</span><b>${dd.getDate()}</b><span class="dx">D${planIndex(date) + 1}</span></div>
      <div style="min-width:0"><div class="ag-top">${e.w ? woChip(date, e) : '<span class="rest-lbl">Rest day</span>'}${S.done[date] ? `<span class="pill acc">${icon('check').replace('<svg', '<svg style="width:12px;height:12px"')}Done</span>` : ''}<span class="ag-k">${fmt(day.totals.k)} <span>/ ${fmt(day.tg.kcal)} kcal</span></span></div>
        <div class="ag-meals">${meals}</div>
        <div class="pcf"><span class="p"><b>${fmt(day.totals.p)}</b>g protein</span><span class="c"><b>${fmt(day.totals.c)}</b>g carbs</span><span class="f"><b>${fmt(day.totals.f)}</b>g fat</span></div></div></div>`;
  }).join('');
  return `<div class="agenda">${rows || '<div class="card empty-state">No plan days in this range.</div>'}</div>`;
}
function viewCalendar() {
  const A = computeAll(); const st = S.settings;
  const start = st.startDate, end = planEnd();
  const t = todayISO(); const anchor = inPlan(t) ? t : (t < start ? start : end);
  if (!UI.calMonth) UI.calMonth = anchor.slice(0, 7);
  if (!UI.calWeek || !inPlan(UI.calWeek) && !inPlan(addDays(UI.calWeek, 6))) UI.calWeek = mondayOf(anchor);
  let title, grid; const compact = calIsCompact(); UI._calCompact = compact;
  if (UI.calView === 'week') {
    const days = Array.from({ length: 7 }, (_, i) => addDays(UI.calWeek, i));
    const pw = days.find(inPlan);
    title = `${fmtDate(days[0], { month: 'short', day: 'numeric' })} – ${fmtDate(days[6], { month: 'short', day: 'numeric' })}` + (pw ? ` <span class="muted" style="font-size:14px;font-weight:500">· Week ${planWeek(pw)}</span>` : '');
    grid = compact ? agendaHTML(days, A) : `<div class="cal week">${days.map(d => `<div class="dow">${DOW[parseISO(d).getDay()]}</div>`).join('')}${days.map(d => cellHTML(d, A, true)).join('')}</div>`;
  } else {
    const [y, m] = UI.calMonth.split('-').map(Number);
    title = `${MONTHS[m - 1]} ${y}`;
    const g0 = monthGrid(UI.calMonth); const g = [];
    for (let i = 0; i < g0.length; i += 7) { const wkd = g0.slice(i, i + 7); if (wkd.some(inPlan)) g.push(...wkd); }
    if (compact) { const last = new Date(y, m, 0).getDate(); grid = agendaHTML(Array.from({ length: last }, (_, i) => `${y}-${pad2(m)}-${pad2(i + 1)}`), A); }
    else grid = `<div class="cal">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="dow">${d}</div>`).join('')}${g.map(d => cellHTML(d, A, false, m)).join('')}</div>${g.length ? '' : `<div class="card empty-state">No plan days in ${MONTHS[m - 1]} — the plan starts ${fmtDate(start, { month: 'short', day: 'numeric', year: 'numeric' })}.</div>`}`;
  }
  const showLib = UI.showLib && !compact;
  const lib = showLib ? libraryHTML() : '';
  const fitsCollapsed = compact && !UI.navCollapsed && innerWidth > 860 && (() => { const w = ($('#view') ? $('#view').clientWidth : innerWidth) + 162 - 48; const lib = UI.showLib && w >= 1130 ? 280 : 0; return (w - lib - 36) / 7 >= (UI.calView === 'week' ? 124 : 116); })();
  return `<div class="page-head"><div class="t"><h1>Plan calendar</h1><p>${compact ? 'Tap any day for the full breakdown — swap meals or change the session there.' + (fitsCollapsed ? ` <button class="btn sm ghost" data-act="nav-toggle" style="vertical-align:middle">${icon('sideL')}Collapse the menu for the drag-and-drop grid</button>` : '') : 'Drag workouts and meals between days — portions and macros recalculate instantly. <span class="kbd">Ctrl</span>/<span class="kbd">Alt</span>-drag copies. Click a day for the full breakdown.'}</p></div></div>
    <div class="cal-wrap ${showLib ? '' : 'nolib'}"><div>
      <div class="cal-bar"><button class="btn icon" data-act="cal-prev">${icon('left')}</button><h2>${title}</h2><button class="btn icon" data-act="cal-next">${icon('right')}</button>
        <button class="btn sm" data-act="cal-today">Today</button><div class="spacer"></div>${syncBtnHTML('sm')}
        <div class="seg"><button class="${UI.calView === 'month' ? 'on' : ''}" data-act="cal-view" data-v="month">Month</button><button class="${UI.calView === 'week' ? 'on' : ''}" data-act="cal-view" data-v="week">Week</button></div>
        <button class="btn sm" data-act="undo" ${undoStack.length ? '' : 'disabled'}>${icon('undo')}Undo</button>
        ${compact ? '' : `<button class="btn sm ${UI.showLib ? '' : 'primary'}" data-act="toggle-lib">${icon('panel')}${UI.showLib ? 'Hide' : 'Show'} library</button>`}</div>
      <div class="row wrap" style="gap:14px;margin-bottom:10px">${['push', 'pull', 'legs', 'deload', 'test'].map(k => `<span class="legend-dot"><i style="background:${KIND_VAR(k)}"></i>${{ push: 'Push', pull: 'Pull', legs: 'Legs', deload: 'Deload', test: 'PR test' }[k]}</span>`).join('')}
        <span class="legend-dot"><span class="bd cook">COOK ×4</span>batch cook</span><span class="legend-dot"><span class="bd left">↺ 2/4</span>leftover</span>${syncActive() ? `<span class="legend-dot"><span class="bd shr pend">${icon('users')}?</span>shared-meal change to review</span>` : ''}</div>
      ${grid}</div>${lib}</div>
    ${showLib ? '' : `<div class="trash float-trash card" data-drop="trash">${icon('trash')}Drop here to remove</div>`}`;
}
function libraryHTML() {
  let list = '';
  if (UI.libTab === 'workouts') {
    list = ALL_PHASES.map(p => `<div class="lib-ph">${p.name}</div>` + p.templates.map(k => { const t = TEMPLATES[k];
      return `<div class="lib-item" draggable="true" data-drag="workout" data-from="lib" data-t="${k}" data-tip-tpl="${k}"><i class="bar" style="--k:${KIND_VAR(t.kind)}"></i><div><b>${esc(t.name)}</b><span>${t.rows.length} exercises · ${t.rows.reduce((a, r) => a + r[2], 0)} sets</span></div></div>`; }).join('')).join('');
  } else {
    const q = UI.libQ.toLowerCase();
    const rs = RECIPES.filter(r => recipeAllowed(r) && (UI.libFilter === 'all' || r.cat === UI.libFilter) && (!q || r.name.toLowerCase().includes(q))).sort((a, b) => isFav(b.id) - isFav(a.id));
    const hidden = RECIPES.filter(r => !recipeAllowed(r)).length;
    list = rs.map(r => { const m = RPS(r.id);
      return `<div class="lib-item" draggable="true" data-drag="meal" data-from="lib" data-rid="${r.id}"><span class="em">${esc(r.emoji)}</span><div style="min-width:0"><b>${isFav(r.id) ? '<span class="fav-mark" title="Favorite">★</span> ' : ''}${esc(r.name)}${r.custom ? ' <span class="pill acc" style="font-size:9.5px;padding:1px 6px">Custom</span>' : ''}</b><span>${fmt(m.k)} kcal · ${fmt(m.p)}P · ${fmt(m.c)}C · ${fmt(m.f)}F${r.yield > 1 ? ' · makes ' + r.yield : ''}</span></div></div>`; }).join('') || '<div class="muted small">No matches</div>';
    if (hidden) list += `<a class="tiny muted" href="#/foods" style="padding:4px 2px">${hidden} recipe${hidden === 1 ? '' : 's'} hidden by your food preferences →</a>`;
  }
  return `<aside class="card lib"><div class="row"><h3 style="flex:1">Library</h3><div class="seg"><button class="${UI.libTab === 'workouts' ? 'on' : ''}" data-act="lib-tab" data-v="workouts">Workouts</button><button class="${UI.libTab === 'meals' ? 'on' : ''}" data-act="lib-tab" data-v="meals">Meals</button></div></div>
    ${UI.libTab === 'meals' ? `<div class="filters" style="margin-top:10px">${['all', 'breakfast', 'lunch', 'dinner', 'snack'].map(f => `<button class="${UI.libFilter === f ? 'on' : ''}" data-act="lib-filter" data-v="${f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join('')}</div>
      <input class="inp" style="margin-top:8px;height:32px" placeholder="Search meals…" data-input="libq" value="${esc(UI.libQ)}">` : '<div class="tiny muted" style="margin-top:8px">Drop a session on any day. Exercise variations follow that day’s week in the rotation.</div>'}
    <div class="lib-list">${list}</div><div class="trash" data-drop="trash">${icon('trash')}Drag here to remove</div></aside>`;
}

/* ---------- drag & drop ---------- */
let drag = null, dropEl = null;
document.addEventListener('dragstart', e => {
  const el = e.target.closest && e.target.closest('[data-drag]'); if (!el) return;
  drag = { kind: el.dataset.drag, from: el.dataset.from || 'cal', date: el.dataset.date, slot: el.dataset.slot, rid: el.dataset.rid, t: el.dataset.t };
  e.dataTransfer.effectAllowed = 'copyMove'; try { e.dataTransfer.setData('text/plain', drag.kind); } catch (x) { }
  el.classList.add('dragging'); hideTip();
  setTimeout(() => document.body.classList.add('dragging', drag && drag.from === 'cal' ? 'dragging-cal' : 'dragging-lib'), 0);
});
function clearDrop() { if (dropEl) dropEl.classList.remove('drop-ok'); dropEl = null; }
document.addEventListener('dragend', () => { document.body.classList.remove('dragging', 'dragging-cal', 'dragging-lib'); $$('.dragging').forEach(x => x.classList.remove('dragging')); clearDrop(); drag = null; });
function dropTarget(e) {
  if (!drag) return null;
  let el = e.target.closest && e.target.closest('[data-drop]'); if (!el) return null;
  if (el.dataset.drop === 'trash') return drag.from === 'cal' ? el : null;
  if (drag.kind === 'workout' && el.dataset.drop === 'slot') el = el.closest('[data-drop="cell"]');
  if (!el || !inPlan(el.dataset.date)) return null;
  return el;
}
document.addEventListener('dragover', e => {
  const el = dropTarget(e); if (!el) { clearDrop(); return; }
  e.preventDefault(); e.dataTransfer.dropEffect = (e.ctrlKey || e.altKey) && drag.from === 'cal' ? 'copy' : 'move';
  if (el !== dropEl) { clearDrop(); dropEl = el; el.classList.add('drop-ok'); }
});
document.addEventListener('drop', e => {
  const el = dropTarget(e); if (!el) return; e.preventDefault();
  const d = drag; const copy = (e.ctrlKey || e.altKey) && d.from === 'cal';
  clearDrop(); document.body.classList.remove('dragging', 'dragging-cal', 'dragging-lib');
  applyDrop(d, el.dataset.drop, el.dataset.date, el.dataset.slot, copy);
});
function applyDrop(d, type, tDate, tSlot, copy) {
  if (type === 'trash') {
    if (d.from !== 'cal') return;
    pushUndo('remove');
    if (d.kind === 'meal') { const rid = S.plan[d.date].m[d.slot]; S.plan[d.date].m[d.slot] = null; markMealEdit(d.date, d.slot); commitPlan(`Removed ${RECIPE[rid] ? RECIPE[rid].name : 'meal'} from ${fmtDate(d.date)}`); }
    else { S.plan[d.date].w = null; commitPlan(`Removed workout from ${fmtDate(d.date)} — it’s now a rest day`); }
    return;
  }
  const tE = S.plan[tDate];
  if (d.kind === 'workout') {
    if (d.from === 'lib') { pushUndo('add workout'); tE.w = { t: d.t, wk: planWeek(tDate) }; commitPlan(`${TEMPLATES[d.t].name} → ${fmtDate(tDate)}`); return; }
    if (d.date === tDate) return;
    pushUndo('move workout'); const src = S.plan[d.date]; const a = src.w, b = tE.w;
    tE.w = a ? Object.assign({}, a) : null; if (!copy) src.w = b ? Object.assign({}, b) : null;
    commitPlan(copy ? `Copied workout to ${fmtDate(tDate)}` : b ? `Swapped workouts: ${fmtDate(d.date)} ↔ ${fmtDate(tDate)}` : `Moved workout to ${fmtDate(tDate)}`);
    return;
  }
  // meals
  const rid = d.from === 'lib' ? d.rid : S.plan[d.date].m[d.slot]; if (!rid) return;
  if (type !== 'slot') {
    if (d.from === 'cal') tSlot = d.slot;
    else { const cat = RECIPE[rid].cat; tSlot = cat !== 'snack' ? cat : (!tE.m.snack1 ? 'snack1' : 'snack2'); }
  }
  if (d.from === 'lib') { pushUndo('add meal'); tE.m[tSlot] = rid; markMealEdit(tDate, tSlot); commitPlan(`${RECIPE[rid].name} → ${fmtDate(tDate)} ${SLOT_LABEL[tSlot].toLowerCase()}`); return; }
  if (d.date === tDate && d.slot === tSlot) return;
  pushUndo('move meal'); const src = S.plan[d.date]; const prev = tE.m[tSlot] || null;
  tE.m[tSlot] = rid; markMealEdit(tDate, tSlot); if (!copy) { src.m[d.slot] = prev; markMealEdit(d.date, d.slot); }
  commitPlan(copy ? `Copied ${RECIPE[rid].name} to ${fmtDate(tDate)}` : prev ? `Swapped ${RECIPE[rid].name} ↔ ${RECIPE[prev].name}` : `Moved ${RECIPE[rid].name} to ${fmtDate(tDate)}`);
}

/* ---------------- DAY DETAIL ---------------- */
function viewDay(date) {
  if (!date || !inPlan(date)) return `<div class="card empty-state">${icon('cal')}<h2 style="margin:8px 0">That day isn’t in the plan</h2><a class="btn" href="#/calendar">Back to calendar</a></div>`;
  const A = computeAll(); const day = A.days[date]; const e = S.plan[date];
  const idx = planIndex(date), wk = planWeek(date);
  const prev = inPlan(addDays(date, -1)) ? addDays(date, -1) : null, next = inPlan(addDays(date, 1)) ? addDays(date, 1) : null;
  const head = `<div class="day-head"><a class="btn icon" href="#/calendar" data-tip="Back to calendar">${icon('cal')}</a>
    <div class="date"><div class="muted small" style="font-weight:600">${idx < LAUNCH_DAYS ? `Day ${idx + 1} of 90 · Week ${wk}` : `Day ${idx + 1} · Cycle ${phaseForWeek(wk).cycle}, week ${phaseForWeek(wk).wic} of 13`}</div><h1>${fmtDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}</h1></div>
    <div class="row wrap">${phasePill(wk)}<span class="pill ${day.isTrain ? 'acc' : ''}">${day.isTrain ? 'Training day' : 'Rest day'}</span></div><div class="spacer"></div>${syncBtnHTML()}
    <a class="btn icon ${prev ? '' : 'hidden'}" href="#/day/${prev}">${icon('left')}</a><a class="btn icon ${next ? '' : 'hidden'}" href="#/day/${next}">${icon('right')}</a></div>`;

  // workout
  const opts = `<option value="">— Rest day —</option>` + (e.w && TEMPLATES[e.w.t] && TEMPLATES[e.w.t].legacy ? `<option value="${e.w.t}" selected>${esc(TEMPLATES[e.w.t].name)} (earlier plan)</option>` : '') + ALL_PHASES.map(p => `<optgroup label="${p.name}">${p.templates.map(k => `<option value="${k}" ${e.w && e.w.t === k ? 'selected' : ''}>${esc(TEMPLATES[k].name)}</option>`).join('')}</optgroup>`).join('');
  let woCard;
  if (e.w) {
    const t = TEMPLATES[e.w.t]; const rows = sessionRows(e.w);
    const prim = rows.flatMap(r => r.ex.primary), sec = rows.flatMap(r => r.ex.secondary);
    woCard = `<div class="card"><div class="card-h" style="align-items:flex-start"><div style="flex:1"><div class="row"><span class="pill" style="background:${KIND_VAR(t.kind)};color:#fff">${esc(t.short)}</span><span class="muted small">${rows.reduce((a, r) => a + r.sets, 0)} sets · ~${estMinutes(rows)} min</span></div>
        <h2 style="margin-top:8px">${esc(t.name)}</h2><div class="sub small" style="margin-top:2px">${esc(t.focus)}</div></div>
        ${muscleMap(prim, sec).replace('class="mm"', 'class="mm" style="width:110px;height:110px;flex:none"')}</div>
      <div class="row wrap" style="margin-bottom:12px"><select class="inp" data-input="day-wo" data-date="${date}" style="max-width:280px">${opts}</select>
        <button class="btn ${S.done[date] ? 'primary' : ''}" data-act="toggle-done" data-date="${date}">${icon('check')}${S.done[date] ? 'Completed' : 'Mark complete'}</button></div>
      <div class="scroll-x"><table class="ex-table"><thead><tr><th>#</th><th>Exercise</th><th>Target</th><th>Log sets (lb × reps)</th></tr></thead><tbody>
      ${rows.map((r, i) => exRowHTML(date, r, i)).join('')}</tbody></table></div>
      <div class="note" style="margin-top:12px">${icon('info')}<span><b>RIR</b> = reps in reserve (how many more clean reps you could do). Strength sets <span class="type-s">S</span>: rest 2–3 min. Hypertrophy sets <span class="type-h">H</span>: rest 60–120 s. Hover any exercise for step-by-step form.</span></div></div>`;
  } else {
    woCard = `<div class="card"><div class="card-h"><h2>Rest &amp; recover</h2></div><div class="note acc">${icon('info')}<span>No lifting today. Walk 8–10k steps, get 7–9 h of sleep and keep protein on target. Today’s calorie target is ${fmt(S.settings.sessionKcal)} kcal lower than a training day, and portions are resized to match.</span></div>
      <div class="row wrap" style="margin-top:14px"><span class="small sub">Add a session:</span><select class="inp" data-input="day-wo" data-date="${date}" style="max-width:280px">${opts}</select></div></div>`;
  }

  // nutrition
  const st = day.stats; const tg = day.tg;
  const mealsHTML = MEAL_SLOTS.map(slot => {
    const m = day.meals.find(x => x.slot === slot);
    const sel = `<select class="inp" data-input="day-meal" data-date="${date}" data-slot="${slot}" style="height:30px;font-size:12px;max-width:190px"><option value="">— none —</option>${['breakfast', 'lunch', 'dinner', 'snack'].map(c => `<optgroup label="${c[0].toUpperCase() + c.slice(1)}">${RECIPES.filter(r => r.cat === c && (recipeAllowed(r) || (m && m.r.id === r.id))).map(r => `<option value="${r.id}" ${m && m.r.id === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</optgroup>`).join('')}</select>`;
    if (!m) return `<div class="meal-card" style="border-style:dashed"><div class="top"><div class="em" style="opacity:.4">+</div><div style="flex:1"><div class="slot">${SLOT_LABEL[slot]}</div><div class="muted small">Nothing planned</div></div>${sel}</div></div>`;
    const b = A.batches.info[date + '|' + slot];
    let bnote = '';
    if (b && b.role === 'cook') {
      const list = Object.entries(b.batch.amounts).map(([id, a]) => { const t = amountText(id, a); return `<span>${esc(ING[id].n)}</span><span class="q">${t.main}${t.sub ? `<small>${t.sub}</small>` : ''}</span>`; }).join('');
      bnote = `<div class="note acc" style="margin-top:10px">${icon('flame')}<div style="flex:1"><b>Cook today: ${b.batch.size} serving${b.batch.size > 1 ? 's' : ''}</b>${b.batch.partnerServ ? ` (${b.batch.size - b.batch.partnerServ} for you, ${b.batch.partnerServ} for ${esc(syncName())})` : ''}${b.batch.size < m.r.yield ? ` (recipe scaled to ${Math.round(b.batch.scale * 100)}%)` : ''} — leftovers on ${b.batch.members.slice(1).map(o => fmtDate(o.date, { weekday: 'short' }) + ' ' + SLOT_LABEL[o.slot].toLowerCase()).join(', ') || '—'}.
        <details><summary>Full batch ingredients (sized to each day’s portions)</summary><div class="ing-list">${list}</div></details></div></div>`;
    } else if (b) bnote = `<div class="note" style="margin-top:10px">${icon('loop')}<span>Leftover ${b.idx}/${b.batch.size} — cooked ${fmtDate(b.batch.cook)}${b.frozen ? '. Move from freezer to fridge the night before.' : '.'}</span></div>`;
    const items = m.items.map(it => { const t = amountText(it.id, it.amt); const dir = it.role === 'P' ? day.pF : (it.role === 'C' || it.role === 'F') ? day.cF : 1;
      return `<span>${esc(ING[it.id].n)}</span><span class="q ${dir > 1.02 ? 'scaled-up' : dir < 0.98 ? 'scaled-dn' : ''}">${t.main}${t.sub ? `<small>${t.sub}</small>` : ''}</span>`; }).join('');
    return `<div class="meal-card"><div class="top"><div class="em">${esc(m.r.emoji)}</div><div style="flex:1;min-width:0"><div class="slot">${SLOT_LABEL[slot]} ${batchBadge(b)}${shareBadge(date, slot)}</div><div class="nm">${esc(m.r.name)}</div></div>
      <div class="mk"><b>${fmt(m.m.k)} kcal</b><div class="pcf" style="justify-content:flex-end"><span class="p">${fmt(m.m.p)}P</span><span class="c">${fmt(m.m.c)}C</span><span class="f">${fmt(m.m.f)}F</span></div></div></div>
      <div class="ing-list">${items}</div>${bnote}
      <details><summary>How to make it</summary><ol>${m.r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol></details>
      <div class="row" style="margin-top:8px"><span class="tiny muted">Swap:</span>${sel}</div></div>`;
  }).join('');
  const nutCard = `<div class="card"><div class="card-h"><h2>Nutrition</h2><span class="pill">${day.isTrain ? 'Training' : 'Rest'} target</span></div>
    <div class="grid" style="grid-template-columns:auto 1fr;gap:18px;align-items:center"><div class="ring">${ringSVG(day.totals.k / tg.kcal, 'var(--kcal)')}<div class="c"><b>${fmt(day.totals.k)}</b><span>of ${fmt(tg.kcal)} kcal</span></div></div><div>${macroBars(day.totals, tg)}</div></div>
    <div class="note" style="margin-top:12px">${icon('scale')}<span>Portions sized from <b>${fmt(st.w, 1)} lb · ${fmt(st.bf, 1)}% BF${st.est ? ' (est.)' : ''}</b> ${st.src === 'start' ? '(starting stats)' : '(weigh-in ' + fmtDate(st.src) + ')'}: protein sources ×${day.pF.toFixed(2)}, carb &amp; fat sources ×${day.cF.toFixed(2)}. <span class="scaled-up" style="color:var(--good)">Green</span> amounts are scaled up, <span style="color:var(--kcal)">orange</span> scaled down.</span></div>
    <div style="margin-top:14px">${mealsHTML}</div></div>`;
  return head + `<div class="day-grid"><div>${woCard}</div><div>${nutCard}</div></div>`;
}
function exRowHTML(date, r, i) {
  const sug = suggestion(r.ex.id, r.reps, date);
  const sets = setInputsHTML(date, r); const typeB = typeBadge(r);
  return `<tr><td class="muted" style="font-weight:700">${i + 1}</td>
    <td style="min-width:190px"><span class="ex-name" data-tip-ex="${r.ex.id}">${esc(r.ex.name)}</span><div class="ex-meta">${esc(SLOTS[r.slot].label)} · variation ${r.vi + 1}/${r.nv}</div>${r.note ? `<div class="ex-meta" style="color:var(--accent-text)">${esc(r.note)}</div>` : ''}</td>
    <td style="white-space:nowrap">${typeB} <b>${r.sets} × ${esc(r.reps)}</b><div class="ex-meta">RIR ${esc(r.rir)} · rest ${r.rest >= 120 ? (r.rest / 60) + ' min' : r.rest + ' s'}</div></td>
    <td><div class="sets">${sets}</div>${hintHTML(date, r, sug)}</td></tr>`;
}
function setInputsHTML(date, r) {
  const logs = (S.logs[date] || {})[r.ex.id] || []; const wl = r.ex.assist ? 'assist' : isBW(r.ex.id) ? '+lb' : 'lb';
  return Array.from({ length: r.sets }, (_, k) => { const s = logs[k] || {};
    return `<div class="set ${s.r > 0 ? 'logged' : ''}"><span class="n">${k + 1}</span><input class="w num" type="number" inputmode="decimal" step="2.5" min="0" placeholder="${wl}" value="${s.w != null ? esc(s.w) : ''}" data-log="${date}|${r.ex.id}|${k}|w" aria-label="${esc(r.ex.name)} set ${k + 1} weight"><span class="x">×</span><input class="r num" type="number" inputmode="numeric" min="0" max="100" placeholder="reps" value="${s.r != null ? esc(s.r) : ''}" data-log="${date}|${r.ex.id}|${k}|r" aria-label="${esc(r.ex.name)} set ${k + 1} reps"></div>`; }).join('');
}
const typeBadge = r => `<span class="type-${r.type.toLowerCase()}">${r.type === 'S' ? 'S' : r.type === 'T' ? 'TEST' : 'H'}</span>`;
const hintHTML = (date, r, sug) => `<div class="hint" id="hint-${r.ex.id}">${prBadge(date, r.ex.id)}${sug ? icon('zap') + `<span>${esc(sug.text)}</span>` : `<span class="muted">First time — pick a weight you can do for the target reps at RIR ${esc(r.rir)}.</span>`}</div>`;
/* sets logged (reps entered) for a session, counting only the planned sets */
function loggedSets(date, rows) { let done = 0, total = 0; rows.forEach(r => { const l = (S.logs[date] || {})[r.ex.id] || []; total += r.sets; for (let k = 0; k < r.sets; k++) if (l[k] && +l[k].r > 0) done++; }); return { done, total }; }
function exLogged(date, r) { const l = (S.logs[date] || {})[r.ex.id] || []; for (let k = 0; k < r.sets; k++) if (!(l[k] && +l[k].r > 0)) return false; return true; }
/* dashboard "Today" set logger */
function todayLogHTML(date, rows) {
  const c = loggedSets(date, rows); const rest = r => r.rest >= 120 ? (r.rest / 60) + ' min' : r.rest + ' s';
  return `<div class="tlog" data-tlog="${date}"><div class="tlog-h"><h3>Log sets</h3><span class="tiny muted">weight × reps — saves as you type</span><span class="pill ${c.done >= c.total ? 'acc' : ''}" id="tlog-count">${c.done} / ${c.total} sets</span></div>
    ${rows.map((r, i) => `<div class="tlog-ex ${exLogged(date, r) ? 'done' : ''}" data-tlog-ex="${r.ex.id}"><div class="tlog-name"><span class="tlog-n">${exLogged(date, r) ? icon('check') : i + 1}</span><div style="min-width:0"><span class="ex-name" data-tip-ex="${r.ex.id}">${esc(r.ex.name)}</span><div class="ex-meta">${typeBadge(r)} <b>${r.sets} × ${esc(r.reps)}</b> · RIR ${esc(r.rir)} · rest ${rest(r)}</div></div></div>
      <div class="tlog-sets"><div class="sets">${setInputsHTML(date, r)}</div>${hintHTML(date, r, suggestion(r.ex.id, r.reps, date))}</div></div>`).join('')}
    <div class="row wrap tlog-foot"><button class="btn ${S.done[date] ? 'primary' : ''}" data-act="toggle-done" data-date="${date}">${icon('check')}${S.done[date] ? 'Workout completed' : 'Mark workout complete'}</button><a class="btn ghost sm" href="#/day/${date}">Full day view ${icon('right')}</a></div></div>`;
}
/* live refresh of the counters after a set is typed in (no full re-render, so focus stays put) */
function refreshLogProgress(date, exId) {
  document.querySelectorAll(`[data-log^="${date}|${exId}|"]`).forEach(inp => { const k = +inp.dataset.log.split('|')[2]; const s = ((S.logs[date] || {})[exId] || [])[k]; const st = inp.closest('.set'); if (st) st.classList.toggle('logged', !!(s && +s.r > 0)); });
  const box = document.querySelector(`[data-tlog="${date}"]`); const e = S.plan[date]; if (!box || !e || !e.w) return;
  const rows = sessionRows(e.w); const c = loggedSets(date, rows); const cnt = $('#tlog-count');
  if (cnt) { cnt.textContent = `${c.done} / ${c.total} sets`; cnt.classList.toggle('acc', c.done >= c.total); }
  const r = rows.find(x => x.ex.id === exId); const el = box.querySelector(`[data-tlog-ex="${exId}"]`);
  if (r && el) { const d = exLogged(date, r); el.classList.toggle('done', d); const n = el.querySelector('.tlog-n'); if (n) n.innerHTML = d ? icon('check') : String(rows.indexOf(r) + 1); }
  return c;
}
function prBadge(date, exId) {
  const h = exerciseHistory(exId).find(x => x.d === date);
  return h && h.pr ? `<span class="prb">${icon('trophy')}PR ${isBW(exId) ? h.best + ' reps' : 'e1RM ' + fmt(h.best)}</span>` : '';
}
