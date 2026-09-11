/* ============================================================
   FORGE 90 — UI core: helpers, icons, art, muscle map, tooltip,
   charts, toast/modal, undo, router
   ============================================================ */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n, d = 0) => (n == null || isNaN(n)) ? '—' : Number(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const UI = { calView: 'month', calMonth: null, calWeek: null, libTab: 'workouts', libFilter: 'all', libQ: '', dietFilter: 'all', groWeek: null, prEx: null, planPhase: 1, showLib: true };
try { Object.assign(UI, JSON.parse(localStorage.getItem('forge90.ui') || '{}')); } catch (e) { }
function saveUI() { try { localStorage.setItem('forge90.ui', JSON.stringify(UI)); } catch (e) { } }

/* ---------- icons (24px stroke) ---------- */
const IC = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/>',
  food: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  trend: '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  snow: '<path d="M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>',
  loop: '<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  scale: '<path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1ZM2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1ZM7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  upper: '<path d="M4 8l4-4h8l4 4-3 3v9H7v-9z"/>', lower: '<path d="M8 3h8l1 8-2 10h-2l-1-8-1 8H9L7 11z"/>',
  full: '<circle cx="12" cy="5" r="2.5"/><path d="M12 8v6M7 10l5 1 5-1M9 22l3-8 3 8"/>', mixed: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/>',
  deload: '<path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10Z"/><path d="M8 12h8"/>', test: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="m9 12 2 2 4-4"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h11"/>', key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14.5 8.5l2 2"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>', eyeOff: '<path d="M3 3l18 18M10.6 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17.8 17.8 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  device: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>', activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  star: '<path d="m12 3.2 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.5-4.2 6.1-.8Z"/>', link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4L12 18.4"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>', arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  sideL: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M16 9.5 13.5 12l2.5 2.5"/>', sideR: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M13.5 9.5 16 12l-2.5 2.5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  pull: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h8M8 11h6"/>'
};
const icon = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[n] || ''}</svg>`;

/* ---------- generated art ---------- */
// Logo: “Anvil Bar + Spark” (option 3B-3) — lime anvil, hammer spark, barbell across the base
const LOGO = `<svg class="logo" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="FORGE 90"><defs><linearGradient id="fgt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#27321c"/><stop offset="1" stop-color="#0b0f09"/></linearGradient><linearGradient id="fgf" x1=".5" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#f2ff9e"/><stop offset=".45" stop-color="#b5f23d"/><stop offset="1" stop-color="#4d8a0a"/></linearGradient></defs><rect width="48" height="48" rx="13" fill="url(#fgt)"/><rect x=".6" y=".6" width="46.8" height="46.8" rx="12.4" fill="none" stroke="#b5f23d" stroke-opacity=".28" stroke-width="1.2"/><path d="M24 12.4V6.800000000000001M18.8 13 15.9 8.8M29.2 13 32.1 8.8" stroke="#d9f99d" stroke-width="2.2" stroke-linecap="round"/><path transform="translate(24 23.8) scale(0.84) translate(-24 -24)" d="M6.5 19.5H38.8Q42.4 19.5 42.4 23.2V24.4H35.6L31.8 29.2V32.6H36.2V37.6H13.8V32.6H18.2V29.2L15.2 25.6Q9.2 25.1 6.5 19.5Z" fill="url(#fgf)"/><g fill="#f7fbe9" stroke="#0f1a02" stroke-width="1.3" paint-order="stroke"><rect x="5.8" y="28.4" width="4.2" height="12" rx="1.8900000000000001"/><rect x="10.4" y="30.68" width="3.2760000000000002" height="7.4399999999999995" rx="1.4742000000000002"/><rect x="38" y="28.4" width="4.2" height="12" rx="1.8900000000000001"/><rect x="34.324" y="30.68" width="3.2760000000000002" height="7.4399999999999995" rx="1.4742000000000002"/><rect x="13.676" y="33.1" width="20.648000000000003" height="2.6" rx="1.3"/></g></svg>`;
function heroArt() {
  let lines = ''; for (let i = 0; i < 9; i++) lines += `<path d="M${-20 + i * 40} 220 L${140 + i * 40} 0" stroke="rgba(181,242,61,${0.05 + i * 0.012})" stroke-width="1"/>`;
  return `<svg class="art" viewBox="0 0 360 220" fill="none"><defs>
    <linearGradient id="ha1" x1="0" x2="1"><stop offset="0" stop-color="#b5f23d" stop-opacity="0"/><stop offset="1" stop-color="#b5f23d" stop-opacity=".9"/></linearGradient>
    <radialGradient id="ha2" cx=".7" cy=".3" r=".6"><stop offset="0" stop-color="#3987e5" stop-opacity=".45"/><stop offset="1" stop-color="#3987e5" stop-opacity="0"/></radialGradient></defs>
    <rect width="360" height="220" fill="url(#ha2)"/>${lines}
    <path d="M30 190 C 90 170, 120 150, 160 120 S 240 70, 330 40" stroke="url(#ha1)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="330" cy="40" r="6" fill="#b5f23d"/><circle cx="330" cy="40" r="14" stroke="#b5f23d" stroke-opacity=".35" stroke-width="2"/>
    <g transform="translate(210 120) rotate(-28)" opacity=".85"><rect x="-58" y="-4" width="116" height="8" rx="4" fill="#dfe7f1"/>
      <rect x="-50" y="-26" width="14" height="52" rx="4" fill="#b5f23d"/><rect x="-66" y="-18" width="12" height="36" rx="4" fill="#8fbf2f"/>
      <rect x="36" y="-26" width="14" height="52" rx="4" fill="#b5f23d"/><rect x="54" y="-18" width="12" height="36" rx="4" fill="#8fbf2f"/></g></svg>`;
}
const RECIPE_GRAD = { breakfast: ['#fde68a', '#f59e0b'], lunch: ['#a7f3d0', '#10b981'], dinner: ['#fecaca', '#ef4444'], snack: ['#c7d2fe', '#6366f1'] };

