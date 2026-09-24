// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz

const BC_L = [[3, 2, 1, 1], [2, 2, 2, 1], [2, 1, 2, 2], [1, 4, 1, 1], [1, 1, 3, 2], [1, 2, 3, 1], [1, 1, 1, 4], [1, 3, 1, 2], [1, 2, 1, 3], [3, 1, 1, 2]];
const BC_G = BC_L.map(p => p.slice().reverse());
const BC_FIRST = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
const BC_UPCE = ['GGGLLL', 'GGLGLL', 'GGLLGL', 'GGLLLG', 'GLGGLL', 'GLLGGL', 'GLLLGG', 'GLGLGL', 'GLGLLG', 'GLLGLG'];
function bcCheck(code) { const d = code.split('').map(Number); const c = d.pop(); const s = d.reverse().reduce((a, n, i) => a + n * (i % 2 ? 1 : 3), 0); return (10 - s % 10) % 10 === c; }
function bcDigit(w, sets) {                    // w: 4 run widths → { d, set, v } best match
  const tot = w[0] + w[1] + w[2] + w[3]; if (!tot) return null; const u = tot / 7; let best = null;
  sets.forEach(([name, pats]) => pats.forEach((p, d) => { let v = 0; for (let j = 0; j < 4; j++) v += Math.abs(w[j] / u - p[j]); if (!best || v < best.v) best = { d, set: name, v }; }));
  return best && best.v < 1.5 ? best : null;
}
function bcGuard(runs, i, n, m) { for (let j = 0; j < n; j++) { const r = runs[i + j] / m; if (r < 0.45 || r > 1.9) return false; } return true; }
// the guard bars are all one module wide, so they show how much to take back
function bcFix(runs, i, len, guards) {
  let b = 0, nb = 0, sp = 0, ns = 0; guards.forEach(g => { if (g % 2 === 0) { b += runs[i + g]; nb++; } else { sp += runs[i + g]; ns++; } });
  const d = (b / nb - sp / ns) / 2; const out = new Array(len);
  for (let j = 0; j < len; j++) out[j] = Math.max(0.05, runs[i + j] + (j % 2 === 0 ? -d : d));
  return out;
}
const BC_G13 = [0, 1, 2, 27, 28, 29, 30, 31, 56, 57, 58], BC_G8 = [0, 1, 2, 19, 20, 21, 22, 23, 40, 41, 42], BC_GE = [0, 1, 2, 27, 28, 29, 30, 31, 32];
function bcTry(runs, i) {                        // runs[i] must be a bar (the first bar of the start guard)
  const out = [];
  if (i + 59 <= runs.length) {
    let tot = 0; for (let j = 0; j < 59; j++) tot += runs[i + j]; const m = tot / 95;
    if ((i === 0 || runs[i - 1] > m * 2.5) && bcGuard(runs, i, 3, m) && bcGuard(runs, i + 27, 5, m) && bcGuard(runs, i + 56, 3, m)) {
      const w = bcFix(runs, i, 59, BC_G13); let digits = '', par = '', ok = true;
      for (let k = 0; k < 6 && ok; k++) { const x = bcDigit(w.slice(3 + k * 4, 7 + k * 4), [['L', BC_L], ['G', BC_G]]); if (!x) ok = false; else { digits += x.d; par += x.set; } }
      for (let k = 0; k < 6 && ok; k++) { const x = bcDigit(w.slice(32 + k * 4, 36 + k * 4), [['R', BC_L]]); if (!x) ok = false; else digits += x.d; }
      if (ok) { const f = BC_FIRST.indexOf(par); if (f >= 0 && bcCheck(f + digits)) out.push(String(f) + digits); }
    }
  }
  if (!out.length && i + 43 <= runs.length) {
    let tot = 0; for (let j = 0; j < 43; j++) tot += runs[i + j]; const m = tot / 67;
    if ((i === 0 || runs[i - 1] > m * 2.5) && bcGuard(runs, i, 3, m) && bcGuard(runs, i + 19, 5, m) && bcGuard(runs, i + 40, 3, m) && (i + 43 >= runs.length || runs[i + 43] > m * 2.5)) {
      const w = bcFix(runs, i, 43, BC_G8); let digits = '', ok = true;
      for (let k = 0; k < 4 && ok; k++) { const x = bcDigit(w.slice(3 + k * 4, 7 + k * 4), [['L', BC_L]]); if (!x) ok = false; else digits += x.d; }
      for (let k = 0; k < 4 && ok; k++) { const x = bcDigit(w.slice(24 + k * 4, 28 + k * 4), [['R', BC_L]]); if (!x) ok = false; else digits += x.d; }
      if (ok && bcCheck(digits)) out.push(digits);
    }
  }
  if (!out.length && i + 33 <= runs.length) {
    let tot = 0; for (let j = 0; j < 33; j++) tot += runs[i + j]; const m = tot / 51;
    if ((i === 0 || runs[i - 1] > m * 2.5) && bcGuard(runs, i, 3, m) && bcGuard(runs, i + 27, 6, m) && (i + 33 >= runs.length || runs[i + 33] > m * 2.5)) {
      const w = bcFix(runs, i, 33, BC_GE); let digits = '', par = '', ok = true;
      for (let k = 0; k < 6 && ok; k++) { const x = bcDigit(w.slice(3 + k * 4, 7 + k * 4), [['L', BC_L], ['G', BC_G]]); if (!x) ok = false; else { digits += x.d; par += x.set; } }
      if (ok) {
        let ns = -1, chk = BC_UPCE.indexOf(par); if (chk >= 0) ns = 0; else { chk = BC_UPCE.indexOf(par.replace(/[LG]/g, c => c === 'L' ? 'G' : 'L')); if (chk >= 0) ns = 1; }
        if (ns >= 0) { const d = digits; const e = +d[5]; const body = e <= 2 ? d[0] + d[1] + d[5] + '0000' + d[2] + d[3] + d[4] : e === 3 ? d[0] + d[1] + d[2] + '00000' + d[3] + d[4] : e === 4 ? d[0] + d[1] + d[2] + d[3] + '00000' + d[4] : d[0] + d[1] + d[2] + d[3] + d[4] + '0000' + d[5];
          const upca = ns + body + chk; if (bcCheck(upca)) out.push(upca); }
      }
    }
  }
  return out[0] || null;
}
function bcMinMax(a, half) {
  const n = a.length, mn = new Float32Array(n), mx = new Float32Array(n); const qa = new Int32Array(n), qb = new Int32Array(n); let ha = 0, ta = 0, hb = 0, tb = 0;
  for (let j = 0; j < n + half; j++) {
    if (j < n) { while (ta > ha && a[qa[ta - 1]] >= a[j]) ta--; qa[ta++] = j; while (tb > hb && a[qb[tb - 1]] <= a[j]) tb--; qb[tb++] = j; }
    const i = j - half; if (i < 0) continue;
    while (qa[ha] < i - half) ha++; while (qb[hb] < i - half) hb++;
    mn[i] = a[qa[ha]]; mx[i] = a[qb[hb]];
  }
  return { mn, mx };
}
function bcRuns(lum) {
  const n = lum.length; if (n < 60) return null;
  let gmn = 255, gmx = 0; for (let i = 0; i < n; i++) { if (lum[i] < gmn) gmn = lum[i]; if (lum[i] > gmx) gmx = lum[i]; }
  if (gmx - gmn < 30) return null;
  const half = Math.max(8, Math.round(n / 24)); const { mn, mx } = bcMinMax(lum, half); const th = new Float32Array(n); const gmid = (gmn + gmx) / 2;
  for (let i = 0; i < n; i++) th[i] = mx[i] - mn[i] > (gmx - gmn) * 0.3 ? (mn[i] + mx[i]) / 2 : gmid;
  const runs = []; let cur = lum[0] < th[0]; const first = cur; let last = 0;
  for (let i = 1; i < n; i++) {
    const bar = lum[i] < th[i]; if (bar === cur) continue;
    const t = (th[i] + th[i - 1]) / 2, dl = lum[i] - lum[i - 1]; let x = dl ? i - 1 + (t - lum[i - 1]) / dl : i - 0.5; x = Math.min(i, Math.max(i - 1, x));
    runs.push(x - last); last = x; cur = bar;
  }
  runs.push(n - last);
  return { runs, firstBar: first };
}
// second opinion for blurry frames: edges at the steepest points of the luminance, so a thin bar or gap
// that never crosses the threshold still counts
function bcEdgeRuns(lum) {
  const n = lum.length; if (n < 60) return null;
  const sm = new Float32Array(n); for (let i = 0; i < n; i++) sm[i] = ((lum[i - 1] ?? lum[i]) + 2 * lum[i] + (lum[i + 1] ?? lum[i])) / 4;
  let gmn = 255, gmx = 0; for (let i = 0; i < n; i++) { if (sm[i] < gmn) gmn = sm[i]; if (sm[i] > gmx) gmx = sm[i]; }
  if (gmx - gmn < 30) return null;
  const d = new Float32Array(n); for (let i = 1; i < n - 1; i++) d[i] = (sm[i + 1] - sm[i - 1]) / 2;
  const thr = Math.max(3, (gmx - gmn) * 0.06); const edges = [];
  for (let i = 2; i < n - 2; i++) {
    const v = d[i]; if (Math.abs(v) < thr) continue;
    if (!(v > 0 ? v >= d[i - 1] && v > d[i + 1] : v <= d[i - 1] && v < d[i + 1])) continue;
    const den = d[i - 1] - 2 * v + d[i + 1]; const x = i + (den ? Math.max(-0.5, Math.min(0.5, (d[i - 1] - d[i + 1]) / (2 * den))) : 0);
    const e = { x, s: v > 0 ? 1 : -1, v: Math.abs(v) }; const p = edges[edges.length - 1];
    if (p && p.s === e.s) { if (e.v > p.v) edges[edges.length - 1] = e; } else edges.push(e);
  }
  if (edges.length < 20) return null;
  const runs = [edges[0].x]; for (let k = 1; k < edges.length; k++) runs.push(edges[k].x - edges[k - 1].x); runs.push(n - edges[edges.length - 1].x);
  return { runs, firstBar: edges[0].s > 0 };
}
function bcDecodeRow(lum) {
  for (const dir of [1, -1]) {
    const row = dir === 1 ? lum : Array.from(lum).reverse();
    for (const r of [bcRuns(row), bcEdgeRuns(row)]) { if (!r) continue;
      for (let i = r.firstBar ? 0 : 1; i < r.runs.length - 30; i += 2) { const c = bcTry(r.runs, i); if (c) return c; } }
  }
  return null;
}
// ImageData → barcode (needs two scan lines to agree, so a smudge can't produce a wrong number)
function bcDecodeImage(img) {
  const { width: w, height: h, data } = img; const hits = {};
  const lumAt = (x, y) => { const o = (y * w + x) * 4; return data[o] * 0.299 + data[o + 1] * 0.587 + data[o + 2] * 0.114; };
  const rowL = y => { const a = new Float32Array(w); for (let x = 0; x < w; x++) a[x] = lumAt(x, y); return a; };
  const colL = x => { const a = new Float32Array(h); for (let y = 0; y < h; y++) a[y] = lumAt(x, y); return a; };
  const tryLines = (count, get, size) => { for (let k = 0; k < count; k++) { const pos = Math.round(size * (0.2 + 0.6 * (k + 0.5) / count)); const c = bcDecodeRow(get(pos)); if (c) { hits[c] = (hits[c] || 0) + 1; if (hits[c] >= 2) return c; } } return null; };
  return tryLines(24, rowL, h) || tryLines(14, colL, w) || null;
}

