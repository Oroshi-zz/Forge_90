// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz

/* ============================================================
   FORGE 90 — Receipt scanning (experimental)

   Photograph a receipt, get its items into the pantry with a use-by date counted from the day
   they were bought rather than the day they were scanned.

   Measured against a real damaged Costco receipt before any of this was written. What that
   measurement decided, so nobody re-litigates it from theory:

   - The browser does the preprocessing. Three cheap canvas variants beat any single one,
     because luminance finds the most lines, a channel maximum erases highlighter over the
     descriptions, and doing it only where the ink is saturated finds the most item numbers.
   - Global Otsu, never adaptive. Adaptive thresholding erased thin thermal print entirely:
     zero to three lines against twenty-five.
   - No cropping. A perspective warp resamples and loses strokes: seventeen lines against
     twenty-five for leaving the frame alone.
   - The server is a dumb OCR proxy. Parsing, merging and matching all happen here, where the
     browser test suites can reach them.
   ============================================================ */

const RC_PROFILES = {};
function ST(id, name, p) { RC_PROFILES[id] = Object.assign({ id, name }, p); }

/* Most receipts are the same shape: a name on the left, a price on the right, and a subtotal
   that ends the items. A named profile exists only where a store departs from that, which is
   what lets an unrecognised store still parse. */
const RC_GENERIC = {
  id: 'generic', name: 'Unknown store', header: null, marks: [],
  item: /^\s*(?<d>.*?[A-Za-z].*?)\s+(?<p>\d{1,4}[.,]\d{2})\s*(?<neg>-?)\s*(?<t>[A-Z]?)\s*$/,
  date: /(?<a>\d{1,2})[\/.-](?<b>\d{1,2})[\/.-](?<c>\d{2,4})/,
  stop: /^\s*(sub\s*total|total)\b/i,
  skip: [/^-{3,}$/, /^\*{3,}$/, /^\s*(cash|change|visa|mastercard|debit|credit|tender)\b/i],
  checks: {}
};

ST('costco', 'Costco Wholesale', {
  /* The wordmark is a stylised logo and OCR never returns it as text — the top of a real
     receipt came out as ". oN / * » %". Detection leans on structural lines instead, which are
     plain text and survive. Every retailer prints its name as a logo, so this generalises. */
  header: /costco\s*wholesale/i,
  marks: [/Bottom of Basket/i, /BOB\s*Cou?n?t/i, /INSTANT SAVINGS/i,
          /TOTAL NUMBER OF ITEMS SOLD/i, /Costco\s+(Visa|Cash)/i, /Date of Birth\s*=/i],
  /* A leading E marks the reduced-rate tax code and is missing on standard-rate lines, so it
     mirrors the trailing code rather than being a field of its own. OCR mangles it constantly,
     so it is optional and nothing depends on it. */
  item: /^\s*(?<flag>[A-Z3]?)\s*(?<n>\d{4,10})[.,;:]?\s+(?<d>.+?)\s+(?<p>\d{1,4}[.,]\d{2})\s*(?<neg>-?)\s*(?<t>[A-Z£]?)\s*$/,
  disc: /^\//,
  /* Costco prints the date at the very bottom, past the tender block, so the scan has to keep
     going after the items end. */
  date: /^(?<a>\d{2})[\/.](?<b>\d{2})[\/.](?<c>\d{4})\s+\d{2}[:.]\d{2}/,
  stop: /^\s*SUBTOTAL\b/i,
  skip: [/^Date of Birth/i, /^AID:/i, /^Se[aq]#/i, /^APPROVED/i, /^AMOUNT:/i, /^X[X*]{3,}/,
         /^\s*(TOTAL\s+)?TAX\b/i, /^\s*CHANGE\b/i, /^TOTAL NUMBER/i, /^INSTANT SAVINGS/i,
         /^OP#/i, /^-{3,}$/, /^\d*\s*Member\b/i, /^\s*\d+%?\s*$/,
         /Visa|Mastercard|Debit|Resp:/i, /Bottom of Basket/i, /BOB\s*Cou?n?t/i,
         /^\s*[\d.]+%\s/, /^[^A-Za-z0-9]*$/],
  checks: {
    subtotal: /^\s*SUBTOTAL\s+(\d+[.,]\d{2})/i,
    count:    /^TOTAL NUMBER OF ITEMS SOLD\s*[-—:=]?\s*(\d+)/i,
    savings:  /^INSTANT SAVINGS\s*\$?\s*(\d+[.,]\d{2})/i
  }
});