/* ---------- muscle map (front + back) ---------- */
const MM = {
  front: {
    left: [['traps', 'path', 'M45 26 L37 33.5 L45 32.5 Z'], ['sideDelt', 'ellipse', '29,41,4.6,7'], ['frontDelt', 'ellipse', '35,39,5,6.5'],
      ['chest', 'path', 'M49.2 34.5 L39.5 34.5 Q33.5 37.5 34.5 46 Q37.5 53 49.2 52 Z'], ['biceps', 'path', 'M26.8 48.5 Q22.8 56 24.8 64.5 Q28.8 66.5 31.8 63.5 Q33 55 31.2 48.5 Z'],
      ['forearms', 'path', 'M24.3 67.5 Q20.3 77 21.3 88 L25.3 88 Q29.3 78 31.3 67.5 Z'], ['obliques', 'path', 'M40.8 54 L36.8 55 Q35.6 68 39.4 82 L42.6 82 Q41.2 68 42.2 54.5 Z'],
      ['quads', 'path', 'M38.6 93 Q32.8 109 34.8 130 Q39 136.5 45.2 132 Q48.2 114 48.2 96 Z'], ['adductors', 'path', 'M48.6 97 Q48 111 46.4 124 L49.6 111 L49.8 97 Z'],
      ['calves', 'path', 'M36 142 Q33 156 36 172 L41 172 Q44 156 42.5 142 Z']],
    center: [['abs', 'rect', '43,54,14,29,4']],
    neutral: ['<circle cx="50" cy="14" r="8.5"/>', '<rect x="46" y="21.5" width="8" height="7" rx="2"/>', '<path d="M38.5 84 L61.5 84 L63.5 93.5 L36.5 93.5 Z"/>',
      '<circle cx="22.5" cy="92" r="3.6"/>', '<circle cx="77.5" cy="92" r="3.6"/>', '<ellipse cx="40.5" cy="137.5" rx="4.4" ry="4.2"/>', '<ellipse cx="59.5" cy="137.5" rx="4.4" ry="4.2"/>',
      '<ellipse cx="38.5" cy="176.5" rx="5" ry="2.8"/>', '<ellipse cx="61.5" cy="176.5" rx="5" ry="2.8"/>'],
    extra: '<path class="six" d="M50 55v27M43.5 61.5h13M43.5 68.5h13M43.5 75.5h13" fill="none"/>'
  },
  back: {
    left: [['rearDelt', 'ellipse', '33.5,39.5,5.4,6.4'], ['sideDelt', 'ellipse', '28,42,3.6,6.2'], ['upperBack', 'path', 'M49.2 50 L45 36.5 L38.5 40 Q37.2 46 40.2 52 Z'],
      ['lats', 'path', 'M40.2 53.5 Q36.2 58 38.2 68 L46.2 80.5 L48.2 64 L48.4 54 Z'], ['triceps', 'path', 'M26.8 48.5 Q22.8 56 24.8 64.5 Q28.8 66.5 31.8 63.5 Q33 55 31.2 48.5 Z'],
      ['forearms', 'path', 'M24.3 67.5 Q20.3 77 21.3 88 L25.3 88 Q29.3 78 31.3 67.5 Z'], ['glutes', 'ellipse', '43.6,93.5,6.6,8.2'],
      ['hamstrings', 'path', 'M38.2 103 Q34 117 35.8 132 Q40 136.5 46 132 Q48.4 118 48.2 104.5 Z'], ['calves', 'path', 'M35 141 Q31.6 151 34.8 163 Q39 167.5 43.2 161 Q45.2 151 42.2 141 Z']],
    center: [['traps', 'path', 'M50 23.5 L40.5 32 L45 36 L50 49.5 L55 36 L59.5 32 Z'], ['lowerBack', 'rect', '45,66,10,16.5,3']],
    neutral: ['<circle cx="50" cy="14" r="8.5"/>', '<rect x="46" y="21.5" width="8" height="5" rx="2"/>', '<circle cx="22.5" cy="92" r="3.6"/>', '<circle cx="77.5" cy="92" r="3.6"/>',
      '<rect x="37" y="166" width="7" height="7" rx="3"/>', '<rect x="56" y="166" width="7" height="7" rx="3"/>', '<ellipse cx="40.5" cy="176.5" rx="4.6" ry="2.8"/>', '<ellipse cx="59.5" cy="176.5" rx="4.6" ry="2.8"/>',
      '<ellipse cx="40.5" cy="137" rx="4" ry="3.6"/>', '<ellipse cx="59.5" cy="137" rx="4" ry="3.6"/>'],
    extra: ''
  }
};
function mmShape(kind, a, cls) {
  if (kind === 'path') return `<path class="${cls}" d="${a}"/>`;
  const v = a.split(',').map(Number);
  if (kind === 'ellipse') return `<ellipse class="${cls}" cx="${v[0]}" cy="${v[1]}" rx="${v[2]}" ry="${v[3]}"/>`;
  return `<rect class="${cls}" x="${v[0]}" y="${v[1]}" width="${v[2]}" height="${v[3]}" rx="${v[4] || 0}"/>`;
}
function muscleMap(primary = [], secondary = [], cls = 'mm') {
  const P = new Set(primary), S2 = new Set(secondary);
  const c = k => P.has(k) ? 'p1' : S2.has(k) ? 'p2' : 'b';
  const fig = (v, dx) => {
    const d = MM[v]; const left = d.left.map(([k, t, a]) => mmShape(t, a, c(k))).join('');
    return `<g transform="translate(${dx} 0)"><g class="b">${d.neutral.join('')}</g>${left}<g transform="translate(100 0) scale(-1 1)">${left}</g>${d.center.map(([k, t, a]) => mmShape(t, a, c(k))).join('')}${d.extra}</g>`;
  };
  return `<svg class="${cls}" viewBox="14 4 172 178" aria-hidden="true">${fig('front', 0)}${fig('back', 86)}</svg>`;
}

