// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
/* ================================================================
   FORGE 90 — dashboard layout: panel order, hidden panels, and the
   Customize editor (drag, or the up/down buttons on touch screens)
   ================================================================ */

// id, name, width ('full' spans the page; half-width panels side by side share a row), short description
const DASH_PANELS = [
  ['hero', 'Cycle overview', 'full', 'Day count, phase and the 13-week bar'],
  ['stats', 'Body stats', 'full', 'Weight, body fat, lean mass, trend and distance to goal'],
  ['today', 'Today', 'half', 'Today’s workout with set logging, macros and meals'],
  ['outlook', 'Goal outlook', 'half', 'Projection, trend coach and quick weigh-in'],
  ['gym', 'Gym card', 'half', 'Your membership barcode for check-in'],
  ['week', 'Next 7 days', 'full', 'The coming week at a glance'],
  ['prs', 'Recent PRs', 'half', 'Your latest personal records']
];
// the phone's Today page has its own panels and its own saved layout (see views-l)
const LAYOUTS = {
  dash: { key: 'dashLayout', panels: () => DASH_PANELS, title: 'Customize dashboard', defHidden: {}, where: 'dashboard' },
  today: { key: 'todayLayout', panels: () => TODAY_PANELS, title: 'Customize Today', defHidden: { gym: 1 }, where: 'Today page' }
};
const layoutOf = L => LAYOUTS[L] || LAYOUTS.dash;
const DASH_DEFAULT = DASH_PANELS.map(p => p[0]);
const dashInfo = (id, L) => layoutOf(L).panels().find(p => p[0] === id);
// saved order with unknown panels dropped and new ones slotted in where they sit by default
function dashOrder(L) {
  const C = layoutOf(L), def = C.panels().map(p => p[0]);
  const Ls = (S && S[C.key]) || {}; const saved = (Ls.order || []).filter((id, i, a) => dashInfo(id, L) && a.indexOf(id) === i);
  def.forEach((id, i) => { if (saved.includes(id)) return; const prev = def.slice(0, i).reverse().find(x => saved.includes(x)); saved.splice(prev ? saved.indexOf(prev) + 1 : 0, 0, id); });
  return saved;
}
const dashHidden = (id, L) => { const C = layoutOf(L), h = ((S && S[C.key]) || {}).hidden; return h && id in h ? !!h[id] : !!C.defHidden[id]; };
// runs of half-width panels share a row: the first takes the wide column, the rest stack beside it
function dashLayoutHTML(html, notes) {
  const vis = dashOrder().filter(id => !dashHidden(id) && html[id]); const wrap = id => `<section class="dash-p" data-panel="${id}">${html[id]}</section>`;
  const out = []; let i = 0;
  while (i < vis.length) {
    if (dashInfo(vis[i])[2] !== 'half') { out.push(wrap(vis[i])); i++; continue; }
    let j = i; while (j < vis.length && dashInfo(vis[j])[2] === 'half') j++;
    const grp = vis.slice(i, j); i = j;
    if (grp.length === 1) out.push(wrap(grp[0]));
    else if (grp.length === 2) out.push(`<div class="g-split dash-row">${grp.map(wrap).join('')}</div>`);
    else out.push(`<div class="g-split dash-row">${wrap(grp[0])}<div class="dash-stack">${grp.slice(1).map(wrap).join('')}</div></div>`);
  }
  const nHid = dashOrder().filter(id => dashHidden(id)).length;
  return `<div class="dash"><div class="dash-top">${nHid ? `<span class="tiny muted">${nHid} panel${nHid === 1 ? '' : 's'} hidden</span>` : ''}<button class="btn sm ghost" data-act="dash-edit">${icon('grid')}Customize</button></div>
    ${notes || ''}${out.join('') || `<div class="card empty-state">${icon('grid')}<div>Every panel is hidden. <button class="btn sm" data-act="dash-edit">Customize</button> to bring some back.</div></div>`}</div>`;
}