const rcMoney = (s, dec) => parseFloat(String(s).replace(dec === ',' ? /\./g : /,/g, '').replace(',', '.'));

function rcDetect(lines) {
  const head = lines.slice(0, 14).join('\n'), whole = lines.join('\n');
  let best = RC_GENERIC, top = 0;
  Object.values(RC_PROFILES).forEach(P => {
    let s = P.header && P.header.test(head) ? 3 : 0;
    s += (P.marks || []).filter(re => re.test(whole)).length;
    if (s > top) { best = P; top = s; }
  });
  return top >= 2 ? best : RC_GENERIC;
}

function rcParse(text) {
  const lines = String(text || '').split('\n').map(l => l.replace(/\s+$/, '')).filter(l => l.trim());
  const P = rcDetect(lines); const dec = P.decimal || '.';
  const out = { store: P.id, storeName: P.name, date: null, items: [], discounts: [], checks: {} };
  let ended = false;

  lines.forEach(raw => {
    const line = raw.replace(/[‘’“”]/g, '');
    Object.keys(P.checks || {}).forEach(k => {
      const m = line.match(P.checks[k]);
      if (m && out.checks[k] == null) out.checks[k] = k === 'count' ? +m[1] : rcMoney(m[1], dec);
    });

    const skipped = (P.skip || []).some(re => re.test(line));
    /* Skips run before the date scan on purpose: "Date of Birth = xx/xx/xx" is date-shaped and
       would otherwise be read as the purchase date, which every use-by on the scan hangs off. */
    if (!out.date && P.date && !skipped) {
      const m = line.match(P.date);
      if (m) {
        const g = m.groups, y = g.c.length === 2 ? '20' + g.c : g.c;
        const mm = P.dateOrder === 'DMY' ? g.b : g.a, dd = P.dateOrder === 'DMY' ? g.a : g.b;
        const iso = y + '-' + String(mm).padStart(2, '0') + '-' + String(dd).padStart(2, '0');
        if (+mm >= 1 && +mm <= 12 && +dd >= 1 && +dd <= 31) out.date = iso;
      }
    }
    if (skipped) return;
    if (!ended && P.stop.test(line)) { ended = true; return; }
    if (ended) return;

    const m = line.match(P.item); if (!m) return;
    const g = m.groups;
    /* The trailing tax letter is matched so the line end can be anchored, then thrown away. It
       only classifies food in states with a reduced grocery rate, an unmatched description
       already routes a non-food item to the same place, and ignoring it makes OCR reading E as
       a pound sign harmless. */
    const desc = (g.d || '').replace(/\*+/g, '').trim();
    const rec = { n: g.n || '', d: desc, p: rcMoney(g.p, dec) * (g.neg === '-' ? -1 : 1) };
    if (!(Math.abs(rec.p) > 0)) return;
    if (P.disc && P.disc.test(desc)) { rec.ref = desc.slice(1); out.discounts.push(rec); }
    else out.items.push(rec);
  });
  return out;
}

/* ---------- merging several OCR passes ---------- */
const rcVote = xs => {
  const c = {}; xs.filter(Boolean).forEach(x => { c[x] = (c[x] || 0) + 1; });
  const b = Object.keys(c).sort((a, z) => c[z] - c[a] || z.length - a.length)[0];
  return b ? { v: b, n: c[b] } : { v: '', n: 0 };
};
const rcJunk = s => (String(s).match(/[^A-Z0-9 ./]/gi) || []).length;

