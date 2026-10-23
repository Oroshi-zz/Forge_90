// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz

/* Receipt scanning. Photograph a receipt, get its items into the pantry with a use-by date
   counted from the day they were bought.
   Preprocessing is in the browser and the server is a dumb OCR proxy, so parsing, merging and
   matching stay where the test suites can reach them. Three canvas variants beat any one of
   them; Otsu not adaptive; no cropping. All three were measured, not assumed. */

const RC_PROFILES = {};
function ST(id, name, p) { RC_PROFILES[id] = Object.assign({ id, name }, p); }

/* A named profile exists only where a store departs from the usual shape, so an unknown one still parses. */
const RC_GENERIC = {
  id: 'generic', name: 'Unknown store', header: null, marks: [],
  item: /^\s*(?<d>.*?[A-Za-z].*?)\s+(?<p>\d{1,4}[.,]\d{2})\s*(?<neg>-?)\s*(?<t>[A-Z]?)\s*$/,
  date: /(?<a>\d{1,2})[\/.-](?<b>\d{1,2})[\/.-](?<c>\d{2,4})/,
  stop: /^\s*(sub\s*total|total)\b/i,
  skip: [/^-{3,}$/, /^\*{3,}$/, /^\s*(cash|change|visa|mastercard|debit|credit|tender)\b/i],
  checks: {}
};

ST('costco', 'Costco Wholesale', {
  /* The wordmark is a logo and OCR returns it as punctuation, so detection leans on structural lines. */
  header: /costco\s*wholesale/i,
  marks: [/Bottom of Basket/i, /BOB\s*Cou?n?t/i, /INSTANT SAVINGS/i,
          /TOTAL NUMBER OF ITEMS SOLD/i, /Costco\s+(Visa|Cash)/i, /Date of Birth\s*=/i],
  /* The leading E mirrors the trailing tax code. OCR mangles it, so nothing depends on it. */
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
    subtotal: /\bSUBTOTAL\s+(\d+[.,]\d{2})/i,
    count:    /TOTAL NUMBER OF ITEMS SOLD\s*[-—:=]*\s*(\d+)/i,
    savings:  /INSTANT SAVINGS\s*\$?\s*(\d+[.,]\d{2})/i
  }
});

/* Every Kroger banner prints this receipt, so the profile is the format; `banners` names the
   one whose wordmark reads. It differs from Costco in four ways: no item numbers, savings
   already inside the listed price, a balance instead of a subtotal, and quantities on the line
   above the item. */