/* ---------- tooltip ---------- */
const tipEl = () => $('#tip');
function exTipHTML(exId, extra = '') {
  const ex = EX[exId]; if (!ex) return '';
  const muscles = ex.primary.map(k => REGION_LABEL[k]).join(', ') + (ex.secondary.length ? ` <span class="muted">· ${ex.secondary.map(k => REGION_LABEL[k]).join(', ')}</span>` : '');
  return `<div class="tmm">${muscleMap(ex.primary, ex.secondary)}<div><h4>${esc(ex.name)}</h4><div class="tmeta">${esc(ex.equip)} · ${ex.compound ? 'Compound' : 'Isolation'}</div><div class="small">${muscles}</div></div></div>
    ${extra}<ol>${ex.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <div class="cue"><b>Cues:</b> ${ex.cues.map(esc).join(' · ')}</div><div class="mistake"><b>Avoid:</b> ${esc(ex.mistake)}</div>`;
}
function woTipHTML(date) {
  const e = S.plan[date]; if (!e || !e.w) return '';
  const t = TEMPLATES[e.w.t]; const rows = sessionRows(e.w);
  const prim = new Set(), sec = new Set(); rows.forEach(r => { r.ex.primary.forEach(k => prim.add(k)); r.ex.secondary.forEach(k => sec.add(k)); });
  return `<div class="tmm">${muscleMap([...prim], [...sec])}<div><h4>${esc(t.name)}</h4><div class="tmeta">Week ${e.w.wk} · ${phaseForWeek(e.w.wk).name} · ${rows.reduce((a, r) => a + r.sets, 0)} sets · ~${estMinutes(rows)} min</div><div class="small sub">${esc(t.focus)}</div></div></div>
    <ul class="tl">${rows.map(r => `<li>${esc(r.ex.name)}<span>${r.sets}×${esc(r.reps)}</span></li>`).join('')}</ul><div class="tiny muted" style="margin-top:8px">Drag to move · Ctrl/Alt-drag to copy · click the day for details</div>`;
}
function tplTipHTML(t) {
  const T = TEMPLATES[t]; const rows = sessionRows({ t, wk: ({ 1: 1, 2: 5, 3: 9, 4: 13, 5: 22 })[T.phase] || 1 });
  const phn = (ALL_PHASES.find(p => p.templates.includes(t)) || {}).name || '';
  return `<h4>${esc(T.name)}</h4><div class="tmeta">${esc(phn)} template · dropping it uses that week's exercise variations</div><div class="small sub">${esc(T.focus)}</div><ul class="tl">${rows.map(r => `<li>${esc(SLOTS[r.slot].label)}<span>${r.sets}×${esc(r.reps)}</span></li>`).join('')}</ul>`;
}
function mealTipHTML(key) {
  const [date, slot] = key.split('|'); const A = computeAll(); const day = A.days[date]; if (!day) return '';
  const m = day.meals.find(x => x.slot === slot); if (!m) return '';
  const b = A.batches.info[date + '|' + slot];
  let bt = '';
  if (b) bt = b.role === 'cook' ? `<div class="note acc" style="margin:8px 0">${icon('flame')}<span>Cook today — batch of <b>${b.batch.size}</b> serving${b.batch.size > 1 ? 's' : ''}${b.batch.size < m.r.yield ? ` (recipe scaled to ${Math.round(b.batch.scale * 100)}%)` : ''}. Leftovers are scheduled.</span></div>`
    : `<div class="note" style="margin:8px 0">${icon('loop')}<span>Leftover ${b.idx}/${b.batch.size} from ${fmtDate(b.batch.cook)}${b.frozen ? ' — thaw from freezer' : ''}.</span></div>`;
  return `<div class="row"><span style="font-size:28px">${esc(m.r.emoji)}</span><div><h4>${esc(m.r.name)}</h4><div class="tmeta" style="margin:0">${SLOT_LABEL[slot]} · ${fmtDate(date)}</div></div></div>${bt}
    <div class="small" style="margin-top:6px"><b>${fmt(m.m.k)}</b> kcal · <span style="color:var(--prot)">P ${fmt(m.m.p)}g</span> · <span style="color:var(--carb)">C ${fmt(m.m.c)}g</span> · <span style="color:var(--fat)">F ${fmt(m.m.f)}g</span></div>
    <div class="tiny muted" style="margin-top:6px">Portions: protein ×${day.pF.toFixed(2)} · carbs/fats ×${day.cF.toFixed(2)} (${day.isTrain ? 'training' : 'rest'} day)</div>`;
}
let tipTarget = null;
function showTip(el, html) {
  const t = tipEl(); t.innerHTML = html; t.classList.add('on');
  const r = el.getBoundingClientRect(); const tw = t.offsetWidth, th = t.offsetHeight;
  let x = r.right + 12, y = r.top - 6;
  if (x + tw > innerWidth - 10) x = r.left - tw - 12;
  if (x < 10) { x = Math.min(innerWidth - tw - 10, Math.max(10, r.left)); y = r.bottom + 10; }
  if (y + th > innerHeight - 10) y = Math.max(10, innerHeight - th - 10);
  t.style.left = x + 'px'; t.style.top = y + 'px';
}
function hideTip() { tipEl().classList.remove('on'); tipTarget = null; }
document.addEventListener('mouseover', e => {
  if (document.body.classList.contains('dragging')) return;
  const el = e.target.closest('[data-tip-ex],[data-tip-wo],[data-tip-meal],[data-tip-tpl],[data-tip]');
  if (!el) { if (tipTarget) hideTip(); return; }
  if (el === tipTarget) return; tipTarget = el;
  let html = '';
  if (el.dataset.tipEx) html = exTipHTML(el.dataset.tipEx, el.dataset.tipExtra ? `<div class="note acc" style="margin:4px 0 2px">${esc(el.dataset.tipExtra)}</div>` : '');
  else if (el.dataset.tipWo) html = woTipHTML(el.dataset.tipWo);
  else if (el.dataset.tipMeal) html = mealTipHTML(el.dataset.tipMeal);
  else if (el.dataset.tipTpl) html = tplTipHTML(el.dataset.tipTpl);
  else html = `<div class="small">${esc(el.dataset.tip)}</div>`;
  if (html) showTip(el, html); else hideTip();
});
document.addEventListener('scroll', hideTip, true);