function rcMerge(texts) {
  const runs = texts.filter(t => t && t.trim()).map(rcParse);
  if (!runs.length) return { store: 'generic', date: null, items: [], discounts: [], suspect: [], checks: {}, sum: 0, reconcile: {} };

  const store = rcVote(runs.map(r => r.store)).v;
  const date = rcVote(runs.map(r => r.date)).v || null;
  const checks = {};
  ['subtotal', 'count', 'savings'].forEach(k => {
    const v = rcVote(runs.map(r => r.checks[k] == null ? null : String(r.checks[k]))).v;
    if (v) checks[k] = +v;
  });

  /* A receipt is an ordered list, and hashing on price collides — this test receipt has three
     items at 9.99 — so the passes are aligned in sequence instead.
     This is a full Needleman-Wunsch alignment rather than a greedy forward scan, and that is
     not over-engineering: a greedy scan desynchronises permanently the first time a price is
     misread. On the real photo one 9.99 came back as 999.00 and every line after it mismatched,
     taking the merge from 26 lines to 18. DP absorbs a bad cell as a gap and recovers. */
  const rcSame = (a, b) => (Math.abs(a.p - b.p) < 0.005 ? 2 : 0) + (a.n && a.n === b.n ? 2 : 0);
  function rcAlign(spine, list) {
    const n = spine.length, m = list.length, GAP = -1;
    const D = []; for (let i = 0; i <= n; i++) { D.push(new Array(m + 1).fill(0)); D[i][0] = i * GAP; }
    for (let j = 0; j <= m; j++) D[0][j] = j * GAP;
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
      const s = rcSame(spine[i - 1], list[j - 1]) || -1;
      D[i][j] = Math.max(D[i - 1][j - 1] + s, D[i - 1][j] + GAP, D[i][j - 1] + GAP);
    }
    const pairs = []; let i = n, j = m;
    while (i > 0 && j > 0) {
      const s = rcSame(spine[i - 1], list[j - 1]) || -1;
      if (D[i][j] === D[i - 1][j - 1] + s) { if (s > 0) pairs.push([i - 1, j - 1]); i--; j--; }
      else if (D[i][j] === D[i - 1][j] + GAP) i--;
      else j--;
    }
    return pairs;
  }

  const lists = runs.map(r => r.items.concat(r.discounts));
  let si = 0; lists.forEach((l, i) => { if (l.length > lists[si].length) si = i; });
  const groups = lists[si].map(x => [x]); const extra = [];
  lists.forEach((list, ri) => {
    if (ri === si) return;
    const taken = new Set();
    rcAlign(lists[si], list).forEach(([a, b]) => { groups[a].push(list[b]); taken.add(b); });
    list.forEach((x, b) => { if (!taken.has(b)) extra.push(x); });
  });
  /* Alignment is only ever spine against one other pass, so a line the spine missed can never
     corroborate itself no matter how many other passes saw it. The leftovers are matched
     against each other before anything is judged uncorroborated: two passes agreeing on a line
     the spine dropped is still two passes agreeing. */
  const loose = [];
  extra.forEach(x => {
    const g = loose.find(gr => rcSame(gr[0], x) >= 2);
    if (g) g.push(x); else loose.push([x]);
  });

  /* A line only one pass saw is more often noise than a line the others missed, and letting
     singletons in wrecked the subtotal check — the one thing that tells a user the scan came
     up short. They are held back rather than counted. */
  const items = [], discounts = [], suspect = [];
  groups.concat(loose).forEach(seen => {
    if (runs.length > 1 && seen.length < 2) {
      suspect.push({ n: seen[0].n, d: seen[0].d, p: seen[0].p, agree: 1, of: runs.length, conf: 'low' });
      return;
    }
    const n = rcVote(seen.map(x => x.n));
    const ds = seen.map(x => x.d).filter(Boolean); const dv = rcVote(ds);
    const d = dv.n > 1 ? dv.v : ds.slice().sort((a, b) => rcJunk(a) - rcJunk(b) || b.length - a.length)[0] || '';
    /* The price is voted on like everything else. Taking the spine's blindly put a 999.00
       into the basket on the real photo: the passes had grouped correctly on the item number,
       and the one misread price still won because it happened to be the spine's. */
    const pv = rcVote(seen.map(x => x.p.toFixed(2)));
    const rec = { n: n.v, d: d, p: +pv.v, agree: seen.length, of: runs.length,
      conf: seen.length === runs.length && n.n === runs.length && dv.n === runs.length && pv.n === runs.length ? 'high' : 'medium' };
    if (/^\//.test(rec.d)) { rec.ref = rec.d.slice(1); discounts.push(rec); } else items.push(rec);
  });

  /* The subtotal can arbitrate. If the corroborated lines fall short by exactly the price of a
     line that was held back, that line was real and one pass simply caught what the others
     missed. Two at most: beyond that the combinations stop being evidence. */
  if (checks.subtotal != null) {
    for (let pass = 0; pass < 2 && suspect.length; pass++) {
      const gap = Math.round((checks.subtotal - items.concat(discounts).reduce((a, x) => a + x.p, 0)) * 100) / 100;
      if (Math.abs(gap) < 0.005) break;
      let i = -1; suspect.forEach((s, k) => { if (i < 0 && Math.abs(s.p - gap) < 0.005) i = k; });
      if (i < 0) break;
      const s = suspect.splice(i, 1)[0]; s.conf = 'rescued';
      if (/^\//.test(s.d)) { s.ref = s.d.slice(1); discounts.push(s); } else items.push(s);
    }
  }

  const all = items.concat(discounts);
  const sum = Math.round(all.reduce((a, x) => a + x.p, 0) * 100) / 100;
  return { store, storeName: (RC_PROFILES[store] || RC_GENERIC).name, date, items, discounts, suspect, checks, sum,
    reconcile: {
      subtotal: checks.subtotal == null ? null : Math.abs(sum - checks.subtotal) < 0.005,
      count: checks.count == null ? null : items.length === checks.count,
      savings: checks.savings == null ? null : Math.abs(discounts.reduce((a, x) => a - x.p, 0) - checks.savings) < 0.005
    } };
}

/* ---------- turning a receipt line into a food ---------- */
/* Consonant drops that prefix matching cannot recover. Truncations like TANGERINE JU or BEEF
   STROGA are NOT listed: a store caps the description and cuts mid-word, so the cut lands
   somewhere different every time and a list of them never converges. Those are handled by
   retrying without the final token. */
const RC_ABBR = { CHX: 'chicken', CHKN: 'chicken', BCN: 'bacon', CHS: 'cheese', STKS: 'steaks',
  STK: 'steak', TOM: 'tomato', VEG: 'vegetable', YOGT: 'yogurt', MLK: 'milk', WHL: 'whole',
  LTTUNA: 'light tuna', BRST: 'breast', JU: 'juice', ORG: 'organic', PNT: 'peanut' };
/* Brand and claim tokens that carry no food meaning. KS is Kirkland Signature. */
const RC_NOISE = /\b(KS|KIRKLAND|SIGNATURE|NAE|GV|GREAT VALUE|ORG|ORGANIC)\b/gi;

function rcClean(desc) {
  let s = String(desc || '').replace(/[*#]+/g, ' ').replace(/\b\d{4,}\b/g, ' ');
  s = s.replace(/\//g, ' ');                                    // TURKEY/HAM is two foods
  s = s.replace(/\b[A-Z]{2,10}\b/g, w => RC_ABBR[w.toUpperCase()] || w);
  s = s.replace(RC_NOISE, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

/* Matching order: a mapping the user confirmed for this exact item number wins outright,
   because the number is stable across receipts and across OCR runs while the description is
   neither. Only then does the fuzzy matcher get a look. */
function rcMatchLine(store, line) {
  const map = (S.rcptMap || {})[store + ':' + line.n];
  if (map === 'skip') return { id: '', st: 'skip', sugg: [], learned: true };
  if (map && ING[map]) return { id: map, st: 'ok', score: 1, sugg: [map], learned: true };
  const clean = rcClean(line.d);
  if (!clean) return { id: '', st: 'none', sugg: [] };
  let m = typeof impMatch === 'function' ? impMatch(clean) : { id: '', st: 'none', sugg: [] };
  if (m.st === 'none') {
    /* Last chance for a truncated tail: drop it and match on what is left. */
    const parts = clean.split(' ');
    if (parts.length > 1) {
      const m2 = impMatch(parts.slice(0, -1).join(' '));
      if (m2.st !== 'none') m = Object.assign(m2, { st: 'check' });
    }
  }
  return m;
}

/* ---------- preprocessing, in the browser ---------- */
function rcOtsu(d) {
  const h = new Array(256).fill(0), n = d.length / 4;
  for (let i = 0; i < d.length; i += 4) h[d[i]]++;
  let sum = 0; for (let i = 0; i < 256; i++) sum += i * h[i];
  let sB = 0, wB = 0, max = -1, th = 128;
  for (let t = 0; t < 256; t++) {
    wB += h[t]; if (!wB) continue;
    const wF = n - wB; if (!wF) break;
    sB += t * h[t];
    const v = wB * wF * Math.pow(sB / wB - (sum - sB) / wF, 2);
    if (v > max) { max = v; th = t; }
  }
  return th;
}

/* The three passes that between them found every line on the test receipt. */
const RC_VARIANTS = ['lum', 'max', 'desat'];
function rcVariant(img, kind, maxW) {
  const scale = Math.min(1, (maxW || 2200) / img.width);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.width * scale));
  c.height = Math.max(1, Math.round(img.height * scale));
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, c.width, c.height);
  const im = x.getImageData(0, 0, c.width, c.height), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
    const mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
    const lum = (r * 299 + g * 587 + b * 114) / 1000;
    /* max of the channels pushes any saturated ink toward white while black print, which is low
       in every channel, stays black. Applied everywhere it costs line detection, so "desat"
       applies it only where the ink is actually coloured. */
    const v = kind === 'max' ? mx : kind === 'desat' ? ((mx - mn) > 70 ? mx : lum) : lum;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  const th = rcOtsu(d);
  for (let i = 0; i < d.length; i += 4) {
    const v = d[i] > th ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  return c.toDataURL('image/png').split(',')[1];
}

/* The footer holds the item count and the savings total, two of the three checksums, and a
   whole-page pass loses its right-hand column. It gets its own crop, its own upscale and a
   different page-segmentation mode. */
function rcFooter(img) {
  const top = Math.round(img.height * 0.80), h = img.height - top;
  const s = Math.min(3, 2400 / img.width);
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * s); c.height = Math.round(h * s);
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, top, img.width, h, 0, 0, c.width, c.height);
  const im = x.getImageData(0, 0, c.width, c.height), d = im.data;
  for (let i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
  const th = rcOtsu(d);
  for (let i = 0; i < d.length; i += 4) { const v = d[i] > th ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  x.putImageData(im, 0, 0);
  return c.toDataURL('image/png').split(',')[1];
}

function rcLoadImage(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('That image could not be read.')); i.src = fr.result; };
    fr.onerror = () => rej(new Error('That file could not be read.'));
    fr.readAsDataURL(file);
  });
}

