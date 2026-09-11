/* ============================================================
   FORGE 90 — Custom exercise editor (exercise library + cards)
   ============================================================ */
const GROUP_REGION = { Chest: 'chest', Back: 'lats', Shoulders: 'sideDelt', Biceps: 'biceps', Triceps: 'triceps', Quads: 'quads', Hamstrings: 'hamstrings', Glutes: 'glutes', Calves: 'calves', Core: 'abs' };
let XE = null;
function slotOptionsFor(group, sel) {
  const slots = Object.entries(SLOTS).filter(([, v]) => v.group === group);
  return `<option value="">Library only — don’t add to the rotation</option>` + slots.map(([k, v]) => `<option value="${k}" ${sel === k ? 'selected' : ''}>Add to “${esc(v.label)}” rotation (${v.vars.length + (CUSTOM_SLOT[k] || []).filter(e => e.id !== (XE && XE.id)).length} → ${v.vars.length + (CUSTOM_SLOT[k] || []).filter(e => e.id !== (XE && XE.id)).length + 1} variations)</option>`).join('');
}
function exerciseEditor(id, group) {
  const e = id ? S.customExercises[id] : null;
  const g = e ? e.group : (group || 'Chest');
  XE = { id: id || null, group: g, compound: e ? !!e.compound : false, bw: e ? !!e.bw : false,
    primary: new Set(e ? e.primary : [GROUP_REGION[g]]), secondary: new Set(e ? e.secondary : []), slot: e ? (e.slot || '') : '' };
  const chips = which => Object.entries(REGION_LABEL).map(([k, l]) => `<button type="button" class="mus ${XE[which].has(k) ? 'on ' + which : ''}" data-act="xe-mus" data-k="${k}" data-which="${which}">${esc(l)}</button>`).join('');
  modal(`<div class="row"><h2 style="flex:1">${id ? 'Edit exercise' : 'New exercise'}</h2><button class="btn icon ghost" data-act="close-modal">${icon('x')}</button></div>
    <form data-form="exercise" class="xe" style="margin-top:12px">
      <div class="xe-top"><div class="xe-fields">
        <div class="field"><label>Exercise name</label><input class="inp" name="name" value="${esc(e ? e.name : '')}" placeholder="e.g. Landmine Press" required></div>
        <div class="grid g2" style="gap:10px;margin-top:10px">
          <div class="field"><label>Muscle group</label><select class="inp" name="group" data-input="xe-group">${EX_GROUPS.map(x => `<option ${x === g ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
          <div class="field"><label>Equipment</label><input class="inp" name="equip" value="${esc(e ? e.equip : '')}" placeholder="e.g. Barbell + landmine"></div></div>
        <div class="row wrap" style="gap:14px;margin-top:10px">
          <div class="seg"><button type="button" class="${!XE.compound ? 'on' : ''}" data-act="xe-type" data-v="0">Isolation</button><button type="button" class="${XE.compound ? 'on' : ''}" data-act="xe-type" data-v="1">Compound</button></div>
          <label class="small"><input type="checkbox" name="bw" ${XE.bw ? 'checked' : ''}> Bodyweight (log reps only)</label></div></div>
        <div class="xe-map" id="xe-map">${muscleMap([...XE.primary], [...XE.secondary])}</div></div>
      <div class="field" style="margin-top:12px"><label>Primary muscles</label><div class="mus-row">${chips('primary')}</div></div>
      <div class="field" style="margin-top:10px"><label>Secondary muscles</label><div class="mus-row">${chips('secondary')}</div></div>
      <div class="field" style="margin-top:12px"><label>Workout plan</label><select class="inp" name="slot" id="xe-slot">${slotOptionsFor(g, XE.slot)}</select>
        <span class="tiny muted">Added exercises join the weekly variation rotation from this week on — earlier weeks stay as they were.</span></div>
      <div class="grid g2" style="gap:10px;margin-top:12px">
        <div class="field"><label>How to do it (one step per line)</label><textarea class="inp" name="steps" rows="5" style="height:auto;padding:8px 11px" placeholder="Set up…&#10;Lower under control…">${esc(e ? e.steps.join('\n') : '')}</textarea></div>
        <div class="field"><label>Coaching cues (one per line)</label><textarea class="inp" name="cues" rows="5" style="height:auto;padding:8px 11px" placeholder="Elbows tucked&#10;Full stretch">${esc(e ? e.cues.join('\n') : '')}</textarea></div></div>
      <div class="field" style="margin-top:10px"><label>Common mistake to avoid</label><input class="inp" name="mistake" value="${esc(e ? e.mistake : '')}" placeholder="e.g. Shrugging the shoulders"></div>
      <div class="row" style="justify-content:flex-end;margin-top:16px">
        ${id ? `<button type="button" class="btn danger" data-act="ex-del" data-id="${id}" style="margin-right:auto">${icon('trash')}Delete</button>` : ''}
        <button type="button" class="btn" data-act="close-modal">Cancel</button><button class="btn primary" type="submit">${id ? 'Save changes' : 'Add exercise'}</button></div></form>`);
}
function refreshXEMap() { const m = $('#xe-map'); if (m && XE) m.innerHTML = muscleMap([...XE.primary], [...XE.secondary]); }
function saveExercise(form) {
  const fd = new FormData(form); const name = String(fd.get('name') || '').trim();
  if (!name) { toast('Give the exercise a name'); return; }
  const group = fd.get('group');
  if (!XE.primary.size) XE.primary.add(GROUP_REGION[group]);
  const lines = k => String(fd.get(k) || '').split('\n').map(x => x.trim()).filter(Boolean);
  const prev = XE.id ? S.customExercises[XE.id] : null;
  const slot = fd.get('slot') || null;
  const id = XE.id || 'ux_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24) + '_' + Date.now().toString(36).slice(-4);
  const since = prev && prev.slot === slot ? prev.since : mondayOf(maxISO(todayISO(), S.settings.startDate));
  S.customExercises[id] = { id, name, group, equip: String(fd.get('equip') || '').trim(), compound: XE.compound, bw: !!fd.get('bw'),
    primary: [...XE.primary], secondary: [...XE.secondary].filter(k => !XE.primary.has(k)), slot, since,
    steps: lines('steps'), cues: lines('cues'), mistake: String(fd.get('mistake') || '').trim() };
  rebuildExercises(); saveState(); closeModal(); render();
  toast(`${name} ${prev ? 'updated' : 'added'}${slot ? ` — joins the ${SLOTS[slot].label.toLowerCase()} rotation` : ''}`);
}
document.addEventListener('submit', e => { if (e.target.dataset && e.target.dataset.form === 'exercise') { e.preventDefault(); saveExercise(e.target); } });
document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.input === 'xe-group' && XE) { XE.group = e.target.value; const s = $('#xe-slot'); if (s) s.innerHTML = slotOptionsFor(XE.group, ''); } });
Object.assign(ACT, {
  'ex-new': el => exerciseEditor(null, el.dataset.group),
  'ex-edit': el => exerciseEditor(el.dataset.id),
  'xe-type': el => { XE.compound = el.dataset.v === '1'; $$('[data-act="xe-type"]').forEach(b => b.classList.toggle('on', b === el)); },
  'xe-mus': el => {
    const k = el.dataset.k, which = el.dataset.which, other = which === 'primary' ? 'secondary' : 'primary';
    if (XE[which].has(k)) XE[which].delete(k); else { XE[which].add(k); XE[other].delete(k); }
    $$(`[data-act="xe-mus"][data-k="${k}"]`).forEach(b => { const w = b.dataset.which; b.className = 'mus' + (XE[w].has(k) ? ' on ' + w : ''); });
    refreshXEMap();
  },
  'ex-del': el => { const x = S.customExercises[el.dataset.id]; confirmBox('Delete exercise?', `Delete <b>${esc(x.name)}</b>? It leaves the rotation; any sets you logged for it stay saved but won’t show on the PR board.`, 'Delete', () => {
    delete S.customExercises[x.id]; rebuildExercises(); saveState(); render(); toast('Exercise deleted'); }, true); }
});

/* ---------------- quick edit (dashboard): change a day's workout and meals without leaving the page ---------------- */
let QE = null;
function quickEdit(date, focus) { QE = { date, focus: focus || 'meals' }; renderQuickEdit(); }
function renderQuickEdit() {
  if (!QE) return; const d = QE.date; ensurePlanThrough(d);
  const e = S.plan[d]; if (!e) return; const A = computeAll(); const x = A.days[d];
  const prev = inPlan(addDays(d, -1)) ? addDays(d, -1) : null, next = inPlan(addDays(d, 1)) ? addDays(d, 1) : null;
  const ph = phaseForWeek(planWeek(d));
  const tplOpt = k => `<option value="${k}" ${e.w && e.w.t === k ? 'selected' : ''}>${esc(TEMPLATES[k].name)}</option>`;
  const woOpts = `<option value="">— Rest day —</option>` + (e.w && TEMPLATES[e.w.t] && TEMPLATES[e.w.t].legacy ? `<option value="${e.w.t}" selected>${esc(TEMPLATES[e.w.t].name)} (earlier plan)</option>` : '')
    + `<optgroup label="This week’s phase — ${esc(ph.name)}">${ph.templates.map(tplOpt).join('')}</optgroup>`
    + ALL_PHASES.filter(p => p.templates.join() !== ph.templates.join()).map(p => `<optgroup label="${esc(p.name)}">${p.templates.map(tplOpt).join('')}</optgroup>`).join('');
  let woBody = '';
  if (e.w && TEMPLATES[e.w.t]) { const t = TEMPLATES[e.w.t]; const rows = sessionRows(e.w);
    woBody = `<div class="row wrap" style="gap:6px;margin-top:10px"><span class="pill" style="background:${KIND_VAR(t.kind)};color:#fff">${esc(t.short || t.name)}</span><span class="small muted">${rows.reduce((a, r) => a + r.sets, 0)} sets · ~${estMinutes(rows)} min</span></div>
      <div class="sets" style="margin-top:8px;gap:5px">${rows.map(r => `<span class="pill" data-tip-ex="${r.ex.id}" style="cursor:help">${esc(r.ex.name)} <span class="muted">${r.sets}×${esc(r.reps)}</span></span>`).join('')}</div>`; }
  else woBody = `<div class="small muted" style="margin-top:8px">Rest day — pick a session above to train on this day.</div>`;
  const mealRow = sl => { const cur = e.m && e.m[sl]; const cat = SLOT_CAT[sl]; const m = x.meals.find(q => q.slot === sl);
    const list = sortRecipes(RECIPES.filter(r => r.cat === cat && (recipeAllowed(r) || r.id === cur))).sort((a, b) => isFav(b.id) - isFav(a.id));
    const opt = r => { const ps = RPS(r.id); return `<option value="${r.id}" ${r.id === cur ? 'selected' : ''}>${isFav(r.id) ? '★ ' : ''}${esc(r.name)} · ${fmt(ps.k)} kcal · ${fmt(ps.p)}P${recipeAllowed(r) ? '' : ' (blocked)'}</option>`; };
    return `<div class="qe-meal ${QE.focus === 'meal:' + sl ? 'focus' : ''}"><span class="em">${m ? esc(m.r.emoji) : '—'}</span><div style="flex:1;min-width:0"><label class="tiny muted" for="qe-${sl}">${SLOT_LABEL[sl]}</label>
      <select class="inp" id="qe-${sl}" data-input="qe-meal" data-slot="${sl}"><option value="">— none —</option>${list.map(opt).join('')}</select></div>
      <span class="num small qe-mac">${m ? `<b>${fmt(m.m.k)}</b> kcal<br><span style="color:var(--prot)">${fmt(m.m.p)}P</span>` : ''}</span></div>`; };
  modal(`<div class="row"><button class="btn icon ghost" data-act="qe-day" data-d="${prev || ''}" ${prev ? '' : 'disabled'} aria-label="Previous day">${icon('left')}</button>
      <div style="flex:1;text-align:center"><div class="tiny muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.08em">Quick edit · ${x.isTrain ? 'training day' : 'rest day'}</div><h2 style="margin-top:2px">${d === todayISO() ? 'Today · ' : ''}${fmtDate(d, { weekday: 'long', month: 'short', day: 'numeric' })}</h2></div>
      <button class="btn icon ghost" data-act="qe-day" data-d="${next || ''}" ${next ? '' : 'disabled'} aria-label="Next day">${icon('right')}</button><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>
    <section class="qe-sec ${QE.focus === 'wo' ? 'focus' : ''}"><div class="row"><h3 style="flex:1">${icon('dumbbell')}Workout</h3>${e.w ? `<button class="btn sm ${S.done[d] ? 'primary' : ''}" data-act="qe-done">${icon('check')}${S.done[d] ? 'Completed' : 'Mark complete'}</button>` : ''}</div>
      <select class="inp" id="qe-wo" data-input="qe-wo" style="margin-top:8px;width:100%">${woOpts}</select>${woBody}
      <div class="row wrap" style="gap:6px;margin-top:10px"><a class="btn sm ghost" href="#/day/${d}" data-act="close-go" data-h="#/day/${d}">${icon('list')}Open day to log sets</a><a class="btn sm ghost" href="#/workouts" data-act="close-go" data-h="#/workouts">${icon('grip')}Change exercises in Workout plan</a></div></section>
    <section class="qe-sec ${QE.focus !== 'wo' ? 'focus' : ''}"><div class="row"><h3 style="flex:1">${icon('food')}Meals</h3><span class="tiny muted">★ favorites first · changes keep your hand-picked meals when the plan re-plans</span></div>
      ${MEAL_SLOTS.map(mealRow).join('')}
      <div class="qe-tot"><div><span class="tiny muted">Day total</span><b class="num">${fmt(x.totals.k)}</b><span class="small muted"> / ${fmt(x.tg.kcal)} kcal</span></div><div class="small num"><span style="color:var(--prot)"><b>${fmt(x.totals.p)}</b>/${fmt(x.tg.protein)}g P</span> · <span style="color:var(--carb)">${fmt(x.totals.c)}C</span> · <span style="color:var(--fat)">${fmt(x.totals.f)}F</span></div><span class="tiny muted">Portions resize automatically</span></div></section>
    <div class="row" style="justify-content:flex-end;margin-top:12px;gap:6px"><button class="btn" data-act="undo" ${undoStack.length ? '' : 'disabled'}>${icon('undo')}Undo</button><button class="btn primary" data-act="close-modal">Done</button></div>`);
  const f = QE.focus === 'wo' ? $('#qe-wo') : QE.focus.startsWith('meal:') ? $('#qe-' + QE.focus.slice(5)) : null;
  if (f) setTimeout(() => { f.focus(); f.closest('section, .qe-meal').scrollIntoView({ block: 'nearest' }); }, 30);
}
Object.assign(ACT, {
  qe: el => quickEdit(el.dataset.d, el.dataset.f),
  'qe-day': el => { if (!el.dataset.d) return; QE.date = el.dataset.d; renderQuickEdit(); },
  'qe-done': () => { const d = QE.date; if (S.done[d]) delete S.done[d]; else S.done[d] = true; saveState(); render(); renderQuickEdit(); },
  'close-go': el => { closeModal(); location.hash = el.dataset.h; }
});
document.addEventListener('change', e => {
  const t = e.target; if (!t.dataset || !QE || !$('#modal')) return;
  if (t.dataset.input === 'qe-wo') { const d = QE.date; pushUndo('change workout'); S.plan[d].w = t.value ? { t: t.value, wk: planWeek(d) } : null; QE.focus = 'wo';
    saveState(); render(); renderQuickEdit(); toast(t.value ? `${fmtDate(d)}: ${TEMPLATES[t.value].name}` : `${fmtDate(d)} is now a rest day`, true); }
  if (t.dataset.input === 'qe-meal') { const d = QE.date, sl = t.dataset.slot; pushUndo('change meal'); S.plan[d].m[sl] = t.value || null; markMealEdit(d, sl); QE.focus = 'meal:' + sl;
    saveState(); render(); renderQuickEdit(); toast(t.value ? `${SLOT_LABEL[sl]} → ${RECIPE[t.value].name}` : `${SLOT_LABEL[sl]} removed`, true); }
});

/* ---------------- switch exercises on / off ---------------- */
function curPlanWeekStart() { const t = todayISO(), st = S.settings.startDate; return t < st ? st : planWeekStart(planWeek(t)); }
function toggleExercise(id, on) {
  const e = EX[id]; if (!e) return; const g = exGroupOf(e);
  if (!on && !Object.values(EX).some(x => x.id !== id && exGroupOf(x) === g && !exOffNow(x.id))) { toast(`Keep at least one ${g.toLowerCase()} exercise switched on — switch another one on first.`); render(); return; }
  let from = curPlanWeekStart();
  if (!on) {   // already logged this week? then the change starts next week so today's log stays with the exercise
    const logged = Object.keys(S.logs || {}).some(d => d >= from && d <= todayISO() && (S.logs[d][id] || []).some(x => x && (x.w != null || x.r != null)));
    if (logged) from = addDays(from, 7);
  }
  S.exOff = S.exOff || {}; const per = S.exOff[id] = S.exOff[id] || [];
  if (!on) { if (!per.some(([, t]) => !t)) per.push([from, null]); }
  else { const open = per.find(([, t]) => !t); if (open) { if (open[0] >= from) per.splice(per.indexOf(open), 1); else open[1] = from; } if (!per.length) delete S.exOff[id]; }
  saveState(); render();
  toast(on ? `${e.name} is back in the rotation from ${fmtDate(from)}` : `${e.name} switched off from ${fmtDate(from)} — its sessions use your other ${g.toLowerCase()} exercises`);
}
document.addEventListener('change', e => { const t = e.target; if (t && t.dataset && t.dataset.input === 'ex-on') toggleExercise(t.dataset.id, t.checked); });
