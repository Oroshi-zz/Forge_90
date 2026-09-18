// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz

/* ---------- symbology tables ---------- */
const C128 = ['212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'].map(p => p.split('').map(Number));
const C39_BARS = [[0, 4], [1, 4], [0, 1], [2, 4], [0, 2], [1, 2], [3, 4], [0, 3], [1, 3], [2, 3]];
const C39 = (() => {
  const t = {}; const put = (ch, bars, spaces) => { const w = Array(9).fill(0); bars.forEach(b => { w[b * 2] = 1; }); spaces.forEach(s => { w[s * 2 + 1] = 1; }); t[ch] = w; };
  '1234567890'.split('').forEach((c, i) => put(c, C39_BARS[i], [1])); 'ABCDEFGHIJ'.split('').forEach((c, i) => put(c, C39_BARS[i], [2]));
  'KLMNOPQRST'.split('').forEach((c, i) => put(c, C39_BARS[i], [3])); ['U', 'V', 'W', 'X', 'Y', 'Z', '-', '.', ' ', '*'].forEach((c, i) => put(c, C39_BARS[i], [0]));
  put('$', [], [0, 1, 2]); put('/', [], [0, 1, 3]); put('+', [], [0, 2, 3]); put('%', [], [1, 2, 3]); return t;
})();
const CBAR = { 0: '0000011', 1: '0000110', 2: '0001001', 3: '1100000', 4: '0010010', 5: '1000010', 6: '0100001', 7: '0100100', 8: '0110000', 9: '1001000', '-': '0001100', '$': '0011000',
  ':': '1000101', '/': '1010001', '.': '1010100', '+': '0010101', A: '0011010', B: '0101001', C: '0001011', D: '0001110' };
Object.keys(CBAR).forEach(k => { CBAR[k] = CBAR[k].split('').map(Number); });
const ITF = ['00110', '10001', '01001', '11000', '00101', '10100', '01100', '00011', '10010', '01010'].map(p => p.split('').map(Number));

const GYM_FMTS = [['auto', 'Automatic'], ['code128', 'Code 128'], ['code39', 'Code 39'], ['codabar', 'Codabar'], ['itf', 'Interleaved 2 of 5'], ['ean13', 'EAN-13'], ['upca', 'UPC-A'], ['ean8', 'EAN-8'], ['upce', 'UPC-E'], ['qr', 'QR code']];
const fmtName = f => (GYM_FMTS.find(x => x[0] === f) || [, f])[1];
const gtinOk = c => /^\d+$/.test(c) && bcCheck(c);
function gymAutoFmt(code) {
  if (/^\d{13}$/.test(code) && gtinOk(code)) return 'ean13';
  if (/^\d{12}$/.test(code) && gtinOk(code)) return 'upca';
  if (/^\d{8}$/.test(code) && gtinOk(code)) return 'ean8';
  return /^[\x20-\x7e]+$/.test(code) ? 'code128' : 'qr';
}
// null when the code can be drawn in that type, otherwise why not
function gymCodeProblem(code, fmt) {
  if (!code) return 'Enter the number on the card.';
  if (fmt === 'code128') return /^[\x20-\x7e]{1,80}$/.test(code) ? null : 'Code 128 takes letters, numbers and common symbols (up to 80).';
  if (fmt === 'code39') return /^[0-9A-Z\-. $/+%]{1,60}$/.test(code) ? null : 'Code 39 takes capital letters, numbers, spaces and - . $ / + %.';
  if (fmt === 'codabar') return /^[A-D]?[0-9\-$:/.+]{1,60}[A-D]?$/.test(code) ? null : 'Codabar takes numbers and - $ : / . +, optionally between A–D start and stop letters.';
  if (fmt === 'itf') return /^(\d\d){1,40}$/.test(code) ? null : 'Interleaved 2 of 5 needs an even number of digits.';
  if (fmt === 'ean13') return /^\d{13}$/.test(code) && gtinOk(code) ? null : 'EAN-13 is 13 digits with a valid check digit.';
  if (fmt === 'upca') return /^\d{12}$/.test(code) && gtinOk(code) ? null : 'UPC-A is 12 digits with a valid check digit.';
  if (fmt === 'ean8') return /^\d{8}$/.test(code) && gtinOk(code) ? null : 'EAN-8 is 8 digits with a valid check digit.';
  if (fmt === 'upce') return /^[01]\d{7}$/.test(code) && gtinOk(upceExpand(code) || '1') ? null : 'UPC-E is 8 digits starting with 0 or 1.';
  if (fmt === 'qr') return new TextEncoder().encode(code).length <= 200 ? null : 'That’s too long for a QR code here (200 characters).';
  return 'Pick a barcode type.';
}
function upceExpand(c) { if (!/^[01]\d{7}$/.test(c)) return null; const d = c.slice(1, 7); const e = +d[5];
  const body = e <= 2 ? d[0] + d[1] + d[5] + '0000' + d[2] + d[3] + d[4] : e === 3 ? d[0] + d[1] + d[2] + '00000' + d[3] + d[4] : e === 4 ? d[0] + d[1] + d[2] + d[3] + '00000' + d[4] : d[0] + d[1] + d[2] + d[3] + d[4] + '0000' + d[5];
  return c[0] + body + c[7]; }