/* ---------- the shared product list ---------- */
let SHARED_REV = 0, SHARED_LOADED = false, SHARED_TRY = 0, SHARED_T = null, SHARED_WARNED = false;
const gtinNorm = code => { code = String(code || '').replace(/\D/g, ''); if (code.length === 12) code = '0' + code; return code; };
async function loadSharedFoods() {
  if (AUTH.mode !== 'server') { SHARED_LOADED = true; return; }
  try { const r = await api('GET', '/api/foods/shared'); SHARED_FOODS = r.foods || {}; SHARED_REV = r.rev || 0; SHARED_LOADED = true; SHARED_TRY = 0; if (S) { rebuildCatalog(); render(); } }
  catch (e) {
    /* Without this list the pantry stops being consumed and scanned foods vanish from recipes,
       so keep retrying rather than sitting broken for the rest of the session. */
    if (SHARED_TRY < 6) { const wait = Math.min(30000, 1000 * Math.pow(2, SHARED_TRY++)); clearTimeout(SHARED_T); SHARED_T = setTimeout(loadSharedFoods, wait); }
    else if (!SHARED_WARNED) { SHARED_WARNED = true; toast('Couldn’t load the shared food list — the pantry won’t update until it loads. Reload to try again.'); }
  }
}
function sharedAdd(food) { SHARED_FOODS[food.id] = food; rebuildCatalog(); }

/* ---------- the shared recipe book ---------- */
let SREC_REV = 0, SREC_LOADED = false, SREC_TRY = 0, SREC_T = null, SREC_WARNED = false;
const recipeMine = r => !!r && !!r.shared && !!AUTH.user && r.by === AUTH.user.id;
const recipeMayEdit = r => !r ? false : r.shared ? (recipeMine(r) || isAdmin()) : true;
async function loadSharedRecipes() {
  if (AUTH.mode !== 'server') { SREC_LOADED = true; return; }
  try {
    const r = await api('GET', '/api/recipes/shared');
    SHARED_RECIPES = r.recipes || {}; SREC_REV = r.rev || 0; SREC_LOADED = true; SREC_TRY = 0;
    if (S) { await migrateRecipesUp(); rebuildCatalog(); render(); }
  } catch (e) {
    if (SREC_TRY < 6) { const wait = Math.min(30000, 1000 * Math.pow(2, SREC_TRY++)); clearTimeout(SREC_T); SREC_T = setTimeout(loadSharedRecipes, wait); }
    else if (!SREC_WARNED) { SREC_WARNED = true; toast('Couldn’t load the shared recipes. Reload to try again.'); }
  }
}
async function migrateRecipesUp() {
  if (AUTH.mode !== 'server' || S.recipesShared) return;
  const mine = Object.values(S.customRecipes || {}).filter(r => r && r.id && !SHARED_RECIPES[r.id]);
  if (!mine.length) { S.recipesShared = 1; saveState(); return; }
  let r; try { r = await api('POST', '/api/recipes/migrate', { recipes: mine }); } catch (e) { return; }
  const map = r.map || {};
  Object.entries(map).forEach(([oldId, newId]) => { if (newId !== oldId) remapRecipeId(oldId, newId); });
  try { const f = await api('GET', '/api/recipes/shared'); SHARED_RECIPES = f.recipes || {}; SREC_REV = f.rev || 0; } catch (e) { }
  S.customRecipes = {}; S.recipesShared = 1; rebuildCatalog(); saveState();
  if (r.added) toast(`${r.added} recipe${r.added === 1 ? '' : 's'} shared with everyone on this server`);
}
function remapRecipeId(oldId, newId) {
  Object.values(S.plan || {}).forEach(e => { if (e && e.m) Object.keys(e.m).forEach(sl => { if (e.m[sl] === oldId) e.m[sl] = newId; }); });
  [S.favRecipes, S.recipeOff].forEach(o => { if (o && o[oldId] != null) { o[newId] = o[oldId]; delete o[oldId]; } });
  Object.keys(S.importMap || {}).forEach(k => { if (S.importMap[k] === oldId) S.importMap[k] = newId; });
}
const foodLabel = id => { const g = ING[id]; return g ? g.n + (g.brand ? ' · ' + g.brand : '') : id; };
const pantryName = id => { const g = ING[id]; return !g ? 'Removed food' : g.dry ? g.dryName : g.n; };
const canScan = () => AUTH.mode === 'server';
const scanBtnHTML = (mode = 'today', cls = '', date = '') => canScan() ? `<button class="btn ${cls}" data-act="scan" data-v="${mode}" ${date ? `data-d="${date}"` : ''} title="${mode === 'pantry' ? 'Scan groceries into the pantry' : `Scan a barcode to add it to ${date && date !== todayISO() ? fmtDate(date) : 'today'}`}">${icon('scan')}Scan</button>` : '';
const addFoodBtnHTML = (date = '', cls = '') => `<button class="btn ${cls}" data-act="qa-pick" ${date ? `data-d="${date}"` : ''} title="Add a snack or any food to ${date && date !== todayISO() ? fmtDate(date) : 'today'}">${icon('plus')}Add food</button>`;

/* ---------- scanner ---------- */
let SCN = null;
function openScanner(mode, date, draft) {
  if (mode !== 'gym' && !canScan()) { toast('Scanning needs the FORGE 90 server.'); return; }
  scanStop(); SCN = { mode, date: date || todayISO(), added: [], last: '', lastAt: 0, draft: draft || null };
  const gym = mode === 'gym';
  modal(`<div class="scan-m"><div class="row"><h2 style="flex:1">${gym ? 'Scan your membership card' : mode === 'pantry' ? 'Scan into the pantry' : 'Scan a barcode'}</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div class="tiny muted" style="margin:2px 0 10px">${gym ? 'Hold the card or key tag flat, with the whole barcode inside the box. Most gym barcodes work, including QR codes on phones that can read them.' : mode === 'pantry' ? 'Each scan adds one package with a typical use-by date — keep scanning, then fix dates or amounts on the Pantry page.' : `Scan a snack or meal to add it to ${SCN.date === todayISO() ? 'today' : fmtDate(SCN.date, { weekday: 'long', month: 'short', day: 'numeric' })}.`}</div>
    <div class="scan-view" id="scan-view"><video id="scan-video" playsinline muted></video><div class="scan-guide"></div><div class="scan-msg" id="scan-msg">Starting the camera…</div>
      <button type="button" class="btn sm scan-torch hidden" id="scan-torch" data-act="scan-torch">${icon('bolt')}Light</button></div>
    ${gym ? `<div class="row wrap" style="gap:8px;margin-top:10px"><button type="button" class="btn" data-act="gym-type">${icon('edit')}Type the number instead</button></div>` : `<form class="row" data-form="scan-code" style="gap:8px;margin-top:10px"><input class="inp" id="scan-code" inputmode="numeric" pattern="[0-9 ]*" placeholder="Or type the barcode number" autocomplete="off" style="flex:1"><button class="btn" type="submit">Look up</button></form>
      <div class="row" style="margin-top:8px"><button type="button" class="btn sm ghost" style="flex:1" data-act="food-by-name" data-v="${mode}" data-d="${esc(date || todayISO())}" data-tab="online">${icon('search')}Search online by name instead</button></div>`}
    <label class="btn sm ghost scan-photo">${icon('upload')}<span class="scan-photo-t">Use a photo instead</span><input type="file" accept="image/*" capture="environment" data-input="scan-photo" hidden></label>
    ${mode === 'pantry' ? `<div class="scan-added" id="scan-added">${scanAddedHTML()}</div>` : ''}</div>`, 'scan-modal');
  scanStart();
}
/* the "added this session" list: rebuilt from SCN.added so it survives reopening the scanner
   (cancelling a new-product form drops back here and the list has to come back with it) */
function scanAddedHTML() {
  if (!SCN || SCN.mode !== 'pantry' || !SCN.added.length) return '';
  const rows = SCN.added.slice(0, 12).map(e => `<div class="scan-row"><span class="sr-ok">${icon('check')}</span><div class="sr-t"><b>${esc(foodLabel(e.food))}</b><span class="tiny muted">${esc(pantryQtyText(e.food, packInfo(e.food).P * e.n))}${e.base > 0 ? ` · ${esc(pantryQtyText(e.food, e.base))} already here` : ''}</span></div>
    <div class="qstep">${scanStepHTML(e, 'scan')}</div></div>`).join('');
  const n = SCN.added.reduce((a, e) => a + e.n, 0);
  return `<div class="tiny muted">Added this session</div>${rows}${SCN.added.length > 12 ? `<div class="tiny muted">…and ${SCN.added.length - 12} more</div>` : ''}
    <button type="button" class="btn sm primary scan-rev" data-act="scan-review">${icon('list')}Review ${n} item${n === 1 ? '' : 's'}</button>`;
}
const scanStepHTML = (e, ns) => `<button type="button" class="btn icon sm" data-act="${ns}-less" data-f="${esc(e.food)}" aria-label="One fewer">${icon('minus')}</button><b class="qn">${e.n}</b><button type="button" class="btn icon sm" data-act="${ns}-more" data-f="${esc(e.food)}" aria-label="One more">${icon('plus')}</button>`;
function scanPaint() { const el = $('#scan-added'); if (el) el.innerHTML = scanAddedHTML(); }
/* one row per food per scanning session; scanning the same barcode again bumps its count.
   The row a scan lands on may already have held stock (pantryAdd merges by use-by date),
   so the count is a delta on top of `base` — dropping to zero leaves what was there before. */