/* ---------- charts ---------- */
function niceTicks(min, max, n = 5) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min; const raw = span / n; const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => span / s <= n) || 10 * mag;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step; const out = [];
  for (let v = lo; v <= hi + step * 1e-6; v += step) out.push(+v.toFixed(6));
  return out;
}
/* cfg: {series:[{label,color,pts:[{d,v}],line,dots,muted,width}], refs:[{v,label}], yFmt, h, xMin, xMax} */
function lineChart(el, cfg) {
  if (!el) return;
  const all = cfg.series.flatMap(s => s.pts);
  const H = cfg.h || 260;
  if (!all.length) { el.innerHTML = `<div class="empty" style="height:${H}px">${cfg.empty || 'No data yet'}</div>`; return; }
  const W = Math.max(280, el.clientWidth || 600);
  const m = { l: 44, r: 16, t: 14, b: 28 };
  const ds = all.map(p => p.d).sort(); const x0 = cfg.xMin || ds[0], x1 = cfg.xMax || ds[ds.length - 1];
  const span = Math.max(1, dayDiff(x0, x1));
  let vs = all.map(p => p.v).concat((cfg.refs || []).filter(r => r.inRange !== false).map(r => r.v));
  let yMin = Math.min(...vs), yMax = Math.max(...vs); const pad = (yMax - yMin) * 0.08 || 1; yMin -= pad; yMax += pad;
  const ticks = niceTicks(yMin, yMax, 5); yMin = ticks[0]; yMax = ticks[ticks.length - 1];
  const X = d => m.l + (dayDiff(x0, d) / span) * (W - m.l - m.r);
  const Y = v => m.t + (1 - (v - yMin) / (yMax - yMin)) * (H - m.t - m.b);
  const step = ticks.length > 1 ? ticks[1] - ticks[0] : 1; const dec = step < 0.1 ? 2 : step < 1 ? 1 : 0;
  const yF = cfg.unit != null ? (v => fmt(v, dec) + cfg.unit) : (cfg.yFmt || (v => fmt(v, dec)));
  let s = `<svg viewBox="0 0 ${W} ${H}" height="${H}">`;
  ticks.forEach(t => { s += `<line class="grid-l" x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}"/><text class="ax" x="${m.l - 8}" y="${Y(t) + 4}" text-anchor="end">${yF(t)}</text>`; });
  const nX = Math.min(6, span + 1); for (let i = 0; i < nX; i++) { const d = addDays(x0, Math.round(span * i / Math.max(1, nX - 1))); s += `<text class="ax" x="${X(d)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === nX - 1 ? 'end' : 'middle'}">${fmtDate(d, { month: 'short', day: 'numeric' })}</text>`; }
  (cfg.refs || []).forEach(r => { if (r.v < yMin || r.v > yMax) return; s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(r.v)}" y2="${Y(r.v)}" stroke="${r.color || 'var(--muted)'}" stroke-width="1.5" opacity=".8"/><text class="ax" x="${W - m.r}" y="${Y(r.v) - 6}" text-anchor="end" style="fill:var(--text-2);font-weight:600">${esc(r.label)}</text>`; });
  cfg.series.forEach(se => {
    const pts = se.pts.slice().sort((a, b) => a.d < b.d ? -1 : 1);
    if (se.area && pts.length > 1) s += `<path d="M${X(pts[0].d)} ${Y(yMin)} ${pts.map(p => `L${X(p.d)} ${Y(p.v)}`).join(' ')} L${X(pts[pts.length - 1].d)} ${Y(yMin)} Z" fill="${se.color}" opacity=".1"/>`;
    if (se.line !== false && pts.length > 1) s += `<path d="${pts.map((p, i) => (i ? 'L' : 'M') + X(p.d) + ' ' + Y(p.v)).join(' ')}" fill="none" stroke="${se.color}" stroke-width="${se.width || 2}" stroke-linejoin="round" stroke-linecap="round" opacity="${se.muted ? .55 : 1}"/>`;
    if (se.dots) pts.forEach(p => { s += `<circle cx="${X(p.d)}" cy="${Y(p.v)}" r="${p.pr ? 5.5 : (se.r || 4)}" fill="${p.pr ? '#f59e0b' : se.color}" stroke="var(--solid)" stroke-width="2" opacity="${se.muted ? .6 : 1}"/>`; });
  });
  s += `<line class="xh" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" stroke="var(--line-2)" stroke-width="1" visibility="hidden"/><g class="hl"></g><rect class="hit" x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}" fill="transparent"/></svg><div class="tt hidden"></div>`;
  el.innerHTML = s;
  const svg = $('svg', el), tt = $('.tt', el), xh = $('.xh', el), hl = $('.hl', el);
  const dates = [...new Set(all.map(p => p.d))].sort();
  $('.hit', el).addEventListener('mousemove', ev => {
    const r = svg.getBoundingClientRect(); const px = (ev.clientX - r.left) * (W / r.width);
    let best = dates[0], bd = 1e9; dates.forEach(d => { const dd = Math.abs(X(d) - px); if (dd < bd) { bd = dd; best = d; } });
    xh.setAttribute('x1', X(best)); xh.setAttribute('x2', X(best)); xh.setAttribute('visibility', 'visible');
    let rows = '', dots = '', topY = H;
    cfg.series.forEach(se => { const p = se.pts.find(q => q.d === best); if (!p) return; topY = Math.min(topY, Y(p.v));
      dots += `<circle cx="${X(best)}" cy="${Y(p.v)}" r="5" fill="${se.color}" stroke="var(--solid)" stroke-width="2"/>`;
      rows += `<div class="r"><i class="dot" style="background:${se.color}"></i>${esc(se.label)}<b>${(se.fmt || yF)(p.v)}${p.note ? ' · ' + esc(p.note) : ''}</b></div>`; });
    hl.innerHTML = dots;
    tt.innerHTML = `<div class="tiny muted" style="margin-bottom:4px">${fmtDate(best, { weekday: 'short', month: 'short', day: 'numeric' })}</div>${rows}`;
    tt.classList.remove('hidden'); const sx = r.width / W;
    tt.style.left = Math.min(r.width - 70, Math.max(70, X(best) * sx)) + 'px'; tt.style.top = (topY * sx - 10) + 'px';
  });
  $('.hit', el).addEventListener('mouseleave', () => { tt.classList.add('hidden'); xh.setAttribute('visibility', 'hidden'); hl.innerHTML = ''; });
}
function ringSVG(frac, color, size = 132, stroke = 12) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
  return `<svg viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="${stroke}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c * f} ${c}"/></svg>`;
}
function macroBars(tot, tg) {
  const row = (lbl, v, t, col, unit = 'g') => `<div class="mbar"><span class="sub">${lbl}</span><div class="track"><i style="width:${Math.min(100, t ? v / t * 100 : 0)}%;background:${col}"></i></div><b class="num">${fmt(v)}${t ? `<span class="muted"> / ${lbl === 'Protein' ? '' : '~'}${fmt(t)}${unit}</span>` : unit}</b></div>`;
  return row('Protein', tot.p, tg.protein, 'var(--prot)') + row('Carbs', tot.c, tg.carbs, 'var(--carb)') + row('Fat', tot.f, tg.fat, 'var(--fat)');
}
function estMinutes(rows) { return Math.round(rows.reduce((a, r) => a + r.sets * (0.75 + r.rest / 60), 0) + 8); }

