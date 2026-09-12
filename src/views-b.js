// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
/* ============================================================
   FORGE 90 — Views: workout plan, diet, grocery & prep, progress,
   settings; router, actions, init
   ============================================================ */

/* ---------------- WORKOUT PLAN ---------------- */
const EX_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'];
// Average direct sets per week for each muscle group, given the number of training days
function weeklySets() {
  const n = S.settings.trainDays.length;
  const out = {}; EX_GROUPS.forEach(g => out[g] = ALL_PHASES.map(() => 0));
  ALL_PHASES.forEach((p, i) => { const seq = p.key === 'test' ? testWeekSeq(n) : p.seq;
    seq.forEach(k => TEMPLATES[k].rows.forEach(r => { out[SLOTS[r[0]].group][i] += r[2] * (p.key === 'test' ? 1 : n / seq.length); })); });
  return { groups: EX_GROUPS, out };
}
function viewWorkouts() {
  const ph = ALL_PHASES.find(p => p.key === UI.planPhase || p.n === +UI.planPhase) || ALL_PHASES[0];
  const start = S.settings.startDate;
  const card = (p, i, cyc) => `<div class="card phase-card"><i class="band ${p.cls}b"></i><span class="num">0${i + 1}</span>
    <div class="tiny muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.1em">Weeks ${p.weeks[0]}${p.weeks[1] !== p.weeks[0] ? '–' + p.weeks[1] : ''} · ${fmtDate(addDays(cycleStartDate(cyc), (p.weeks[0] - 1) * 7), { month: 'short', day: 'numeric' })}</div>
    <h2 style="margin:4px 0 6px">${p.name}</h2><div class="small sub">${esc(p.summary)}</div><div class="row wrap" style="margin-top:10px"><span class="pill">${esc(p.legs)}</span></div></div>`;
  const phaseCards = CYCLE1.map((p, i) => card(p, i, 1)).join('');
  const contCards = CYCLEN.map((p, i) => card(p, i, 2)).join('');
  const ws = weeklySets(); const maxV = Math.max(...Object.values(ws.out).flat());
  const heat = `<table class="tbl heat"><thead><tr><th>Muscle</th>${ALL_PHASES.map(p => `<th style="text-align:center">${p.key === 'test' ? 'Test' : p.name}</th>`).join('')}</tr></thead><tbody>
    ${ws.groups.map(g => `<tr><td style="font-weight:600">${g}</td>${ws.out[g].map(v => { const a = v / maxV; const bg = v ? `color-mix(in srgb, var(--prot) ${Math.round(15 + a * 80)}%, var(--surface-2))` : 'var(--surface-2)'; return `<td class="hc" style="background:${bg};color:${a > .5 ? '#fff' : 'var(--text)'}">${v ? fmt(v, v % 1 ? 1 : 0) : '–'}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
  const weeks = []; for (let w = 1; w <= 26 && weeks.length < (ph.key === 'test' ? 1 : 4); w++) if (phaseForWeek(w).key === ph.key) weeks.push(w);
  const sessions = ph.templates.map((k, si) => { const t = TEMPLATES[k];
    return `<div class="card" style="margin-bottom:14px"><div class="card-h"><span class="pill" style="background:${KIND_VAR(t.kind)};color:#fff">${ph.key === 'test' ? (t.kind === 'test' ? 'Test' : 'Deload') : 'Session ' + (si + 1)}</span><h3>${esc(t.name)}</h3><span class="muted small">${t.rows.reduce((a, r) => a + r[2], 0)} sets</span></div><div class="small sub" style="margin:-6px 0 12px">${esc(t.focus)}</div>
      <div class="scroll-x"><table class="tbl"><thead><tr><th>Slot</th><th>Prescription</th>${weeks.map(w => `<th>Week ${w}${phaseForWeek(w).cycle > 1 ? ` <span class="muted" style="text-transform:none;letter-spacing:0">(cycle ${phaseForWeek(w).cycle})</span>` : ''}</th>`).join('')}</tr></thead><tbody>
      ${t.rows.map(r => { const [slot, type, sets, reps, rest, off, note] = r;
        return `<tr><td><b>${esc(SLOTS[slot].label)}</b><div class="tiny muted">${SLOTS[slot].group}</div></td><td style="white-space:nowrap"><span class="type-${type.toLowerCase()}">${type === 'T' ? 'TEST' : type}</span> ${sets} × ${esc(reps)}<div class="tiny muted">rest ${rest >= 120 ? rest / 60 + ' min' : rest + ' s'}${note ? ' · ' + esc(note) : ''}</div></td>
          ${weeks.map(w => { const vv = slotVars(slot, w); const exId = vv[((w - 1 + off) % vv.length + vv.length) % vv.length]; const wip = weekInPhase(w); const rir = type === 'T' ? 'top set' : ph.key === 'test' ? 'RIR 3–4' : 'RIR ' + RIR[type][wip - 1];
            const swapped = S.slotSwap && slotSwapsOn(slot, planWeekStart(w)).some(x => x[1] === exId);
            return `<td><div class="var-cell"><span class="ex-name" data-tip-ex="${exId}">${esc(EX[exId].name)}</span><span class="tiny muted">${rir}${swapped ? ' · <span class="swap-mark">swapped</span>' : ''}</span><button type="button" class="swap-btn" data-act="swap-prog" data-slot="${slot}" data-ex="${exId}" title="Swap ${esc(EX[exId].name)} in the program" aria-label="Swap ${esc(EX[exId].name)} in the program">${icon('loop')}</button></div></td>`; }).join('')}</tr>`; }).join('')}</tbody></table></div></div>`; }).join('');
  const lib = MUSCLE_GROUPS.map(g => {
    const exs = Object.values(EX).filter(e => exGroupOf(e) === g); const onN = exs.filter(e => !exOffNow(e.id)).length;
    const cw = curPlanWeekStart(); const inProg = new Set(Object.keys(S.slotSwap || {}).flatMap(sl => SLOTS[sl] ? slotSwapsOn(sl, cw).map(x => x[1]) : []));
    return `<div style="margin-bottom:18px"><h3 style="margin-bottom:8px">${g} <span class="muted small" style="font-weight:500">· ${onN} of ${exs.length} in rotation</span></h3><div class="grid g4" style="gap:10px">
      ${exs.map(e => { const on = !exOffNow(e.id); const last = on && onN <= 1;
        return `<div class="ex-card ${e.custom ? 'custom' : ''} ${on ? '' : 'off'}" data-tip-ex="${e.id}">${muscleMap(e.primary, e.secondary)}<div style="min-width:0;flex:1"><b>${esc(e.name)}</b><span>${esc(e.equip || '—')}</span><div class="row wrap" style="margin-top:4px;gap:4px">${inProg.has(e.id) ? '<span class="pill acc" style="font-size:10.5px">Swapped in</span>' : ''}<span class="pill" style="font-size:10.5px">${e.compound ? 'Compound' : 'Isolation'}</span>${e.custom ? `<span class="pill acc" style="font-size:10.5px">Yours${e.slot && SLOTS[e.slot] ? ' · in rotation' : ''}</span>` : ''}</div>
          <label class="ex-tog" title="${last ? `This is the only ${g.toLowerCase()} exercise switched on — every muscle group keeps at least one` : on ? 'Switch off to keep it out of your sessions' : 'Switch on to add it back to the rotation'}"><input type="checkbox" data-input="ex-on" data-id="${e.id}" ${on ? 'checked' : ''} ${last ? 'disabled' : ''}><i class="switch ${on ? 'on' : ''}" aria-hidden="true"><i></i></i><span>${on ? (last ? 'Required' : 'In rotation') : 'Off'}</span></label></div>
        ${e.custom ? `<button class="ex-edit" data-act="ex-edit" data-id="${e.id}" title="Edit exercise" aria-label="Edit ${esc(e.name)}">${icon('edit')}</button>` : ''}</div>`; }).join('')}
      <button class="ex-card ex-add" data-act="ex-new" data-group="${g === 'Rear delts' ? 'Shoulders' : g}" aria-label="Add a ${g.toLowerCase()} exercise"><span class="plus">${icon('plus')}</span><span>Add ${g === 'Rear delts' ? 'rear delt' : g.toLowerCase()} exercise</span></button></div></div>`; }).join('');
  const libCard = `<div class="card ${collCls('lib')}" data-coll="lib"><div class="card-h">${collHead('lib', 'Exercise library', `<span class="muted small">Hover for step-by-step form · switch exercises on or off · add your own with the + card</span>`)}</div><div class="coll-body">
      <div class="note" style="margin-bottom:14px">${icon('info')}<span>Switching an exercise off removes it from the rotation from this plan week on (next week if you’ve already logged it this week); past sessions keep what you did. Every muscle group keeps at least one exercise on — if every variation for a slot is off, the plan borrows another switched-on exercise for the same muscles. Research picks start switched off; hover one to see why it’s included.</span></div>${lib}</div></div>`;
  return `<div class="page-head"><div class="t"><h1>Workout plan</h1><p>A 90-day launch, then repeating 13-week cycles · ${S.settings.trainDays.length} training day${S.settings.trainDays.length === 1 ? '' : 's'} a week (change it below or in <a href="#/settings">Settings</a>) · Push / Pull / Legs — push and pull never share a session. Every muscle group rotates through 3+ exercise variations.</p></div></div>
    ${trainingDaysCardHTML(true)}<div style="height:16px"></div>
    <section class="${collCls('cycle1')}" data-coll="cycle1"><div class="coll-row">${collHead('cycle1', 'Cycle 1 · the 90-day launch')}</div><div class="coll-body"><div class="grid g4">${phaseCards}</div></div></section><div style="height:18px"></div>
    <section class="${collCls('cycle2')}" data-coll="cycle2"><div class="coll-row">${collHead('cycle2', 'Cycle 2 onward · repeats every 13 weeks', `<span class="pill">Next: ${fmtDate(cycleStartDate(2), { month: 'short', day: 'numeric', year: 'numeric' })}</span>`)}</div><div class="coll-body">
    <div class="grid g4">${contCards}</div>
    <div class="note" style="margin-top:12px">${icon('loop')}<span>Legs stay at full frequency from here on. The exercise rotation keeps counting week by week, so each new cycle pairs the variations differently. The calendar adds the next cycle automatically; the diet keeps adjusting from your weigh-ins and switches to maintenance when you hit your goal (changeable in Settings).</span></div></div></section><div style="height:16px"></div>
    <div class="g-half">
      <div class="card ${collCls('how')}" data-coll="how"><div class="card-h">${collHead('how', 'How the program works')}</div><div class="coll-body">
        <div class="small" style="display:grid;gap:10px">
          <div class="note">${icon('pull')}<span><b>Push / Pull / Legs.</b> Push days train chest, shoulders and triceps; pull days train back, rear delts and biceps; legs get their own day. Sessions are handed out in a rolling order across your training days, so it works with any number of days.</span></div>
          <div class="note">${icon('dumbbell')}<span><b>Isolation-first.</b> Machines, cables and dumbbells carry most of the volume. Compound lifts appear only in the “strength” slot of a session (stable machine/DB versions), which keeps joint stress and fatigue low while you’re in a calorie deficit.</span></div>
          <div class="note">${icon('loop')}<span><b>Variation rotation.</b> Each slot has 3 exercises that cycle weekly (Week 1 → A, Week 2 → B, Week 3 → C, repeat). Each variation comes back every 3 weeks — beat what you did last time on it. The B session of each pair uses a different variation from the A session. Swap any exercise with the ${icon('loop').replace('<svg', '<svg style="width:12px;height:12px;vertical-align:-2px"')} button — in a day’s session for that day only, or in the table below for the whole program.</span></div>
          <div class="note">${icon('trend')}<span><b>Double progression.</b> Work in the rep range at the target RIR. When every set hits the top of the range, add load (≈5 lb dumbbells/cables, 10 lb machines) and start again at the bottom.</span></div>
          <div class="note">${icon('flame')}<span><b>Effort waves.</b> RIR drops across each 4-week phase, then resets as the next phase changes the split. Every 13th week is a deload plus PR tests on the strength slots.</span></div>
        </div>
        <table class="tbl" style="margin-top:12px"><thead><tr><th>Week of phase</th><th>1</th><th>2</th><th>3</th><th>4</th></tr></thead><tbody>
          <tr><td>Hypertrophy sets (H)</td>${RIR.H.map(v => `<td>RIR ${v}</td>`).join('')}</tr><tr><td>Strength sets (S)</td>${RIR.S.map(v => `<td>RIR ${v}</td>`).join('')}</tr></tbody></table></div></div>
      <div class="card ${collCls('sets')}" data-coll="sets"><div class="card-h">${collHead('sets', 'Direct weekly sets by muscle', `<span class="pill">${S.settings.trainDays.length} days / week</span>`)}</div><div class="coll-body"><div class="small sub" style="margin:-6px 0 10px">Average sets per week with your current training days. Legs stay low in month 1, then rise to their full share.</div><div class="scroll-x">${heat}</div></div></div></div>
    <div style="height:16px"></div>
    ${libCard}
    <div style="height:16px"></div>
    <section class="${collCls('sessions')}" data-coll="sessions"><div class="coll-row" style="margin-bottom:12px">${collHead('sessions', 'Sessions & rotation', `<div class="seg">${ALL_PHASES.map(p => `<button class="${ph.key === p.key ? 'on' : ''}" data-act="plan-phase" data-v="${p.key}">${p.name}</button>`).join('')}</div>`)}</div>
    <div class="coll-body"><div class="tiny muted" style="margin:-4px 0 12px">Use ${icon('loop').replace('<svg', '<svg style="width:12px;height:12px;vertical-align:-2px"')} on any exercise to swap it in the program from this week on.</div>${sessions}</div></section>`;
}

/* ---------------- DIET ---------------- */
function viewDiet() {
  const st = S.settings; const cur = latestStats();
  const tT = targetsFor(cur.w, cur.bf, true), tR = targetsFor(cur.w, cur.bf, false);
  const A = computeAll(); const dates = planDates();
  const today = todayISO(); const ref = inPlan(today) ? today : dates[0];
  const nextT = dates.find(d => d >= ref && A.days[d].isTrain) || dates.find(d => A.days[d].isTrain);
  const nextR = dates.find(d => d >= ref && !A.days[d].isTrain) || dates.find(d => !A.days[d].isTrain);
  const trend = weightTrend(); const pj = projection();
  const weeklyAvg = Math.round((tT.kcal * st.trainDays.length + tR.kcal * (7 - st.trainDays.length)) / 7);
  const targets = `<div class="card"><div class="card-h"><h2>Your targets</h2>${tT.maintMode ? '<span class="pill acc">Goal reached · maintenance</span>' : ''}<span class="pill">${fmt(cur.w, 1)} lb · ${fmt(cur.bf, 1)}% BF${cur.est ? ' est.' : ''}</span></div>
    <div class="grid g4" style="gap:12px">
      <div class="card stat" style="box-shadow:none;background:var(--surface-2)"><div class="lbl">${icon('dumbbell')}Training day</div><div class="val">${fmt(tT.kcal)}<small>kcal</small></div><div class="delta neu">${fmt(tT.protein)} g protein</div></div>
      <div class="card stat" style="box-shadow:none;background:var(--surface-2)"><div class="lbl">${icon('moon')}Rest day</div><div class="val">${fmt(tR.kcal)}<small>kcal</small></div><div class="delta neu">${fmt(tR.protein)} g protein</div></div>
      <div class="card stat" style="box-shadow:none;background:var(--surface-2)"><div class="lbl">${icon('target')}Weekly average</div><div class="val">${fmt(weeklyAvg)}<small>kcal</small></div><div class="delta neu">−${fmt(tT.deficit)} kcal/day vs maintenance</div></div>
      <div class="card stat" style="box-shadow:none;background:var(--surface-2)"><div class="lbl">${icon('bolt')}Protein</div><div class="val">${fmt(st.proteinPerLb, 2)}<small>g/lb</small></div><div class="delta neu">range ${fmt(cur.w * 0.5)}–${fmt(cur.w)} g (0.5–1 g/lb)</div></div></div>
    <div class="scroll-x" style="margin-top:14px"><table class="tbl"><tbody>
      <tr><td>Lean body mass</td><td class="num">${fmt(cur.lbm, 1)} lb</td><td class="muted">weight × (1 − body-fat %)</td></tr>
      <tr><td>BMR (Katch–McArdle)</td><td class="num">${fmt(tT.bmr)} kcal</td><td class="muted">370 + 21.6 × lean mass (kg)</td></tr>
      <tr><td>Maintenance — rest / training</td><td class="num">${fmt(tR.maint)} / ${fmt(tT.maint)} kcal</td><td class="muted">BMR × ${st.activity} activity, + ${st.sessionKcal} kcal on lifting days</td></tr>
      <tr><td>${tT.bulking ? 'Surplus' : 'Deficit'}</td><td class="num">${fmt(tT.bulking ? tT.surplus : tT.deficit)} kcal/day</td><td class="muted">${tT.bfCap ? `At ${fmt(cur.bf, 1)}% body fat, at or above the ${st.bulkMaxBF}% ceiling — holding at maintenance` : tT.maintMode ? (goalKind() === 'maintain' ? 'Maintenance calories' : 'Goal reached — eating at maintenance (change in Settings)') : tT.bulking ? `${fmt(bulkLb(cur.w), 2)} lb/week × 3,500 kcal ÷ 7` : st.rate + ' lb/week × 3,500 kcal ÷ 7'}${st.kcalAdjust ? ` · adjustment ${st.kcalAdjust > 0 ? '+' : ''}${st.kcalAdjust} kcal` : ''}</td></tr>
    </tbody></table></div>
    <div class="small muted" style="margin-top:14px">Targets and every portion on the calendar update from your latest weigh-in.</div></div></div>`;
  const portion = (d, lbl) => { if (!d) return ''; const x = A.days[d]; return `<div class="card" style="box-shadow:none;background:var(--surface-2)"><div class="tiny muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.08em">${lbl} · ${fmtDate(d)}</div>
      <div class="row" style="margin-top:8px;gap:18px"><div><div class="tiny muted">Protein sources</div><div style="font-size:24px;font-weight:700" class="num">×${x.pF.toFixed(2)}</div></div><div><div class="tiny muted">Carb & fat sources</div><div style="font-size:24px;font-weight:700" class="num">×${x.cF.toFixed(2)}</div></div><div><div class="tiny muted">Day total</div><div style="font-size:24px;font-weight:700" class="num">${fmt(x.totals.k)}</div></div></div>
      <a class="btn sm" style="margin-top:10px" href="#/day/${d}">See scaled recipes ${icon('right')}</a></div>`; };
  const portions = `<div class="card"><div class="card-h"><h2>Serving-size suggestions</h2></div>
    <div class="small sub" style="margin:-6px 0 12px">Every recipe is written as a standard 1× serving. Each day, protein ingredients (chicken, eggs, yogurt…) are scaled to land your protein target, then carb & fat ingredients (rice, potatoes, oats, oils…) are scaled to land calories. Training days get more carbs.</div>
    <div class="grid g2" style="gap:12px">${portion(nextT, 'Next training day')}${portion(nextR, 'Next rest day')}</div>
    ${trend ? `<div class="note ${trend.delta ? 'warn' : 'acc'}" style="margin-top:12px">${icon('trend')}<span>${esc(trend.advice)} ${trend.delta ? `<button class="btn sm" data-act="apply-trend" data-delta="${trend.delta}">Apply ${trend.delta > 0 ? '+' : ''}${trend.delta} kcal</button>` : ''}</span></div>` : `<div class="note" style="margin-top:12px">${icon('info')}<span>After ~1–2 weeks of weigh-ins, the app compares what the scale actually did to your ${goalKind() === 'bulk' ? `${fmt(bulkLb(cur.w), 2)} lb/wk gain` : goalKind() === 'maintain' ? 'maintenance' : `${st.rate} lb/wk loss`} target and suggests a calorie adjustment.</span></div>`}
    ${goalKind() === 'maintain' ? '' : `<div class="note" style="margin-top:8px">${icon('target')}<span>At ${goalKind() === 'bulk' ? `${fmt(bulkLb(cur.w), 2)} lb/wk` : `${st.rate} lb/wk`} you’ll be around <b>${fmt(pj.endW, 0)} lb</b> ${pj.cyc === 1 ? 'on Day 90' : 'at the end of cycle ' + pj.cyc}${Math.abs(pj.weeks) > 0.01 ? ` and reach ${st.goalWeight} lb around <b>${fmtDate(pj.goalDate, { month: 'long', year: 'numeric' })}</b>` : ''}. Holding your lean mass, ${st.goalBF}% BF ≈ <b>${fmt(pj.wAtGoalBF, 0)} lb</b>.</span></div>`}</div>`;
  const goalLine = goalKind() === 'bulk' ? `A ${fmt(st.bulkPct, 2)}%/week lean gain with ${fmt(st.proteinPerLb, 2)} g protein per lb, the surplus weighted toward carbohydrate to fuel training.`
    : goalKind() === 'maintain' ? `Maintenance calories with ${fmt(st.proteinPerLb, 2)} g protein per lb.`
    : `A ${st.rate} lb/week cut with ${fmt(st.proteinPerLb, 2)} g protein per lb.`;
  return `<div class="page-head"><div class="t"><h1>Diet plan</h1><p>${goalLine} Meals are popular high-protein meal-prep staples; multi-serving recipes are scheduled as leftovers so nothing goes to waste.</p></div>${syncBtnHTML()}</div>
    ${bfEstimateNote()}${targets}<div style="height:16px"></div>${portions}<div style="height:16px"></div>
    <div style="height:16px"></div>
    <div class="grid g2">${lossRateCardHTML()}${bodyGoalsCardHTML()}<div style="grid-column:1/-1">${nutritionCardHTML()}</div></div>
    <div class="note" style="margin-top:12px">${icon('info')}<span>These are the same settings as on the Settings page — changing them here updates your targets and every portion on the calendar. Browse, favorite and edit recipes in <a href="#/foods">Foods &amp; recipes</a>.</span></div>`;
}
/* ---------- recipe details: popup, full page and print ---------- */
function recipeParts(rid) {
  const r = RECIPE[rid]; if (!r) return null; const m = RPS(rid);
  const rows = div => r.ing.map(([id, a]) => ({ id, name: ING[id].n, t: amountText(id, a / div) }));
  const list = rs => rs.map(x => `<span>${esc(x.name)}</span><span class="q">${x.t.main}${x.t.sub ? `<small>${x.t.sub}</small>` : ''}</span>`).join('');
  const roles = { P: 'protein', C: 'carb', F: 'fat', V: 'fixed' };
  return { r, m, per: rows(r.yield), batch: rows(1), list,
    meta: `${r.cat} · ${r.yield > 1 ? 'makes ' + r.yield : '1 serving'} · ${r.storage === 'freezer' ? 'freezer-friendly' : r.storage === 'fridge' ? 'keeps 4 days' : 'eat fresh'}${r.time ? ' · ' + r.time + ' min' : ''}`,
    tags: r.tags.map(t => `<span class="pill">${esc(t)}</span>`).join(''),
    macros: [['kcal', m.k, 'var(--kcal)'], ['Protein', m.p, 'var(--prot)'], ['Carbs', m.c, 'var(--carb)'], ['Fat', m.f, 'var(--fat)']].map(([l, v, c]) => `<div class="card" style="box-shadow:none;background:var(--surface-2);padding:12px"><div class="tiny muted">${l}${l !== 'kcal' ? ' (g)' : ''}</div><div style="font-size:22px;font-weight:700;border-left:3px solid ${c};padding-left:8px;margin-top:4px" class="num">${fmt(v)}</div></div>`).join(''),
    steps: r.steps.length ? `<ol class="rec-steps">${r.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : '<div class="tiny muted">No steps yet — add them with Edit recipe.</div>',
    scaling: `<div class="note" style="margin-top:10px">${icon('info')}<span>Portion scaling: ${r.fixed ? 'fixed portion (not scaled).' : r.ing.map(([id]) => `${ING[id].n.split(',')[0]} → ${roles[ING[id].r]}`).join(' · ')}</span></div>`,
    blocked: recipeAllowed(r) ? '' : `<span class="pill warn-pill">Blocked · ${esc(blockedBy(r).join(', '))}</span>` };
}
function recipeModal(rid) {
  const x = recipeParts(rid); if (!x) return; const r = x.r;
  modal(`<div class="row" style="align-items:flex-start"><div style="font-size:44px">${esc(r.emoji)}</div><div style="flex:1;min-width:0"><div class="tiny muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.08em">${x.meta}</div><h2 style="font-size:22px">${esc(r.name)}</h2>
    <div class="row wrap" style="margin-top:6px">${x.tags}</div></div>${favBtnHTML(rid, 'in-modal')}
    <button class="btn icon ghost" data-act="recipe-print" data-rid="${rid}" title="Print this recipe" aria-label="Print this recipe">${icon('print')}</button>
    <button class="btn icon ghost" data-act="recipe-expand" data-rid="${rid}" title="Open as a full page" aria-label="Open as a full page">${icon('expand')}</button>
    <button class="btn icon ghost" data-act="close-modal" title="Close" aria-label="Close">${icon('x')}</button></div>
    <div class="grid g4" style="gap:10px;margin:16px 0">${x.macros}</div>
    <div class="grid g2"><div><h3>Per standard serving</h3><div class="ing-list">${x.list(x.per)}</div></div>${r.yield > 1 ? `<div><h3>Full batch (${r.yield} servings)</h3><div class="ing-list">${x.list(x.batch)}</div></div>` : ''}</div>
    <h3 style="margin-top:16px">Method</h3>${x.steps}
    ${linksBlockHTML(r)}${x.scaling}
    <div class="row wrap" style="justify-content:flex-end;margin-top:14px;gap:6px">${x.blocked ? `<span style="margin-right:auto">${x.blocked}</span>` : ''}
      <button class="btn" data-act="recipe-dup" data-rid="${rid}">Duplicate</button><button class="btn primary" data-act="recipe-edit" data-rid="${rid}">${icon('edit')}Edit recipe</button></div>`);
}
let REC_FROM = '';                        // where "Back" goes from the full-page recipe
function viewRecipe(rid) {
  const x = recipeParts(rid);
  if (!x) return `<div class="page-head"><div class="t"><h1>Recipe not found</h1><p>It may have been deleted. <a href="#/foods">Back to Foods &amp; recipes</a></p></div></div>`;
  const r = x.r;
  return `<div class="page-head rec-head"><div class="t"><a class="rec-back" href="${esc(REC_FROM || '#/foods')}">${icon('left')}Back</a>
      <div class="tiny muted rec-kicker">${x.meta}</div><h1><span class="rec-emo">${esc(r.emoji)}</span>${esc(r.name)}</h1>${x.tags ? `<div class="row wrap" style="margin-top:8px">${x.tags}</div>` : ''}</div>
    <div class="row wrap">${x.blocked}${favBtnHTML(rid)}<button class="btn" data-act="recipe-print" data-rid="${rid}">${icon('print')}Print</button><button class="btn" data-act="recipe-dup" data-rid="${rid}">Duplicate</button><button class="btn primary" data-act="recipe-edit" data-rid="${rid}">${icon('edit')}Edit recipe</button></div></div>
    <div class="grid g4" style="gap:10px;margin-bottom:16px">${x.macros}</div>
    <div class="grid ${r.yield > 1 ? 'g2' : ''}" style="margin-bottom:16px"><div class="card"><div class="card-h"><h2>Per standard serving</h2></div><div class="ing-list">${x.list(x.per)}</div></div>
      ${r.yield > 1 ? `<div class="card"><div class="card-h"><h2>Full batch</h2><span class="pill">${r.yield} servings</span></div><div class="ing-list">${x.list(x.batch)}</div></div>` : ''}</div>
    <div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Method</h2></div>${x.steps}</div>
    <div class="card">${linksBlockHTML(r).replace('<h3 style="margin-top:16px">', '<h3 style="margin-top:0">')}${x.scaling}</div>`;
}
function recipePrintHTML(rid) {
  const x = recipeParts(rid); const r = x.r; const m = x.m;
  const table = rs => `<table>${rs.map(y => `<tr><td>${esc(y.name)}</td><td class="q">${y.t.main}${y.t.sub ? ` <small>${y.t.sub}</small>` : ''}</td></tr>`).join('')}</table>`;
  const links = (r.links || []).filter(l => l && l.url);
  return `<article class="pr">
    <div class="pr-meta">${esc(x.meta)}</div><h1><span>${esc(r.emoji)}</span> ${esc(r.name)}</h1>
    <div class="pr-mac">Per serving: <b>${fmt(m.k)}</b> kcal · <b>${fmt(m.p)} g</b> protein · <b>${fmt(m.c)} g</b> carbs · <b>${fmt(m.f)} g</b> fat</div>
    <div class="pr-cols"><section><h2>Per serving</h2>${table(x.per)}</section>${r.yield > 1 ? `<section><h2>Full batch · ${r.yield} servings</h2>${table(x.batch)}</section>` : ''}</div>
    ${r.steps.length ? `<section class="pr-steps"><h2>Method</h2><ol>${r.steps.map(y => `<li>${esc(y)}</li>`).join('')}</ol></section>` : ''}
    ${links.length ? `<section class="pr-links"><h2>Source</h2>${links.map(l => `<div>${esc(l.title || l.site || '')}${l.title ? ' — ' : ''}${esc(l.url)}</div>`).join('')}</section>` : ''}
    <footer>${esc(appTitle())} · printed ${esc(fmtDate(todayISO(), { month: 'short', day: 'numeric', year: 'numeric' }))} · amounts are one standard serving; your daily portions are sized to your targets in the app.</footer></article>`;
}
function printRecipe(rid) {
  if (!RECIPE[rid]) return;
  let el = $('#print-area'); if (!el) { el = document.createElement('div'); el.id = 'print-area'; document.body.appendChild(el); }
  el.innerHTML = recipePrintHTML(rid); document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); const a = $('#print-area'); if (a) a.remove(); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => { window.print(); setTimeout(() => { if (!window.matchMedia || !matchMedia('print').matches) done(); }, 500); }, 50);
}

/* ---------------- GROCERY & PREP ---------------- */
// everything the shopping list and the prep schedule need for the selected week (Grocery page, and on phones the List and Prep tabs)
function groceryWeek() {
  const A = computeAll(); const dates = planDates();
  const cur = inPlan(todayISO()) ? planWeek(todayISO()) : 1;
  if (!UI.groWeek) UI.groWeek = cur;
  const wk = Math.min(UI.groWeek, Math.ceil(dates.length / 7)); const wd = dates.slice((wk - 1) * 7, wk * 7);
  const totals = {}; const cooks = []; const singles = [];
  wd.forEach(d => A.days[d].meals.forEach(m => {
    const b = A.batches.info[d + '|' + m.slot];
    if (b && b.role === 'leftover') return;
    if (b && b.role === 'cook') { cooks.push({ d, m, b }); Object.entries(b.batch.amounts).forEach(([id, a]) => totals[id] = (totals[id] || 0) + a); }
    else { singles.push({ d, m }); m.items.forEach(it => totals[it.id] = (totals[it.id] || 0) + it.amt); if (m.partner) m.partner.items.forEach(([id, a]) => totals[id] = (totals[id] || 0) + a); }
  }));
  const carried = []; wd.forEach(d => A.days[d].meals.forEach(m => { const b = A.batches.info[d + '|' + m.slot]; if (b && b.role === 'leftover' && b.batch.cook < wd[0]) carried.push({ d, m, b }); }));
  const got = syncActive() ? ((SY.data.grocery || {})[wd[0]] || {}) : ((S.grocery = S.grocery || {})['w' + wk] || {});
  const GL = groceryRows(A, wd, totals);
  GRO_ROWS = { rows: GL.rows, week: wd[0], wk };
  const nW = Math.ceil(dates.length / 7);
  const opts = Array.from({ length: nW }, (_, i) => `<option value="${i + 1}" ${wk === i + 1 ? 'selected' : ''}>Week ${i + 1} · ${fmtDate(dates[i * 7], { month: 'short', day: 'numeric' })} – ${fmtDate(dates[Math.min(dates.length - 1, i * 7 + 6)], { month: 'short', day: 'numeric' })}${phaseForWeek(i + 1).cycle > 1 ? ' · cycle ' + phaseForWeek(i + 1).cycle : ''}</option>`).join('');
  return { A, dates, wk, wd, totals, cooks, singles, carried, got, GL, opts };
}
function prepScheduleHTML(G) {
  const { cooks, singles, carried } = G;
  const cookRows = cooks.slice().sort((a, b) => a.d < b.d ? -1 : 1).map(({ d, m, b }) => { const dd = parseISO(d); const prep = addDays(d, -1);
    return `<div class="prep-row"><div class="d"><span>${DOW[dd.getDay()]}</span><b>${dd.getDate()}</b></div><div style="flex:1;min-width:0"><div class="row"><span style="font-size:20px">${esc(m.r.emoji)}</span><b>${esc(m.r.name)}</b><span class="bd cook">COOK ×${b.batch.size}</span>${b.batch.partnerServ ? `<span class="bd shr" data-tip="${b.batch.size - b.batch.partnerServ} for you · ${b.batch.partnerServ} for ${esc(syncName())}">${icon('users')}${b.batch.partnerServ}</span>` : ''}</div>
      <div class="small sub" style="margin-top:3px">Eat: ${b.batch.members.map(o => fmtDate(o.date, { weekday: 'short' }) + ' ' + SLOT_LABEL[o.slot].toLowerCase()).join(' · ')}${m.r.storage === 'freezer' ? ' · freeze extras' : ''}</div>
      <div class="tiny muted">Prep ${fmtDate(prep, { weekday: 'long' })} evening or ${fmtDate(d, { weekday: 'long' })} morning · ~${m.r.time} min${b.batch.size < m.r.yield ? ` · recipe scaled to ${Math.round(b.batch.scale * 100)}%` : ''}</div></div></div>`; }).join('') || '<div class="muted small">No batch cooking this week.</div>';
  const singleSummary = {}; singles.forEach(({ m }) => singleSummary[m.r.id] = (singleSummary[m.r.id] || 0) + 1);
  return `<div class="card"><div class="card-h"><h2>Batch-cook schedule</h2></div>${cookRows}
        ${carried.length ? `<div class="note" style="margin-top:12px">${icon('loop')}<span>Carried over from last week (already cooked): ${[...new Set(carried.map(c => c.m.r.name))].map(esc).join(', ')}.</span></div>` : ''}</div>
        <div style="height:16px"></div><div class="card"><div class="card-h"><h2>Cook-fresh meals</h2></div>
        <div class="row wrap" style="gap:6px">${Object.entries(singleSummary).map(([id, n]) => `<span class="pill">${esc(RECIPE[id].emoji)} ${esc(RECIPE[id].name)}${n > 1 ? ' ×' + n : ''}</span>`).join('') || '<span class="muted small">None</span>'}</div></div>`;
}
function viewGrocery() {
  const G = groceryWeek(); if (isPhone()) return groceryPhoneHTML(G);
  const { A, dates, wk, wd, totals, got, GL, opts } = G;
  const unitOf = id => ING[id].u ? ING[id].u + 's' : ING[id].ml ? 'ml' : 'g';
  const aisles = {}; GL.rows.forEach(r => { const ai = ING[r.id].a; (aisles[ai] = aisles[ai] || []).push(r); });
  const order = AISLES.concat(Object.keys(aisles).filter(a => !AISLES.includes(a)));
  // everything stays on the list; what the pantry covers starts ticked with a pantry note, so a pantry that's behind can't hide an item
  const list = order.filter(a => aisles[a]).map(a => `<div class="gro-aisle"><h3>${a}</h3>${aisles[a].sort((x, y) => ING[x.id].n.localeCompare(ING[y.id].n)).map(r => { const { id, total, have } = r; const g = groceryText(id, total);
    const pi = packInfo(id); const npk = Math.ceil(total / pi.P - 1e-9); const pkTxt = pi.w >= .3 && pi.P > 1 ? `<small class="pk" title="Typical package: ${fmt(pi.P)} ${unitOf(id)} — edit it on the food">≈ ${npk} pack${npk === 1 ? '' : 's'}</small>` : '';
    const st = groRowState(r, got);
    const panTxt = st.covered ? `<small class="pan-have full" title="Your pantry has enough — untick it if you still need to buy it">${icon('box')}In your pantry${have > total * 1.01 ? ` · ${esc(pantryQtyText(id, have))}` : ''}</small>` : have > 0 ? `<small class="pan-have" title="Your pantry has some of this">${icon('box')}${esc(pantryQtyText(id, have))} at home</small>` : '';
    return `<label class="gro-item ${st.checked ? 'got' : ''} ${st.covered ? 'pan' : ''}"><input type="checkbox" data-input="gro" data-id="${id}" ${st.covered ? 'data-pan="1"' : ''} ${st.checked ? 'checked' : ''}><span>${esc(g.name)}${st.covered ? `<span class="gro-pan-ic" title="In your pantry">${icon('box')}</span>` : ''}</span><span class="q">${g.qty}${g.sub ? `<small>${g.sub}</small>` : ''}${pkTxt}${panTxt}</span></label>`; }).join('')}</div>`).join('');
  const T = groTools(GL.rows, got); const nAll = GL.rows.length;
  return `<div class="page-head"><div class="t"><h1>Grocery & meal prep</h1><p>Quantities are summed from the exact scaled portions on your calendar — including leftovers — for the selected week.</p></div>
      <div class="row wrap">${syncBtnHTML()}<select class="inp" data-input="gro-week">${opts}</select><button class="btn" data-act="copy-list">${icon('list')}Copy list</button><button class="btn" data-act="print">Print</button></div></div>
    ${syncGroceryNote(wd, A)}
    ${moneySaverHTML(wd)}<div style="height:16px"></div>
    <div class="g-half">
      <div>${prepScheduleHTML(G)}</div>
      <div class="card"><div class="card-h"><h2>Shopping list</h2><span class="muted small">${nAll} item${nAll === 1 ? '' : 's'} · tap to check off</span></div>
        ${nAll ? `<div class="row wrap gro-tools"><button class="btn sm" data-act="gro-all" data-v="1" ${T.checked === nAll ? 'disabled' : ''}>${icon('check')}Check all</button><button class="btn sm" data-act="gro-all" data-v="0" ${T.checked ? '' : 'disabled'}>${icon('x')}Uncheck all</button><button class="btn sm primary" data-act="gro-pantry" ${T.add ? '' : 'disabled'} title="Put the items you ticked in the pantry and clear their ticks">${icon('box')}Add checked to pantry${T.add ? ` (${T.add})` : ''}</button></div>` : ''}
        ${GL.note}${list || '<div class="muted">Nothing planned this week.</div>'}
        <div class="tiny muted" style="margin-top:10px">Rice & quinoa are listed uncooked (~⅓ of cooked weight). Seasonings, garlic, lemon/lime and cooking spray aren’t listed.</div></div></div>`;
}

/* ---------------- money saver: ingredient sharing ---------------- */
function moneySaverHTML(wd) {
  const on = S.settings.shareIngredients !== false;
  const pick = M => Object.fromEntries(wd.map(d => [d, M[d] || {}]));
  const sim = simulateMeals(!on); const real = days => Object.fromEntries(days.map(d => [d, (S.plan[d] || {}).m || {}]));
  const actual = shoppingStats(real(wd));
  const other = shoppingStats(pick(sim));
  const dPk = other.packs - actual.packs, dIt = other.items - actual.items, dLb = (other.leftG - actual.leftG) / 453.6;
  // the next 4 plan weeks from the selected one
  const all = planDates(); const i0 = all.indexOf(wd[0]); let pk4 = 0, n4 = 0;
  for (let w = 0; w < 4; w++) { const days = all.slice(i0 + w * 7, i0 + w * 7 + 7); if (days.length < 7) break; n4++;
    const a = shoppingStats(real(days)), o = shoppingStats(Object.fromEntries(days.map(d => [d, sim[d] || {}]))); pk4 += on ? o.packs - a.packs : a.packs - o.packs; }
  const good = dPk > 0 || dIt > 0;
  const headline = on
    ? (good ? `Sharing ingredients saves about <b>${Math.max(0, dPk)} fresh package${dPk === 1 ? '' : 's'}</b>${dIt > 0 ? ` and <b>${dIt} item${dIt === 1 ? '' : 's'}</b>` : ''} this week${dLb > 0.2 ? `, and less fresh food left sitting in opened packages` : ''}.` : `This week already lines up well — the plain rotation wouldn’t need fewer packages.`)
    : (dPk < 0 || dIt < 0 ? `Turning ingredient sharing on would save about <b>${Math.max(0, -dPk)} fresh package${-dPk === 1 ? '' : 's'}</b>${-dIt > 0 ? ` and <b>${-dIt} item${-dIt === 1 ? '' : 's'}</b>` : ''} this week.` : `Ingredient sharing is off.`);
  const chips = actual.shared.filter(x => packInfo(x.id).w >= .3).slice(0, 10).map(x => `<span class="pill share-chip" data-tip="${esc(x.recipes.map(r => RECIPE[r] ? RECIPE[r].name : r).join(' · '))}">${esc(ING[x.id].n.split(',')[0])} <b>×${x.n}</b></span>`).join('');
  const sum = on ? (dPk > 0 ? `−${dPk} package${dPk === 1 ? '' : 's'} this week` : 'on') : 'off';
  return `<div class="card money ${collCls('money')}" data-coll="money"><div class="card-h">${collHead('money', `${icon('target')}Money saver`, `<span class="pill coll-sum">${sum}</span>`)}
      <label class="share-tog" title="Plan meals so recipes in the same week share ingredients"><span class="small">Share ingredients between recipes</span>${`<input type="checkbox" data-input="share" ${on ? 'checked' : ''}>`}<i class="switch ${on ? 'on' : ''}" aria-hidden="true"><i></i></i></label></div><div class="coll-body">
    <div class="grid g4" style="gap:10px">
      <div class="ms-stat"><span class="tiny muted">Items to buy</span><b class="num">${actual.items}</b><span class="tiny ${dIt > 0 ? 'good' : 'muted'}">${on ? (dIt > 0 ? `−${dIt} vs plain rotation` : 'same as plain rotation') : (dIt < 0 ? `${-dIt} fewer with sharing` : '')}</span></div>
      <div class="ms-stat"><span class="tiny muted">Fresh packages</span><b class="num">${actual.packs}</b><span class="tiny ${dPk > 0 ? 'good' : 'muted'}">${on ? (dPk > 0 ? `−${dPk} vs plain rotation` : 'same as plain rotation') : (dPk < 0 ? `${-dPk} fewer with sharing` : '')}</span></div>
      <div class="ms-stat"><span class="tiny muted">Ingredients in 2+ recipes</span><b class="num">${actual.shared.filter(x => packInfo(x.id).w >= .3).length}</b><span class="tiny muted">fresh foods bought once, used twice</span></div>
      <div class="ms-stat"><span class="tiny muted">Next ${n4} weeks</span><b class="num">${on ? (pk4 > 0 ? '−' + pk4 : '0') : (pk4 < 0 ? -pk4 : '0')}<small> packages</small></b><span class="tiny ${on && pk4 > 0 ? 'good' : 'muted'}">${on ? 'fewer fresh packages than the plain rotation' : 'you could save with sharing on'}</span></div></div>
    <div class="note ${on && good ? 'acc' : ''}" style="margin-top:12px">${icon('info')}<span>${headline}</span></div>
    ${chips ? `<div class="row wrap" style="gap:6px;margin-top:10px"><span class="tiny muted">Shared this week:</span>${chips}</div>` : ''}
    <details class="formula"><summary>How the formula works</summary>
      <p>When meals are planned, each slot looks at the <b>next 3 recipes</b> in its rotation and picks the one with the best <b>shopping score</b> against everything already on that week’s list:</p>
      <div class="eq">score = Σ<sub>ingredients</sub> w × ( min(a, R) ÷ P − ⌈ max(0, a − R) ÷ P ⌉ ) ÷ servings</div>
      <ul><li><b>a</b> — how much of the ingredient the recipe needs (the whole batch for batch recipes)</li>
        <li><b>R</b> — what’s left in packages you’re already buying that week</li>
        <li><b>P</b> — the typical package size (edit it on any food)</li>
        <li><b>w</b> — how fast it spoils: fresh meat, fish, greens ≈ 1 · eggs, peppers ≈ 0.5 · frozen ≈ 0.3 · rice, pasta, canned ≈ 0.05 · spices and oils 0</li></ul>
      <p>A recipe that finishes the half-bag of spinach you already need scores high; one that needs a new pack of something perishable scores low. No recipe waits more than two turns, so variety and your ★ favorites stay the same — only the order within the week changes. Meals you placed by hand are never moved. Numbers here use standard servings; the list below uses your scaled portions.</p></details></div></div>`;
}

/* ---------------- PROGRESS ---------------- */
function progRange() { const t = todayISO(); const all = sortedWeights(); const first = all.length ? minISO(all[0].d, S.settings.startDate) : S.settings.startDate; return UI.prRange === '14' ? { key: '14', from: addDays(t, -13), to: t, label: 'in 2 weeks' } : { key: 'all', from: first, to: null, label: 'since the start' }; }
const minISO = (a, b) => a < b ? a : b;
// plan line: from the first weigh-in (or the start) at the target loss rate
function planLine() { const ws = sortedWeights(); const st = S.settings; const s0 = ws.length && ws[0].d < st.startDate ? ws[0].d : st.startDate; const w0 = ws.length && ws[0].d < st.startDate ? ws[0].w : st.startWeight;
  const r = planRate(w0); return { s0, w0, rate: r, at: d => w0 + r * dayDiff(s0, d) / 7 }; }
function rateOver(from) { const ws = sortedWeights().filter(x => x.d >= from); if (ws.length < 3 || dayDiff(ws[0].d, ws[ws.length - 1].d) < 7) return null; const lr = linreg(ws.map(x => [dayDiff(from, x.d), x.w])); return lr ? -lr.m * 7 : null; }
function consistencyHTML() {
  const t = todayISO(); const mon = mondayOf(t); const weeks = [];
  for (let k = 3; k >= 0; k--) { const m = addDays(mon, -7 * k); const days = Array.from({ length: 7 }, (_, i) => addDays(m, i)).filter(d => inPlan(d) && S.plan[d] && S.plan[d].w); if (days.length) weeks.push([m, days]); }
  if (!weeks.length) return '';
  const state = d => { const rows = sessionRows(S.plan[d].w); const did = S.done[d] || loggedSets(d, rows).done > 0; return did ? 'done' : d < t ? 'miss' : d === t ? 'today' : 'next'; };
  const cells = weeks.map(([m, days]) => `<span class="cons-wk">${esc(fmtDate(m, { month: 'short', day: 'numeric' }))}</span><span class="cons-row">${days.map(d => { const s = state(d); const dw = DOW[parseISO(d).getDay()];
    return `<a class="cons-c ${s}" href="#/day/${d}" aria-label="${esc(fmtDate(d, { weekday: 'long', month: 'short', day: 'numeric' }))}: ${{ done: 'done', miss: 'missed', today: 'today', next: 'coming up' }[s]}">${s === 'done' ? icon('check') : s === 'miss' ? icon('x') : ''}${dw}${s === 'today' ? ' · today' : ''}</a>`; }).join('')}</span>`).join('');
  const past = weeks.flatMap(w => w[1]).filter(d => d <= t); const done = past.filter(d => state(d) === 'done').length; const miss = past.filter(d => state(d) === 'miss').length;
  return `<div class="card"><div class="card-h"><h2>Consistency</h2><span class="pill ${miss ? '' : 'acc'} num">${done} of ${past.length} done${miss ? ` · ${miss} missed` : ''}</span></div><div class="cons">${cells}</div>
    <div class="tiny muted" style="margin-top:10px">The last four weeks of planned sessions. ${icon('check')} done · ${icon('x')} missed — a session counts once you log a set or mark it complete. Tap a day to open it.</div></div>`;
}
function viewProgress() {
  const ws = sortedWeights(); const st = S.settings; const cur = latestStats(); const phone = isPhone(); const R = progRange();
  const logged = allLoggedExercises();
  if (!UI.prEx || !logged.includes(UI.prEx)) UI.prEx = logged[0] || null;
  const board = logged.map(ex => { const h = exerciseHistory(ex); const best = h.reduce((a, x) => x.best > a.best ? x : a, h[0]); const first = h[0];
    return { ex, h, best, first, gain: best.best - first.best }; }).sort((a, b) => EX[a.ex].group.localeCompare(EX[b.ex].group) || EX[a.ex].name.localeCompare(EX[b.ex].name));
  const hist = ws.slice().reverse().map(x => { const lbm = x.bf != null && x.bf !== '' ? x.w * (1 - x.bf / 100) : null;
    return `<tr><td>${fmtDate(x.d, { weekday: 'short', month: 'short', day: 'numeric', year: phone ? undefined : 'numeric' })}</td><td class="num"><b>${fmt(x.w, 1)}</b> lb</td><td class="num">${x.bf != null && x.bf !== '' ? fmt(x.bf, 1) + '%' : '<span class="muted">—</span>'}</td><td class="num">${lbm ? fmt(lbm, 1) + ' lb' : '<span class="muted">—</span>'}</td><td style="text-align:right"><button class="btn sm ghost danger" data-act="del-weight" data-d="${x.d}" aria-label="Delete the ${esc(fmtDate(x.d))} weigh-in">${icon('trash')}</button></td></tr>`; }).join('');
  const sel = logged.length ? `<select class="inp" data-input="pr-ex" aria-label="Exercise">${['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'].map(g => { const xs = logged.filter(e => EX[e].group === g); return xs.length ? `<optgroup label="${g}">${xs.map(e => `<option value="${e}" ${UI.prEx === e ? 'selected' : ''}>${esc(EX[e].name)}</option>`).join('')}</optgroup>` : ''; }).join('')}</select>` : '';
  const sessRows = UI.prEx ? exerciseHistory(UI.prEx).slice().reverse().map(h => `<tr><td>${fmtDate(h.d)}</td><td>${h.sets.map(s => `${fmt(+s.w, 1)}×${s.r}`).join(', ')}</td><td class="num">${isBW(UI.prEx) ? h.best + ' reps' : fmt(h.best)}</td><td class="num">${fmt(h.vol)}</td><td>${h.pr ? `<span class="prb">${icon('trophy')}PR</span>` : ''}</td></tr>`).join('') : '';
  const exOpts = Object.values(EX).sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name)).map(e => `<option value="${e.id}">${e.group} — ${esc(e.name)}</option>`).join('');
  // tiles: now, and the change over the chosen range
  const before = R.key === 'all' ? { w: st.startWeight, bf: st.startBF, lbm: st.startWeight * (1 - st.startBF / 100) } : statsOn(addDays(R.from, -1));
  const sign = (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '±') + fmt(Math.abs(v), d);
  const rate = R.key === '14' ? rateOver(R.from) : (weightTrend() || {}).rate; const hasW = ws.length > 0;
  const dW = cur.w - before.w, dB = cur.bf - before.bf, dL = cur.lbm - before.lbm;
  const tile = (lbl, val, unit, delta, good) => `<div class="card stat ptile"><div class="lbl">${lbl}</div><div class="val">${val}<small>${unit}</small></div><div class="delta ${delta == null ? 'neu' : good ? 'good' : 'bad'}">${delta == null ? '&nbsp;' : delta}</div></div>`;
  const tiles = `<div class="grid g4 ptiles">${tile('Weight', fmt(cur.w, 1), 'lb', hasW ? `${sign(dW)} lb ${R.label}` : null, dW <= 0)}${tile('Body fat', fmt(cur.bf, 1), '%' + (cur.est ? ' est.' : ''), hasW ? `${sign(dB)} pts ${R.label}` : null, dB <= 0)}
    ${tile('Lean mass', fmt(cur.lbm, 1), 'lb', hasW ? `${sign(dL)} lb · ${dL >= -1 ? 'holding' : 'dropping'}` : null, dL >= -1)}${tile('Weekly trend', rate != null ? sign(-rate, 2) : '—', 'lb/wk', goalKind() === 'maintain' ? 'Plan: hold' : `Plan ${sign(planRate(cur.w), 2)} lb/wk`, true).replace('delta good', 'delta neu')}</div>`;
  // where the 7-day average sits against the plan line, and when the goal lands at this pace
  let pace = '';
  if (ws.length > 1) {
    const last = ws[ws.length - 1]; const avg = movingAvg(ws).slice(-1)[0].v; const gap = planLine().at(last.d) - avg;
    const lr = rate != null && rate > 0.05 ? rate : null; const when = lr ? addDays(last.d, Math.round(Math.max(0, cur.w - st.goalWeight) / lr * 7)) : null;
    const bulking = goalKind() === 'bulk'; const ahead = bulking ? gap < 0 : gap > 0;   // "ahead" is up when bulking, down when cutting
    const moved = lr == null ? '' : bulking ? `Gaining <b>${fmt(-lr, 2)} lb/week</b> (plan ${fmt(planRate(cur.w), 2)}). ` : goalKind() === 'maintain' ? `Scale moving <b>${sign(-lr, 2)} lb/week</b> (plan: hold). ` : `Losing <b>${fmt(lr, 2)} lb/week</b> (plan ${fmt(st.rate, 2)}). `;
    pace = `<div class="note ${Math.abs(gap) <= 0.3 || ahead ? 'acc' : 'warn'}" style="margin-top:12px">${icon('trend')}<span>${moved}The 7-day average is ${Math.abs(gap) <= 0.3 ? '<b>on the plan line</b>' : `<b>${fmt(Math.abs(gap), 1)} lb ${gap > 0 ? 'above' : 'below'}</b> the plan`}.${when && (bulking ? cur.w < st.goalWeight : cur.w > st.goalWeight) ? ` At this pace you reach ${st.goalWeight} lb around <b>${esc(fmtDate(when, { month: 'long', year: 'numeric' }))}</b>.` : ''}</span></div>`;
  }
  const range = `<div class="seg prange" role="group" aria-label="Time range">${[['all', 'Since day 1'], ['14', 'Last 2 weeks']].map(([k, l]) => `<button class="${R.key === k ? 'on' : ''}" data-act="pr-range" data-v="${k}" aria-pressed="${R.key === k}">${l}</button>`).join('')}</div>`;
  const weighCard = phone ? '' : `<div class="card"><div class="card-h"><h2>Log a weigh-in</h2></div>${weighForm()}<div class="tiny muted" style="margin-top:8px">Weigh in first thing in the morning, after the bathroom, 3–7× a week. Body fat is optional — when it’s blank, the app estimates it by holding your last measured lean mass.</div></div><div style="height:16px"></div>`;
  return `<div class="page-head"><div class="t">${phone ? `<a class="back-lnk" href="#/you">${icon('left')}You</a>` : ''}<h1>Progress</h1><p>Body weight, body fat and strength — logged here or from each day’s workout.</p></div><div class="row wrap">${range}${phone ? `<button class="btn primary" data-act="weigh-sheet">${icon('scale')}Log weight</button>` : ''}</div></div>
    ${weighCard}${tiles}<div style="height:16px"></div>
    <div class="card"><div class="card-h"><h2>Body weight</h2><div class="legend"><span><i class="dt" style="background:var(--muted)"></i>Weigh-in</span><span><i style="background:var(--prot)"></i>7-day average</span><span><i style="background:var(--accent-2)"></i>Plan (${goalKind() === 'maintain' ? 'hold' : sign(planRate(), 2) + ' lb/wk'})</span></div></div><div class="chart" id="ch-weight"></div>${pace}</div>
    <div style="height:16px"></div>
    <div class="grid g2 pduo"><div class="card"><div class="card-h"><h2>Body fat %</h2></div><div class="chart" id="ch-bf"></div></div><div class="card"><div class="card-h"><h2>Lean mass</h2></div><div class="chart" id="ch-lbm"></div></div></div>
    <div class="tiny muted" style="margin-top:8px">Body fat comes from the weigh-ins where you entered it; lean mass is weight × (1 − body fat). Holding lean mass while the scale drops is the goal of a cut.</div>
    <div style="height:16px"></div>${consistencyHTML()}
    <div style="height:24px"></div><div class="row wrap" style="margin-bottom:12px"><h2 style="flex:1">Strength PRs</h2></div>
    <div class="g-split">
      <div class="card"><div class="card-h"><h2>Estimated 1-rep max</h2>${sel}</div>${UI.prEx ? `<div class="small sub" style="margin:-6px 0 8px"><span data-tip-ex="${UI.prEx}" class="ex-name">${esc(EX[UI.prEx].name)}</span> · best set each session (Epley: weight × (1 + reps/30)). Gold dots are PRs.</div>` : ''}<div class="chart" id="ch-pr"></div>
        ${UI.prEx ? `<div class="scroll-x" style="margin-top:12px;max-height:260px;overflow-y:auto"><table class="tbl"><thead><tr><th>Date</th><th>Sets (lb×reps)</th><th>e1RM</th><th>Volume</th><th></th></tr></thead><tbody>${sessRows}</tbody></table></div>` : ''}</div>
      <div class="card"><div class="card-h"><h2>PR board</h2></div>
        ${board.length ? `<div class="scroll-x" style="max-height:420px;overflow-y:auto"><table class="tbl"><thead><tr><th>Exercise</th><th>Best set</th><th>e1RM</th><th>Since first</th></tr></thead><tbody>${board.map(b => `<tr><td><span class="ex-name" data-tip-ex="${b.ex}">${esc(EX[b.ex].name)}</span><div class="tiny muted">${EX[b.ex].group} · ${b.h.length} session${b.h.length > 1 ? 's' : ''}</div></td><td>${b.best.bestSet ? fmt(+b.best.bestSet.w, 1) + '×' + b.best.bestSet.r : ''}<div class="tiny muted">${fmtDate(b.best.d)}</div></td><td class="num"><b>${isBW(b.ex) ? b.best.best + ' reps' : fmt(b.best.best)}</b></td><td class="num ${b.gain > 0 ? '' : 'muted'}" style="${b.gain > 0 ? 'color:var(--good);font-weight:700' : ''}">${b.gain > 0 ? '+' + fmt(b.gain) : '—'}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty-state">${icon('trophy')}<div>Log sets in a workout (or below) to build your PR board.</div></div>`}
        <hr class="sep"><h3 style="margin-bottom:8px">Quick log a set</h3>
        <form data-form="quicklog" class="grid" style="grid-template-columns:1fr 1fr;gap:8px">
          <div class="field" style="grid-column:1/-1"><label>Exercise</label><select class="inp" name="ex">${exOpts}</select></div>
          <div class="field"><label>Date</label><input class="inp" type="date" name="d" value="${todayISO()}"></div><div class="field"><label>Weight (lb)</label><input class="inp" type="number" step="2.5" name="w" required></div>
          <div class="field"><label>Reps</label><input class="inp" type="number" name="r" min="1" required></div><div class="field" style="justify-content:flex-end"><button class="btn primary" type="submit">${icon('plus')}Add set</button></div></form></div></div>
    <div style="height:16px"></div>
    <div class="card"><div class="card-h"><h2>Weigh-in history</h2><span class="muted small">${ws.length} entries</span></div>${ws.length ? `<div class="scroll-x" style="max-height:340px;overflow-y:auto"><table class="tbl"><thead><tr><th>Date</th><th>Weight</th><th>Body fat</th><th>Lean mass</th><th></th></tr></thead><tbody>${hist}</tbody></table></div>` : `<div class="empty-state">${icon('scale')}<div>No weigh-ins yet.</div></div>`}</div>`;
}
function progressCharts() {
  const ws = sortedWeights(); const st = S.settings; const R = progRange(); const phone = isPhone();
  const cs = getComputedStyle(document.documentElement); const col = v => cs.getPropertyValue(v).trim();
  const inR = x => x.d >= R.from && (!R.to || x.d <= R.to);
  const PL = planLine(); const planPts = [];
  if (ws.length) { if (R.key === '14') { planPts.push({ d: R.from, v: PL.at(R.from) }, { d: R.to, v: PL.at(R.to) }); }
    else { const e0 = phone ? minISO(projection().endPlan, addDays(maxISO(todayISO(), ws[ws.length - 1].d), 14)) : projection().endPlan; for (let i = 0; i <= dayDiff(PL.s0, e0); i += 7) planPts.push({ d: addDays(PL.s0, i), v: PL.at(addDays(PL.s0, i)) }); planPts.push({ d: e0, v: PL.at(e0) }); } }
  const wIn = ws.filter(inR); const avg = movingAvg(ws).filter(inR);
  lineChart($('#ch-weight'), { h: phone ? 220 : 280, empty: 'Log a weigh-in to start your chart', unit: '', label: 'Body weight', xMin: R.key === '14' ? R.from : undefined, xMax: R.key === '14' ? R.to : undefined,
    refs: [{ v: st.goalWeight, label: 'Goal ' + st.goalWeight + ' lb', color: col('--good'), inRange: false }],
    series: wIn.length ? [{ label: 'Plan', color: col('--accent-2'), pts: planPts, width: 1.5, muted: true, fmt: v => fmt(v, 1) + ' lb' }, { label: 'Weigh-in', color: col('--muted'), pts: wIn.map(x => ({ d: x.d, v: x.w })), line: false, dots: true, r: 3.5, fmt: v => fmt(v, 1) + ' lb' }, { label: '7-day avg', color: col('--prot'), pts: avg.map(x => ({ d: x.d, v: x.v })), fmt: v => fmt(v, 1) + ' lb' }] : [] });
  const bfPts = ws.filter(x => x.bf != null && x.bf !== '' && inR(x)).map(x => ({ d: x.d, v: +x.bf }));
  lineChart($('#ch-bf'), { h: phone ? 170 : 220, empty: 'Add body-fat % to a weigh-in to chart it', unit: '%', label: 'Body fat', refs: [{ v: st.goalBF, label: 'Goal ' + st.goalBF + '%', color: col('--good'), inRange: false }], series: bfPts.length ? [{ label: 'Body fat', color: col('--kcal'), pts: bfPts, dots: true, area: true, fmt: v => fmt(v, 1) + '%' }] : [] });
  const lPts = ws.filter(x => x.bf != null && x.bf !== '' && inR(x)).map(x => ({ d: x.d, v: x.w * (1 - x.bf / 100) }));
  lineChart($('#ch-lbm'), { h: phone ? 170 : 220, empty: 'Lean mass appears when body-fat % is logged', unit: '', label: 'Lean mass', series: lPts.length ? [{ label: 'Lean mass', color: col('--carb'), pts: lPts, dots: true, area: true, fmt: v => fmt(v, 1) + ' lb' }] : [] });
  if ($('#ch-pr')) { const h = UI.prEx ? exerciseHistory(UI.prEx) : [];
    lineChart($('#ch-pr'), { h: phone ? 210 : 240, empty: 'No strength logs yet', unit: '', label: 'Estimated one-rep max', series: h.length ? [{ label: isBW(UI.prEx) ? 'Best reps' : 'e1RM', color: col('--prot'), pts: h.map(x => ({ d: x.d, v: x.best, pr: x.pr, note: x.bestSet ? `${x.bestSet.w}×${x.bestSet.r}` : '' })), dots: true, fmt: v => fmt(v, 0) + (isBW(UI.prEx) ? ' reps' : ' lb') }] : [] }); }
}

/* ---------------- SETTINGS ---------------- */
function rateInfoHTML(rate) {
  const st = S.settings; const cur = latestStats(); const pct = rate / cur.w * 100;
  const tT = targetsFor(cur.w, cur.bf, true), tR = targetsFor(cur.w, cur.bf, false);
  const deficit = Math.round(rate * 500); const weeks = Math.max(0, cur.w - st.goalWeight) / rate;
  const when = addDays(maxISO(todayISO(), st.startDate), Math.round(weeks * 7));
  const flag = pct > 1 ? `<div class="note warn" style="margin-top:8px">${icon('info')}<span>That’s ${fmt(pct, 1)}% of your body weight per week — above the ~1%/week where muscle loss and training quality usually start to suffer.</span></div>` : '';
  return `<div class="grid g3" style="gap:10px"><div><div class="tiny muted">Daily deficit</div><b class="num" style="font-size:18px">−${fmt(deficit)} kcal</b></div><div><div class="tiny muted">Training / rest day</div><b class="num" style="font-size:18px">${fmt(tT.kcal)} / ${fmt(tR.kcal)}</b></div><div><div class="tiny muted">Reach ${st.goalWeight} lb</div><b style="font-size:18px">${fmtDate(when, { month: 'short', year: 'numeric' })}</b></div></div>
    <div class="tiny muted" style="margin-top:6px">${fmt(pct, 2)}% of body weight per week · portions on the calendar resize automatically.</div>${flag}`;
}
/* settings cards shared by Settings and the Diet plan */
const setField = (lbl, name, val, attrs = '', hint = '') => `<div class="field"><label>${lbl}</label><input class="inp" name="${name}" value="${esc(val)}" ${attrs}>${hint ? `<span class="tiny muted">${hint}</span>` : ''}</div>`;
function trainingDaysCardHTML(coll) { const st = S.settings; const f = setField;
  const pill = `<span class="pill acc" id="td-count">${st.trainDays.length} day${st.trainDays.length === 1 ? '' : 's'} / week</span>`;
  const body = `<div class="row wrap td-pick">${[1, 2, 3, 4, 5, 6, 0].map(i => `<label class="td ${st.trainDays.includes(i) ? 'on' : ''}"><input type="checkbox" data-input="td" value="${i}" ${st.trainDays.includes(i) ? 'checked' : ''}><span>${DOW[i]}</span></label>`).join('')}</div>
        <div class="note" style="margin-top:12px">${icon('dumbbell')}<span>Pick as many days as you like — the workout plan updates instantly from today forward. Sessions rotate <b>Push → Pull → Legs</b> (push and pull never share a day), so each muscle is trained about <b>${fmt(st.trainDays.length / 3, 1)}×</b> per week${st.trainDays.length < 3 ? '' : ''}. ${st.trainDays.length >= 6 ? 'Six or more days gives a classic twice-a-week PPL.' : st.trainDays.length <= 2 ? 'With 1–2 days, the rotation spreads across weeks.' : ''}</span></div>
        <form data-form="plan" class="row wrap" style="gap:10px;margin-top:14px;align-items:flex-end">
          ${f('Start date (Day 1)', 'startDate', st.startDate, 'type="date" required')}
          <button class="btn" type="submit">Rebuild from new start date</button></form>
        <div class="tiny muted" style="margin-top:8px">After the 90-day launch the plan keeps going in 13-week cycles (Build → Intensify → Volume → Deload & Test).</div>`;
  return coll ? `<div class="card ${collCls('days')}" data-coll="days"><div class="card-h">${collHead('days', 'Training days', pill)}</div><div class="coll-body">${body}</div></div>`
    : `<div class="card"><div class="card-h"><h2>Training days</h2>${pill}</div>${body}</div>`; }
const GOALS = [['cut', 'Lose fat', 'Calorie deficit, protein held high to keep muscle.'], ['maintain', 'Maintain', 'Eat at maintenance and train.'], ['bulk', 'Build muscle', 'Measured surplus, most of the extra as carbohydrate.']];
function lossRateCardHTML() { const st = S.settings; const k = goalKind(); const cur = latestStats();
  const goalPick = `<div class="field" style="margin-bottom:12px"><label>Goal</label><div class="seg seg-goal">${GOALS.map(([v, l]) => `<button type="button" class="${k === v ? 'on' : ''}" data-act="set-goal" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="tiny muted" style="margin-top:6px">${esc((GOALS.find(g => g[0] === k) || GOALS[0])[2])}</div></div>`;
  if (k === 'maintain') return `<div class="card"><div class="card-h"><h2>Goal</h2><span class="pill acc">Maintenance</span></div>${goalPick}
    <div class="tiny muted">Calories sit at maintenance for the day — no deficit, no surplus. The trend coach still flags drift in either direction.</div></div>`;
  if (k === 'bulk') return `<div class="card"><div class="card-h"><h2>Goal</h2><span class="pill" id="rate-pill">${fmt(st.bulkPct, 2)} % / week</span></div>${goalPick}
        <label class="tiny muted">Weekly gain, as a share of body weight</label>
        <input type="range" min="0.15" max="0.6" step="0.05" value="${st.bulkPct}" data-input="bulkpct" style="margin:6px 0 4px">
        <div class="row" style="justify-content:space-between"><span class="tiny muted">0.15</span><span class="tiny muted">0.35</span><span class="tiny muted">0.6 %/wk</span></div>
        <div id="rate-info" style="margin-top:10px">${bulkInfoHTML(st.bulkPct)}</div></div>`;
  return `<div class="card"><div class="card-h"><h2>Goal</h2><span class="pill" id="rate-pill">${fmt(st.rate, 2)} lb / week</span></div>${goalPick}
        <label class="tiny muted">Target loss rate</label>
        <input type="range" min="0.25" max="2" step="0.05" value="${st.rate}" data-input="rate" style="margin:6px 0 4px">
        <div class="row" style="justify-content:space-between" ><span class="tiny muted">0.25</span><span class="tiny muted">1.0</span><span class="tiny muted">2.0 lb/wk</span></div>
        <div id="rate-info" style="margin-top:10px">${rateInfoHTML(st.rate)}</div></div>`; }
/* What the chosen gain rate means in calories, and the two guard rails that matter:
   too fast and the surplus goes on as fat; too high a body fat and it does the same. */
function bulkInfoHTML(pct) {
  const st = S.settings; const cur = latestStats();
  const lb = Math.min(cur.w * pct / 100, (+st.bulkMaxSurplus || 500) * 7 / 3500);
  const capped = cur.w * pct / 100 > lb + 1e-9;
  const tT = targetsFor(cur.w, cur.bf, true), tR = targetsFor(cur.w, cur.bf, false);
  const toGoal = Math.max(0, st.goalWeight - cur.w); const weeks = lb > 0 ? toGoal / lb : 0;
  const when = addDays(maxISO(todayISO(), st.startDate), Math.round(weeks * 7));
  const fast = pct > 0.5 ? `<div class="note warn" style="margin-top:8px">${icon('info')}<span>Above about 0.5%/week most of the extra weight is fat, not muscle — an intermediate lifter can't build tissue faster than that.</span></div>` : '';
  const cap = cur.bf >= (+st.bulkMaxBF || 20) ? `<div class="note warn" style="margin-top:8px">${icon('info')}<span>You're at ${fmt(cur.bf, 1)}% body fat, at or above the ${st.bulkMaxBF}% ceiling, so calories are held at maintenance. Lower the ceiling setting or cut first.</span></div>` : '';
  return `<div class="grid g3" style="gap:10px"><div><div class="tiny muted">Daily surplus</div><b class="num" style="font-size:18px">+${fmt(Math.round(lb * 3500 / 7))} kcal</b></div><div><div class="tiny muted">Training / rest day</div><b class="num" style="font-size:18px">${fmt(tT.kcal)} / ${fmt(tR.kcal)}</b></div><div><div class="tiny muted">${toGoal > 0 ? `Reach ${st.goalWeight} lb` : 'Above goal weight'}</div><b style="font-size:18px">${toGoal > 0 ? fmtDate(when, { month: 'short', year: 'numeric' }) : '—'}</b></div></div>
    <div class="tiny muted" style="margin-top:6px">${fmt(lb, 2)} lb per week at ${fmt(cur.w, 0)} lb${capped ? ` · capped at the ${st.bulkMaxSurplus} kcal/day surplus` : ''} · stops at ${st.bulkMaxBF}% body fat.</div>${fast}${cap}`;
}
function bodyGoalsCardHTML() { const st = S.settings; const f = setField;
  return `<div class="card"><div class="card-h"><h2>Body & goals</h2></div><form data-form="body" class="grid g2" style="gap:12px">
        ${f('Starting weight (lb)', 'startWeight', st.startWeight, 'type="number" step="0.1"')}${f('Starting body fat %', 'startBF', st.startBF, 'type="number" step="0.1"')}
        ${f('Goal weight (lb)', 'goalWeight', st.goalWeight, 'type="number" step="0.1"')}${f('Goal body fat %', 'goalBF', st.goalBF, 'type="number" step="0.1"')}
        <div><button class="btn primary" type="submit">Save</button></div></form></div>`; }
function nutritionCardHTML() { const st = S.settings; const f = setField;
  return `<div class="card"><div class="card-h"><h2>Nutrition model</h2></div><form data-form="nut" class="grid g2" style="gap:12px">
        <div class="field"><label>Protein: <b id="prot-v">${st.proteinPerLb}</b> g per lb</label><input type="range" name="proteinPerLb" min="0.5" max="1" step="0.05" value="${st.proteinPerLb}" oninput="document.getElementById('prot-v').textContent=this.value"></div>
        <div class="field"><label>Daily activity (outside the gym)</label><select class="inp" name="activity">${[[1.3, 'Sedentary — desk, <5k steps'], [1.4, 'Light — desk + 5–8k steps'], [1.5, 'Moderate — 8–12k steps'], [1.6, 'Active — on your feet / 12k+']].map(([v, l]) => `<option value="${v}" ${+st.activity === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        ${f('Extra kcal on lifting days', 'sessionKcal', st.sessionKcal, 'type="number" step="10"')}
        ${f('Manual calorie adjustment', 'kcalAdjust', st.kcalAdjust, 'type="number" step="25"', 'Applied to every day. The trend coach can set this for you.')}
        ${f('Calorie floor', 'minKcal', st.minKcal, 'type="number" step="50"')}
        ${goalKind() === 'bulk' ? f('Stop bulking at body fat %', 'bulkMaxBF', st.bulkMaxBF, 'type="number" step="0.5"', 'Past this, more of every surplus calorie is stored as fat. Calories hold at maintenance instead.') + f('Largest daily surplus (kcal)', 'bulkMaxSurplus', st.bulkMaxSurplus, 'type="number" step="25"', 'A ceiling on the surplus however fast the target gain is.') : ''}
        <div class="field" style="grid-column:1/-1"><label>When you reach your goal weight or body-fat %</label><select class="inp" name="atGoal"><option value="maintain" ${st.atGoal === 'maintain' ? 'selected' : ''}>Switch to maintenance calories automatically</option><option value="continue" ${st.atGoal === 'continue' ? 'selected' : ''}>Keep the deficit going</option></select></div>
        <div><button class="btn primary" type="submit">Save</button></div></form></div>`; }
function viewSettings(group) {
  const st = S.settings;
  if (group && SET_GROUPS[group]) return settingsGroupHTML(group);
  const f = (lbl, name, val, attrs = '', hint = '') => `<div class="field"><label>${lbl}</label><input class="inp" name="${name}" value="${esc(val)}" ${attrs}>${hint ? `<span class="tiny muted">${hint}</span>` : ''}</div>`;
  return `<div class="page-head"><div class="t"><h1>Settings</h1><p>${AUTH.mode === 'server' ? 'Everything is saved to your account. Export a backup now and then.' : 'Everything is saved in this browser. Export a backup now and then.'}</p></div></div>
    <div class="grid g2">
      ${trainingDaysCardHTML()}
      ${lossRateCardHTML()}
      ${bodyGoalsCardHTML()}
      ${nutritionCardHTML()}
      ${gymSettingsHTML()}
      ${restSettingsHTML()}
      ${appearanceCardHTML()}</div>
    <div style="height:16px"></div>
    ${moneyCardHTML()}
    ${apiCardHTML()}
    <div style="height:16px"></div>
    ${foodPrefsCardHTML()}
    ${settingsFootHTML()}`;
}
function appearanceCardHTML() {
  const st = S.settings;
  return `<div class="card"><div class="card-h"><h2>Appearance & data</h2></div>
        <div class="field"><label>Theme</label><div class="seg">${['dark', 'light', 'system'].map(t => `<button class="${st.theme === t ? 'on' : ''}" data-act="theme" data-v="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div></div>
        <label class="set-tog" style="margin-top:12px"><span><b class="small">Background photos</b><span class="tiny muted">${st.bgPhotos !== false ? 'A fitness photo behind each page.' : 'Off — plain background. Pages load faster and text is easier to read.'}</span></span><input type="checkbox" data-input="bg-photos" ${st.bgPhotos !== false ? 'checked' : ''}><i class="switch ${st.bgPhotos !== false ? 'on' : ''}" aria-hidden="true"><i></i></i></label>
        <hr class="sep"><div class="row wrap"><button class="btn" data-act="export">${icon('download')}Export backup</button><label class="btn">${icon('upload')}Import backup<input type="file" accept="application/json" data-input="import" hidden></label>
        <button class="btn danger" data-act="reset">${icon('trash')}Reset everything</button></div>
        <div class="tiny muted" style="margin-top:10px">${AUTH.mode === 'server' ? `Your data is saved to your FORGE 90 account on the server and follows you to any device you sign in on. <a href="#/account">Account settings</a>` : 'Data lives in this browser’s local storage for this file. Opening the file in a different browser starts fresh — use Export/Import to move it. Run the FORGE 90 server to get accounts and sign-in.'}</div>
        <div class="tiny muted" style="margin-top:10px">Background photos from Unsplash (free Unsplash License): ${Object.values(SECTION_BG).map(b => `<a href="https://unsplash.com/photos/${b.slug}" target="_blank" rel="noopener">${esc(b.who)}</a>`).join(' · ')}.</div></div>`;
}
function moneyCardHTML() {
  const st = S.settings;
  return `<div class="card"><div class="card-h"><h2>Money-saving meal planning</h2><label class="share-tog"><span class="small">Share ingredients between recipes</span><input type="checkbox" data-input="share" ${st.shareIngredients !== false ? 'checked' : ''}><i class="switch ${st.shareIngredients !== false ? 'on' : ''}" aria-hidden="true"><i></i></i></label></div>
      <div class="small sub">When on, the planner orders each week’s meals so recipes reuse the same fresh ingredients — fewer packages to buy and less food going bad. Variety and favorites are unchanged. See the formula and this week’s savings on <a href="#/grocery">Grocery & prep</a>. Package sizes can be edited on any food.</div></div>`;
}
function foodPrefsCardHTML() { return `<div class="card"><div class="card-h"><h2>Food preferences</h2><a class="btn sm" href="#/foods">Manage foods & recipes ${icon('right')}</a></div>${foodPrefsHTML()}</div>`; }
function settingsFootHTML() { return `<div class="tiny muted" style="margin-top:14px;text-align:center">FORGE 90 ${APP_VERSION} · <a href="${SOURCE_URL}/blob/main/LICENSE" target="_blank" rel="noopener">AGPL-3.0</a> · <a href="${SOURCE_URL}" target="_blank" rel="noopener">Source code</a></div>`; }

/* ---------------- router ---------------- */
const NAV = [['', 'Dashboard', 'grid'], ['calendar', 'Calendar', 'cal'], ['workouts', 'Workout plan', 'dumbbell'], ['diet', 'Diet plan', 'food'], ['foods', 'Foods & recipes', 'book'], ['grocery', 'Grocery & prep', 'cart'], ['pantry', 'Pantry', 'box'], ['progress', 'Progress', 'trend'], ['settings', 'Settings', 'sliders']];
function shell() {
  document.body.innerHTML = `<div id="bg" aria-hidden="true"><div class="bg-layer"></div><div class="bg-layer"></div></div><div class="app"><aside class="side"><div class="brand"><a class="brand-link" href="#/" title="FORGE 90 — Dashboard">${LOGO}<b class="wm">FORGE<em>90</em></b></a><button class="side-toggle" data-act="nav-toggle" id="side-toggle"></button></div>
    <nav class="nav">${navItems().map(([k, l, i]) => `<a href="#/${k}" data-nav="${k}" title="${l}">${icon(i)}<span>${l}</span></a>`).join('')}</nav><div class="side-foot" id="side-foot"></div></aside>
    <main class="main" id="view"></main></div><nav class="tabbar" id="tabbar" aria-label="Main"></nav><div id="wo-root"></div><div id="tip"></div><div id="toast"></div>`;
}
function sideFoot() {
  const t = todayISO(); const i = planIndex(t); const d = Math.max(0, i + 1);
  const ph = i >= 0 ? phaseForWeek(planWeek(t)) : null;
  const lbl = i < 0 ? `Starts in ${-i} day${-i === 1 ? '' : 's'}` : `Cycle ${ph.cycle} · ${ph.name}`;
  const frac = i < 0 ? 0 : ph.cycle === 1 ? Math.min(1, d / LAUNCH_DAYS) : (ph.wic - 1 + ((i % 7) + 1) / 7) / 13;
  $('#side-foot').innerHTML = userChipHTML() + `<div class="lbl">${i >= 0 && ph.cycle > 1 ? 'Cycle ' + ph.cycle : 'Progress'}</div><div class="big">Day ${d}${i >= 0 && ph.cycle === 1 && d <= LAUNCH_DAYS ? '<span class="muted" style="font-size:14px"> / 90</span>' : ''}</div><div class="small sub">${lbl}</div><div class="pbar"><i style="width:${frac * 100}%"></i></div>
    <button class="btn sm ghost theme-btn" data-act="theme-toggle" title="Switch to ${effTheme() === 'light' ? 'dark' : 'light'} mode" aria-label="Switch to ${effTheme() === 'light' ? 'dark' : 'light'} mode">${icon(effTheme() === 'light' ? 'moon' : 'sun')}<span>${effTheme() === 'light' ? 'Dark' : 'Light'} mode</span></button><div class="app-ver" title="FORGE 90 ${APP_VERSION}">${APP_VERSION}</div>`;
  const tg = $('#side-toggle'); if (tg) { const c = !!UI.navCollapsed; tg.innerHTML = icon(c ? 'sideR' : 'sideL'); tg.title = c ? 'Expand menu' : 'Collapse menu'; tg.setAttribute('aria-label', tg.title); tg.setAttribute('aria-expanded', String(!c)); }
}
function effTheme() { const t = document.documentElement.dataset.theme; return t === 'system' ? (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : t; }
const appTitle = () => (typeof AUTH !== 'undefined' && AUTH.config && AUTH.config.appName) || 'FORGE 90';   // Admin → App settings → App name
function render() {
  if (!$('#view')) return;                                  // sign-in screen is showing
  const h = location.hash.replace(/^#\/?/, ''); const [page, arg] = h.split('/');
  const phone = isPhone(); document.body.classList.toggle('phone', phone);
  // phones: Plan and Kitchen remember the tab you were on; big screens have no Prep or Plan pages of their own
  if (page === 'plan') { location.replace('#/' + (phone ? (UI.lastPlan || 'calendar') : 'calendar')); return; }
  if (page === 'kitchen') { location.replace('#/' + (phone ? (UI.lastKit || 'grocery') : 'grocery')); return; }
  if (page === 'prep' && !phone) { location.replace('#/grocery'); return; }
  if (phone && hubOf(page) === 'plan' && UI.lastPlan !== page) { UI.lastPlan = page; saveUI(); }
  if (phone && hubOf(page) === 'kitchen' && page !== 'recipe' && UI.lastKit !== page) { UI.lastKit = page; saveUI(); }
  document.body.classList.toggle('compact', !!UI.navCollapsed);
  if (page === 'day' && arg) ensurePlanThrough(arg);
  const sec = ({ '': 'dashboard', calendar: 'calendar', day: 'day', workouts: 'workouts', diet: 'diet', foods: 'foods', recipe: 'foods', grocery: 'grocery', pantry: 'grocery', prep: 'grocery', progress: 'progress', settings: 'settings', account: 'settings', admin: 'settings', you: 'settings' })[page || ''] || 'dashboard';
  document.body.dataset.sec = sec; applyBackground(sec);
  $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === (page === 'day' ? 'calendar' : page === 'recipe' ? 'foods' : (page || ''))));
  const sy = window.scrollY; const same = render._last === h; render._last = h;
  if (page !== 'calendar') UI._calCompact = null;
  let html;
  switch (page) {
    case 'calendar': html = viewCalendar(); break;
    case 'day': html = phone ? viewToday(arg) : viewDay(arg); break;
    case 'workouts': html = viewWorkouts(); break;
    case 'diet': html = viewDiet(); break;
    case 'grocery': html = viewGrocery(); break;
    case 'pantry': html = viewPantry(); break;
    case 'progress': html = viewProgress(); break;
    case 'settings': html = viewSettings(arg); break;
    case 'you': html = viewYou(); break;
    case 'prep': html = viewPrep(); break;
    case 'foods': html = viewFoods(); break;
    case 'recipe': html = viewRecipe(decodeURIComponent(arg || '')); break;
    case 'account': html = viewAccount(); break;
    case 'admin': html = viewAdmin(); break;
    default: html = phone ? viewToday(todayISO()) : viewDashboard();
  }
  if (phone && hubOf(page)) html = hubSegHTML(page) + html;
  $('#view').innerHTML = html; sideFoot(); hideTip(); fpAfter(); pantryNavBadge(); tabbarRender(page);
  if (page === 'progress') progressCharts();
  window.scrollTo(0, same ? sy : 0);
  document.title = appTitle() + ' · ' + (page === 'recipe' ? ((RECIPE[decodeURIComponent(arg || '')] || {}).name || 'Recipe') : (navItems().concat([['account', 'Account'], ['you', 'You'], ['prep', 'Meal prep']]).find(n => n[0] === page) || [, page === 'day' ? 'Day' : phone ? 'Today' : 'Dashboard'])[1]);
  if (page === 'account') accountAfter(); if (page === 'admin') adminAfter(); if (page === 'settings') settingsAfter();
  if (UI._scrollTo) { const el = document.getElementById(UI._scrollTo); UI._scrollTo = null; if (el) el.scrollIntoView({ block: 'start' }); }
  woRefresh();
}
function applyTheme() { const t = (S && S.settings.theme) || UI.lastTheme || 'dark'; document.documentElement.dataset.theme = t; if (UI.lastTheme !== t) { UI.lastTheme = t; saveUI(); } }

/* ---------------- actions ---------------- */
const ACT = {
  undo: () => undo(),
  'toast-close': () => { clearTimeout(toastTimer); const t = $('#toast'); if (t) t.classList.remove('on'); },
  'close-modal': () => closeModal(),
  'cal-view': el => { UI.calView = el.dataset.v; if (UI.calView === 'week') { const t = todayISO(); UI.calWeek = mondayOf(inPlan(t) ? t : (UI.calMonth + '-01' < S.settings.startDate ? S.settings.startDate : UI.calMonth + '-01')); } saveUI(); render(); },
  'cal-prev': () => shiftCal(-1), 'cal-next': () => shiftCal(1),
  'cal-today': () => { const t = todayISO(); const a = inPlan(t) ? t : S.settings.startDate; UI.calMonth = a.slice(0, 7); UI.calWeek = mondayOf(a); saveUI(); render(); },
  'toggle-lib': () => { UI.showLib = !UI.showLib; saveUI(); render(); },
  'lib-tab': el => { UI.libTab = el.dataset.v; saveUI(); render(); },
  'lib-filter': el => { UI.libFilter = el.dataset.v; saveUI(); render(); },
  'diet-filter': el => { UI.dietFilter = el.dataset.v; saveUI(); render(); },
  'plan-phase': el => { UI.planPhase = el.dataset.v; saveUI(); render(); },
  recipe: el => recipeModal(el.dataset.rid),
  'recipe-print': el => printRecipe(el.dataset.rid),
  'recipe-expand': el => { const h = location.hash; REC_FROM = /^#\/recipe\//.test(h) ? REC_FROM : (h || '#/'); closeModal(); location.hash = '#/recipe/' + el.dataset.rid; },
  'toggle-done': el => { const d = el.dataset.date; if (S.done[d]) delete S.done[d]; else S.done[d] = true; saveState(); render(); toast(S.done[d] ? 'Workout marked complete 💪' : 'Marked not complete'); },
  'set-rate': el => { S.settings.rate = +el.dataset.v; saveState(); render(); toast(`Loss rate set to ${el.dataset.v} lb/week — portions updated`); },
  'set-goal': el => { const v = el.dataset.v; if (v === S.settings.goal) return; S.settings.goal = v; S.settings.kcalAdjust = 0; saveState(); render();
    toast(v === 'bulk' ? 'Building muscle — calories, macros and portions updated' : v === 'maintain' ? 'Maintenance — calories held level' : 'Losing fat — deficit back on'); },
  'apply-trend': el => { S.settings.kcalAdjust = (+S.settings.kcalAdjust || 0) + (+el.dataset.delta); saveState(); render(); toast(`Calories adjusted ${+el.dataset.delta > 0 ? '+' : ''}${el.dataset.delta} kcal/day`); },
  'pr-range': el => { UI.prRange = el.dataset.v === '14' ? '14' : 'all'; saveUI(); render(); },
  'del-weight': el => { S.weights = S.weights.filter(x => x.d !== el.dataset.d); saveState(); render(); toast('Weigh-in deleted'); },
  theme: el => { S.settings.theme = el.dataset.v; saveState(); applyTheme(); render(); },
  'theme-toggle': () => { S.settings.theme = effTheme() === 'light' ? 'dark' : 'light'; saveState(); applyTheme(); render(); },
  'nav-toggle': () => { UI.navCollapsed = !UI.navCollapsed; saveUI(); hideTip(); render();
    setTimeout(() => { if (location.hash.startsWith('#/progress')) progressCharts(); if (location.hash.startsWith('#/calendar') && calIsCompact() !== UI._calCompact) render(); }, 260); },
  export: () => { const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `forge90-backup-${todayISO()}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('Backup downloaded'); },
  reset: () => confirmBox('Reset everything?', 'This deletes your plan edits, weigh-ins, strength logs, custom foods and recipes from this browser. Export a backup first if you want to keep them.', 'Reset', () => { S = freshState(); rebuildCatalog(); ensureHorizon(); bgCurrent = null; saveState(); undoStack.length = 0; applyTheme(); showOnboarding(() => { shell(); render(); toast('Reset complete — your new plan is ready'); }); }, true),
  'copy-list': () => { const txt = $$('.gro-item').map(l => `${l.querySelector('input').checked ? '[x]' : '[ ]'} ${l.children[1].textContent} — ${l.querySelector('.q').childNodes[0].textContent}`).join('\n'); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Shopping list copied'), () => toast('Copy not available — use Print instead')); },
  print: () => window.print()
};
function shiftCal(n) {
  if (UI.calView === 'week') UI.calWeek = addDays(UI.calWeek, 7 * n);
  else { let [y, m] = UI.calMonth.split('-').map(Number); m += n; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } UI.calMonth = y + '-' + pad2(m); }
  const last = UI.calView === 'week' ? addDays(UI.calWeek, 6) : iso(new Date(+UI.calMonth.slice(0, 4), +UI.calMonth.slice(5, 7), 0));
  if (ensurePlanThrough(last)) saveState();
  saveUI(); render();
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  const link = e.target.closest('a[href]'); if (a && link && link !== a && a.contains(link)) return;   // real links inside clickable cards
  if (a) { const fn = ACT[a.dataset.act]; if (fn) { e.preventDefault(); fn(a, e); } return; }
  const go = e.target.closest('[data-go]');
  if (go && !e.target.closest('select,input,button,a')) location.hash = '#/day/' + go.dataset.go;
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.log) {
    const [d, ex, i, k] = el.dataset.log.split('|');
    S.logs[d] = S.logs[d] || {}; const arr = S.logs[d][ex] = S.logs[d][ex] || [];
    arr[+i] = arr[+i] || {}; const prev = arr[+i][k]; arr[+i][k] = el.value === '' ? null : +el.value;
    for (let j = 0; j < arr.length; j++) if (!arr[j]) arr[j] = {};
    saveState();
    const hint = $('#hint-' + ex); if (hint) { const b = prBadge(d, ex); const old = hint.querySelector('.prb'); if (old) old.remove(); if (b) { hint.insertAdjacentHTML('afterbegin', b); if (!old) toast(`New PR on ${EX[ex].name}! 🏆`); } }
    if (k === 'r') { const c = refreshLogProgress(d, ex); if (c && c.done >= c.total && !S.done[d] && !(prev > 0) && +el.value > 0) toast('Every set is logged — nice work! Tap “Mark workout complete” to finish the session. 💪'); }
    return;
  }
  const inp = el.dataset.input;
  if (inp === 'day-wo') { pushUndo('change workout'); const d = el.dataset.date; S.plan[d].w = el.value ? { t: el.value, wk: planWeek(d) } : null; commitPlan(el.value ? `Session set to ${TEMPLATES[el.value].name}` : 'Changed to a rest day'); }
  else if (inp === 'day-meal') { pushUndo('change meal'); S.plan[el.dataset.date].m[el.dataset.slot] = el.value || null; markMealEdit(el.dataset.date, el.dataset.slot); commitPlan(el.value ? `${SLOT_LABEL[el.dataset.slot]} → ${RECIPE[el.value].name}` : `${SLOT_LABEL[el.dataset.slot]} removed`); }
  else if (inp === 'share') { pushUndo('ingredient sharing'); S.settings.shareIngredients = el.checked; const from = nextPlanWeekStart(); replanMeals(from); saveState(); render();
    toast(`Ingredient sharing ${el.checked ? 'on' : 'off'} — meals from ${fmtDate(from)} on re-planned (hand-picked meals kept)`, true); }
  else if (inp === 'gro-week') { UI.groWeek = +el.value; saveUI(); render(); }
  else if (inp === 'gro') groTick(el);
  else if (inp === 'pr-ex') { UI.prEx = el.value; saveUI(); render(); }
  else if (inp === 'rate') { S.settings.rate = +el.value; saveState(); render(); toast(`Target loss rate ${fmt(+el.value, 2)} lb/week — calories and portions updated`); }
  else if (inp === 'bulkpct') { S.settings.bulkPct = +el.value; saveState(); render(); toast(`Target gain ${fmt(+el.value, 2)}% of body weight per week — calories and portions updated`); }
  else if (inp === 'td') {
    const days = $$('[data-input="td"]').filter(x => x.checked).map(x => +x.value).sort();
    if (!days.length) { el.checked = true; toast('Keep at least one training day'); return; }
    pushUndo('training days'); S.settings.trainDays = days;
    const from = maxISO(todayISO(), S.settings.startDate); rescheduleWorkouts(from); saveState(); render();
    toast(`Training ${days.length} day${days.length === 1 ? '' : 's'} a week — workouts rescheduled from ${fmtDate(from)}`, true);
  }
  else if (inp === 'bg-photos') { S.settings.bgPhotos = el.checked; saveState(); bgCurrent = null; applyBackground(document.body.dataset.sec || 'settings'); render(); toast(el.checked ? 'Background photos on' : 'Background photos off'); }
  else if (inp === 'bg-dim') { S.settings.bgDim = +(1 - el.value).toFixed(2); saveState(); document.documentElement.style.setProperty('--dim', S.settings.bgDim); }
  else if (inp === 'foodcat') { UI.foodCat = el.value; saveUI(); render(); }
  else if (inp === 'bg-file') { const f = el.files[0]; if (!f) return; resizeImageFile(f).then(url => { S.bgCustom[el.dataset.sec] = url; bgCurrent = null; saveState(); render(); toast('Background updated'); }).catch(() => toast('Couldn’t read that image')); }
  else if (inp === 'import') {
    const file = el.files[0]; if (!file) return; const rd = new FileReader();
    rd.onload = () => { try { let o = JSON.parse(rd.result); if (o && o.state && o.state.settings) o = o.state; if (!o.settings || !o.plan) throw 0; loadState(o); bgCurrent = null; undoStack.length = 0; applyTheme(); render(); toast('Backup imported'); } catch (x) { toast('That file isn’t a FORGE 90 backup'); } };
    rd.readAsText(file);
  }
});
document.addEventListener('input', e => {
  if (e.target.dataset.input === 'rate') { const v = +e.target.value; const pill = $('#rate-pill'); if (pill) pill.textContent = fmt(v, 2) + ' lb / week'; const prev = S.settings.rate; S.settings.rate = v; const ri = $('#rate-info'); if (ri) ri.innerHTML = rateInfoHTML(v); S.settings.rate = prev; }
  if (e.target.dataset.input === 'bulkpct') { const v = +e.target.value; const pill = $('#rate-pill'); if (pill) pill.textContent = fmt(v, 2) + ' % / week'; const prev = S.settings.bulkPct; S.settings.bulkPct = v; const ri = $('#rate-info'); if (ri) ri.innerHTML = bulkInfoHTML(v); S.settings.bulkPct = prev; }
  if (e.target.dataset.input === 'bg-dim') document.documentElement.style.setProperty('--dim', 1 - e.target.value);
  if (e.target.dataset.input === 'recq') { UI.recQ = e.target.value; const pos = e.target.selectionStart; render(); const n = $('[data-input="recq"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) { /* search inputs */ } } return; }
  if (e.target.dataset.input === 'foodq') { UI.foodQ = e.target.value; const pos = e.target.selectionStart; render(); const n = $('[data-input="foodq"]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } return; }
  if (e.target.dataset.input === 'libq') { UI.libQ = e.target.value; const pos = e.target.selectionStart; render(); const n = $('[data-input="libq"]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } } });
document.addEventListener('submit', e => {
  const f = e.target; const kind = f.dataset.form; if (!kind) return; e.preventDefault(); const fd = new FormData(f);
  if (kind === 'weigh') {
    const d = fd.get('d'), w = +fd.get('w'), bf = fd.get('bf'); if (!d || !w) return;
    S.weights = S.weights.filter(x => x.d !== d); S.weights.push({ d, w, bf: bf === '' ? null : +bf }); saveState(); render();
    const t = latestStats(); toast(`Logged ${w} lb${bf ? ' · ' + bf + '%' : ''} — targets now ${targetsFor(t.w, t.bf, true).kcal}/${targetsFor(t.w, t.bf, false).kcal} kcal`);
  } else if (kind === 'quicklog') {
    const ex = fd.get('ex'), d = fd.get('d'), w = +fd.get('w'), r = +fd.get('r');
    S.logs[d] = S.logs[d] || {}; const arr = S.logs[d][ex] = (S.logs[d][ex] || []).filter(s => s && +s.r > 0); arr.push({ w, r }); UI.prEx = ex; saveUI(); saveState(); render(); toast(`Logged ${EX[ex].name}: ${w} × ${r}`);
  } else if (kind === 'plan') {
    const sd = fd.get('startDate'); const td = S.settings.trainDays;
    confirmBox('Rebuild the plan?', `Day 1 becomes ${fmtDate(sd, { weekday: 'long', month: 'long', day: 'numeric' })} with training on ${td.map(i => DOW[i]).join(', ')}. Calendar edits are replaced; logs are kept.`, 'Rebuild', () => {
      const go = () => { S.settings.startDate = sd; pushUndo('rebuild'); S.plan = {}; S.planEnd = null; ensureHorizon(); if (syncActive()) syncApplyAgreed();     // shared meals stay as agreed with the partner
        UI.calMonth = null; UI.calWeek = null; UI.groWeek = null; saveUI(); saveState(); render(); toast('Plan rebuilt'); };
      if (syncActive()) syncFetch(true).then(go); else go(); });
  } else if (kind === 'body' || kind === 'nut') {
    if (kind === 'body' && S.settings.bfEstimated && +fd.get('startBF') !== +S.settings.startBF) S.settings.bfEstimated = false;
    for (const [k, v] of fd.entries()) S.settings[k] = isNaN(+v) ? v : +v;
    saveState(); render(); toast('Saved — targets and portions recalculated');
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); undo(); }
});
let rsT = null; window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => {
  if (location.hash.startsWith('#/progress')) progressCharts();
  if (location.hash.startsWith('#/calendar') && calIsCompact() !== UI._calCompact) render();
}, 150); });
window.addEventListener('hashchange', render);