/* ============================================================
   The scan flow and its review screen
   ============================================================ */
let RC = null;
/* OCR runs on the server, so this is only offered when there is one. */
const canReceipt = () => AUTH.mode === 'server';
const rcConf = { high: 'Confident', medium: 'Check it', rescued: 'Recovered', low: 'Unsure' };

function rcStart() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment';
  inp.onchange = () => { const f = inp.files && inp.files[0]; if (f) rcRun(f); };
  inp.click();
}

async function rcRun(file) {
  RC = { stage: 'read', step: 'Preparing the photo', rows: [], err: null };
  rcRender();
  try {
    const img = await rcLoadImage(file);
    RC.step = 'Reading the text'; rcRender();
    const images = RC_VARIANTS.map(k => ({ id: k, psm: 4, b64: rcVariant(img, k) }));
    images.push({ id: 'foot', psm: 6, b64: rcFooter(img) });
    const r = await api('POST', '/api/receipt/ocr', { images });
    const byId = {}; (r.texts || []).forEach(t => { byId[t.id] = t.text || ''; });
    RC.step = 'Matching your foods'; rcRender();
    const bodies = RC_VARIANTS.map(k => byId[k] || '').filter(Boolean);
    if (!bodies.length) throw new Error('Nothing readable came back from that photo.');
    /* The footer pass is appended to each body so the checksums it alone recovers are visible
       to every parse rather than only to a fourth one that has no items in it. */
    const merged = rcMerge(bodies.map(b => b + '\n' + (byId.foot || '')));
    RC.store = merged.store; RC.storeName = merged.storeName;
    RC.date = merged.date || todayISO(); RC.dateRead = !!merged.date;
    RC.checks = merged.checks; RC.reconcile = merged.reconcile; RC.sum = merged.sum;
    RC.suspect = merged.suspect || [];
    RC.rows = merged.items.map(it => {
      const m = rcMatchLine(merged.store, it);
      return { line: it, food: m.id || '', st: m.st, sugg: m.sugg || [], learned: !!m.learned,
        on: m.st === 'ok' && !!m.id, conf: it.conf };
    });
    RC.discounts = merged.discounts;
    RC.stage = 'review';
  } catch (e) {
    RC.stage = 'error'; RC.err = (e && e.message) || 'That scan did not work.';
  }
  rcRender();
}