function scanCount(food, n) {
  if (!SCN) return;
  const e = SCN.added.find(x => x.food === food); if (!e) return;
  n = Math.max(0, Math.round(n));
  const q = Math.round((e.base + packInfo(food).P * n) * 100) / 100;
  if (!n && !(e.base > 0)) pantryDel(e.itemId);
  else pantrySet(e.itemId, { qty: q });
  e.n = n; if (!n) SCN.added = SCN.added.filter(x => x !== e);
  if (/^#\/(pantry|grocery)/.test(location.hash)) render();
}
function scanMsg(t, cls) { const m = $('#scan-msg'); if (m) { m.textContent = t; m.className = 'scan-msg ' + (cls || ''); } }
async function scanStart() {
  const v = $('#scan-video'); const me = SCN; if (!v || !me) return;
  const gone = () => SCN !== me || !document.body.contains(v);
  const noLive = t => { if (gone()) return; scanMsg(t, 'warn'); const ph = $('#modal .scan-photo'); if (ph) { ph.classList.remove('ghost'); ph.classList.add('primary'); ph.querySelector('.scan-photo-t').textContent = 'Take a photo of the barcode'; } };
  if (!window.isSecureContext) { noLive('The live camera needs HTTPS. Take a photo of the barcode instead, or type the number.'); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { noLive('This browser can’t open the camera here. Take a photo instead, or type the number.'); return; }
  try { me.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); }
  catch (e) { noLive(e && e.name === 'NotAllowedError' ? 'Camera access was blocked. Allow it in the browser’s site settings, or take a photo instead.' : 'No camera found. Take a photo of the barcode or type the number.'); return; }
  if (gone()) { scanStop(me); return; }
  v.srcObject = me.stream; try { await v.play(); } catch (e) { }
  const track = me.stream.getVideoTracks()[0]; const caps = track && track.getCapabilities ? track.getCapabilities() : {};
  if (caps.torch) { const t = $('#scan-torch'); if (t) t.classList.remove('hidden'); }
  scanMsg('Line the barcode up inside the box');
  let detector = null;
  const gym = me.mode === 'gym'; const kinds = gym ? Object.keys(BD_FMT) : ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
  if ('BarcodeDetector' in window) { try { const f = await window.BarcodeDetector.getSupportedFormats(); const want = kinds.filter(x => f.includes(x)); if (want.length) detector = new window.BarcodeDetector({ formats: want }); } catch (e) { detector = null; } }
  const cv = document.createElement('canvas'); const ctx = cv.getContext('2d', { willReadFrequently: true });
  const tick = async () => {
    if (gone()) { scanStop(me); return; }
    if (!me.busy && v.readyState >= 2 && v.videoWidth) {
      let code = null, fmt = null;
      try {
        if (detector) { const r = await detector.detect(v); if (r && r[0]) { code = r[0].rawValue; fmt = BD_FMT[r[0].format] || r[0].format; } }
        if (!code && (!detector || gym)) { const W = Math.min(1280, v.videoWidth), H = Math.round(v.videoHeight * W / v.videoWidth); cv.width = W; cv.height = H; ctx.drawImage(v, 0, 0, W, H); const img = ctx.getImageData(0, 0, W, H);
          if (gym) { const x = bcDecodeAny(img); if (x) { code = x.code; fmt = x.fmt; } } else code = bcDecodeImage(img); }
      } catch (e) { }
      if (code && !gone()) scanFound(code, fmt);
    }
    me.timer = setTimeout(tick, detector ? 120 : 160);
  };
  tick();
}
function scanStop(sess) { const x = sess || SCN; if (!x) return; clearTimeout(x.timer); if (x.stream) x.stream.getTracks().forEach(t => t.stop()); x.stream = null; }
async function scanFound(raw, fmt) {
  if (SCN && SCN.mode === 'gym') { if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) { } gymScanned(String(raw), fmt); return; }
  const code = gtinNorm(raw); if (!/^\d{8}$|^\d{13,14}$/.test(code)) return;
  if (SCN.last === code && Date.now() - SCN.lastAt < 3000) return; SCN.last = code; SCN.lastAt = Date.now();
  if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) { }
  SCN.busy = true; scanMsg('Found ' + code + ' — looking it up…', 'ok');
  try { const id = await barcodeFood(code); if (id) scanUse(id); else if (SCN) SCN.busy = false; }
  catch (e) { scanMsg(e.message, 'warn'); if (SCN) SCN.busy = false; }
}
async function barcodeFood(code) {
  const local = Object.values(ING).find(g => g.gtin === code); if (local) return local.id;
  const r = await api('GET', '/api/barcode/' + encodeURIComponent(code));
  if (r.food) { sharedAdd(r.food); return r.food.id; }
  return await productForm(r.gtin || code, r.suggest, r.error);
}
function scanUse(id) {
  if (!SCN) return;
  if (SCN.mode === 'pantry') {
    const e = SCN.added.find(x => x.food === id);
    if (e) { scanCount(id, e.n + 1); scanMsg(`${foodLabel(id)} again — that’s ${e.n}`, 'ok'); }
    else {
      const P = packInfo(id).P;
      const before = pantryItems().find(x => x.food === id && (x.exp || '') === (defaultExp(id) || ''));
      const base = before ? Math.max(0, Math.round((+before.qty) * 100) / 100) : 0;
      const it = pantryAdd(id, null, null, 'scan'); if (!it) { SCN.busy = false; return; }
      SCN.added.unshift({ food: id, itemId: it.id, n: 1, base });
      if (/^#\/(pantry|grocery)/.test(location.hash)) render();
      scanMsg(`Added ${foodLabel(id)} — scan the next item`, 'ok');
    }
    scanPaint(); SCN.busy = false; return;
  }
  const d = SCN.date; scanStop(); SCN = null; quickAdd(id, d);
}

/* ---------- adding (or fixing) a product on the shared food list ---------- */
const PRODUCT_SUBS = [['bars', 'Protein & snack bars'], ['rtd', 'Protein shakes'], ['whey', 'Protein powder'], ['chips', 'Chips & salty snacks'], ['crackers', 'Crackers & rice cakes'], ['sweets', 'Sweets & desserts'], ['cereal', 'Cereal & granola'], ['bread', 'Bread'], ['wraps', 'Tortillas & wraps'], ['pasta', 'Pasta & noodles'], ['rice', 'Rice'], ['yogurt', 'Yogurt'], ['milk', 'Milk'], ['milk_alt', 'Plant milk'], ['cheese', 'Cheese'], ['deli', 'Deli meat'], ['jerky', 'Jerky'], ['frozen_meals', 'Frozen & ready meals'], ['soups', 'Soups & chili'], ['sauces', 'Sauces'], ['condiments', 'Condiments'], ['spices', 'Spices & baking'], ['peanuts', 'Peanut butter & peanuts'], ['tree_nuts', 'Nuts'], ['juice', 'Juice & sports drinks'], ['zero_drinks', 'Zero-calorie drinks'], ['soda', 'Soda & energy drinks']];
const PRODUCT_AISLE = { bars: 'Snacks', rtd: 'Beverages', whey: 'Pantry', chips: 'Snacks', crackers: 'Snacks', sweets: 'Snacks', cereal: 'Grains & Bread', bread: 'Grains & Bread', wraps: 'Grains & Bread', pasta: 'Grains & Bread', rice: 'Grains & Bread', yogurt: 'Dairy & Eggs', milk: 'Dairy & Eggs', milk_alt: 'Dairy & Eggs', cheese: 'Dairy & Eggs', deli: 'Deli & Prepared', jerky: 'Snacks', frozen_meals: 'Frozen', soups: 'Pantry', sauces: 'Pantry', condiments: 'Pantry', spices: 'Pantry', peanuts: 'Pantry', tree_nuts: 'Snacks', juice: 'Beverages', zero_drinks: 'Beverages', soda: 'Beverages' };
function productGuessSub(s) {
  const c = ((s && s.categories) || []).join(' ') + ' ' + ((s && s.name) || '');
  const rules = [[/protein-?bar|snack-?bar|granola-?bar|\bbars?\b/i, 'bars'], [/protein-?shake|protein-?drink/i, 'rtd'], [/protein-?powder|whey/i, 'whey'], [/chips|crisps/i, 'chips'], [/cracker|rice-?cake/i, 'crackers'], [/yogh?urt|skyr/i, 'yogurt'], [/cheese/i, 'cheese'],
    [/plant-?milk|almond-?milk|oat-?milk|soy-?milk/i, 'milk_alt'], [/\bmilks?\b|dairy-?drink/i, 'milk'], [/cereal|granola|muesli/i, 'cereal'], [/bread|bagel|bun/i, 'bread'], [/tortilla|wrap/i, 'wraps'], [/pasta|noodle/i, 'pasta'], [/\brice\b/i, 'rice'], [/jerky/i, 'jerky'],
    [/frozen|ready-?meal|meals\b/i, 'frozen_meals'], [/soup|chili/i, 'soups'], [/sauce/i, 'sauces'], [/condiment|ketchup|mustard|dressing/i, 'condiments'], [/peanut/i, 'peanuts'], [/\bnuts?\b|almond|cashew|pistachio|walnut/i, 'tree_nuts'], [/juice|sports-?drink/i, 'juice'], [/diet|zero|sugar-?free-?(soda|drink)|water/i, 'zero_drinks'], [/soda|soft-?drink|energy-?drink/i, 'soda'], [/chocolate|candy|confection|cookie|biscuit|dessert|ice-?cream/i, 'sweets']];
  const hit = rules.find(([re]) => re.test(c)); return hit ? hit[1] : 'bars';
}
let PF = null;
const pfVal = v => v == null || v === '' ? '' : Math.round(v * 10) / 10;
const pfInt = v => v == null || v === '' ? '' : Math.max(0, Math.round(+v || 0));   // package size, serving size and item weight are whole units
function productFieldsHTML(v, lock) {
  const dis = lock ? 'disabled' : ''; const b = v.basis;
  return `<div class="field" style="grid-column:1/-1"><label>Name</label><input class="inp" name="n" value="${esc(v.n || '')}" required maxlength="80" placeholder="e.g. Chocolate protein bar" ${dis}></div>
    <div class="field"><label>Brand</label><input class="inp" name="brand" value="${esc(v.brand || '')}" maxlength="60" ${dis}></div>
    <div class="field"><label>Type</label><select class="inp" name="sub" ${dis}>${PRODUCT_SUBS.concat(PRODUCT_SUBS.some(x => x[0] === v.sub) || !v.sub ? [] : [[v.sub, SUB_LABEL[v.sub] || v.sub]]).map(([k, l]) => `<option value="${k}" ${k === v.sub ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
    <div class="field"><label>Nutrition is for</label><select class="inp" name="basis" data-input="pf-basis" ${dis || (v.edit ? 'disabled' : '')}><option value="g" ${b === 'g' ? 'selected' : ''}>100 g</option><option value="ml" ${b === 'ml' ? 'selected' : ''}>100 ml</option><option value="u" ${b === 'u' ? 'selected' : ''}>1 item (bar, bottle…)</option></select></div>
    <div class="field pf-unit ${b === 'u' ? '' : 'hidden'}"><label>Item name & weight</label><div class="row" style="gap:6px"><input class="inp" name="u" value="${esc(v.u || 'item')}" style="width:50%" ${dis}><input class="inp" type="number" min="1" step="1" name="g" value="${esc(pfInt(v.g))}" inputmode="numeric" placeholder="grams" style="width:50%" ${dis}></div></div>
    <div class="field"><label>Calories</label><input class="inp" type="number" min="0" step="0.1" name="k" value="${pfVal(v.k)}" required ${dis}></div>
    <div class="field"><label>Protein (g)</label><input class="inp" type="number" min="0" step="0.1" name="p" value="${pfVal(v.p)}" required ${dis}></div>
    <div class="field"><label>Carbs (g)</label><input class="inp" type="number" min="0" step="0.1" name="c" value="${pfVal(v.c)}" required ${dis}></div>
    <div class="field"><label>Fat (g)</label><input class="inp" type="number" min="0" step="0.1" name="f" value="${pfVal(v.f)}" required ${dis}></div>
    <div class="field"><label>Package size <span class="muted pf-pku" style="font-weight:500">(${b === 'u' ? 'items' : b})</span></label><input class="inp" type="number" min="0" step="1" name="pk" value="${esc(pfInt(v.pk))}" inputmode="numeric" ${dis}></div>
    <div class="field"><label>Serving size (${b === 'ml' ? 'ml' : 'g'})</label><input class="inp" type="number" min="0" step="1" name="srv" value="${esc(pfInt(v.srv))}" inputmode="numeric" ${dis || (b === 'u' ? 'disabled' : '')}></div>`;
}
function productForm(gtin, sug, error) {
  return new Promise(resolve => {
    const s = sug || {}; const per = s.per100 || {};
    const unitWord = (String(s.srvText || '').match(/^\s*1\s+([a-z]+)/i) || [])[1];
    const perItem = !!(unitWord && !/^(g|gram|grams|ml|oz|cup|cups|tbsp|tsp|serving|portion)$/i.test(unitWord) && s.srv > 0);
    const scale = perItem ? s.srv / 100 : 1; const x = k => per[k] != null ? per[k] * scale : null;
    const v = { n: s.name, brand: s.brand, sub: productGuessSub(s), basis: perItem ? 'u' : s.unit === 'ml' ? 'ml' : 'g', u: perItem ? unitWord.toLowerCase() : 'item', g: perItem ? s.srv : null,
      k: x('k'), p: x('p'), c: x('c'), f: x('f'), pk: perItem ? (s.pk && s.srv ? Math.max(1, Math.round(s.pk / s.srv)) : 1) : s.pk, srv: perItem ? null : s.srv };
    PF = { gtin, resolve, sug: s };
    scanStop();
    modal(`<div class="prod-m"><div class="row"><h2 style="flex:1">${sug ? 'Add this product?' : 'New product'}</h2><button class="btn icon ghost" data-act="prod-cancel" aria-label="Close">${icon('x')}</button></div>
      <div class="prod-head">${s.image ? `<img src="${esc(s.image)}" alt="" loading="lazy" onerror="this.remove()">` : `<span class="prod-ph">${icon('scan')}</span>`}<div><div class="tiny muted">Barcode ${esc(gtin)}</div>
        <div class="small">${sug ? 'Found on <b>Open Food Facts</b>. Check the details, then add it to the food list — everyone on this server can use it after that.' : `${error ? esc(error) + ' ' : 'This barcode isn’t in Open Food Facts. '}Enter it from the nutrition label and it’s added to the food list for everyone.`}</div></div></div>
      <form data-form="product" class="grid g2" style="gap:12px;margin-top:12px">${productFieldsHTML(v)}
        <div class="row" style="grid-column:1/-1;justify-content:flex-end;gap:8px"><button type="button" class="btn" data-act="prod-cancel">Not now</button><button class="btn primary" type="submit">Add to food list</button></div></form>
      ${sug ? '<div class="tiny muted" style="margin-top:8px">Product data © Open Food Facts contributors, available under the Open Database License.</div>' : ''}</div>`, 'prod-modal');
  });
}
function sharedFoodEditor(id) {
  const g = ING[id]; if (!g || !g.shared) return;
  const mine = AUTH.user && (g.by === AUTH.user.id || isAdmin());
  const v = { edit: id, n: g.n, brand: g.brand, sub: g.sub, basis: g.u ? 'u' : g.ml ? 'ml' : 'g', u: g.u, g: g.g, k: g.k, p: g.p, c: g.c, f: g.f, pk: g.pk, srv: g.srv };
  PF = { gtin: g.gtin, edit: id, resolve: null };
  modal(`<div class="prod-m"><div class="row"><h2 style="flex:1">${mine ? 'Edit product' : 'Product details'}</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div class="prod-head"><span class="prod-ph">${icon('scan')}</span><div>${g.gtin ? `<div class="tiny muted">Barcode ${esc(g.gtin)}</div>` : ''}<div class="small">On the shared food list — added by ${esc(g.byName || 'someone')}${g.at ? ' on ' + esc(fmtDate(String(g.at).slice(0, 10), { month: 'short', day: 'numeric', year: 'numeric' })) : ''}${g.src === 'off' ? ' from Open Food Facts' : ''}. ${mine ? 'Changes apply for everyone.' : 'Only they or an administrator can change it.'}</div></div></div>
    <form data-form="product" class="grid g2" style="gap:12px;margin-top:12px">${productFieldsHTML(v, !mine)}
      <div class="row wrap" style="grid-column:1/-1;justify-content:flex-end;gap:8px">${isAdmin() ? `<button type="button" class="btn danger" data-act="prod-del" data-id="${id}" style="margin-right:auto">${icon('trash')}Delete</button>` : ''}<button type="button" class="btn" data-act="close-modal">${mine ? 'Cancel' : 'Close'}</button>${mine ? '<button class="btn primary" type="submit">Save for everyone</button>' : ''}</div></form>
    ${g.src === 'off' ? '<div class="tiny muted" style="margin-top:8px">Product data © Open Food Facts contributors, available under the Open Database License.</div>' : ''}</div>`, 'prod-modal');
}
async function productSave(form) {
  const fd = new FormData(form); const o = Object.fromEntries(fd.entries()); o.a = PRODUCT_AISLE[o.sub] || 'Pantry';
  ['g', 'pk', 'srv'].forEach(k => { if (o[k] !== '' && o[k] != null) o[k] = String(pfInt(o[k])); });   // whole items/grams, whatever Open Food Facts or a typed decimal gave us
  const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
  if (PF && PF.edit) {
    try { const r = await api('PATCH', '/api/foods/shared/' + encodeURIComponent(PF.edit), o); sharedAdd(r.food); PF = null; closeModal(); render(); toast(`${r.food.n} updated for everyone`); }
    catch (e) { btn.disabled = false; toast(e.message); }
    return;
  }
  o.gtin = PF.gtin; o.src = PF.sug && PF.sug.name ? 'off' : 'user';
  try { const r = await api('POST', '/api/foods/shared', o); sharedAdd(r.food); const res = PF.resolve; PF = null; toast(r.existed ? `${r.food.n} was already on the food list` : `${r.food.n} added to the food list for everyone`);
    if (SCN && SCN.mode === 'pantry') { openScannerKeep(); } res(r.food.id); }
  catch (e) { btn.disabled = false; toast(e.message); }
}
function openScannerKeep() { const added = (SCN && SCN.added) || []; openScanner('pantry'); if (SCN) { SCN.added = added; scanPaint(); } }
function scanReview() {
  if (!SCN || !SCN.added.length) return;
  const added = SCN.added; scanStop();
  SCN = { mode: 'pantry', date: todayISO(), added, last: '', lastAt: 0, draft: null, review: true };
  modal(`<div class="scan-rev-m"><div class="row"><h2 style="flex:1">Scanned items</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div class="tiny muted" style="margin:2px 0 10px">Everything here is already in the pantry. Adjust the counts or use-by dates, or take something back off.</div>
    <div id="scan-rev-list">${scanReviewListHTML()}</div>
    <div class="row wrap" style="justify-content:flex-end;gap:8px;margin-top:12px"><button type="button" class="btn" data-act="scan-again">${icon('scan')}Scan more</button><button type="button" class="btn primary" data-act="scan-done">Done</button></div></div>`, 'scan-rev-modal');
}
function scanReviewListHTML() {
  if (!SCN || !SCN.added.length) return '<div class="muted small">Nothing left. Close this and scan again.</div>';
  return SCN.added.map(e => { const it = pantryItems().find(x => x.id === e.itemId);
    return `<div class="sr-row"><div class="sr-t"><b>${esc(foodLabel(e.food))}</b><span class="tiny muted">${esc(pantryQtyText(e.food, packInfo(e.food).P * e.n))}</span></div>
      <div class="qstep">${scanStepHTML(e, 'srv')}</div>
      <input class="inp sm sr-exp" type="date" data-input="sr-exp" data-f="${esc(e.food)}" value="${it && it.exp ? esc(it.exp) : ''}" aria-label="Use by">
      <button type="button" class="btn icon sm ghost" data-act="srv-rm" data-f="${esc(e.food)}" aria-label="Remove">${icon('trash')}</button></div>`;
  }).join('');
}
function scanReviewPaint() { const el = $('#scan-rev-list'); if (el) el.innerHTML = scanReviewListHTML(); }

/* ---------- quick add to a day ---------- */
let QP = null;
function quickPick(date) {
  const d = date || todayISO(); if (!inPlan(d)) { toast('That day isn’t in your plan.'); return; }
  QP = { d };
  modal(`<div class="qp-m"><div class="row"><h2 style="flex:1">Add food to ${d === todayISO() ? 'today' : esc(fmtDate(d, { weekday: 'short', month: 'short', day: 'numeric' }))}</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div class="row" style="gap:8px;margin:10px 0"><input class="inp" type="search" id="qp-q" data-input="qp-q" placeholder="Search foods and scanned products…" style="flex:1;min-width:0" autocomplete="off">${scanBtnHTML('today', '', d)}</div>
    <div class="qp-list" id="qp-list">${qpListHTML('')}</div></div>`, 'qp-modal');
  const q = $('#qp-q'); if (q && window.matchMedia && matchMedia('(pointer: fine)').matches) q.focus();
}
/* The group label is searchable so "stone fruit" finds a plum, but a label hit must never
   outrank a name hit: searching "pear" used to list every apple in the same subgroup first. */
const rxEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function qpWordScore(w, n, br, lbl) {
  if (n === w) return 100;
  if (n.startsWith(w)) return 80;
  if (new RegExp('\\b' + rxEsc(w)).test(n)) return 64;
  if (n.includes(w)) return 40;
  if (br.startsWith(w)) return 26;
  if (br.includes(w)) return 20;
  if (lbl.includes(w)) return 4;
  return 0;
}
function qpRelevance(g, q, words) {
  if (!words.length) return 0;
  const n = g.n.toLowerCase(), br = (g.brand || '').toLowerCase(), lbl = ((SUB_LABEL[g.sub] || '') + ' ' + (g.a || '')).toLowerCase();
  if (/^\d{6,}$/.test(q) && g.gtin && (g.gtin === q || String(g.gtin).endsWith(q))) return 1000;
  let s = 0; words.forEach(w => { s += qpWordScore(w, n, br, lbl); });
  s = s / words.length;
  if (words.length > 1 && n.includes(q)) s += 30;
  return s;
}
function qpListHTML(q, act, d) {
  act = act || 'qa-food'; d = d == null ? (QP ? QP.d : '') : d;
  const qs = String(q || '').trim().toLowerCase();
  const words = qs.split(/\s+/).filter(Boolean);
  const recent = {}; Object.keys(S.plan || {}).sort().slice(-60).forEach((d, i) => ((S.plan[d] || {}).x || []).forEach(x => { recent[x.id] = i + 1; }));
  const hay = g => (g.n + ' ' + (g.brand || '') + ' ' + (SUB_LABEL[g.sub] || '') + ' ' + (g.gtin || '')).toLowerCase();
  const rank = g => (isFavFood(g.id) ? 4 : 0) + (recent[g.id] ? 2 : 0) + (g.shared ? 1 : 0);
  const rel = {}; Object.values(ING).forEach(g => { rel[g.id] = qpRelevance(g, qs, words); });
  const list = Object.values(ING).filter(g => words.every(w => hay(g).includes(w)))
    .sort((a, b) => rel[b.id] - rel[a.id] || rank(b) - rank(a) || (recent[b.id] || 0) - (recent[a.id] || 0) || a.n.length - b.n.length || a.n.localeCompare(b.n));
  const top = list.slice(0, 50);
  return top.map(g => `<button type="button" class="qp-opt" data-act="${act}" data-id="${g.id}" data-d="${esc(d)}"><span class="qp-t"><b>${esc(g.n)}</b><small>${esc([g.brand, SUB_LABEL[g.sub]].filter(Boolean).join(' · '))}</small></span>
      <span class="qp-p">${isFavFood(g.id) ? `<span class="qp-star" title="Favorite">${icon('star')}</span>` : ''}${recent[g.id] ? '<span class="pill">Recent</span>' : ''}${g.shared ? '<span class="pill acc">Scanned</span>' : ''}<span class="tiny muted num">${fmt(g.k)} kcal / ${g.u ? esc(g.u) : g.ml ? '100 ml' : '100 g'}</span></span></button>`).join('')
    + (list.length > top.length ? `<div class="tiny muted" style="padding:8px 4px">${list.length - top.length} more — keep typing to narrow it down.</div>` : '') || `<div class="muted small" style="padding:12px 4px">No foods match.${canScan() ? ' Scan the barcode to add a new product.' : ''}</div>`;
}

let FP = null;
function foodByName(mode, date, ingIndex, tab) {
  scanStop();
  FP = { mode, d: date || (SCN && SCN.date) || todayISO(), i: ingIndex, raw: '', tab: tab === 'online' && onlineFoodOK() ? 'online' : 'list' };
  FO = { q: '', rows: null, busy: false, err: '' };
  /* A receipt pick opens already searching for the cleaned-up line, so the list is filtered
     before the user types anything. */
  if (mode === 'receipt' && RC && RC.rows[ingIndex]) { FP.raw = RC.rows[ingIndex].line.d; FO.q = rcClean(FP.raw); }
  const title = mode === 'pantry' ? 'Add to the pantry by name' : mode === 'foods' ? 'Find a food' : mode === 'ing' ? 'Pick an ingredient' : mode === 'receipt' ? 'Which food is this?' : `Add food to ${FP.d === todayISO() ? 'today' : fmtDate(FP.d, { weekday: 'short', month: 'short', day: 'numeric' })}`;
  modal(`<div class="qp-m"><div class="row"><h2 style="flex:1">${esc(title)}</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div id="fp-body">${fpBodyHTML()}</div></div>`, 'qp-modal');
  fpFocus();
}
const onlineFoodOK = () => AUTH.mode === 'server' && !!AUTH.user;
let FO = null;
function fpFocus() { const q = $(FP && FP.tab === 'online' ? '#fo-q' : '#fp-q'); if (q && window.matchMedia && matchMedia('(pointer: fine)').matches) q.focus(); }
function fpBodyHTML() {
  const mode = FP.mode;
  const tabs = onlineFoodOK() ? `<div class="seg sm" style="margin-bottom:10px">${[['list', 'On your food list'], ['online', 'Search online']].map(([k, l]) => `<button type="button" class="${FP.tab === k ? 'on' : ''}" data-act="fp-tab" data-v="${k}">${l}</button>`).join('')}</div>` : '';
  if (FP.tab === 'online') return tabs + foOnlineHTML();
  const hint = mode === 'pantry' ? 'Pick a food to put one package in the pantry — handy for loose produce and anything without a barcode.'
    : mode === 'foods' ? 'Search everything on the food list, including products other people scanned. Pick one to see or edit it.'
    : mode === 'ing' ? 'Search the whole food database. Your recipe is untouched while this is open.'
    : mode === 'receipt' ? 'Search your food list, look the product up online, or add it yourself. Whichever you pick is remembered for this store.'
    : 'Search the food list and anything scanned on this server.';
  return tabs + `${mode === 'receipt' && FP.raw ? `<div class="fp-from">${esc(FP.raw)}</div>` : ''}<div class="tiny muted" style="margin:2px 0 8px">${esc(hint)}</div>
    <div class="row" style="gap:8px;margin-bottom:10px"><input class="inp" type="search" id="fp-q" data-input="fp-q" placeholder="Search foods and scanned products…" style="flex:1;min-width:0" autocomplete="off" value="${esc(FO.q || '')}">${mode !== 'foods' && mode !== 'ing' && canScan() ? `<button type="button" class="btn" data-act="fp-scan">${icon('scan')}Scan</button>` : ''}</div>
    <div class="qp-list" id="fp-list">${qpListHTML(FO.q || '', 'fp-pick', FP.d)}</div>
    ${mode === 'foods' || mode === 'ing' || mode === 'receipt' ? `<div class="row" style="justify-content:flex-end;margin-top:10px"><button type="button" class="btn" data-act="${mode === 'ing' ? 'food-new-inline' : mode === 'receipt' ? 'food-new-for-receipt' : 'food-new-from-pick'}">${icon('plus')}None of these — create a new food</button></div>` : ''}`;
}
function foOnlineHTML() {
  const rows = FO.rows;
  const body = FO.busy ? `<div class="qp-empty">${icon('loop')}<span>Searching Open Food Facts…</span></div>`
    : FO.err ? `<div class="note warn">${icon('info')}<span>${esc(FO.err)}</span></div>`
    : rows == null ? `<div class="qp-empty">${icon('search')}<span>Type a product name and press Search. Brand names work best.</span></div>`
    : !rows.length ? `<div class="qp-empty">${icon('search')}<span>Nothing on Open Food Facts matched “${esc(FO.q)}”. Try fewer words, or add the food yourself.</span></div>`
    : rows.map((r, i) => `<button type="button" class="qp-opt fo-opt" data-act="fo-pick" data-i="${i}">
        ${r.image ? `<img class="fo-img" src="${esc(r.image)}" alt="" loading="lazy" onerror="this.remove()">` : `<span class="fo-img ph">${icon('scan')}</span>`}
        <span class="qp-t"><b>${esc(r.name)}</b><small>${esc([r.brand, r.quantity].filter(Boolean).join(' · '))}</small></span>
        <span class="qp-p">${r.have ? '<span class="pill acc">On your list</span>' : ''}<span class="tiny muted num">${fmt(r.per100.k)} kcal · ${fmt(r.per100.p)}P / 100 ${esc(r.unit)}</span></span></button>`).join('');
  return `<div class="tiny muted" style="margin:2px 0 8px">Search Open Food Facts, the same product database the barcode scanner reads. Pick one and you can check the numbers before it joins this server's food list.</div>
    <form class="row" data-form="fo-search" style="gap:8px;margin-bottom:10px"><input class="inp" type="search" id="fo-q" placeholder="e.g. Fage 0% yogurt" style="flex:1;min-width:0" autocomplete="off" value="${esc(FO.q || '')}"><button class="btn primary" type="submit" ${FO.busy ? 'disabled' : ''}>${icon('search')}Search</button>${canScan() ? `<button type="button" class="btn" data-act="fp-scan" title="Scan a barcode instead">${icon('scan')}</button>` : ''}</form>
    <div class="qp-list" id="fo-list">${body}</div>
    <div class="tiny muted" style="margin-top:8px">Product data © Open Food Facts contributors, available under the Open Database License.</div>`;
}
function fpRepaint() { const b = $('#fp-body'); if (b) { b.innerHTML = fpBodyHTML(); fpFocus(); } }
async function foSearch(q) {
  if (!FP || !FO) return;
  FO.q = String(q || '').trim(); FO.err = ''; FO.rows = null;
  if (FO.q.length < 2) { FO.err = 'Type at least two letters.'; fpRepaint(); return; }
  FO.busy = true; fpRepaint();
  try { const r = await api('GET', '/api/foods/search?q=' + encodeURIComponent(FO.q)); if (!FO) return; FO.rows = r.results || []; FO.err = r.error || ''; }
  catch (e) { if (FO) FO.err = e.message; }
  if (FO) { FO.busy = false; fpRepaint(); }
}
async function foPick(i) {
  const row = FO && (FO.rows || [])[i]; if (!row || !FP) return;
  const m = FP.mode, d = FP.d, ii = FP.i;
  let id = null;
  try { id = row.have ? await barcodeFood(row.gtin) : await productForm(row.gtin, row, null); }
  catch (e) { toast(e.message); return; }
  if (!id) return;
  fpUse(id, m, d, ii);
}
function fpPick(id) {
  const m = FP ? FP.mode : 'today'; const d = FP ? FP.d : todayISO(); const ii = FP ? FP.i : null;
  fpUse(id, m, d, ii);
}
function fpUse(id, m, d, ii) {
  const raw = FP ? FP.raw : '';
  FP = null; FO = null;
  if (m === 'receipt') { closeModal(); rcPicked(ii, id); return; }
  if (m === 'ing') { closeModal(); reSetIng(ii, id); return; }
  if (m === 'foods') { const g = ING[id]; closeModal(); if (g && g.shared) sharedFoodEditor(id); else foodEditor(id); return; }
  if (m === 'pantry') {
    if (SCN && SCN.mode === 'pantry') { scanUse(id); openScannerKeep(); return; }
    const it = pantryAdd(id, null, null, 'manual'); closeModal(); render();
    toast(it ? `${foodLabel(id)} added to the pantry` : 'That food has no package size set');
    return;
  }
  SCN = null; quickAdd(id, d);
}
const slotNow = () => { const h = new Date().getHours() + new Date().getMinutes() / 60; return h < 10.5 ? 'breakfast' : h < 14.5 ? 'lunch' : h < 17 ? 'snack1' : h < 20.5 ? 'dinner' : 'snack2'; };
let QA = null;
function quickAdd(id, date) {
  const g = ING[id]; if (!g) return; const d = date || todayISO();
  if (!inPlan(d)) { closeModal(); toast(`${d === todayISO() ? 'Today isn’t' : 'That day isn’t'} in your plan, so there’s nothing to add it to.`); return; }
  ensurePlanThrough(d);
  const srv = +g.srv > 0 ? +g.srv : 0;
  const units = g.u ? [['u', 1, g.u]] : [].concat(srv ? [['srv', srv, `serving (${fmt(srv)} ${g.ml ? 'ml' : 'g'})`]] : [], +g.pk > 1 ? [['pk', +g.pk, `package (${fmt(+g.pk)} ${g.ml ? 'ml' : 'g'})`]] : [], [['g', 1, g.ml ? 'ml' : 'g']]);
  QA = { id, d, units, unit: units[0][0], n: units[0][0] === 'g' ? 100 : 1, slot: slotNow() };
  renderQuickAdd();
}
function qaAmount() { const u = QA.units.find(x => x[0] === QA.unit); return Math.max(0, +QA.n || 0) * u[1]; }
function renderQuickAdd() {
  const g = ING[QA.id]; const amt = qaAmount(); const m = ingMacros(QA.id, amt);
  modal(`<div class="qa-m"><div class="row"><h2 style="flex:1">Add to ${QA.d === todayISO() ? 'today' : fmtDate(QA.d)}</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div class="qa-food"><b>${esc(g.n)}</b>${g.brand ? `<span class="tiny muted">${esc(g.brand)}</span>` : ''}${favFoodBtnHTML(QA.id)}</div>
    <div class="grid g2" style="gap:12px;margin-top:10px">
      <div class="field"><label>Amount</label><div class="row" style="gap:6px"><input class="inp" type="number" min="0" step="${QA.unit === 'g' ? 5 : 0.5}" value="${QA.n}" data-input="qa-n" style="width:90px"><select class="inp" data-input="qa-unit">${QA.units.map(([k, , l]) => `<option value="${k}" ${QA.unit === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div></div>
      <div class="field"><label>With</label><select class="inp" data-input="qa-slot">${DAY_SLOTS.map(s => `<option value="${s}" ${QA.slot === s ? 'selected' : ''}>${SLOT_LABEL[s]}</option>`).join('')}</select></div></div>
    <div class="qa-mac" id="qa-mac"><b>${fmt(m.k)}</b> kcal · <span style="color:var(--prot)">${fmt(m.p)}P</span> · <span style="color:var(--carb)">${fmt(m.c)}C</span> · <span style="color:var(--fat)">${fmt(m.f)}F</span></div>
    <div class="tiny muted">It counts toward the day’s macros, and the rest of the day’s portions shrink to make room.</div>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:14px"><button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="qa-save">${icon('plus')}Add</button></div></div>`, 'sm qa-modal');
}
function qaSave() {
  const amt = qaAmount(); if (!(amt > 0)) { toast('Enter an amount'); return; }
  const e = S.plan[QA.d]; if (!e) return; pushUndo('quick add');
  e.x = (e.x || []).concat([{ id: QA.id, amt: Math.round(amt * 100) / 100, slot: QA.slot }]);
  saveState(); closeModal(); render(); toast(`${ING[QA.id].n} added to ${SLOT_LABEL[QA.slot].toLowerCase()} ${QA.d === todayISO() ? 'today' : 'on ' + fmtDate(QA.d)}`, true); QA = null;
}
function extraRemove(d, i) { const e = S.plan[d]; if (!e || !e.x || !e.x[i]) return; pushUndo('remove added food'); const x = e.x.splice(i, 1)[0]; if (!e.x.length) delete e.x; saveState(); render(); toast(`${ING[x.id] ? ING[x.id].n : 'Item'} removed`, true); }
function extrasHTML(day, slot) {
  const xs = (day.extras || []).filter(x => !slot || x.slot === slot);
  /* A product an admin deleted drops out of day.extras, but its record stays on the day with
     no way to clear it. Show those as orphans so they can be removed. */
  const raw = ((S.plan[day.date] || {}).x || []);
  const orphans = raw.map((x, i) => ({ x, i })).filter(({ x, i }) => x && !ING[x.id] && (!slot || x.slot === slot) && !xs.some(e => e.i === i));
  if (!xs.length && !orphans.length) return '';
  return `<div class="xtras ${slot ? '' : 'all'}">${xs.map(x => `<span class="xtra">${icon('plus')}<span class="xtra-t">${slot ? '' : `<span class="xtra-s">${SLOT_LABEL[x.slot] || ''}</span>`}${esc(ING[x.id].n)} <b>${esc(amountText(x.id, x.amt).main)}</b> <span class="muted num">${fmt(x.m.k)} kcal · ${fmt(x.m.p)}P</span></span><button type="button" class="xtra-x" data-act="x-rm" data-d="${day.date}" data-i="${x.i}" title="Remove" aria-label="Remove ${esc(ING[x.id].n)}">${icon('x')}</button></span>`).join('')}
    ${orphans.map(({ i }) => `<span class="xtra gone">${icon('info')}<span class="xtra-t">${slot ? '' : `<span class="xtra-s">${SLOT_LABEL[raw[i].slot] || ''}</span>`}<span class="muted">Food no longer on the list</span></span><button type="button" class="xtra-x" data-act="x-rm" data-d="${day.date}" data-i="${i}" title="Remove" aria-label="Remove">${icon('x')}</button></span>`).join('')}</div>`;
}

/* ---------- favorite foods ---------- */
const isFavFood = id => !!(S.favFoods || {})[id];
function favFoodBtnHTML(id) { const on = isFavFood(id); return `<button type="button" class="fav-btn sm ${on ? 'on' : ''}" data-act="fav-food" data-id="${id}" aria-pressed="${on}" title="${on ? 'Favorite food — click to remove' : 'Add to favorite foods'}">${icon('star')}</button>`; }
function toggleFavFood(id) { S.favFoods = S.favFoods || {}; if (S.favFoods[id]) delete S.favFoods[id]; else S.favFoods[id] = 1; saveState(); $$(`.fav-btn[data-act="fav-food"][data-id="${id}"]`).forEach(b => { const on = isFavFood(id); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); }

/* ---------- pantry ---------- */
const PANTRY_SOON = 14;
function pantryShared() { return typeof SY !== 'undefined' && SY && SY.data && SY.data.status === 'active' && SY.data.pantry && SY.data.pantry.on; }
function pantryItems() { return pantryShared() ? (SY.data.pantry.items || []) : (S.pantry || []); }
function pantryInUse() { return pantryShared() || (S.pantry || []).length > 0; }
/* `from` is the day the food was actually bought, which a receipt supplies and a barcode scan
   does not. Counting shelf life from the purchase date rather than from today is the whole
   point of reading the date off a receipt: a Saturday shop scanned on Tuesday should not give
   the chicken three extra days. */
function defaultExp(id, from) {
  const g = ING[id]; if (!g) return null; const w = packInfo(id).w; let days;
  if (g.a === 'Frozen') days = 180; else if (w >= .9) days = 5; else if (w >= .6) days = 10; else if (w >= .4) days = 21; else if (w >= .2) days = 60; else days = 365;
  return addDays(from || todayISO(), days);
}
const pid = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function pantryQtyText(id, q) { const g = ING[id]; if (!g) return ''; return g.u ? amountText(id, q).main : groceryText(id, q).qty; }
async function pantryOps(ops, consume) {
  try { const r = await api('POST', '/api/sync/pantry', { ops, consume }); SY.data.pantry = Object.assign(SY.data.pantry || {}, r.pantry);
    S.pantrySharedCopy = r.pantry.items; S.pantrySharedRev = r.pantry.rev; if (r.used && (!S.pantryThrough || r.used > S.pantryThrough)) S.pantryThrough = r.used; saveState();
    if (/^#\/(pantry|grocery)/.test(location.hash)) render(); return true; }
  catch (e) { toast(e.message); if (/^#\/(pantry|grocery)/.test(location.hash)) { syncFetch(true); } return false; }
}
function pantryAdd(food, qty, exp, src) {
  const g = ING[food]; if (!g) return;
  const it = { id: pid(), food, qty: Math.round((qty != null ? +qty : packInfo(food).P) * 100) / 100, exp: exp === undefined || exp === null ? defaultExp(food) : exp, added: todayISO() };
  if (!(it.qty > 0)) return;
  if (!S.pantryThrough) S.pantryThrough = addDays(todayISO(), -1);
  const same = pantryItems().find(x => x.food === food && (x.exp || '') === (it.exp || ''));
  if (same) { const qty2 = Math.round((+same.qty + it.qty) * 100) / 100; pantrySet(same.id, { qty: qty2, added: todayISO() }); return pantryItems().find(x => x.id === same.id) || same; }
  if (pantryShared()) { SY.data.pantry.items = (SY.data.pantry.items || []).concat([it]); pantryOps([{ op: 'add', item: it }]); }
  else { S.pantry = (S.pantry || []).concat([it]); saveState(); }
  return it;
}
// fold any duplicates already sitting in the pantry (added before merging existed, or arrived by sync)
function pantryMergeDupes() {
  const items = pantryItems(); const seen = {}; const merge = []; const drop = [];
  items.forEach(x => { const k = x.food + '|' + (x.exp || '');
    if (!seen[k]) { seen[k] = x; return; }
    seen[k].qty = Math.round((+seen[k].qty + +x.qty) * 100) / 100;
    if (!merge.includes(seen[k])) merge.push(seen[k]);
    drop.push(x); });
  if (!drop.length) return 0;
  if (pantryShared()) { SY.data.pantry.items = items.filter(x => !drop.includes(x)); pantryOps(merge.map(x => ({ op: 'set', id: x.id, qty: x.qty })).concat(drop.map(x => ({ op: 'del', id: x.id })))); }
  else { S.pantry = items.filter(x => !drop.includes(x)); saveState(); }
  return drop.length;
}
function pantrySet(itemId, fields) {
  if (pantryShared()) { const it = SY.data.pantry.items.find(x => x.id === itemId); if (it) Object.assign(it, fields); pantryOps([Object.assign({ op: 'set', id: itemId }, fields)]); return; }
  const it = (S.pantry || []).find(x => x.id === itemId); if (!it) return; Object.assign(it, fields); if (!(it.qty > 0.001)) S.pantry = S.pantry.filter(x => x !== it); saveState();
}
function pantryDel(itemId) {
  if (pantryShared()) { SY.data.pantry.items = SY.data.pantry.items.filter(x => x.id !== itemId); pantryOps([{ op: 'del', id: itemId }]); return; }
  S.pantry = (S.pantry || []).filter(x => x.id !== itemId); saveState();
}
function pantryHave(food, items) { return (items || pantryItems()).filter(x => x.food === food).reduce((a, x) => a + (+x.qty || 0), 0); }
function useFifo(items, use) {
  Object.entries(use).forEach(([food, amt]) => { let left = amt;
    items.filter(x => x.food === food && x.qty > 0).sort((a, b) => (a.exp || '9999') < (b.exp || '9999') ? -1 : 1).forEach(x => { const t = Math.min(left, x.qty); x.qty = Math.round((x.qty - t) * 100) / 100; left -= t; }); });
  return items.filter(x => x.qty > 0.001);
}
let _pantryBusy = false;
function pantryCatchUp() {
  if (_pantryBusy || !S || (AUTH.mode === 'server' && !SHARED_LOADED)) return;          // scanned foods must be known first, or their use would be missed
  const y = addDays(todayISO(), -1);
  if (!pantryInUse()) { if (S.pantryThrough) { delete S.pantryThrough; saveState(); } return; }
  if (!S.pantryThrough) { S.pantryThrough = y; saveState(); return; }
  if (S.pantryThrough >= y) return;
  const A = computeAll(); const use = {}; let d = addDays(S.pantryThrough, 1); let n = 0;
  while (d <= y && n < 120) { if (A.days[d]) Object.entries(dayUse(A, d, true)).forEach(([id, a]) => use[id] = (use[id] || 0) + a); d = addDays(d, 1); n++; }
  const through = addDays(d, -1);
  const prev = S.pantryThrough; S.pantryThrough = through < y ? through : y;
  const y2 = S.pantryThrough;
  if (pantryShared()) { _pantryBusy = true; pantryOps([], { through: y2, use }).then(ok => { if (!ok) S.pantryThrough = prev; }).finally(() => { _pantryBusy = false; }); return; }
  S.pantry = useFifo((S.pantry || []).map(x => Object.assign({}, x)), use); saveState();
}
// sharing turned on/off (or the sync ended): move items between the personal and the shared pantry
async function pantrySyncReconcile() {
  if (AUTH.mode !== 'server' || !S) return;
  const shared = pantryShared();
  if (shared && S.pantryShareSid !== SY.data.id) {
    S.pantryShareSid = SY.data.id; const mine = (S.pantry || []).filter(x => x.qty > 0);
    S.pantry = []; S.pantrySharedRev = null; saveState();
    if (mine.length) { SY.data.pantry.items = (SY.data.pantry.items || []).concat(mine); await pantryOps(mine.map(item => ({ op: 'add', item }))); toast(`Moved ${mine.length} pantry item${mine.length > 1 ? 's' : ''} into the shared pantry`); }
    return;
  }
  if (shared) { if (S.pantrySharedRev !== SY.data.pantry.rev) { S.pantrySharedCopy = SY.data.pantry.items; S.pantrySharedRev = SY.data.pantry.rev; saveState(); } return; }
  if (S.pantryShareSid) {                                     // sharing stopped (or the sync ended): keep a copy of what was in it
    const copy = (S.pantrySharedCopy || []).filter(x => x.qty > 0).map(x => ({ id: pid(), food: x.food, qty: x.qty, exp: x.exp || null, added: x.added || todayISO() }));
    S.pantry = (S.pantry || []).concat(copy); delete S.pantryShareSid; delete S.pantrySharedCopy; delete S.pantrySharedRev; saveState();
    if (copy.length) toast('The pantry isn’t shared any more — you kept a copy of its items');
  }
}
/* Grocery ticks live in the shared copy while a sync is on and in the personal one otherwise.
   Both are keyed by the week's start date, and every tick made during a sync is also written to
   the personal copy, so a shop in progress survives a sync starting or ending mid-aisle. */
async function grocerySyncReconcile() {
  if (AUTH.mode !== 'server' || !S) return;
  if (!syncActive()) { if (S.groShareSid) { delete S.groShareSid; saveState(); } return; }
  if (S.groShareSid === SY.data.id) return;
  S.groShareSid = SY.data.id; saveState();
  const mine = S.grocery || {}; const g = SY.data.grocery = SY.data.grocery || {};
  const weeks = Object.keys(mine).filter(w => Object.keys(mine[w] || {}).length && !g[w]);
  for (const w of weeks) {
    g[w] = Object.assign({}, mine[w]);
    try { const r = await api('PUT', '/api/sync/grocery', { week: w, set: mine[w] }); SY.rev = r.rev; } catch (e) { delete g[w]; break; }
  }
}
function pantryProjected(date) {
  const items = pantryItems().map(x => Object.assign({}, x)); const A = computeAll(); let d = todayISO(); const use = {};
  while (d < date) { if (A.days[d]) Object.entries(dayUse(A, d, !pantryShared(), true)).forEach(([id, a]) => use[id] = (use[id] || 0) + a); d = addDays(d, 1); }
  return useFifo(items, use);
}
const expDate = exp => fmtDate(exp, exp.slice(0, 4) === todayISO().slice(0, 4) ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
function daysLeft(exp) { return exp ? dayDiff(todayISO(), exp) : null; }
function expText(exp) { const n = daysLeft(exp); if (n == null) return 'no date'; if (n < 0) return `expired ${-n} day${n === -1 ? '' : 's'} ago`; if (n === 0) return 'expires today'; if (n === 1) return 'expires tomorrow'; return `${n} days left`; }
function pantrySoon() { return pantryItems().filter(x => x.exp && daysLeft(x.exp) <= PANTRY_SOON).sort((a, b) => a.exp < b.exp ? -1 : 1); }

const PAN_SORTS = [['aisle', 'Aisle'], ['name', 'Name'], ['expiry', 'Use-by date'], ['added', 'Recently added']];
function viewPantry() {
  pantryCatchUp(); pantryMergeDupes();
  const items = pantryItems(); const soon = pantrySoon(); const shared = pantryShared();
  const byFood = {}; items.forEach(x => (byFood[x.food] = byFood[x.food] || []).push(x));
  const lotHTML = x => `<div class="pan-lot ${x.exp && daysLeft(x.exp) < 0 ? 'bad' : x.exp && daysLeft(x.exp) <= PANTRY_SOON ? 'soon' : ''}"><span class="num">${esc(pantryQtyText(x.food, x.qty))}</span><span class="tiny">${x.exp ? `${esc(expDate(x.exp))} · ${esc(expText(x.exp))}` : 'no use-by date'}</span>
      <button type="button" class="btn icon ghost sm" data-act="pan-edit" data-id="${x.id}" title="Edit" aria-label="Edit">${icon('edit')}</button><button type="button" class="btn icon ghost sm" data-act="pan-del" data-id="${x.id}" title="Used up — remove" aria-label="Remove">${icon('x')}</button></div>`;
  const words = String(UI.panQ || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const sort = words.length ? 'expiry' : (PAN_SORTS.some(x => x[0] === UI.panSort) ? UI.panSort : 'aisle');
  const hay = f => (pantryName(f) + ' ' + (ING[f] ? ING[f].n + ' ' + (ING[f].brand || '') + ' ' + (ING[f].a || '') + ' ' + (SUB_LABEL[ING[f].sub] || '') : '')).toLowerCase();
  const all = Object.keys(byFood); const foods = all.filter(f => words.every(w => hay(f).includes(w)));
  const firstExp = f => byFood[f].map(x => x.exp || '9999-12-31').sort()[0], lastAdded = f => byFood[f].map(x => x.added || '').sort().slice(-1)[0];
  const byName = (x, y) => pantryName(x).localeCompare(pantryName(y));
  const flat = sort !== 'aisle';
  const foodRow = f => `<div class="pan-food"><div class="pan-name"><b>${esc(pantryName(f))}</b>${ING[f] && ING[f].brand ? `<span class="tiny muted">${esc(ING[f].brand)}</span>` : ''}<span class="tiny muted">${esc(pantryQtyText(f, pantryHave(f, items)))} in total${flat && ING[f] ? ' · ' + esc(ING[f].a) : ''}</span></div><div class="pan-lots">${byFood[f].sort((a, b) => (a.exp || '9999') < (b.exp || '9999') ? -1 : 1).map(lotHTML).join('')}</div></div>`;
  let list;
  if (!flat) { const aisles = {}; foods.forEach(f => { const a = ING[f] ? ING[f].a : 'Pantry'; (aisles[a] = aisles[a] || []).push(f); });
    list = AISLES.concat(Object.keys(aisles).filter(a => !AISLES.includes(a))).filter(a => aisles[a]).map(a => `<div class="pan-aisle"><h3>${esc(a)}</h3>${aisles[a].sort(byName).map(foodRow).join('')}</div>`).join(''); }
  else list = foods.length ? `<div class="pan-aisle">${foods.sort(sort === 'name' ? byName : sort === 'expiry' ? (x, y) => firstExp(x).localeCompare(firstExp(y)) || byName(x, y) : (x, y) => lastAdded(y).localeCompare(lastAdded(x)) || byName(x, y)).map(foodRow).join('')}</div>` : '';
  const tools = all.length ? `<div class="row wrap pan-tools"><div class="rec-search">${icon('search')}<input class="inp" type="search" placeholder="Search the pantry…" data-input="panq" value="${esc(UI.panQ || '')}" aria-label="Search the pantry" autocomplete="off"></div>
      <label class="pan-sort"><span class="tiny muted">${words.length ? 'Sorted by' : 'Sort'}</span><select class="inp" data-input="pan-sort" ${words.length ? 'disabled title="While searching, results are ordered by use-by date"' : ''}>${PAN_SORTS.map(([k, l]) => `<option value="${k}" ${k === sort ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>` : '';
  const soonCard = soon.length ? `<div class="card pan-soon"><div class="card-h"><h2>${icon('clock')}Expiring soon</h2><span class="pill warn-pill">${soon.length}</span></div>
      ${soon.map(x => `<div class="pan-srow ${daysLeft(x.exp) < 0 ? 'bad' : ''}"><b>${esc(pantryName(x.food))}</b><span class="num tiny">${esc(pantryQtyText(x.food, x.qty))}</span><span class="tiny">${esc(expText(x.exp))}</span><button type="button" class="btn sm ghost" data-act="pan-del" data-id="${x.id}">Used up</button></div>`).join('')}
      <div class="tiny muted" style="margin-top:6px">Anything within ${PANTRY_SOON} days of its use-by date shows here.</div></div>` : '';
  return `<div class="page-head"><div class="t"><h1>Pantry</h1><p>What you already have at home. The shopping list ticks off what’s here, and planned meals use the pantry up automatically as each day passes${shared ? ` — shared with ${esc(syncName())}` : ''}.</p></div>
      <div class="row wrap">${scanBtnHTML('pantry', 'primary')}${canReceipt() ? `<button class="btn" data-act="rc-scan" title="Photograph a receipt and add everything on it">${icon('list')}Scan a receipt <span class="pill" style="font-size:10px;margin-left:6px">Experimental</span></button>` : ''}<button class="btn ${canScan() ? '' : 'primary'}" data-act="pan-add">${icon('plus')}Add item</button></div></div>
    ${soonCard}${soon.length ? '<div style="height:16px"></div>' : ''}
    <div class="card"><div class="card-h"><h2>In the pantry</h2><span class="pill">${foods.length < all.length ? `${foods.length} of ${all.length}` : all.length} food${all.length === 1 ? '' : 's'}</span>${shared ? `<span class="pill acc">${icon('users')}Shared</span>` : ''}</div>
      ${tools}${all.length && !foods.length ? `<div class="muted small" style="padding:10px 2px">Nothing in the pantry matches “${esc(String(UI.panQ || '').trim())}”.</div>` : ''}
      ${all.length ? list : `<div class="empty-state">${icon('box')}<div>The pantry is empty. ${canScan() ? 'Scan groceries, ' : ''}add items by hand, or tick items on the <a href="#/grocery">shopping list</a> and add them here.</div></div>`}
      <div class="tiny muted" style="margin-top:10px">${S.pantryThrough ? `Planned meals through ${fmtDate(S.pantryThrough, { month: 'short', day: 'numeric' })} have been taken out, soonest-expiring first.` : ''} Use-by dates start from typical shelf life — edit them to match the package.</div></div>`;
}
const panUnit = id => { const g = ING[id]; return !g ? '' : g.u ? g.u + 's' : g.dry ? 'g uncooked' : g.ml ? 'ml' : 'g'; };
const panToShown = (id, q) => { const g = ING[id]; return g && g.dry ? Math.round(q * g.dry) : Math.round(q * 100) / 100; };
const panFromShown = (id, q) => { const g = ING[id]; return g && g.dry ? q / g.dry : q; };
function panFindFood(q) { q = String(q || '').trim().toLowerCase(); if (!q) return null; return Object.values(ING).find(x => foodLabel(x.id).toLowerCase() === q) || Object.values(ING).find(x => x.n.toLowerCase() === q) || null; }
function pantryItemModal(itemId, foodId) {
  const it = itemId ? pantryItems().find(x => x.id === itemId) : null; const food = it ? it.food : (foodId || '');
  if (itemId && !it) { toast('That item is gone — someone may have used it up'); render(); return; }
  modal(`<div><div class="row"><h2 style="flex:1">${it ? 'Edit pantry item' : 'Add to the pantry'}</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>
    <form data-form="pantry" data-id="${it ? it.id : ''}" class="grid" style="gap:12px;margin-top:12px">
      <div class="field"><label>Food</label>${it ? `<b>${esc(pantryName(food))}${ING[food] && ING[food].brand ? ' · ' + esc(ING[food].brand) : ''}</b>` : `<input class="inp" list="pan-foods" name="foodq" data-input="pan-foodq" value="${food && ING[food] ? esc(foodLabel(food)) : ''}" placeholder="Search foods…" required autocomplete="off"><datalist id="pan-foods">${Object.values(ING).sort((a, b) => (isFavFood(b.id) - isFavFood(a.id)) || a.n.localeCompare(b.n)).map(g => `<option value="${esc(foodLabel(g.id))}">`).join('')}</datalist>`}</div>
      <div class="grid g2" style="gap:12px"><div class="field"><label>Amount <span class="muted" id="pan-unit" style="font-weight:500">${esc(panUnit(food))}</span></label><input class="inp" type="number" min="0" step="1" inputmode="numeric" name="qty" value="${it ? panToShown(food, it.qty) : ''}" placeholder="${it ? '' : 'one package if blank'}"></div>
        <div class="field"><label>Use by</label><input class="inp" type="date" name="exp" value="${it && it.exp ? it.exp : ''}"><span class="tiny muted">${it ? '' : 'Blank = typical shelf life'}</span></div></div>
      <div class="row wrap" style="justify-content:flex-end;gap:8px">${it ? `<button type="button" class="btn danger" data-act="pan-del" data-id="${it.id}" style="margin-right:auto">${icon('trash')}Remove</button>` : ''}<button type="button" class="btn" data-act="close-modal">Cancel</button><button class="btn primary" type="submit">${it ? 'Save' : 'Add'}</button></div></form></div>`, 'sm');
}
function pantrySubmit(form) {
  const fd = new FormData(form); const itemId = form.dataset.id; const qs = String(fd.get('qty') || '').trim();
  if (itemId) { const it = pantryItems().find(x => x.id === itemId); if (!it) { closeModal(); render(); return; }
    pantrySet(itemId, { qty: qs === '' ? 0 : Math.max(0, Math.round(panFromShown(it.food, Math.round(+qs)) * 100) / 100), exp: fd.get('exp') || null }); closeModal(); render(); toast('Pantry updated'); return; }
  const g = panFindFood(fd.get('foodq')); if (!g) { toast('Pick a food from the list'); return; }
  if (qs !== '' && !(+qs > 0)) { toast('Enter an amount above 0, or leave it blank for one package'); return; }
  pantryAdd(g.id, qs === '' ? null : panFromShown(g.id, Math.round(+qs)), fd.get('exp') || null, 'manual'); closeModal(); render(); toast(`${g.n} added to the pantry`);
}
function pantryNavBadge() { const a = $('.nav a[data-nav="pantry"]'); if (!a) return; const n = S ? pantrySoon().length : 0; let b = a.querySelector('.nav-badge'); if (!n) { if (b) b.remove(); return; } if (!b) { b = document.createElement('span'); b.className = 'nav-badge'; a.appendChild(b); } b.textContent = n; b.title = `${n} pantry item${n === 1 ? '' : 's'} expiring soon`; }

/* ---------- shopping list: pantry-aware rows, check all, add checked to the pantry ---------- */
let GRO_ROWS = null;
function groceryRows(A, wd, totals) {
  pantryCatchUp(); const t = todayISO();
  if (!pantryInUse() || wd[wd.length - 1] < t) return { rows: Object.entries(totals).map(([id, a]) => ({ id, total: a, have: 0, need: a })), note: '' };
  const days = wd.filter(d => d >= t); const tot = {};
  days.forEach(d => Object.entries(dayUse(A, d, false)).forEach(([id, a]) => tot[id] = (tot[id] || 0) + a));
  const proj = pantryProjected(days[0]);
  const rows = Object.entries(tot).filter(([id]) => ING[id]).map(([id, a]) => { const have = pantryHave(id, proj); let need = Math.max(0, a - have); if (need < (ING[id].u ? 0.05 : 1)) need = 0; return { id, total: a, have, need }; });
  const part = days.length < wd.length;
  const note = `<div class="note gro-pan-note">${icon('box')}<span>${part ? `This week’s list covers <b>${fmtDate(days[0], { weekday: 'long' })}</b> on — earlier days are already eaten. ` : ''}Items your <a href="#/pantry">pantry</a> already covers${days[0] > t ? ' (after the meals planned before then)' : ''} are ticked with a pantry icon — untick any you still need to buy. Partly covered items show the full amount and what’s at home.</span></div>`;
  return { rows, note };
}
function groRowState(r, got) { const covered = !(r.need > 0) && r.have > 0; return { covered, checked: covered ? got[r.id] !== 0 : !!got[r.id] }; }
function groTools(rows, got) { let checked = 0, add = 0; rows.forEach(r => { const st = groRowState(r, got); if (st.checked) { checked++; if (!st.covered) add++; } }); return { checked, add }; }
function groGot() { const G = GRO_ROWS; if (!G) return {}; return ((syncActive() ? (SY.data.grocery = SY.data.grocery || {}) : (S.grocery = S.grocery || {}))[G.week]) || {}; }
async function groSetMany(changes, noRender) {
  const G = GRO_ROWS; if (!G || !changes.length) return;
  const apply = w => changes.forEach(([id, v]) => { if (v == null) delete w[id]; else w[id] = v; });
  S.grocery = S.grocery || {}; apply(S.grocery[G.week] = S.grocery[G.week] || {});
  if (syncActive()) {
    const g = SY.data.grocery = SY.data.grocery || {}; apply(g[G.week] = g[G.week] || {}); saveState(); if (!noRender) render();
    try { const r = await api('PUT', '/api/sync/grocery', { week: G.week, set: Object.fromEntries(changes) }); SY.rev = r.rev; } catch (e) { toast(e.message); }
    return;
  }
  saveState(); if (!noRender) render();
}
function groTick(el) {
  const id = el.dataset.id; const covered = !!el.dataset.pan;
  groSetMany([[id, covered ? (el.checked ? null : 0) : (el.checked ? 1 : null)]], true);
  const row = el.closest('.gro-item'); if (row) row.classList.toggle('got', el.checked); groToolsRefresh();
}
function groToolsRefresh() {
  const G = GRO_ROWS; if (!G) return; const T = groTools(G.rows, groGot()); const n = G.rows.length;
  const all = $('[data-act="gro-all"][data-v="1"]'), none = $('[data-act="gro-all"][data-v="0"]'), add = $('[data-act="gro-pantry"]');
  if (all) all.disabled = T.checked === n; if (none) none.disabled = !T.checked;
  if (add) { add.disabled = !T.add; add.innerHTML = `${icon('box')}Add checked to pantry${T.add ? ` (${T.add})` : ''}`; }
}
function groAll(on) {
  const G = GRO_ROWS; if (!G) return; const got = groGot(); const ch = [];
  G.rows.forEach(r => { const st = groRowState(r, got); if (st.checked === on) return; ch.push([r.id, st.covered ? (on ? null : 0) : (on ? 1 : null)]); });
  if (!on) Object.keys(got).forEach(id => { if (got[id] && !G.rows.some(r => r.id === id)) ch.push([id, null]); });
  groSetMany(ch);
}
function groceryAddChecked() {
  const G = GRO_ROWS; if (!G) return; const got = groGot(); const done = [];
  G.rows.forEach(r => { const st = groRowState(r, got); if (!st.checked || st.covered) return; const pi = packInfo(r.id); const q = pi.P > 1 ? Math.ceil(r.total / pi.P - 1e-9) * pi.P : r.total; if (pantryAdd(r.id, q, null, 'list')) done.push(r.id); });
  if (!done.length) { toast('Tick the items you bought first'); return; }
  groSetMany(done.map(id => [id, null])); toast(`${done.length} item${done.length === 1 ? '' : 's'} added to the pantry`);
}

Object.assign(ACT, {
  scan: el => openScanner(el.dataset.v || 'today', el.dataset.d || null),
  'scan-torch': async () => { const t = SCN && SCN.stream && SCN.stream.getVideoTracks()[0]; if (!t) return; SCN.torch = !SCN.torch; try { await t.applyConstraints({ advanced: [{ torch: SCN.torch }] }); } catch (e) { toast('The light isn’t available'); } },
  'prod-del': el => { const g = ING[el.dataset.id]; if (!g) return; confirmBox(`Delete ${esc(g.n)}?`, 'It comes off the shared food list for everyone. Meals and pantry items that use it lose it too.', 'Delete', async () => {
    try { await api('DELETE', '/api/foods/shared/' + encodeURIComponent(g.id)); delete SHARED_FOODS[g.id]; rebuildCatalog(); render(); toast(`${g.n} deleted`); } catch (e) { toast(e.message); } }, true); },
  'food-edit': el => { const g = ING[el.dataset.id]; if (g && g.shared) sharedFoodEditor(g.id); else foodEditor(el.dataset.id); },
  'prod-cancel': () => { const r = PF && PF.resolve; PF = null; if (SCN && SCN.mode === 'pantry') { openScannerKeep(); } else { scanStop(); closeModal(); } if (r) r(null); },
  'scan-less': el => { scanCount(el.dataset.f, (SCN.added.find(x => x.food === el.dataset.f) || { n: 0 }).n - 1); scanPaint(); },
  'scan-more': el => { scanCount(el.dataset.f, (SCN.added.find(x => x.food === el.dataset.f) || { n: 0 }).n + 1); scanPaint(); },
  'scan-review': () => scanReview(),
  'food-by-name': el => foodByName(el.dataset.v === 'pantry' ? 'pantry' : el.dataset.v === 'foods' ? 'foods' : 'today', el.dataset.d || null, null, el.dataset.tab),
  'fp-tab': el => { if (!FP) return; FP.tab = el.dataset.v; fpRepaint(); },
  'fo-pick': el => foPick(+el.dataset.i),
  'fp-pick': el => fpPick(el.dataset.id),
  'fp-scan': () => { const m = FP ? FP.mode : 'today', d = FP ? FP.d : todayISO(); FP = null; FO = null;
    if (m === 'pantry' && SCN && SCN.mode === 'pantry') openScannerKeep(); else openScanner(m === 'pantry' ? 'pantry' : 'today', d); },
  'food-new-from-pick': () => { FP = null; closeModal(); foodEditor(null); },
  'scan-again': () => openScannerKeep(),
  'scan-done': () => { const n = SCN ? SCN.added.reduce((a, e) => a + e.n, 0) : 0; scanStop(); SCN = null; closeModal(); render(); if (n) toast(`${n} item${n === 1 ? '' : 's'} in the pantry`); },
  'srv-less': el => { scanCount(el.dataset.f, (SCN.added.find(x => x.food === el.dataset.f) || { n: 0 }).n - 1); scanReviewPaint(); },
  'srv-more': el => { scanCount(el.dataset.f, (SCN.added.find(x => x.food === el.dataset.f) || { n: 0 }).n + 1); scanReviewPaint(); },
  'srv-rm': el => { scanCount(el.dataset.f, 0); scanReviewPaint(); },
  'qa-save': () => qaSave(),
  'qa-food': el => { QP = null; quickAdd(el.dataset.id, el.dataset.d || null); },
  'qa-pick': el => quickPick(el.dataset.d || null),
  'x-rm': el => extraRemove(el.dataset.d, +el.dataset.i),
  'fav-food': el => toggleFavFood(el.dataset.id),
  'pan-add': () => pantryItemModal(null),
  'pan-edit': el => pantryItemModal(el.dataset.id),
  'pan-del': el => { const it = pantryItems().find(x => x.id === el.dataset.id); pantryDel(el.dataset.id); closeModal(); render(); if (it) toast(`${pantryName(it.food)} removed from the pantry`); },
  'gro-all': el => groAll(el.dataset.v === '1'),
  'gro-pantry': () => groceryAddChecked(),
  'recq-clear': () => { UI.recQ = ''; render(); },
  'pan-share': async el => { const on = el.dataset.v === '1'; try { const r = await api('POST', '/api/sync/pantry/share', { on }); if (!on && r.previous) S.pantrySharedCopy = r.previous; await syncFetch(true); await pantrySyncReconcile(); render(); toast(on ? 'Pantry shared' : 'Pantry no longer shared'); } catch (e) { toast(e.message); } }
});
document.addEventListener('submit', e => {
  const f = e.target; if (!f.dataset) return;
  if (f.dataset.form === 'fo-search') { e.preventDefault(); foSearch(($('#fo-q') || {}).value || ''); return; }
  if (f.dataset.form === 'scan-code') { e.preventDefault(); const v = ($('#scan-code') || {}).value || ''; const code = gtinNorm(v); if (!/^\d{8}$|^\d{13,14}$/.test(code)) { scanMsg('Enter the 8, 12 or 13 digits under the barcode', 'warn'); return; } SCN.last = ''; scanFound(code); }
  if (f.dataset.form === 'product') { e.preventDefault(); productSave(f); }
  if (f.dataset.form === 'pantry') { e.preventDefault(); pantrySubmit(f); }
});
document.addEventListener('input', e => {
  const t = e.target; if (!t || !t.dataset) return;
  if (t.dataset.input === 'panq') { UI.panQ = t.value; const pos = t.selectionStart; render(); const n = $('[data-input="panq"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) { } } return; }
  if (t.dataset.input === 'qp-q' && QP) { const l = $('#qp-list'); if (l) l.innerHTML = qpListHTML(t.value); }
  if (t.dataset.input === 'fp-q' && FP) { if (FO) FO.q = t.value; const l = $('#fp-list'); if (l) l.innerHTML = qpListHTML(t.value, 'fp-pick', FP.d); }
  if (t.dataset.input === 'pan-foodq') { const g = panFindFood(t.value); const u = $('#pan-unit'); if (u) u.textContent = g ? panUnit(g.id) : ''; }
  if (!QA) return;
  if (t.dataset.input === 'qa-n') { QA.n = t.value; const m = ingMacros(QA.id, qaAmount()); const el = $('#qa-mac'); if (el) el.innerHTML = `<b>${fmt(m.k)}</b> kcal · <span style="color:var(--prot)">${fmt(m.p)}P</span> · <span style="color:var(--carb)">${fmt(m.c)}C</span> · <span style="color:var(--fat)">${fmt(m.f)}F</span>`; }
});
document.addEventListener('change', async e => {
  const t = e.target; if (!t || !t.dataset) return;
  if (t.dataset.input === 'pan-sort') { UI.panSort = t.value; saveUI(); render(); }
  if (t.dataset.input === 'sr-exp' && SCN) { const e2 = SCN.added.find(x => x.food === t.dataset.f); if (e2) { pantrySet(e2.itemId, { exp: t.value || null }); if (/^#\/(pantry|grocery)/.test(location.hash)) render(); } }
  if (t.dataset.input === 'qa-unit' && QA) { QA.unit = t.value; QA.n = t.value === 'g' ? 100 : 1; renderQuickAdd(); }
  if (t.dataset.input === 'qa-slot' && QA) QA.slot = t.value;
  if (t.dataset.input === 'pf-basis') { const u = $('#modal .pf-unit'); if (u) u.classList.toggle('hidden', t.value !== 'u'); const s = $('#modal [name="srv"]'); if (s) s.disabled = t.value === 'u'; const pu = $('#modal .pf-pku'); if (pu) pu.textContent = `(${t.value === 'u' ? 'items' : t.value})`; }
  if (t.dataset.input === 'scan-photo') {
    const f = t.files && t.files[0]; t.value = ''; if (!f) return; scanMsg('Reading the photo…');
    try { const bmp = await createImageBitmap(f); const W = Math.min(1600, bmp.width), H = Math.round(bmp.height * W / bmp.width); const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(bmp, 0, 0, W, H);
      const gym = SCN && SCN.mode === 'gym'; let code = null, fmt = null;
      if ('BarcodeDetector' in window) { try { const f = await window.BarcodeDetector.getSupportedFormats(); const want = (gym ? Object.keys(BD_FMT) : ['ean_13', 'ean_8', 'upc_a', 'upc_e']).filter(k => f.includes(k)); const r = await new window.BarcodeDetector({ formats: want }).detect(c); if (r[0]) { code = r[0].rawValue; fmt = BD_FMT[r[0].format] || r[0].format; } } catch (er) { } }
      if (!code) { const img = x.getImageData(0, 0, W, H); if (gym) { const d = bcDecodeAny(img); if (d) { code = d.code; fmt = d.fmt; } } else code = bcDecodeImage(img); }
      if (code && SCN) { SCN.last = ''; scanFound(code, fmt); } else scanMsg('No barcode found in that photo — try closer and straight on, or type the number.', 'warn'); }
    catch (er) { scanMsg('That photo couldn’t be read.', 'warn'); }
  }
});