/* ---------- encoders → module rows (1 = bar) ---------- */
function runsToBits(widths, startBar = true) { const bits = []; let bar = startBar; widths.forEach(w => { for (let i = 0; i < w; i++) bits.push(bar ? 1 : 0); bar = !bar; }); return bits; }
function c128Values(s) {
  const codes = []; let set = null, i = 0;
  const run = k => { let n = 0; while (k + n < s.length && s.charCodeAt(k + n) >= 48 && s.charCodeAt(k + n) <= 57) n++; return n; };
  while (i < s.length) {
    const r = run(i);
    if (r >= 4 || (r >= 2 && i === 0 && r === s.length)) {
      const n = r - (r % 2); if (set !== 'C') { codes.push(set ? 99 : 105); set = 'C'; }
      for (let k = 0; k < n; k += 2) codes.push(+s.substr(i + k, 2)); i += n; continue;
    }
    if (set !== 'B') { codes.push(set ? 100 : 104); set = 'B'; }
    codes.push(s.charCodeAt(i) - 32); i++;
  }
  let sum = codes[0]; for (let k = 1; k < codes.length; k++) sum += k * codes[k];
  return codes.concat([sum % 103, 106]);
}
function encode1D(code, fmt) {
  if (fmt === 'code128') return runsToBits([].concat(...c128Values(code).map(v => C128[v])));
  if (fmt === 'code39') { const w = []; ('*' + code + '*').split('').forEach((ch, k) => { if (k) w.push(1); C39[ch].forEach(x => w.push(x ? 3 : 1)); }); return runsToBits(w); }
  if (fmt === 'codabar') { let s = code; if (!/^[A-D]/.test(s)) s = 'A' + s; if (!/[A-D]$/.test(s)) s += 'A'; const w = [];
    s.split('').forEach((ch, k) => { if (k) w.push(1); CBAR[ch].forEach(x => w.push(x ? 3 : 1)); }); return runsToBits(w); }
  if (fmt === 'itf') { const w = [1, 1, 1, 1]; for (let k = 0; k < code.length; k += 2) { const a = ITF[+code[k]], b = ITF[+code[k + 1]]; for (let j = 0; j < 5; j++) w.push(a[j] ? 3 : 1, b[j] ? 3 : 1); } w.push(3, 1, 1); return runsToBits(w); }
  const d = fmt === 'upca' ? '0' + code : code; const bits = []; const guard = s => s.split('').forEach(c => bits.push(+c)); const put = (ws, bar) => runsToBits(ws, bar).forEach(b => bits.push(b));
  if (fmt === 'ean13' || fmt === 'upca') { const par = BC_FIRST[+d[0]]; guard('101'); for (let k = 0; k < 6; k++) put((par[k] === 'L' ? BC_L : BC_G)[+d[1 + k]], false); guard('01010'); for (let k = 0; k < 6; k++) put(BC_L[+d[7 + k]], true); guard('101'); return bits; }
  if (fmt === 'ean8') { guard('101'); for (let k = 0; k < 4; k++) put(BC_L[+d[k]], false); guard('01010'); for (let k = 0; k < 4; k++) put(BC_L[+d[4 + k]], true); guard('101'); return bits; }
  if (fmt === 'upce') { let par = BC_UPCE[+d[7]]; if (d[0] === '1') par = par.replace(/[LG]/g, c => c === 'L' ? 'G' : 'L'); guard('101'); for (let k = 0; k < 6; k++) put((par[k] === 'L' ? BC_L : BC_G)[+d[1 + k]], false); guard('010101'); return bits; }
  return null;
}

