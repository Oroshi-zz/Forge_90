// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
/* ================================================================
   FORGE 90 — exercise swaps (one day, or the program from this week on),
   collapsible page sections, and profile pictures
   ================================================================ */

/* ---------- swapping exercises ---------- */
let SWP = null;
function swapStartWeek(exId) {
  let from = curPlanWeekStart();
  const logged = Object.keys(S.logs || {}).some(d => d >= from && d <= todayISO() && ((S.logs[d] || {})[exId] || []).some(x => x && (x.w != null || x.r != null)));
  return logged ? addDays(from, 7) : from;
}
function swapOpenDay(date, i, back) {
  const e = S.plan[date]; if (!e || !e.w) return; const r = sessionRows(e.w)[i]; if (!r) return;
  SWP = { mode: 'day', date, i, slot: r.slot, exId: r.ex.id, planned: r.planned.id, back: back || null, all: false }; renderSwap();
}
function swapOpenProg(slot, exId) { SWP = { mode: 'prog', slot, exId, all: false }; renderSwap(); }
function progSwapOrigin(slot, exId, wStart) { const x = slotSwapsOn(slot, wStart).find(s => s[1] === exId); return x ? x[0] : null; }
function swapCandidates() {
  const cur = EX[SWP.exId]; const g = exGroupOf(cur);
  const inSlot = new Set(SLOTS[SWP.slot].vars.concat((CUSTOM_SLOT[SWP.slot] || []).map(e => e.id)));
  const list = Object.values(EX).filter(e => e.id !== SWP.exId && (SWP.all || exGroupOf(e) === g));
  const rank = e => (inSlot.has(e.id) ? 0 : exGroupOf(e) === g ? 1 : 2) * 2 + (exOffNow(e.id) ? 1 : 0);
  return list.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name)).map(e => ({ e, grp: inSlot.has(e.id) ? 'slot' : exGroupOf(e) === g ? 'group' : 'other' }));
}
function renderSwap() {
  const x = SWP; const cur = EX[x.exId]; const g = exGroupOf(cur); const sl = SLOTS[x.slot];
  let scope, reset = '';
  if (x.mode === 'day') {
    scope = `Only changes the ${esc(sl.label.toLowerCase())} exercise on <b>${fmtDate(x.date, { weekday: 'long', month: 'short', day: 'numeric' })}</b>. The program stays the same.`;
    if (x.planned !== x.exId) reset = `<button class="btn sm" data-act="swap-pick" data-id="${x.planned}">${icon('undo')}Back to the planned exercise: ${esc(EX[x.planned].name)}</button>`;
  } else {
    const from = swapStartWeek(x.exId); const orig = progSwapOrigin(x.slot, x.exId, from) || progSwapOrigin(x.slot, x.exId, curPlanWeekStart());
    scope = `Replaces <b>${esc(cur.name)}</b> everywhere the <b>${esc(sl.label)}</b> rotation uses it, from the week of <b>${fmtDate(from, { month: 'short', day: 'numeric' })}</b>. Earlier weeks keep what was planned.`;
    if (orig && EX[orig]) reset = `<button class="btn sm" data-act="swap-pick" data-id="${orig}">${icon('undo')}Restore the original: ${esc(EX[orig].name)}</button>`;
  }
  const groups = { slot: `Other ${esc(sl.label.toLowerCase())} exercises`, group: `More ${esc(g.toLowerCase())} exercises`, other: 'Other muscle groups' };
  let last = ''; const opts = swapCandidates().map(({ e, grp }) => {
    const head = grp !== last ? `<div class="swap-grp">${groups[grp]}</div>` : ''; last = grp;
    const pills = [exOffNow(e.id) ? '<span class="pill">Off in library</span>' : '', e.custom ? '<span class="pill acc">Custom</span>' : '', e.extra ? '<span class="pill">Research pick</span>' : ''].join('');
    return `${head}<button type="button" class="swap-opt" data-act="swap-pick" data-id="${e.id}" data-n="${esc((e.name + ' ' + e.equip + ' ' + exGroupOf(e)).toLowerCase())}" data-tip-ex="${e.id}">${muscleMap(e.primary, e.secondary)}<span class="swap-t"><b>${esc(e.name)}</b><small>${esc(e.equip || '')} · ${e.compound ? 'compound' : 'isolation'}</small></span><span class="swap-p">${pills}</span></button>`; }).join('');
  modal(`<div class="swap-m"><div class="row"><h2 style="flex:1">${x.mode === 'day' ? 'Swap for this day' : 'Swap in the program'}</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div class="swap-cur">${muscleMap(cur.primary, cur.secondary)}<div style="min-width:0"><div class="tiny muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.08em">${esc(sl.label)} · now</div><b>${esc(cur.name)}</b><div class="tiny muted">${esc(cur.equip || '')}</div></div></div>
    <div class="note" style="margin:10px 0">${icon('info')}<span>${scope}</span></div>${reset ? `<div style="margin-bottom:10px">${reset}</div>` : ''}
    <div class="row wrap" style="gap:10px;margin-bottom:8px"><input class="inp" type="search" id="swap-q" data-input="swap-q" placeholder="Search exercises…" style="flex:1;min-width:180px" autocomplete="off">
      <label class="small"><input type="checkbox" data-input="swap-all" ${x.all ? 'checked' : ''}> Show every muscle group</label></div>
    <div class="swap-list" id="swap-list">${opts || '<div class="muted small" style="padding:12px">No other exercises.</div>'}</div></div>`, 'swap-modal');
  const q = $('#swap-q'); if (q && x.q) { q.value = x.q; swapFilter(); }
}
function swapFilter() {
  const q = ($('#swap-q') || {}).value || ''; SWP.q = q; const t = q.trim().toLowerCase();
  const words = t.split(/\s+/).filter(Boolean);
  $$('#swap-list .swap-opt').forEach(b => { b.hidden = words.some(w => !b.dataset.n.includes(w)); });
  $$('#swap-list .swap-grp').forEach(h => { let n = h.nextElementSibling, any = false; while (n && !n.classList.contains('swap-grp')) { if (!n.hidden) any = true; n = n.nextElementSibling; } h.hidden = !any; });
}
function swapPick(id) {
  const x = SWP; if (!x || !EX[id]) return; const from = EX[x.exId];
  if (x.mode === 'day') {
    const e = S.plan[x.date]; if (!e || !e.w) return; pushUndo('swap exercise');
    const sw = Object.assign({}, e.w.sw || {}); if (id === x.planned) delete sw[x.i]; else sw[x.i] = id;
    e.w = Object.assign({}, e.w); if (Object.keys(sw).length) e.w.sw = sw; else delete e.w.sw;
    const logged = ((S.logs[x.date] || {})[x.exId] || []).some(s => s && +s.r > 0);
    saveState(); SWP = null; closeModal(); render(); if (x.back === 'qe' && typeof renderQuickEdit === 'function' && QE) renderQuickEdit();
    toast(`${fmtDate(x.date, { weekday: 'short' })}: ${from.name} → ${EX[id].name}${logged ? ' · sets you logged for ' + from.name + ' stay in your history' : ''}`, true);
    return;
  }
  const wkFrom = swapStartWeek(x.exId);
  pushUndo('swap exercise in the program');
  S.slotSwap = S.slotSwap || {}; const L = S.slotSwap[x.slot] = S.slotSwap[x.slot] || [];
  const act = L.find(s => s[1] === x.exId && !s[3]);
  const orig = act ? act[0] : x.exId;
  if (act) { if (act[2] >= wkFrom) L.splice(L.indexOf(act), 1); else act[3] = wkFrom; }
  if (id !== orig) L.push([orig, id, wkFrom, null]);
  if (!L.length) delete S.slotSwap[x.slot];
  saveState(); SWP = null; closeModal(); render();
  toast(id === orig ? `${EX[id].name} is back in the ${SLOTS[x.slot].label.toLowerCase()} rotation from ${fmtDate(wkFrom)}` : `${from.name} → ${EX[id].name} in the program from ${fmtDate(wkFrom)}`, true);
}