function rcRowHTML(r, i) {
  const g = r.food && ING[r.food] ? ING[r.food] : null;
  const cls = r.on ? 'on' : '';
  const exp = g ? defaultExp(r.food, RC.date) : null;
  return `<div class="rc-row ${cls} ${r.st === 'none' ? 'none' : ''}" data-i="${i}">
    <label class="rc-tick"><input type="checkbox" data-input="rc-on" data-i="${i}" ${r.on ? 'checked' : ''} ${g ? '' : 'disabled'}><i class="switch ${r.on ? 'on' : ''}" aria-hidden="true"><i></i></i></label>
    <div class="rc-main">
      <div class="rc-raw">${esc(r.line.d)}${r.line.n ? `<span class="tiny muted"> · ${esc(r.line.n)}</span>` : ''}</div>
      ${g ? `<b>${esc(foodLabel(r.food))}</b><span class="tiny muted">${exp ? 'use by ' + esc(expDate(exp)) : ''}${r.learned ? ' · remembered' : ''}</span>`
          : `<b class="muted">No food matched</b><span class="tiny muted">Pick one, or leave it out</span>`}
    </div>
    <div class="rc-side">
      <span class="pill ${r.conf === 'high' ? 'acc' : ''}" style="font-size:10.5px">${rcConf[r.conf] || 'Check it'}</span>
      <button type="button" class="btn sm" data-act="rc-pick" data-i="${i}">${g ? 'Change' : 'Pick'}</button>
      <button type="button" class="btn sm icon ghost" data-act="rc-skip" data-i="${i}" title="Not a food — leave it out and remember that" aria-label="Not a food">${icon('x')}</button>
    </div></div>`;
}