/* ---------- QR code (byte mode, error correction M, versions 1–10) ---------- */
const QR_M = [null, [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0], [24, 2, 43, 0, 0], [16, 4, 27, 0, 0], [18, 4, 31, 0, 0], [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44]];
const QR_ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
const GF = (() => { const exp = new Array(512), log = new Array(256); let x = 1; for (let i = 0; i < 255; i++) { exp[i] = x; log[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (let i = 255; i < 512; i++) exp[i] = exp[i - 255]; return { exp, log }; })();
const gfMul = (a, b) => a && b ? GF.exp[GF.log[a] + GF.log[b]] : 0;
function rsEcc(data, n) {
  let g = [1]; for (let i = 0; i < n; i++) { const ng = new Array(g.length + 1).fill(0); g.forEach((c, j) => { ng[j] ^= c; ng[j + 1] ^= gfMul(c, GF.exp[i]); }); g = ng; }
  const r = new Array(n).fill(0);
  data.forEach(b => { const f = b ^ r[0]; r.shift(); r.push(0); for (let j = 0; j < n; j++) r[j] ^= gfMul(g[j + 1], f); });
  return r;
}
function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(text)); let ver = 0;
  for (let v = 1; v <= 10; v++) { const t = QR_M[v]; const cap = t[1] * t[2] + t[3] * t[4]; const bits = 4 + (v < 10 ? 8 : 16) + bytes.length * 8; if (bits <= cap * 8) { ver = v; break; } }
  if (!ver) return null;
  const [ecn, b1, d1, b2, d2] = QR_M[ver]; const cap = b1 * d1 + b2 * d2;
  const bits = []; const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >> i) & 1); };
  put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(b => put(b, 8)); put(0, Math.min(4, cap * 8 - bits.length)); while (bits.length % 8) bits.push(0);
  const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2)); for (let k = 0; data.length < cap; k++) data.push(k % 2 ? 0x11 : 0xec);
  const blocks = []; let p = 0; for (let i = 0; i < b1 + b2; i++) { const n = i < b1 ? d1 : d2; const d = data.slice(p, p + n); p += n; blocks.push({ d, e: rsEcc(d, ecn) }); }
  const cw = []; for (let i = 0; i < Math.max(d1, d2); i++) blocks.forEach(b => { if (i < b.d.length) cw.push(b.d[i]); }); for (let i = 0; i < ecn; i++) blocks.forEach(b => cw.push(b.e[i]));
  const size = ver * 4 + 17; const m = Array.from({ length: size }, () => new Array(size).fill(0)); const fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, v) => { m[y][x] = v ? 1 : 0; fn[y][x] = true; };
  const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= size || y >= size) continue; const d = Math.max(Math.abs(dx), Math.abs(dy)); set(x, y, d !== 2 && d !== 4); } };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const al = QR_ALIGN[ver]; al.forEach((ay, i) => al.forEach((ax, j) => { if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
  const format = mask => { const dat = (0 << 3) | mask; let r = dat; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >> 9) * 0x537); const b = ((dat << 10) | r) ^ 0x5412; const bit = i => (b >> i) & 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i)); set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8)); for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i)); for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i)); set(8, size - 8, 1); };
  format(0);
  if (ver >= 7) { let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >> 11) * 0x1f25); const b = (ver << 12) | r; for (let i = 0; i < 18; i++) { const v = (b >> i) & 1, a = size - 11 + (i % 3), c = Math.floor(i / 3); set(a, c, v); set(c, a, v); } }
  let k = 0; for (let right = size - 1; right >= 1; right -= 2) { if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) { const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
      if (!fn[y][x] && k < cw.length * 8) { m[y][x] = (cw[k >> 3] >> (7 - (k & 7))) & 1; k++; } } }
  const MASKS = [(i, j) => (i + j) % 2 === 0, i => i % 2 === 0, (i, j) => j % 3 === 0, (i, j) => (i + j) % 3 === 0, (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
    (i, j) => (i * j) % 2 + (i * j) % 3 === 0, (i, j) => ((i * j) % 2 + (i * j) % 3) % 2 === 0, (i, j) => ((i + j) % 2 + (i * j) % 3) % 2 === 0];
  const apply = mk => { const out = m.map(r => r.slice()); for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASKS[mk](y, x)) out[y][x] ^= 1; return out; };
  const penalty = g => { let s = 0, dark = 0;
    for (let a = 0; a < size; a++) for (const row of [true, false]) { let run = 1; for (let b = 1; b <= size; b++) { const cur = b < size ? (row ? g[a][b] : g[b][a]) : -1, prev = row ? g[a][b - 1] : g[b - 1][a]; if (cur === prev) run++; else { if (run >= 5) s += run - 2; run = 1; } } }
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const c = g[y][x]; if (c === g[y][x + 1] && c === g[y + 1][x] && c === g[y + 1][x + 1]) s += 3; }
    const pat = [1, 0, 1, 1, 1, 0, 1]; for (let a = 0; a < size; a++) for (let b = 0; b + 7 <= size; b++) for (const row of [true, false]) { let hit = true; for (let t = 0; t < 7 && hit; t++) if ((row ? g[a][b + t] : g[b + t][a]) !== pat[t]) hit = false;
      if (hit) { const l = (n, o) => { for (let t = 1; t <= 4; t++) { const q = n + o * t; if (q >= 0 && q < size && (row ? g[a][q] : g[q][a])) return false; } return true; }; if (l(b, -1) || l(b + 6, 1)) s += 40; } }
    g.forEach(r => r.forEach(v => { dark += v; })); s += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10; return s; };
  let best = null; for (let mk = 0; mk < 8; mk++) { format(mk); const g = apply(mk); const sc = penalty(g); if (!best || sc < best.sc) best = { mk, sc }; }
  format(best.mk); return apply(best.mk);
}