/* ---------- collapsible sections (Workout plan) ---------- */
const collOpen = k => !((UI.coll || {})[k]);
function collHead(k, title, extra = '') {
  const open = collOpen(k);
  return `<button type="button" class="coll-btn" data-act="coll" data-k="${k}" aria-expanded="${open}" title="${open ? 'Collapse' : 'Expand'}">${icon('right')}<h2>${title}</h2></button>${extra}`;
}
const collCls = k => `coll ${collOpen(k) ? '' : 'shut'}`;

/* ---------- profile pictures ---------- */
function avatarSquare(file, size = 256) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => { try {
      const w = img.naturalWidth, h = img.naturalHeight; const s = Math.min(w, h); if (!s) throw new Error('empty');
      const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high'; g.fillStyle = '#fff'; g.fillRect(0, 0, size, size);
      g.drawImage(img, (w - s) / 2, (h - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.86));
    } catch (e) { URL.revokeObjectURL(url); reject(e); } };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
    img.src = url;
  });
}
async function avatarUpload(file) {
  if (!file) return;
  if (!/^image\//.test(file.type || '')) { toast('Choose an image file (JPEG, PNG, WebP…).'); return; }
  if (file.size > 20 * 1024 * 1024) { toast('That image is over 20 MB — choose a smaller one.'); return; }
  let data; try { data = await avatarSquare(file); } catch (e) { toast('That image couldn’t be read. Try a JPEG or PNG.'); return; }
  try { const r = await api('PUT', '/api/account/avatar', { data }); avatarApplied(r.user); toast('Profile picture updated'); } catch (e) { toast(e.message); }
}
function avatarApplied(user) { AUTH.user = user; if (typeof ACC !== 'undefined' && ACC) { ACC.user = user; const r = $('#acc-root'); if (r) r.innerHTML = accountHTML(ACC); } sideFoot(); }

Object.assign(ACT, {
  'swap-day': el => swapOpenDay(el.dataset.date, +el.dataset.i, el.dataset.back),
  'swap-prog': el => swapOpenProg(el.dataset.slot, el.dataset.ex),
  'swap-pick': el => swapPick(el.dataset.id),
  coll: el => { const k = el.dataset.k; UI.coll = UI.coll || {}; if (UI.coll[k]) delete UI.coll[k]; else UI.coll[k] = 1; saveUI();
    const sec = el.closest('.coll'); const open = collOpen(k); if (sec) sec.classList.toggle('shut', !open); el.setAttribute('aria-expanded', String(open)); el.title = open ? 'Collapse' : 'Expand'; },
  'avatar-rm': () => confirmBox('Remove your profile picture?', 'It’s deleted from the server and your initials show instead.', 'Remove', async () => { try { const r = await api('DELETE', '/api/account/avatar'); avatarApplied(r.user); toast('Profile picture removed'); } catch (e) { toast(e.message); } }, true)
});
document.addEventListener('input', e => { const t = e.target; if (t && t.dataset && t.dataset.input === 'swap-q') swapFilter(); });
document.addEventListener('change', e => {
  const t = e.target; if (!t || !t.dataset) return;
  if (t.dataset.input === 'swap-all' && SWP) { SWP.all = t.checked; renderSwap(); }
  if (t.dataset.input === 'avatar') { const f = t.files && t.files[0]; t.value = ''; avatarUpload(f); }
});