function rcRender() {
  const root = $('#wo-root'); if (!root) return;
  if (!RC) { root.innerHTML = ''; document.body.classList.remove('wo-on'); return; }
  document.body.classList.add('wo-on');

  if (RC.stage === 'read') {
    root.innerHTML = `<div class="wom" role="dialog" aria-label="Reading the receipt"><div class="wo-in rc">
      <div class="wo-h"><button class="btn icon ghost" data-act="rc-close" aria-label="Close">${icon('x')}</button><b>Reading the receipt</b></div>
      <div class="rc-body"><div class="rc-wait">${icon('scan')}<b>${esc(RC.step)}</b>
        <span class="tiny muted">Runs on your server. The photo is not stored anywhere.</span></div></div></div></div>`;
    return;
  }
  if (RC.stage === 'error') {
    root.innerHTML = `<div class="wom" role="dialog" aria-label="Scan failed"><div class="wo-in rc">
      <div class="wo-h"><button class="btn icon ghost" data-act="rc-close" aria-label="Close">${icon('x')}</button><b>That did not work</b></div>
      <div class="rc-body"><div class="note warn">${icon('info')}<span>${esc(RC.err)}</span></div>
        <div class="row" style="justify-content:flex-end;gap:8px;margin-top:14px"><button class="btn" data-act="rc-close">Close</button><button class="btn primary" data-act="rc-scan">Try another photo</button></div></div></div></div>`;
    return;
  }

  const on = RC.rows.filter(r => r.on && r.food).length;
  const unmatched = RC.rows.filter(r => !r.food).length;
  const rec = RC.reconcile || {};
  /* A failing subtotal is the honest signal that lines are missing. Saying so beats quietly
     handing someone a pantry that is short. */
  const short = rec.subtotal === false && RC.checks && RC.checks.subtotal != null
    ? Math.round((RC.checks.subtotal - RC.sum) * 100) / 100 : 0;
  const warn = short > 0 ? `<div class="note warn">${icon('info')}<span>The lines read come to ${fmt(RC.sum, 2)} but the receipt says ${fmt(RC.checks.subtotal, 2)}, so about <b>${fmt(short, 2)}</b> is missing. Some lines did not survive the photo — add those by hand.</span></div>`
    : rec.subtotal === true ? `<div class="note acc">${icon('check')}<span>Every line adds up to the printed total, so nothing was missed.</span></div>` : '';

  root.innerHTML = `<div class="wom" role="dialog" aria-label="Review the receipt"><div class="wo-in rc">
    <div class="wo-h"><button class="btn icon ghost" data-act="rc-close" aria-label="Close">${icon('x')}</button>
      <b>${esc(RC.storeName || 'Receipt')}</b><span class="spacer"></span><span class="pill">${RC.rows.length} lines</span></div>
    <div class="rc-body">
      <div class="note ${RC.dateRead ? '' : 'warn'}">${icon('clock')}<span>${RC.dateRead
        ? `Bought <b>${esc(fmtDate(RC.date, { weekday: 'short', month: 'short', day: 'numeric' }))}</b>. Use-by dates count from then, not from today.`
        : `The date could not be read, so use-by dates are counted from today. Set it if you know it.`}
        <input class="inp" type="date" data-input="rc-date" value="${esc(RC.date)}" style="max-width:190px;margin-top:8px"></span></div>
      ${warn}
      ${unmatched ? `<div class="note">${icon('info')}<span>${unmatched} line${unmatched === 1 ? '' : 's'} matched no food. Pick one and it is remembered for this store next time.</span></div>` : ''}
      <div class="rc-list">${RC.rows.map(rcRowHTML).join('')}</div>
      ${RC.suspect && RC.suspect.length ? `<div class="tiny muted" style="margin-top:10px">${RC.suspect.length} unreadable fragment${RC.suspect.length === 1 ? '' : 's'} were left out.</div>` : ''}
    </div>
    <div class="rc-foot"><span class="small muted">${on} of ${RC.rows.length} selected</span><span class="spacer"></span>
      <button class="btn" data-act="rc-close">Cancel</button>
      <button class="btn primary" data-act="rc-add" ${on ? '' : 'disabled'}>Add ${on} to the pantry</button></div>
  </div></div>`;
}