/* ---------- drawing ---------- */
function barcodeSVG(code, fmt, opts = {}) {
  if (fmt === 'qr') {
    const g = qrMatrix(code); if (!g) return ''; const n = g.length, q = 4, tot = n + q * 2; let path = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (g[y][x]) path += `M${x + q} ${y + q}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="bc-svg qr" viewBox="0 0 ${tot} ${tot}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${tot}" height="${tot}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
  }
  const bits = encode1D(code, fmt); if (!bits) return ''; const q = 10, h = opts.h || Math.max(40, Math.round((bits.length + q * 2) * 0.32)); const W = bits.length + q * 2; let path = '', i = 0;
  while (i < bits.length) { if (!bits[i]) { i++; continue; } let j = i; while (j < bits.length && bits[j]) j++; path += `M${i + q} 0h${j - i}v${h}h-${j - i}z`; i = j; }
  return `<svg xmlns="http://www.w3.org/2000/svg" class="bc-svg" viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" shape-rendering="crispEdges" role="img" aria-label="${esc(fmtName(fmt))} barcode"><rect width="${W}" height="${h}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}
const gymHuman = c => c.fmt === 'codabar' ? c.code.replace(/^[A-D]|[A-D]$/g, '') : c.code;

/* ---------- reading more barcode types from camera frames ---------- */
function bcBestPattern(w, pats, total) {
  const tot = total || w.reduce((a, b) => a + b, 0); if (!tot) return null; let best = null, second = Infinity;
  pats.forEach((p, v) => { if (!p || p.length !== w.length) return; const u = tot / p.reduce((a, b) => a + b, 0); let e = 0; for (let j = 0; j < w.length; j++) e += Math.abs(w[j] / u - p[j]);
    if (!best || e < best.e) { if (best) second = best.e; best = { v, e }; } else if (e < second) second = e; });
  return best && best.e < 1.3 && second - best.e > 0.25 ? best.v : null;
}
function c128Text(vals) {
  let set = vals[0] === 103 ? 'A' : vals[0] === 104 ? 'B' : 'C', out = '', shift = false;
  for (let k = 1; k < vals.length; k++) { const v = vals[k]; const cur = shift ? (set === 'A' ? 'B' : 'A') : set; shift = false;
    if (cur === 'C') { if (v < 100) { out += String(v).padStart(2, '0'); continue; } }
    else if (v < 96) { out += cur === 'A' ? String.fromCharCode(v < 64 ? v + 32 : v - 64) : String.fromCharCode(v + 32); continue; }
    if (v === 98 && cur !== 'C') shift = true; else if (v === 99) set = 'C'; else if (v === 100 && cur !== 'B') set = 'B'; else if (v === 101 && cur !== 'A') set = 'A'; }
  return out;
}
function bcTry128(runs, i) {
  if (i + 19 > runs.length) return null;
  const st = bcBestPattern(runs.slice(i, i + 6), C128.slice(0, 106)); if (st == null || st < 103) return null;
  const m0 = runs.slice(i, i + 6).reduce((a, b) => a + b, 0) / 11; if (i > 0 && runs[i - 1] < m0 * 4) return null;
  const P = C128[st]; const d = (runs[i] + runs[i + 2] + runs[i + 4] - (P[0] + P[2] + P[4]) * m0) / 3;
  const fix = (a, b) => runs.slice(a, b).map((x, j) => Math.max(0.05, (a + j - i) % 2 === 0 ? x - d : x + d));
  const vals = [st]; let p = i + 6;
  while (p + 7 <= runs.length && vals.length < 90) {
    const w7 = fix(p, p + 7); const t7 = w7.reduce((a, b) => a + b, 0);
    if (Math.abs(t7 / 13 - m0) < m0 * 0.35 && bcBestPattern(w7, [C128[106]]) === 0 && (p + 7 >= runs.length || runs[p + 7] > m0 * 4)) {
      if (vals.length < 3) return null; const chk = vals.pop(); let sum = vals[0]; for (let k = 1; k < vals.length; k++) sum += k * vals[k];
      if (sum % 103 !== chk) return null; const text = c128Text(vals); return text ? { code: text, fmt: 'code128' } : null;
    }
    const v = bcBestPattern(fix(p, p + 6), C128.slice(0, 103)); if (v == null) return null; vals.push(v); p += 6;
  }
  return null;
}
function bcWide(w, nWide) {
  const s = w.slice().sort((a, b) => b - a); const lo = s[nWide - 1], hi = s[nWide]; if (!(lo > hi * 1.55)) return null;
  const t = (lo + hi) / 2; return w.map(x => x > t ? 1 : 0);
}
const bcKey = a => a.join('');
const C39_REV = Object.fromEntries(Object.entries(C39).map(([k, v]) => [bcKey(v), k]));
function bcTry39(runs, i) {
  const read = p => { if (p + 9 > runs.length) return null; const w = runs.slice(p, p + 9); const b = bcWide(w, 3); return b ? { ch: C39_REV[bcKey(b)], n: w.reduce((a, x) => a + x, 0) / 15 } : null; };
  const s = read(i); if (!s || s.ch !== '*') return null; if (i > 0 && runs[i - 1] < s.n * 6) return null;
  let out = '', p = i + 10;
  while (p + 9 <= runs.length && out.length < 60) {
    if (runs[p - 1] > s.n * 3.5) return null;
    const c = read(p); if (!c || !c.ch || Math.abs(c.n - s.n) > s.n * 0.4) return null;
    if (c.ch === '*') return out && (p + 9 >= runs.length || runs[p + 9] > s.n * 6) ? { code: out, fmt: 'code39' } : null;
    out += c.ch; p += 10;
  }
  return null;
}
const CBAR_REV = Object.fromEntries(Object.entries(CBAR).map(([k, v]) => [bcKey(v), k]));
function bcTryCodabar(runs, i) {
  const read = p => { if (p + 7 > runs.length) return null; const w = runs.slice(p, p + 7); for (const n of [2, 3]) { const b = bcWide(w, n); const ch = b && CBAR_REV[bcKey(b)]; if (ch) return { ch, n: w.reduce((a, x) => a + x, 0) / (7 + 2 * n) }; } return null; };
  const s = read(i); if (!s || !/[A-D]/.test(s.ch)) return null; if (i > 0 && runs[i - 1] < s.n * 6) return null;
  let out = s.ch, p = i + 8;
  while (p + 7 <= runs.length && out.length < 60) {
    if (runs[p - 1] > s.n * 4) return null;
    const c = read(p); if (!c || Math.abs(c.n - s.n) > s.n * 0.45) return null; out += c.ch; p += 8;
    if (/[A-D]/.test(c.ch)) return out.length >= 3 && (p - 1 >= runs.length || runs[p - 1] > s.n * 6) ? { code: out, fmt: 'codabar' } : null;
  }
  return null;
}
function bcTryITF(runs, i) {
  if (i + 17 > runs.length) return null; const n = (runs[i] + runs[i + 1] + runs[i + 2] + runs[i + 3]) / 4;
  for (let j = 0; j < 4; j++) if (runs[i + j] > n * 1.6 || runs[i + j] < n * 0.5) return null;
  if (i > 0 && runs[i - 1] < n * 8) return null;
  let out = '', p = i + 4;
  while (p + 10 <= runs.length && out.length < 40) {
    const w = runs.slice(p, p + 10); const bars = bcWide(w.filter((x, j) => j % 2 === 0), 2), sp = bcWide(w.filter((x, j) => j % 2 === 1), 2);
    const a = bars && ITF.findIndex(x => bcKey(x) === bcKey(bars)), b = sp && ITF.findIndex(x => bcKey(x) === bcKey(sp));
    if (!(a >= 0 && b >= 0)) break; out += a + '' + b; p += 10;
  }
  if (out.length < 4 || p + 3 > runs.length) return null;
  const wb = runs[p], s1 = runs[p + 1], b2 = runs[p + 2];
  if (!(wb > n * 1.8 && s1 < n * 1.6 && b2 < n * 1.6 && (p + 3 >= runs.length || runs[p + 3] > n * 8))) return null;
  return { code: out, fmt: 'itf' };
}
function bcAnyRow(lum) {
  for (const dir of [1, -1]) {
    const row = dir === 1 ? lum : Array.from(lum).reverse();
    for (const r of [bcRuns(row), bcEdgeRuns(row)]) { if (!r) continue;
      for (let i = r.firstBar ? 0 : 1; i < r.runs.length - 15; i += 2) {
        const e = bcTry(r.runs, i); if (e) return e.length === 13 && e[0] === '0' ? { code: e.slice(1), fmt: 'upca' } : { code: e, fmt: e.length === 13 ? 'ean13' : e.length === 8 ? 'ean8' : 'upca' };
        const c = bcTry128(r.runs, i) || bcTry39(r.runs, i) || bcTryCodabar(r.runs, i) || bcTryITF(r.runs, i); if (c) return c;
      } }
  }
  return null;
}
// any supported 1D barcode in an ImageData → { code, fmt } (two scan lines must agree)
function bcDecodeAny(img) {
  const { width: w, height: h, data } = img; const hits = {};
  const lumAt = (x, y) => { const o = (y * w + x) * 4; return data[o] * 0.299 + data[o + 1] * 0.587 + data[o + 2] * 0.114; };
  const line = (count, get, size) => { for (let k = 0; k < count; k++) { const pos = Math.round(size * (0.2 + 0.6 * (k + 0.5) / count)); const c = bcAnyRow(get(pos)); if (c) { const key = c.fmt + '|' + c.code; hits[key] = (hits[key] || 0) + 1; if (hits[key] >= 2) return c; } } return null; };
  return line(24, y => { const a = new Float32Array(w); for (let x = 0; x < w; x++) a[x] = lumAt(x, y); return a; }, h) || line(14, x => { const a = new Float32Array(h); for (let y = 0; y < h; y++) a[y] = lumAt(x, y); return a; }, w);
}
const BD_FMT = { code_128: 'code128', code_39: 'code39', codabar: 'codabar', itf: 'itf', ean_13: 'ean13', ean_8: 'ean8', upc_a: 'upca', upc_e: 'upce', qr_code: 'qr' };

/* ---------- gym cards ---------- */
const gymCards = () => (S && S.gymCards) || [];
const gymActive = () => gymCards().find(c => c.id === S.gymActive) || gymCards()[0] || null;
let GC = null;
function gymCardModal(draft) {
  GC = Object.assign({ name: '', code: '', fmt: 'auto' }, draft || {});
  const edit = GC.id && gymCards().some(c => c.id === GC.id);
  modal(`<div class="gc-m"><div class="row"><h2 style="flex:1">${edit ? 'Edit gym card' : 'Add a gym card'}</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div class="tiny muted" style="margin:2px 0 12px">Scan the barcode on your membership card or key tag, or type the number printed under it. The app shows it on the dashboard so you can check in with your phone.</div>
    <form data-form="gym-card" class="grid" style="gap:12px">
      <div class="field"><label>Name</label><input class="inp" name="name" value="${esc(GC.name)}" maxlength="40" placeholder="e.g. Iron Works Gym" autocomplete="off"></div>
      <div class="field"><label>Card number</label><div class="row" style="gap:8px"><input class="inp" name="code" id="gc-code" data-input="gc-code" value="${esc(GC.code)}" maxlength="200" placeholder="The number under the barcode" autocomplete="off" style="flex:1;min-width:0">
        <button type="button" class="btn" data-act="gym-scan">${icon('scan')}Scan card</button></div></div>
      <div class="field"><label>Barcode type</label><select class="inp" name="fmt" data-input="gc-fmt">${GYM_FMTS.map(([k, l]) => `<option value="${k}" ${GC.fmt === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
        <span class="tiny muted">Scanning sets this for you. When typing, Automatic works with most gym scanners; if check-in fails, pick the type your card uses.</span></div>
      <div class="gc-prev" id="gc-prev">${gymPreviewHTML()}</div>
      <div class="row wrap" style="justify-content:flex-end;gap:8px">${edit ? `<button type="button" class="btn danger" data-act="gym-del" data-id="${GC.id}" style="margin-right:auto">${icon('trash')}Delete</button>` : ''}<button type="button" class="btn" data-act="close-modal">Cancel</button><button class="btn primary" type="submit">${edit ? 'Save' : 'Add card'}</button></div></form></div>`, 'gc-modal');
}
function gymResolve(code, fmt) { code = String(code || '').trim(); const f = fmt === 'auto' ? gymAutoFmt(code) : fmt; return { code: f === 'code39' ? code.toUpperCase() : code, fmt: f }; }
function gymPreviewHTML() {
  const r = gymResolve(GC.code, GC.fmt); if (!r.code) return '<div class="tiny muted gc-empty">The barcode preview shows here.</div>';
  const bad = gymCodeProblem(r.code, r.fmt); if (bad) return `<div class="note warn">${icon('info')}<span>${esc(bad)}</span></div>`;
  return `<div class="gc-code ${r.fmt === 'qr' ? 'qr' : ''}">${barcodeSVG(r.code, r.fmt)}</div><div class="tiny muted" style="text-align:center;margin-top:4px">${esc(fmtName(r.fmt))}${GC.fmt === 'auto' ? ' (automatic)' : ''}</div>`;
}
function gymSave(form) {
  const fd = new FormData(form); const r = gymResolve(fd.get('code'), fd.get('fmt'));
  const bad = gymCodeProblem(r.code, r.fmt); if (bad) { toast(bad); return; }
  const name = String(fd.get('name') || '').trim().slice(0, 40) || 'Gym card';
  S.gymCards = gymCards().slice(); const cur = GC.id && S.gymCards.find(c => c.id === GC.id);
  if (cur) Object.assign(cur, { name, code: r.code, fmt: r.fmt });
  else { const c = { id: 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name, code: r.code, fmt: r.fmt, added: todayISO() }; S.gymCards.push(c); if (!S.gymActive || S.gymCards.length === 1) S.gymActive = c.id; }
  saveState(); GC = null; closeModal(); render(); toast(cur ? 'Gym card saved' : `${name} added — it’s on your dashboard`);
}
function gymScanned(code, fmt) {
  const d = Object.assign({}, (SCN && SCN.draft) || GC || {}, { code, fmt: fmt || gymAutoFmt(code) }); scanStop(); SCN = null;
  if (d.fmt === 'code39') d.code = d.code.toUpperCase();
  if (!GYM_FMTS.some(x => x[0] === d.fmt)) { toast('That barcode type isn’t supported — type the number instead.'); d.fmt = 'auto'; }
  gymCardModal(d); toast(`Read ${fmtName(d.fmt)}: ${d.fmt === 'qr' && d.code.length > 30 ? d.code.slice(0, 30) + '…' : d.code}`);
}
function gymPanelHTML() {
  const cards = gymCards(); const c = gymActive();
  const head = `<div class="card-h"><h2>${icon('dumbbell')}Gym card</h2>${cards.length > 1 ? `<select class="inp gc-pick" data-input="gc-pick" aria-label="Choose a card">${cards.map(x => `<option value="${x.id}" ${x === c ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>` : ''}<a class="btn sm ghost" href="#/settings" data-act="gym-manage">Manage</a></div>`;
  if (!c) return `<div class="card gym-card">${head}<div class="empty-state" style="padding:14px 6px">${icon('scan')}<div>Add your membership card and check in with your phone.</div><button class="btn primary" data-act="gym-add" style="margin-top:10px">${icon('plus')}Add gym card</button></div></div>`;
  return `<div class="card gym-card">${head}<button type="button" class="gc-show ${c.fmt === 'qr' ? 'qr' : ''}" data-act="gym-full" data-id="${c.id}" title="Show full screen for the scanner">${barcodeSVG(c.code, c.fmt)}</button>
    <div class="gc-num"><b>${esc(c.name)}</b><span class="num">${esc(gymHuman(c))}</span></div>
    <div class="row wrap" style="gap:6px;justify-content:center;margin-top:8px"><button class="btn sm primary" data-act="gym-full" data-id="${c.id}">${icon('expand')}Full screen</button></div></div>`;
}
let GYM_LOCK = null;
async function gymFull(id) {
  const c = gymCards().find(x => x.id === id); if (!c) return; gymFullClose();
  const el = document.createElement('div'); el.id = 'gym-full'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', c.name);
  el.innerHTML = `<div class="gf-in"><div class="gf-name">${esc(c.name)}</div><div class="gf-code ${c.fmt === 'qr' ? 'qr' : ''}">${barcodeSVG(c.code, c.fmt, { h: 60 })}</div><div class="gf-num">${esc(gymHuman(c))}</div>
    <div class="gf-tip">Turn the screen brightness up if the scanner struggles. Tap anywhere, or go back, to close.</div></div>`;
  el.addEventListener('click', gymFullClose); document.body.appendChild(el); backPush('gym-full', gymFullClose);
  try { if (navigator.wakeLock) GYM_LOCK = await navigator.wakeLock.request('screen'); } catch (e) { GYM_LOCK = null; }
}
function gymFullClose() { const el = $('#gym-full'); if (!el) return; el.remove(); if (GYM_LOCK) { GYM_LOCK.release().catch(() => {}); GYM_LOCK = null; } backDrop('gym-full'); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') gymFullClose(); });
function gymSettingsHTML() {
  const cards = gymCards(); const act = gymActive();
  return `<div class="card" id="gym-cards"><div class="card-h"><h2>${icon('dumbbell')}Gym cards</h2><button class="btn sm primary" data-act="gym-add">${icon('plus')}Add card</button></div>
    ${cards.length ? cards.map(c => `<div class="gc-row"><button type="button" class="gc-mini ${c.fmt === 'qr' ? 'qr' : ''}" data-act="gym-full" data-id="${c.id}" title="Show full screen">${barcodeSVG(c.code, c.fmt, { h: 40 })}</button>
      <div class="gc-t"><b>${esc(c.name)}</b><span class="tiny muted">${esc(gymHuman(c))} · ${esc(fmtName(c.fmt))}</span></div>
      <div class="gc-acts">${c === act ? '<span class="pill acc">On dashboard</span>' : `<button class="btn sm ghost" data-act="gym-show" data-id="${c.id}">Show on dashboard</button>`}<button class="btn sm" data-act="gym-edit" data-id="${c.id}">${icon('edit')}Edit</button></div></div>`).join('')
      : `<div class="small muted">No cards yet. Add your gym membership card to show its barcode on the dashboard${cards.length ? '' : ' — scan it or type the number'}.</div>`}
    <div class="tiny muted" style="margin-top:10px">Cards are saved with your plan and aren’t shared with anyone you sync meals with.</div></div>`;
}

Object.assign(ACT, {
  'gym-add': () => gymCardModal(null),
  'gym-edit': el => { const c = gymCards().find(x => x.id === el.dataset.id); if (c) gymCardModal(Object.assign({}, c)); },
  'gym-del': el => { const c = gymCards().find(x => x.id === el.dataset.id); if (!c) return; confirmBox(`Delete ${esc(c.name)}?`, 'The card comes off your dashboard. You can add it again any time.', 'Delete', () => {
    pushUndo('delete gym card'); S.gymCards = gymCards().filter(x => x.id !== c.id); if (S.gymActive === c.id) S.gymActive = S.gymCards[0] ? S.gymCards[0].id : null; saveState(); render(); toast(`${c.name} deleted`, true); }, true); },
  'gym-show': el => { S.gymActive = el.dataset.id; saveState(); render(); },
  'gym-full': el => gymFull(el.dataset.id),
  'gym-scan': () => { const f = $('#modal form[data-form="gym-card"]'); const draft = Object.assign({}, GC, f ? { name: f.name.value, code: f.code.value, fmt: f.fmt.value } : {}); openScanner('gym', null, draft); },
  'gym-type': () => { const d = SCN && SCN.draft; scanStop(); SCN = null; gymCardModal(d); },
  'gym-manage': () => { if (isPhone()) { location.hash = '#/settings/gym'; return; } UI._scrollTo = 'gym-cards'; location.hash = '#/settings'; }
});
document.addEventListener('submit', e => { const f = e.target; if (f.dataset && f.dataset.form === 'gym-card') { e.preventDefault(); gymSave(f); } });
document.addEventListener('input', e => { const t = e.target; if (t && t.dataset && t.dataset.input === 'gc-code' && GC) { GC.code = t.value; const p = $('#gc-prev'); if (p) p.innerHTML = gymPreviewHTML(); } });
document.addEventListener('change', e => { const t = e.target; if (!t || !t.dataset) return;
  if (t.dataset.input === 'gc-fmt' && GC) { GC.fmt = t.value; const p = $('#gc-prev'); if (p) p.innerHTML = gymPreviewHTML(); }
  if (t.dataset.input === 'gc-pick') { S.gymActive = t.value; saveState(); render(); } });