/* ---------- toast, modal ---------- */
let toastTimer = null;
const TOAST_MS = 10000;   // notifications stay up for 10 seconds (paused while the pointer is over them)
function toast(msg, undoable) {
  const t = $('#toast'); if (!t) return;
  t.innerHTML = `<span>${esc(msg)}</span>${undoable ? `<button data-act="undo">Undo</button>` : ''}<button class="toast-x" data-act="toast-close" aria-label="Dismiss">${icon('x')}</button>`;
  t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
  t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), TOAST_MS);
  if (!t._hover) { t._hover = true; t.addEventListener('mouseenter', () => clearTimeout(toastTimer)); t.addEventListener('mouseleave', () => { clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 4000); }); }
}
function modal(html, cls = '') {
  closeModal();
  const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal';
  bg.innerHTML = `<div class="modal ${cls}">${html}</div>`;
  bg.addEventListener('mousedown', e => { if (e.target === bg) closeModal(); });
  document.body.appendChild(bg); hideTip();
}
function closeModal() { const m = $('#modal'); if (m) m.remove(); }
function confirmBox(title, text, okLabel, onOk, danger) {
  modal(`<h2>${esc(title)}</h2><p class="sub">${text}</p><div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn" data-act="close-modal">Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" id="cf-ok">${esc(okLabel)}</button></div>`, 'sm');
  $('#cf-ok').onclick = () => { closeModal(); onOk(); };
}

/* ---------- undo ---------- */
const undoStack = [];
function pushUndo(label) { undoStack.push({ plan: JSON.stringify(S.plan), fav: JSON.stringify(S.favRecipes || {}), share: S.settings.shareIngredients !== false, label }); if (undoStack.length > 40) undoStack.shift(); }
function undo() {
  const u = undoStack.pop(); if (!u) { toast('Nothing to undo'); return; }
  S.plan = JSON.parse(u.plan); if (u.fav) S.favRecipes = JSON.parse(u.fav); if (u.share != null) S.settings.shareIngredients = u.share; invalidate(); saveState(); render(); refreshFavButtons();
  if (typeof renderQuickEdit === 'function' && QE && $('#modal .qe-sec')) renderQuickEdit();
  toast('Undid: ' + u.label);
}
function commitPlan(label) { saveState(); render(); toast(label, true); }