function rcCommit() {
  if (!RC) return;
  let n = 0;
  const map = S.rcptMap = S.rcptMap || {};
  RC.rows.forEach(r => {
    if (!r.on || !r.food || !ING[r.food]) return;
    pantryAdd(r.food, null, defaultExp(r.food, RC.date), 'receipt');
    /* Only a line the user left selected teaches the map. An item number is wrong on roughly a
       fifth of lines, and a mapping learned from an unconfirmed read would bind a real product
       to a wrong key permanently and quietly. */
    if (r.line.n) map[RC.store + ':' + r.line.n] = r.food;
    n++;
  });
  saveState(); rcClose();
  toast(n ? `${n} item${n === 1 ? '' : 's'} added to the pantry` : 'Nothing was added');
}

function rcClose() { RC = null; rcRender(); render(); }

Object.assign(ACT, {
  'rc-scan': () => { if (!canReceipt()) { toast('Receipt scanning needs the server build.'); return; } rcStart(); },
  'rc-close': () => rcClose(),
  'rc-add': () => rcCommit(),
  /* Hands off to the app's own food picker rather than a bespoke list. That is where the
     Open Food Facts search, the barcode scanner and "create a new food" already live, and a
     receipt line is exactly the case that needs all three: a product the food list has never
     seen. */
  'rc-pick': el => { const i = +el.dataset.i; if (RC && RC.rows[i]) foodByName('receipt', null, i); },
  'rc-skip': el => {
    const i = +el.dataset.i, r = RC && RC.rows[i]; if (!r) return;
    r.food = ''; r.on = false; r.st = 'skip';
    if (r.line.n) { S.rcptMap = S.rcptMap || {}; S.rcptMap[RC.store + ':' + r.line.n] = 'skip'; saveState(); }
    closeModal(); rcRender();
  }
});

/* Called back by the food picker, and by the food editor when a new food was created for this
   line. Kept out of the picker so the picker needs to know nothing about receipts. */
function rcPicked(i, id) {
  const r = RC && RC.rows[i]; if (!r || !id || !ING[id]) { rcRender(); return; }
  r.food = id; r.on = true; r.st = 'ok';
  if (r.conf !== 'high') r.conf = 'medium';
  rcRender();
}

document.addEventListener('change', e => {
  const t = e.target; if (!t.dataset || !RC) return;
  if (t.dataset.input === 'rc-on') { const r = RC.rows[+t.dataset.i]; if (r) { r.on = t.checked; rcRender(); } }
  else if (t.dataset.input === 'rc-date') { RC.date = t.value || todayISO(); RC.dateRead = true; rcRender(); }
});