/* ---------- Customize ---------- */
function dashEditor(L) {
  L = L === 'today' ? 'today' : 'dash'; const C = layoutOf(L); const order = dashOrder(L);
  const rows = order.map((id, k) => { const [, name, size, desc] = dashInfo(id, L); const hid = dashHidden(id, L); const lA = L === 'today' ? ' data-l="today"' : '';
    return `<li class="dl-row ${hid ? 'off' : ''}" data-id="${id}"><span class="dl-grip" title="Drag to move" aria-hidden="true">${icon('grip')}</span>
      <span class="dl-t"><b>${esc(name)}</b><small>${esc(desc)}${L === 'dash' ? ` · ${size === 'full' ? 'full width' : 'half width'}` : ''}${hid ? ' · hidden' : ''}</small></span>
      <span class="dl-acts"><button type="button" class="btn icon ghost sm" data-act="dash-move" data-id="${id}" data-v="-1"${lA} ${k ? '' : 'disabled'} aria-label="Move ${esc(name)} up">${icon('arrowUp')}</button><button type="button" class="btn icon ghost sm" data-act="dash-move" data-id="${id}" data-v="1"${lA} ${k < order.length - 1 ? '' : 'disabled'} aria-label="Move ${esc(name)} down">${icon('arrowDown')}</button>
        <button type="button" class="btn sm ${hid ? 'primary' : 'ghost'}" data-act="dash-hide" data-id="${id}"${lA} aria-pressed="${hid}">${icon(hid ? 'eye' : 'eyeOff')}${hid ? 'Show' : 'Hide'}</button></span></li>`; }).join('');
  modal(`<div class="dl-m"><div class="row"><h2 style="flex:1">${C.title}</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div class="tiny muted" style="margin:2px 0 12px">${L === 'dash' ? 'Drag panels by the handle or use the arrows. Half-width panels next to each other share a row on wide screens: the first gets the wide column and the rest stack beside it.' : 'Drag panels by the handle or use the arrows to put them in the order you use them.'} Changes show on the ${C.where} straight away and are saved to your ${AUTH.mode === 'server' ? 'account' : 'plan'}.</div>
    <ul class="dl-list" id="dl-list" data-l="${L}">${rows}</ul>
    <div class="row wrap" style="justify-content:flex-end;gap:8px;margin-top:14px"><button class="btn ghost" data-act="dash-reset"${L === 'today' ? ' data-l="today"' : ''} style="margin-right:auto">${icon('undo')}Reset to default</button><button class="btn primary" data-act="close-modal">Done</button></div></div>`, 'dl-modal');
}
function dashSave(order, hidden, L) {
  const C = layoutOf(L), cur = S[C.key] || {};
  const h = Object.assign({}, C.defHidden, cur.hidden || {}, hidden !== undefined && hidden !== null ? hidden : {});
  S[C.key] = { order: order || dashOrder(L), hidden: h };
  saveState(); render();
}
// drag rows by the handle — pointer events, so it works with a mouse, a finger or a pen
let DL = null;
document.addEventListener('pointerdown', e => {
  const g = e.target.closest && e.target.closest('.dl-grip'); if (!g) return; const row = g.closest('.dl-row'); if (!row) return;
  e.preventDefault(); DL = { row, list: row.parentElement, moved: false }; row.classList.add('drag'); document.body.classList.add('dl-dragging');
});
window.addEventListener('pointermove', e => {
  if (!DL) return; e.preventDefault();
  const others = [...DL.list.children].filter(r => r !== DL.row); let before = null;
  for (const r of others) { const b = r.getBoundingClientRect(); if (e.clientY < b.top + b.height / 2) { before = r; break; } }
  if (before !== DL.row.nextElementSibling || (!before && DL.list.lastElementChild !== DL.row)) { DL.list.insertBefore(DL.row, before); DL.moved = true; }
}, { passive: false });
const dlEnd = () => {
  if (!DL) return; const { row, list, moved } = DL; DL = null; row.classList.remove('drag'); document.body.classList.remove('dl-dragging');
  if (moved) { const L = list.dataset.l; dashSave([...list.children].map(r => r.dataset.id), null, L); dashEditor(L); }
};
window.addEventListener('pointerup', dlEnd); window.addEventListener('pointercancel', dlEnd);

Object.assign(ACT, {
  'dash-edit': el => dashEditor(el.dataset.l),
  'dash-move': el => { const L = el.dataset.l; const o = dashOrder(L); const i = o.indexOf(el.dataset.id), j = i + +el.dataset.v; if (i < 0 || j < 0 || j >= o.length) return; [o[i], o[j]] = [o[j], o[i]]; dashSave(o, null, L); dashEditor(L);
    const b = $(`#dl-list [data-act="dash-move"][data-id="${el.dataset.id}"][data-v="${el.dataset.v}"]`); if (b && !b.disabled) b.focus(); },
  'dash-hide': el => { const L = el.dataset.l; const id = el.dataset.id; dashSave(null, { [id]: !dashHidden(id, L) }, L); dashEditor(L); },
  'dash-reset': el => { const L = el.dataset.l; delete S[layoutOf(L).key]; saveState(); render(); dashEditor(L); toast(L === 'today' ? 'Today layout reset' : 'Dashboard layout reset'); }
});