ST('kroger', 'Kroger family store', {
  banners: [[/fry'?s/i, "Fry's Food Stores"], [/ralphs/i, 'Ralphs'], [/king\s*soopers/i, 'King Soopers'],
            [/smith'?s/i, "Smith's"], [/dillons/i, 'Dillons'], [/\bQFC\b/, 'QFC'],
            [/fred\s*meyer/i, 'Fred Meyer'], [/\bkroger\b/i, 'Kroger']],
  header: /fry'?s|ralphs|king\s*soopers|fred\s*meyer|\bkroger\b|FRESH FOR EVERYONE/i,
  marks: [/YOUR SAVINGS/i, /\beCpn\b/i, /VIP\s+(Customer|CARD SAVINGS)/i, /Annual Card Savings/i,
          /Redeem Points in the App/i, /TOTAL SAVINGS\s*\(/i, /frysfood\.com|kroger\.com|ralphs\.com/i,
          /FRESH FOR EVERYONE/i, /\bFUEL POINTS\b/i],
  /* The trailing tax letter is what separates an item from a savings line. V marks the card price. */
  item: /^\s*(?:(?<wt>W[TI1]?)\s+)?(?<d>.*?[A-Za-z].*?)\s+(?<v>[VY])?\s*(?<p>\d{1,4}[.,]\d{2})\s*(?<neg>-?)\s*(?<t>[A-Z])\s*$/,
  /* Lines that qualify the NEXT item rather than being one. */
  /* "lb" comes back as "Ib" or "1b" more often than as "lb" on thermal print, so the unit is
     matched loosely and normalised. */
  pre: [{ kind: 'weight', re: /^\s*\W*(?<q>\d+[.,]\d+)\s*(?:\(\s*[\d.,]+\s*\))?\s*(?<u>[li1]b|kg|oz)\s*@\s*(?<up>[\d.,]+)\s*\/\s*[li1]?\w/i },
        { kind: 'multi',  re: /^\s*(?<q>\d+)\s*@\s*\d+\s*\/\s*[\d.,]+\s*$/ }],
  /* Anchored, or it matches the multi-buy line "1 @ 2/3.00" as a date. The "Date:" line at the
     foot is deliberately not skipped: it is the cleanest date on the receipt. */
  date: /^\s*(?:Date:\s*)?(?<a>\d{2})\/(?<b>\d{2})\/(?<c>\d{2})\b/,
  stop: /^\s*(?:\*{2,}\s*)?BALANCE\b|^\s*TAX\s+\d|^\s*VIP\s+Customer\b/i,
  skip: [/^\s*S[C0O]\b/i, /YOUR SAVINGS/i, /\beCpn\b/i, /^\s*\d+\s*@\s*\d+\s*\//,
         /^\s*\W*[\d.,]+\s*(\(.*\))?\s*([li1]b|kg|oz)\s*@/i, /^\s*(TOTAL|VIP|BALANCE|DEBIT|CHANGE|CASHBACK|PURCHASE)\b/i,
         /^\s*(US\s+)?(DEBIT|CREDIT)\b/i, /^\s*(REF#|AID|IC|APPROVAL|AUTH|TERMINAL|Entry ID)\b/i,
         /VERIFIED BY/i, /^\s*Annual Card Savings/i, /Redeem Points|FUEL POINTS|REWARDS\b/i,
         /Points Earned|Total \w+ Points/i, /^\s*(Visit|Go to|or customer service)/i,
         /^\s*Time\s*:/i, /^\*{3,}$/, /^-{3,}$/, /^\s*X[X*]{3,}/, /^[^A-Za-z0-9]*$/,
         /With Our Low Prices/i, /FRESH FOR EVERYONE/i],
  checks: {
    count:   /TOTAL NUMBER OF ITEMS SOLD\s*[-—:=]*\s*(\d+)/i,
    balance: /\bBALANCE\s+\$?\s*(\d+[.,]\d{2})/i,
    tax:     /^\s*TAX\s+\$?\s*(\d+[.,]\d{2})/i
  },
  /* No savings check: Kroger prices already include them, so one would fail on every correct scan. */
  derived: ['subtotal'],
  derive: c => { if (c.subtotal == null && c.balance != null && c.tax != null) c.subtotal = Math.round((c.balance - c.tax) * 100) / 100; }
});

/* A lone comma with two digits after it is a decimal point, not a thousands separator: 174,06 was becoming 17406. */
function rcMoney(s, dec) {
  let t = String(s).trim();
  if (dec !== ',' && /^\d{1,4},\d{2}$/.test(t)) t = t.replace(',', '.');
  return parseFloat(t.replace(dec === ',' ? /\./g : /,/g, '').replace(',', '.'));
}
/* A weighed line is worth a real amount in the pantry rather than one notional package. */
const RC_TO_G = { lb: 453.592, kg: 1000, oz: 28.3495 };
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
  /* One profile can cover a chain of banners, so the displayed name comes from whichever
     wordmark actually read, falling back to the family name. */
  let name = P.name;
  if (P.banners) { const whole = lines.join('\n'); const hit = P.banners.find(([re]) => re.test(whole)); if (hit) name = hit[1]; }
  const out = { store: P.id, storeName: name, date: null, items: [], discounts: [], checks: {} };
  let ended = false, pending = null;

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
    /* A quantity line qualifies the item BELOW it, so it is read before the skip takes it out
       of consideration as an item of its own. */
    if (P.pre && !ended) {
      const hit = (P.pre || []).map(x => ({ kind: x.kind, m: line.match(x.re) })).find(x => x.m);
      if (hit) {
        const g = hit.m.groups, q = rcMoney(g.q, dec);
        const u = /^[li1]b$/i.test(String(g.u || '')) ? 'lb' : String(g.u || '').toLowerCase();
        if (q > 0) pending = hit.kind === 'weight'
          ? { g: Math.round(q * (RC_TO_G[u] || 0)), unit: u, q }
          : { count: q };
        return;
      }
    }
    if (skipped) return;
    if (!ended && P.stop.test(line)) { ended = true; return; }
    if (ended) return;

    const m = line.match(P.item); if (!m) return;
    const g = m.groups;
    /* Matched only to anchor the line end, then discarded; an unmatched description routes a non-food the same way. */
    /* Leading punctuation is OCR debris from the next column. The slash stays: it marks a Costco discount. */
    const desc = (g.d || '').replace(/\*+/g, '').replace(/^[^A-Za-z0-9/]+/, '').trim();
    const rec = { n: g.n || '', d: desc, p: rcMoney(g.p, dec) * (g.neg === '-' ? -1 : 1) };
    if (pending) { if (pending.g > 0) rec.q = pending; pending = null; }
    if (!(Math.abs(rec.p) > 0)) return;
    if (P.disc && P.disc.test(desc)) { rec.ref = desc.slice(1); out.discounts.push(rec); }
    else out.items.push(rec);
  });
  if (P.derive) P.derive(out.checks);
  return out;
}

/* ---------- merging several OCR passes ---------- */
/* Text ties break long (truncation); money ties break short (a lost decimal point makes the wrong value longer). */
const rcVote = (xs, numeric) => {
  const c = {}; xs.filter(Boolean).forEach(x => { c[x] = (c[x] || 0) + 1; });
  const b = Object.keys(c).sort((a, z) => c[z] - c[a] || (numeric ? a.length - z.length : z.length - a.length))[0];
  return b ? { v: b, n: c[b] } : { v: '', n: 0 };
};
const rcJunk = s => (String(s).match(/[^A-Z0-9 ./]/gi) || []).length;

function rcMerge(texts) {
  const runs = texts.filter(t => t && t.trim()).map(rcParse);
  if (!runs.length) return { store: 'generic', date: null, items: [], discounts: [], suspect: [], checks: {}, sum: 0, reconcile: {} };

  const store = rcVote(runs.map(r => r.store)).v;
  const storeName = rcVote(runs.map(r => r.storeName)).v || (RC_PROFILES[store] || RC_GENERIC).name;
  const date = rcVote(runs.map(r => r.date)).v || null;
  const checks = {};
  ['subtotal', 'count', 'savings', 'balance', 'tax'].forEach(k => {
    const v = rcVote(runs.map(r => r.checks[k] == null ? null : String(r.checks[k])), k !== 'count').v;
    if (v) checks[k] = +v;
  });
  /* Derived fields are recomputed from the voted components, or one bad pass carries its whole derivation. */
  const DP = RC_PROFILES[store];
  if (DP) { (DP.derived || []).forEach(k => delete checks[k]); if (DP.derive) DP.derive(checks); }

  /* Prices collide, so passes are aligned in sequence. Full Needleman-Wunsch rather than a greedy
     scan: a greedy scan desynchronises permanently on the first misread price. */
  /* Kroger has no item numbers and repeats prices, so the first description word has to carry weight too. */
  const rcHead = s => String(s || '').trim().split(/\s+/)[0].toUpperCase();
  const rcSame = (a, b) => (Math.abs(a.p - b.p) < 0.005 ? 2 : 0) + (a.n && a.n === b.n ? 2 : 0)
    + (a.d && b.d && rcHead(a.d) === rcHead(b.d) ? 1 : 0);
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
  /* Leftovers are matched against each other first: two passes agreeing on a line the spine missed still counts. */
  const loose = [];
  extra.forEach(x => {
    const g = loose.find(gr => rcSame(gr[0], x) >= 2);
    if (g) g.push(x); else loose.push([x]);
  });

  /* A line only one pass saw is usually noise, and letting singletons in wrecked the subtotal check. */
  const items = [], discounts = [], suspect = [];
  groups.concat(loose).forEach(seen => {
    if (runs.length > 1 && seen.length < 2) {
      suspect.push({ n: seen[0].n, d: seen[0].d, p: seen[0].p, agree: 1, of: runs.length, conf: 'low' });
      return;
    }
    const n = rcVote(seen.map(x => x.n));
    const ds = seen.map(x => x.d).filter(Boolean); const dv = rcVote(ds);
    const d = dv.n > 1 ? dv.v : ds.slice().sort((a, b) => rcJunk(a) - rcJunk(b) || b.length - a.length)[0] || '';
    /* Voted, not taken from the spine: a correctly grouped line can still carry the spine’s misread price. */
    const pv = rcVote(seen.map(x => x.p.toFixed(2)), true);
    const rec = { n: n.v, d: d, p: +pv.v, agree: seen.length, of: runs.length,
      conf: seen.length === runs.length && n.n === runs.length && dv.n === runs.length && pv.n === runs.length ? 'high' : 'medium' };
    /* A weight only one pass read is still better than no weight: the alternative is adding a
       notional package of loose produce to the pantry. */
    const qv = rcVote(seen.map(x => x.q && x.q.g > 0 ? String(x.q.g) : null));
    if (qv.v) { const src = seen.find(x => x.q && x.q.g === +qv.v) || { q: {} }; rec.q = { g: +qv.v, unit: src.q.unit || 'lb', q: src.q.q }; }
    if (/^\//.test(rec.d)) { rec.ref = rec.d.slice(1); discounts.push(rec); } else items.push(rec);
  });

  /* If the gap equals a held-back line exactly, that line was real. Two at most, then it stops being evidence. */
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
  return { store, storeName, date, items, discounts, suspect, checks, sum,
    reconcile: {
      subtotal: checks.subtotal == null ? null : Math.abs(sum - checks.subtotal) < 0.005,
      count: checks.count == null ? null : items.length === checks.count,
      savings: checks.savings == null ? null : Math.abs(discounts.reduce((a, x) => a - x.p, 0) - checks.savings) < 0.005
    } };
}

/* ---------- turning a receipt line into a food ---------- */
/* Consonant drops only. Truncations like TANGERINE JU are not listed: the cut lands somewhere
   different every time, so they are handled by retrying without the final token. */
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

/* Costco prints a stable item number; Kroger prints none, which left every line sharing one key.
   The cleaned description is the fallback, and # keeps it from colliding with a numeric key. */
function rcKey(store, line) {
  if (line.n) return store + ':' + line.n;
  const c = rcClean(line.d).toLowerCase();
  return c ? store + ':#' + c : '';
}
/* A confirmed mapping wins outright: the key is stable across receipts, a fuzzy match is not. */
function rcMatchLine(store, line) {
  const key = rcKey(store, line);
  const map = key ? (S.rcptMap || {})[key] : null;
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
/* Scales up as well as down. The body pass capped at 1x, so a low-resolution photo went into
   tesseract far below the size it wants. The megapixel ceiling keeps a large photo cheap. */
const RC_MAX_UP = 3, RC_MAX_PX = 16e6;
function rcScale(img, maxW) {
  return Math.min((maxW || 2200) / img.width, RC_MAX_UP, Math.sqrt(RC_MAX_PX / (img.width * img.height)));
}
function rcVariant(img, kind, maxW) {
  const scale = rcScale(img, maxW);
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
    /* Max-of-channels whitens saturated ink but costs line detection, so desat applies it only where ink is coloured. */
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

/* The footer carries two of the three checksums and loses its right column in a whole-page pass. */
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
/* This pill is about how well the LINE was read, not about the food match. Labelled "Confident"
   it sat directly above "No food matched" and read as confidence that the item is not a food. */
const rcConf = { high: 'Text clear', medium: 'Check text', rescued: 'Recovered', low: 'Unsure' };

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

/* Skipping had no rendered state, so a row that already matched nothing looked identical
   afterwards and the button appeared dead. A skipped row now dims, says which kind of skip it
   was, and offers a way back.
   Skip and Not food are deliberately different. Skip leaves a line out of this scan only.
   Not food records against the item number that this line is never a food, so the next receipt
   from the same store does not ask again. */
function rcRowHTML(r, i) {
  const g = r.food && ING[r.food] ? ING[r.food] : null;
  const exp = g ? defaultExp(r.food, RC.date) : null;
  const raw = `<div class="rc-raw">${esc(r.line.d)}${r.line.n ? `<span class="tiny muted"> · ${esc(r.line.n)}</span>` : ''}${r.line.q && r.line.q.g > 0 ? `<span class="tiny muted"> · ${esc(fmt(r.line.q.q || r.line.q.g / 453.592, 2))} ${esc(r.line.q.unit || 'lb')}</span>` : ''}</div>`;

  if (r.skip) return `<div class="rc-row skipped" data-i="${i}">
    <span class="rc-tick off" aria-hidden="true">${icon('x')}</span>
    <div class="rc-main">${raw}
      <b class="muted">${r.skip === 'always' ? 'Not a food' : 'Skipped'}</b>
      <span class="tiny muted">${r.skip === 'always' ? 'Remembered, so it will not be asked again' : 'Left out of this scan'}</span></div>
    <div class="rc-side"><button type="button" class="btn sm" data-act="rc-unskip" data-i="${i}">Undo</button></div></div>`;

  return `<div class="rc-row ${r.on ? 'on' : ''} ${g ? '' : 'none'}" data-i="${i}">
    <label class="rc-tick"><input type="checkbox" data-input="rc-on" data-i="${i}" ${r.on ? 'checked' : ''} ${g ? '' : 'disabled'}><i class="switch ${r.on ? 'on' : ''}" aria-hidden="true"><i></i></i></label>
    <div class="rc-main">${raw}
      ${/* The per-row hint said the same thing as the section heading above it, twenty-five
            times over, and it was the tallest part of the row on a phone. */
        g ? `<b>${esc(foodLabel(r.food))}</b><span class="tiny muted">${exp ? 'use by ' + esc(expDate(exp)) : ''}${r.learned ? ' · remembered' : ''}</span>`
          : `<b class="muted">No food matched</b>`}
    </div>
    <div class="rc-side">
      <span class="pill ${r.conf === 'high' ? 'acc' : ''}" style="font-size:10.5px">${rcConf[r.conf] || 'Check it'}</span>
      <button type="button" class="btn sm" data-act="rc-pick" data-i="${i}">${g ? 'Change' : 'Pick'}</button>
      <button type="button" class="btn sm ghost" data-act="rc-skip" data-i="${i}" title="Leave this line out of this scan">Skip</button>
      <button type="button" class="btn sm ghost" data-act="rc-notfood" data-i="${i}" title="Never a food — remember that for this store">Not food</button>
    </div></div>`;
}
/* Receipt order put the lines that still need a decision anywhere in a list of twenty-five, so
   the work was a scroll hunt. They are grouped by what the scan actually knows instead, ordered
   by how much attention each group wants, with the confident matches last so they sit directly
   above the button that adds them.
   The split is on `st`, the match quality, not on `on`, the tick. Keying it on the tick would
   make a row jump to another section the moment the user toggled it, moving the list out from
   under their finger.
   The index passed to rcRowHTML stays the row's real index, so every data-i still addresses
   RC.rows even though the rows render out of order. */
function rcSectionsHTML() {
  const idx = RC.rows.map((r, i) => [r, i]);
  const need = idx.filter(([r]) => !r.skip && !r.food);
  const check = idx.filter(([r]) => !r.skip && r.food && r.st !== 'ok');
  const gone = idx.filter(([r]) => r.skip);
  const sure = idx.filter(([r]) => !r.skip && r.food && r.st === 'ok');
  const sec = (rows, label, note) => rows.length ? `<div class="rc-sec"><b>${label} · ${rows.length}</b>${note ? `<span class="spacer"></span><span class="tiny muted">${note}</span>` : ''}</div>
    <div class="rc-list">${rows.map(([r, i]) => rcRowHTML(r, i)).join('')}</div>` : '';
  return sec(need, 'Needs a food', 'Pick one, skip it, or mark it not food')
    + sec(check, 'Check the match', 'Guessed from the line, so worth a look')
    + sec(gone, 'Left out', 'Undo any you did not mean')
    + sec(sure, 'Matched', 'Change any that came out wrong');
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
  /* A skipped line is a decision, not an outstanding task, so it stops being counted as one. */
  const unmatched = RC.rows.filter(r => !r.food && !r.skip).length;
  const skipped = RC.rows.filter(r => r.skip).length;
  const allSkipped = skipped === RC.rows.length && RC.rows.length > 0;
  const rec = RC.reconcile || {};
  /* A failing subtotal is the honest signal that lines are missing. Saying so beats quietly
     handing someone a pantry that is short. */
  const short = rec.subtotal === false && RC.checks && RC.checks.subtotal != null
    ? Math.round((RC.checks.subtotal - RC.sum) * 100) / 100 : 0;
  /* The receipt prints how many items it rang up, so when that disagrees the shortfall can be
     given as a number of lines rather than only as money, which is far easier to act on. */
  const missing = rec.count === false && RC.checks.count != null ? RC.checks.count - RC.rows.length : 0;
  const warn = (short > 0 || missing > 0)
    ? `<div class="note warn">${icon('info')}<span>${missing > 0
        ? `The receipt rang up <b>${RC.checks.count}</b> items and only <b>${RC.rows.length}</b> came through${short > 0 ? `, about ${fmt(short, 2)} worth` : ''}.`
        : `The lines read come to ${fmt(RC.sum, 2)} but the receipt says ${fmt(RC.checks.subtotal, 2)}, so about <b>${fmt(short, 2)}</b> is missing.`}
        Some lines did not survive the photo. Add those by hand, or try retaking the picture.</span></div>`
    : rec.subtotal === true || rec.count === true ? `<div class="note acc">${icon('check')}<span>Every line adds up to what the receipt printed, so nothing was missed.</span></div>` : '';

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
      <div class="rc-head">
        <span class="tiny muted">${RC.rows.length} line${RC.rows.length === 1 ? '' : 's'}${skipped ? ` · ${skipped} skipped` : ''}</span>
        <span class="spacer"></span>
        <button type="button" class="btn sm ghost" data-act="rc-skip-all">${allSkipped ? 'Undo skip all' : 'Skip all'}</button>
      </div>
      ${rcSectionsHTML()}
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
    if (r.skip || !r.on || !r.food || !ING[r.food]) return;
    /* A weighed line printed its actual weight, so the pantry gets that rather than a notional
       package. Only for foods measured by weight: grams mean nothing to a food counted in
       items, and a food in ml is not what a per-pound line is selling. */
    const g = ING[r.food];
    const qty = r.line.q && r.line.q.g > 0 && !g.u && !g.ml ? r.line.q.g : null;
    pantryAdd(r.food, qty, defaultExp(r.food, RC.date), 'receipt');
    /* Only a line the user left selected teaches the map. An item number is wrong on roughly a
       fifth of lines, and a mapping learned from an unconfirmed read would bind a real product
       to a wrong key permanently and quietly. */
    const key = rcKey(RC.store, r.line); if (key) map[key] = r.food;
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
  'rc-skip': el => rcSkip(+el.dataset.i, 'once'),
  'rc-notfood': el => rcSkip(+el.dataset.i, 'always'),
  'rc-unskip': el => {
    const r = RC && RC.rows[+el.dataset.i]; if (!r) return;
    /* Undoing a "not food" has to clear what it remembered too, or the next scan silently
       repeats the decision the user just took back. */
    const k = rcKey(RC.store, r.line);
    if (r.skip === 'always' && k && S.rcptMap) { delete S.rcptMap[k]; saveState(); }
    r.skip = null; r.on = !!r.food; rcRender();
  },
  'rc-skip-all': () => {
    const any = RC.rows.some(r => !r.skip);
    RC.rows.forEach(r => { if (any) { r.skip = 'once'; r.on = false; } else if (r.skip === 'once') { r.skip = null; r.on = !!r.food; } });
    rcRender();
  }
});

/* kind 'once' leaves the line out of this scan; 'always' also records it against the item
   number so the same product is not asked about on the next receipt from this store. */
function rcSkip(i, kind) {
  const r = RC && RC.rows[i]; if (!r) return;
  r.skip = kind; r.on = false;
  const k = rcKey(RC.store, r.line);
  if (kind === 'always' && k) { S.rcptMap = S.rcptMap || {}; S.rcptMap[k] = 'skip'; saveState(); }
  closeModal(); rcRender();
}

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
