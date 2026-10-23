// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
const SOURCE_URL = 'https://github.com/Oroshi-zz/Forge_90';
const $ = (s, el = document) => el.querySelector(s);
const PHONE_MQ = window.matchMedia ? window.matchMedia('(max-width: 860px)') : null;
const isPhone = () => !!(PHONE_MQ && PHONE_MQ.matches);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n, d = 0) => (n == null || isNaN(n)) ? '—' : Number(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const UI = { calView: 'month', calMonth: null, calWeek: null, libTab: 'workouts', libFilter: 'all', libQ: '', dietFilter: 'all', groWeek: null, prEx: null, planPhase: 1, showLib: true, lowFx: null };
/* Per-account, because two people on one machine were inheriting each other's grocery week,
   calendar position, searches and theme. The bare key stays for signed-out (local) use. */
const UI_DEFAULTS = JSON.parse(JSON.stringify(UI));
function uiUser() { try { return (AUTH && AUTH.user) || null; } catch (e) { return null; } }
const uiKey = () => { const u = uiUser(); return u ? 'forge90.ui:' + u.id : 'forge90.ui'; };
function loadUI() {
  Object.keys(UI).forEach(k => { delete UI[k]; });
  Object.assign(UI, JSON.parse(JSON.stringify(UI_DEFAULTS)));
  try { Object.assign(UI, JSON.parse(localStorage.getItem(uiKey()) || '{}')); } catch (e) { }
  delete UI.returnToRecipe;
}
loadUI();
function saveUI() { try { localStorage.setItem(uiKey(), JSON.stringify(UI)); } catch (e) { } }

/* ---------- visual effects ----------
   Whether this browser can composite on the GPU is a property of the machine, not the account,
   so the choice lives in per-device UI state and never syncs. WebGL falling back to a software
   renderer is the same switch that turns off GPU compositing, so it stands in for it; it only
   picks the first-run default and an explicit choice is never overridden. */
function gpuIsSoftware() {
  try {
    const cv = document.createElement('canvas');
    const gl = cv.getContext('webgl') || cv.getContext('experimental-webgl');
    if (!gl) return true;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const r = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '';
    const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
    return /swiftshader|softwarerasterizer|llvmpipe|basic render|microsoft basic/i.test(r);
  } catch (e) { return false; }
}
function lowFxOn() { if (UI.lowFx == null) { UI.lowFx = gpuIsSoftware(); saveUI(); } return !!UI.lowFx; }
function applyFx() { if (document.body) document.body.classList.toggle('low-fx', lowFxOn()); }

/* ---------- icons (24px stroke) ---------- */
const IC = {
  print: '<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
  expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
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
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
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
  heart: '<path d="M19 14c1.5-1.5 2.5-3.1 2.5-5A4.5 4.5 0 0 0 12 6.5 4.5 4.5 0 0 0 2.5 9c0 1.9 1 3.5 2.5 5l7 7z"/>',
  stopwatch: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6M19 5l1.5 1.5"/>',
  lap: '<path d="M3 12h4l3 7 4-14 3 7h4"/>',
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
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8v8M10 8v8M13 8v8M17 8v8"/>',
  box: '<path d="M21 8v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8"/><path d="M1.5 3.5h21v4.5h-21z"/><path d="M10 12h4"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h8M8 11h6"/>'
};
const icon = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[n] || ''}</svg>`;

/* ---------- generated art ---------- */
const LOGO = `<svg class="logo" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="FORGE 90"><defs><linearGradient id="fgt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#27321c"/><stop offset="1" stop-color="#0b0f09"/></linearGradient><linearGradient id="fgf" x1=".5" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#f2ff9e"/><stop offset=".45" stop-color="#b5f23d"/><stop offset="1" stop-color="#4d8a0a"/></linearGradient></defs><rect width="48" height="48" rx="13" fill="url(#fgt)"/><rect x=".6" y=".6" width="46.8" height="46.8" rx="12.4" fill="none" stroke="#b5f23d" stroke-opacity=".28" stroke-width="1.2"/><path d="M24 12.4V6.800000000000001M18.8 13 15.9 8.8M29.2 13 32.1 8.8" stroke="#d9f99d" stroke-width="2.2" stroke-linecap="round"/><path transform="translate(24 23.8) scale(0.84) translate(-24 -24)" d="M6.5 19.5H38.8Q42.4 19.5 42.4 23.2V24.4H35.6L31.8 29.2V32.6H36.2V37.6H13.8V32.6H18.2V29.2L15.2 25.6Q9.2 25.1 6.5 19.5Z" fill="url(#fgf)"/><g fill="#f7fbe9" stroke="#0f1a02" stroke-width="1.3" paint-order="stroke"><rect x="5.8" y="28.4" width="4.2" height="12" rx="1.8900000000000001"/><rect x="10.4" y="30.68" width="3.2760000000000002" height="7.4399999999999995" rx="1.4742000000000002"/><rect x="38" y="28.4" width="4.2" height="12" rx="1.8900000000000001"/><rect x="34.324" y="30.68" width="3.2760000000000002" height="7.4399999999999995" rx="1.4742000000000002"/><rect x="13.676" y="33.1" width="20.648000000000003" height="2.6" rx="1.3"/></g></svg>`;
function heroArt() {
  /* Colours come from --hero-accent / --accent-2 so the art follows the accent setting. CSS variables
     do not resolve in SVG presentation attributes, so each one is set through a style attribute. */
  const A = 'style="fill:var(--hero-accent)"', AS = 'style="stroke:var(--hero-accent)"';
  let lines = ''; for (let i = 0; i < 9; i++) lines += `<path d="M${-20 + i * 40} 220 L${140 + i * 40} 0" ${AS} stroke-opacity="${(0.05 + i * 0.012).toFixed(3)}" stroke-width="1"/>`;
  return `<svg class="art" viewBox="0 0 360 220" fill="none"><defs>
    <linearGradient id="ha1" x1="0" x2="1"><stop offset="0" style="stop-color:var(--hero-accent)" stop-opacity="0"/><stop offset="1" style="stop-color:var(--hero-accent)" stop-opacity=".9"/></linearGradient>
    <radialGradient id="ha2" cx=".7" cy=".3" r=".6"><stop offset="0" style="stop-color:var(--hero-accent)" stop-opacity=".22"/><stop offset="1" style="stop-color:var(--hero-accent)" stop-opacity="0"/></radialGradient></defs>
    <rect width="360" height="220" fill="url(#ha2)"/>${lines}
    <path d="M30 190 C 90 170, 120 150, 160 120 S 240 70, 330 40" stroke="url(#ha1)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="330" cy="40" r="6" ${A}/><circle cx="330" cy="40" r="14" ${AS} stroke-opacity=".35" stroke-width="2"/>
    <g transform="translate(210 120) rotate(-28)" opacity=".85"><rect x="-58" y="-4" width="116" height="8" rx="4" fill="#dfe7f1"/>
      <rect x="-50" y="-26" width="14" height="52" rx="4" ${A}/><rect x="-66" y="-18" width="12" height="36" rx="4" style="fill:var(--accent-2)"/>
      <rect x="36" y="-26" width="14" height="52" rx="4" ${A}/><rect x="54" y="-18" width="12" height="36" rx="4" style="fill:var(--accent-2)"/></g></svg>`;
}
const RECIPE_GRAD = { breakfast: ['#fde68a', '#f59e0b'], lunch: ['#a7f3d0', '#10b981'], dinner: ['#fecaca', '#ef4444'], snack: ['#c7d2fe', '#6366f1'], dessert: ['#f5d0fe', '#c026d3'] };

/* ---------- muscle map (front + back) ---------- */
/* One figure is 100 wide x 184 tall; only the left half is authored and the right is mirrored.
   The muscle layer is clipped to the silhouette, so bellies may overlap the outline rather than
   having to tile it exactly, and the seam on each belly is what separates them. The outline is
   spliced so the foot differs by view: toes from the front, heel from the back. Hands and feet
   are drawn in the base tone and never take the accent — they are not trainable regions. */
const MM_SIL_F = "M50 4 C45.6 4 41.8 8 41.8 13.6 C41.8 18.8 43.6 22 46 23.6 L45.6 27.6 C39.8 29.2 32.8 31.6 28 35.6 C25 38.2 23.2 41.6 23 45.2 C22.9 50 23.8 54 24.5 58 C25.2 63 25.8 67 26 70.2 C25.4 77 25.1 85 26.2 92 C25.5 95.4 25.3 99.8 26 102.8 C26.5 105.6 28.1 106.9 30 106.9 C31.9 106.9 33.4 105.6 33.8 102.8 C34.5 99.8 34.3 95.4 33.6 92 C33.3 85 33.2 77 33.4 70.2 C33.5 65 33.8 59 34.4 54.5 C35 49.8 35.6 46 36.2 44 C36.4 49 36.5 53 36.7 57 C37.3 66 37.9 74 38.6 80 C37.5 85 36.5 89 36.1 92 C35.1 96 34.7 100 34.5 104 C34.1 112 34.5 120 35.5 128 C36.3 134 37.3 138 38.1 140.5 C36.9 145 36.1 150 36.3 154 C36.7 161 37.7 167 38.7 170.5 C37.6 173.4 36 175.6 35.9 177.4 C35.9 179.4 38 180.1 41.6 180.1 C45 180.1 46.8 179.4 46.9 177.4 C47 175.4 46.6 172.8 46.3 171 C46.1 164 45.7 157 45.7 152 C45.9 147 46.1 143.5 46.3 140.5 C46.7 130 46.9 118 47.3 110 C47.7 104 48.2 99.6 48.8 97.4 C49.2 96 49.6 95.2 50 94.6 L50.5 94 L50.5 4 Z";
const MM_SIL_B = "M50 4 C45.6 4 41.8 8 41.8 13.6 C41.8 18.8 43.6 22 46 23.6 L45.6 27.6 C39.8 29.2 32.8 31.6 28 35.6 C25 38.2 23.2 41.6 23 45.2 C22.9 50 23.8 54 24.5 58 C25.2 63 25.8 67 26 70.2 C25.4 77 25.1 85 26.2 92 C25.5 95.4 25.3 99.8 26 102.8 C26.5 105.6 28.1 106.9 30 106.9 C31.9 106.9 33.4 105.6 33.8 102.8 C34.5 99.8 34.3 95.4 33.6 92 C33.3 85 33.2 77 33.4 70.2 C33.5 65 33.8 59 34.4 54.5 C35 49.8 35.6 46 36.2 44 C36.4 49 36.5 53 36.7 57 C37.3 66 37.9 74 38.6 80 C37.5 85 36.5 89 36.1 92 C35.1 96 34.7 100 34.5 104 C34.1 112 34.5 120 35.5 128 C36.3 134 37.3 138 38.1 140.5 C36.9 145 36.1 150 36.3 154 C36.7 161 37.7 167 38.7 170.5 C38.5 173 38.6 175 39 176.6 C39.5 178.3 40.8 178.9 42.6 178.9 C44.4 178.9 45.5 178.3 45.8 176.6 C46.1 174.8 46.2 172.6 46.3 171 C46.1 164 45.7 157 45.7 152 C45.9 147 46.1 143.5 46.3 140.5 C46.7 130 46.9 118 47.3 110 C47.7 104 48.2 99.6 48.8 97.4 C49.2 96 49.6 95.2 50 94.6 L50.5 94 L50.5 4 Z";
const mmSil = v => v === 'back' ? MM_SIL_B : MM_SIL_F;
const MM = {
  front: {
    left: [
  ["traps", "M46 27.4 C41 28.6 35.4 30.8 30.6 34.2 L33.8 38.4 C38 35.8 42.6 34.4 46.4 34 Z"],
  ["sideDelt", "M30.6 34.4 C27 37 24.4 40.4 23.6 44.6 C23.1 48 24.4 50.6 26.6 51 C28.8 51.4 30.4 49 31 45.4 C31.4 42.4 31.8 38.6 32.4 36.2 Z"],
  ["frontDelt", "M33.6 36.8 C32 39 31.2 42 31.1 45.4 C31 49 32 51.6 33.8 52.2 C35.6 52.8 36.8 51 36.9 47.6 C37 43.6 36.3 39.6 35.6 37.2 Z"],
  ["chest", "M49.6 34.6 C45 34.8 40.4 35.8 36.6 38 C36.2 42.4 36.4 47.4 37.4 51.4 C41.4 54.6 45.6 56 49.6 56.2 Z"],
  ["biceps", "M32.6 46.8 C29.6 50.4 27.2 55 26.4 60.4 C25.8 65 27.2 68.2 29.6 68.4 C32.2 68.6 33.6 66 33.8 61 C34 55.6 33.6 50.2 33.2 46.8 Z"],
  ["forearms", "M32.8 69.8 C30.2 73.8 27.8 79.6 26.9 85 C26.3 89 27.1 91.4 29 91.6 C30.9 91.8 32 89.8 32.5 85.8 C33.2 79.8 33.4 74 33.4 69.8 Z"],
  ["obliques", "M40.6 55.4 C38.8 56.6 37.4 58 36.6 59.6 C36.6 66.4 37.2 73.6 38.6 79.6 C39.6 84 41 87 42.6 88.4 L43.6 79.4 C41.8 71.4 40.6 63 40.6 55.4 Z"],
  ["quads", "M38.4 97.6 C35.4 104.6 34.2 114.6 34.6 124.6 C34.9 132 36.2 137.4 38.4 140.2 C41.4 142.6 44.4 141.2 45.6 136.4 C46.8 124.6 47.2 110 46.9 99 Z"],
  ["adductors", "M47.6 99.4 C45.2 103.8 43.4 109.8 42.6 116.8 C42.1 122 43 126.2 44.6 127.6 C46.1 127.2 47.1 124 47.5 118.8 C47.9 112 48 105 47.9 99.4 Z"],
  ["calves", "M37.6 146.6 C36 152 35.2 158.4 35.6 163.6 C36.8 165.8 38.8 166 40.2 163.8 C41 158.4 41.4 152 41.2 146.8 ZM42.4 146.8 C42.6 152.4 43 158.8 44 162.8 C45.4 163.8 46.4 162 46.2 158.2 C46 153.6 45.4 149.4 44.6 146.6 Z"]
    ],
    center: [
  ["abs", "M44.2 55 C43.4 62 43.2 70 43.6 77 C44 83 45.2 87.6 47.2 90.2 L52.8 90.2 C54.8 87.6 56 83 56.4 77 C56.8 70 56.6 62 55.8 55 Z"]
    ],
    detail: [
  ["hand", "M33.6 92.6 C34.4 95.6 34.5 99.8 33.8 102.8 C33.4 105.6 31.9 106.9 30 106.9 C28.1 106.9 26.5 105.6 26.1 102.8 C25.4 99.8 25.6 95.6 26.3 92.6 Z"],
  ["foot", "M38.6 171.2 C37.6 173.6 36 175.7 35.9 177.5 C35.9 179.5 38 180.2 41.6 180.2 C45 180.2 46.8 179.5 46.9 177.5 C47 175.5 46.6 172.9 46.3 171.2 Z"]
    ]
  },
  back: {
    left: [
  ["sideDelt", "M30.6 34.4 C27 37 24.4 40.4 23.6 44.6 C23.1 48 24.4 50.6 26.6 51 C28.8 51.4 30.4 49 31 45.4 C31.4 42.4 31.8 38.6 32.4 36.2 Z"],
  ["rearDelt", "M33.6 36.8 C32.2 39.2 31.5 42.2 31.5 45.4 C31.5 48.8 32.5 51.2 34.2 51.8 C35.9 52.4 36.9 50.8 36.9 47.6 C36.9 43.6 36.2 39.8 35.6 37.2 Z"],
  ["upperBack", "M49.6 38.6 C45.4 39 41.4 40.4 38 43 C37.6 47.6 38.2 52 39.6 55.2 C42.8 53.8 46.2 53.2 49.6 53 Z"],
  ["lats", "M49.6 54.4 C45.6 54.6 41.4 55.6 38 57.4 C36.6 64.6 37.2 73 39.4 80.6 C41.2 86.6 43.4 90 46.2 91.4 L49.6 91.4 Z"],
  ["triceps", "M33 45.6 C30 49.4 27.4 54.6 26.6 60.4 C26 65.2 27.4 68.4 29.8 68.6 C32.4 68.8 33.8 66.2 34 61 C34.2 55.2 33.8 49.6 33.4 45.6 Z"],
  ["forearms", "M32.8 69.8 C30.2 73.8 27.8 79.6 26.9 85 C26.3 89 27.1 91.4 29 91.6 C30.9 91.8 32 89.8 32.5 85.8 C33.2 79.8 33.4 74 33.4 69.8 Z"],
  ["glutes", "M49 92.4 C44.8 92.6 40.8 94.4 38.4 97.6 C36.6 101.8 36.8 106.4 39 109.4 C42 112 46 111.4 49 108.4 Z"],
  ["hamstrings", "M38.8 110.6 C36.4 117.6 35.6 126 36.2 133.6 C36.6 138.8 37.8 142.6 39.6 144.4 C42.8 146 45.8 144.4 46.8 140 C47.8 130 48 118.6 47.6 111.4 Z"],
  ["calves", "M37.6 146.6 C36 152 35.2 158.4 35.6 163.6 C36.8 165.8 38.8 166 40.2 163.8 C41 158.4 41.4 152 41.2 146.8 ZM42.4 146.8 C42.6 152.4 43 158.8 44 162.8 C45.4 163.8 46.4 162 46.2 158.2 C46 153.6 45.4 149.4 44.6 146.6 Z"]
    ],
    center: [
  ["traps", "M50 26.6 C44.6 27.4 38.6 30 33.8 33.8 L37.6 38.6 C41.2 36.6 45.6 35.6 50 35.4 C54.4 35.6 58.8 36.6 62.4 38.6 L66.2 33.8 C61.4 30 55.4 27.4 50 26.6 ZM50 37.4 C46.2 37.6 42.4 38.6 39.6 40.4 C41.4 47.4 45 54.4 50 59.6 C55 54.4 58.6 47.4 60.4 40.4 C57.6 38.6 53.8 37.6 50 37.4 Z"],
  ["lowerBack", "M46.4 61.6 C45.2 67.6 44.8 75.6 45.4 82.6 C45.8 87 46.6 89.8 47.8 91 L49.2 91 C49 83 48.8 71.6 49 61.6 ZM53.6 61.6 C54.8 67.6 55.2 75.6 54.6 82.6 C54.2 87 53.4 89.8 52.2 91 L50.8 91 C51 83 51.2 71.6 51 61.6 Z"]
    ],
    detail: [
  ["hand", "M33.6 92.6 C34.4 95.6 34.5 99.8 33.8 102.8 C33.4 105.6 31.9 106.9 30 106.9 C28.1 106.9 26.5 105.6 26.1 102.8 C25.4 99.8 25.6 95.6 26.3 92.6 Z"],
  ["foot", "M38.7 171.2 C38.5 173.1 38.6 175.1 39 176.7 C39.5 178.4 40.8 179 42.6 179 C44.4 179 45.5 178.4 45.8 176.7 C46.1 174.9 46.2 172.7 46.3 171.2 Z"]
    ]
  }
};
/* Defs ride inside each figure so the gradient stops resolve against the theme tokens in scope.
   The ids repeat across figures, which is fine: every definition is identical. */
function mmDefs() {
  const pair = d => `<path d="${d}"/><path transform="translate(100 0) scale(-1 1)" d="${d}"/>`;
  const grad = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">`
    + `<stop offset="0%" stop-color="var(--${a})"/><stop offset="100%" stop-color="var(--${b})"/></linearGradient>`;
  return `<defs><clipPath id="mmcf">${pair(MM_SIL_F)}</clipPath><clipPath id="mmcb">${pair(MM_SIL_B)}</clipPath>`
    + grad('mmgb', 'mm-hi', 'mm-lo') + grad('mmgp', 'mm-p-hi', 'mm-p-lo') + grad('mmgs', 'mm-s-hi', 'mm-s-lo')
    + `</defs>`;
}
function muscleMap(primary = [], secondary = [], cls = 'mm') {
  const P = new Set(primary), S2 = new Set(secondary);
  const c = k => P.has(k) ? 'p1' : S2.has(k) ? 'p2' : 'b';
  const draw = (l, cl) => l.map(([k, d]) => `<path class="${cl || c(k)}" d="${d}"/>`).join('');
  const mir = s => `<g transform="translate(100 0) scale(-1 1)">${s}</g>`;
  const fig = (v, dx) => {
    const m = MM[v], half = draw(m.left), det = draw(m.detail, 'b'), d = mmSil(v);
    return `<g transform="translate(${dx} 0)"><g class="mm-sil"><path d="${d}"/>`
      + `<path transform="translate(100 0) scale(-1 1)" d="${d}"/></g>`
      + `<g class="mm-m" clip-path="url(#${v === 'back' ? 'mmcb' : 'mmcf'})">`
      + half + mir(half) + draw(m.center) + det + mir(det) + `</g></g>`;
  };
  return `<svg class="${cls}" viewBox="14 0 172 184" aria-hidden="true">${mmDefs()}${fig('front', 0)}${fig('back', 86)}</svg>`;
}

/* ---------- tooltip ---------- */
const tipEl = () => $('#tip');
function exTipHTML(exId, extra = '') {
  const ex = EX[exId]; if (!ex) return '';
  const muscles = ex.primary.map(k => REGION_LABEL[k]).join(', ') + (ex.secondary.length ? ` <span class="muted">· ${ex.secondary.map(k => REGION_LABEL[k]).join(', ')}</span>` : '');
  return `<div class="tmm">${muscleMap(ex.primary, ex.secondary)}<div><h4>${esc(ex.name)}</h4><div class="tmeta">${esc(ex.equip)} · ${ex.compound ? 'Compound' : 'Isolation'}</div><div class="small">${muscles}</div></div></div>
    ${extra}${ex.why ? `<div class="why"><b>Why it’s here:</b> ${esc(ex.why)}</div>` : ''}<ol>${ex.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
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
let tipPtr = 'mouse', tipTap = null;
document.addEventListener('pointerdown', e => { tipPtr = e.pointerType || 'mouse'; tipTap = e.target; if (tipPtr !== 'mouse' && tipTarget && !(e.target.closest && e.target.closest('#tip'))) hideTip(); }, true);
const TIP_SEL = '[data-tip-ex],[data-tip-wo],[data-tip-meal],[data-tip-tpl],[data-tip]';
function tipHTMLFor(el) {
  if (el.dataset.tipEx) return exTipHTML(el.dataset.tipEx, el.dataset.tipExtra ? `<div class="note acc" style="margin:4px 0 2px">${esc(el.dataset.tipExtra)}</div>` : '');
  if (el.dataset.tipWo) return woTipHTML(el.dataset.tipWo);
  if (el.dataset.tipMeal) return mealTipHTML(el.dataset.tipMeal);
  if (el.dataset.tipTpl) return tplTipHTML(el.dataset.tipTpl);
  return `<div class="small">${esc(el.dataset.tip)}</div>`;
}
function openTip(el) { if (!el) return; if (el === tipTarget) return; tipTarget = el; const html = tipHTMLFor(el); if (html) showTip(el, html); else hideTip(); }
document.addEventListener('mouseover', e => {
  if (document.body.classList.contains('dragging')) return;
  const el = e.target.closest(TIP_SEL);
  if (tipPtr !== 'mouse' && el) return;
  if (!el) { if (tipTarget) hideTip(); return; }
  openTip(el);
});
document.addEventListener('focusin', e => { const el = e.target.closest && e.target.closest(TIP_SEL); if (el) openTip(el); else if (tipTarget) hideTip(); });
document.addEventListener('focusout', e => { if (tipTarget && e.target === tipTarget) hideTip(); });
document.addEventListener('click', e => {
  if (tipPtr === 'mouse') return;
  const el = e.target.closest && e.target.closest(TIP_SEL);
  if (!el) return;
  if (el === tipTarget) { hideTip(); return; }
  openTip(el);
});
document.addEventListener('scroll', hideTip, true);
/* A tip target that isn't already a button or a link can't be tabbed to, so give it a stop. */
function tipA11y(root) {
  $$(TIP_SEL, root || document).forEach(el => {
    if (el.hasAttribute('tabindex') || /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName) || el.closest('button, a')) return;
    el.tabIndex = 0;
  });
}

/* ---------- charts ---------- */
function niceTicks(min, max, n = 5) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min; const raw = span / n; const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => span / s <= n) || 10 * mag;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step; const out = [];
  for (let v = lo; v <= hi + step * 1e-6; v += step) out.push(+v.toFixed(6));
  return out;
}
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
  const nX = Math.max(2, Math.min(6, span + 1, Math.floor((W - m.l - m.r) / 58) + 1)); for (let i = 0; i < nX; i++) { const d = addDays(x0, Math.round(span * i / Math.max(1, nX - 1))); s += `<text class="ax" x="${X(d)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === nX - 1 ? 'end' : 'middle'}">${fmtDate(d, { month: 'short', day: 'numeric' })}</text>`; }
  (cfg.refs || []).forEach(r => { if (r.v < yMin || r.v > yMax) return; s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(r.v)}" y2="${Y(r.v)}" stroke="${r.color || 'var(--muted)'}" stroke-width="1.5" opacity=".8"/><text class="ax" x="${W - m.r}" y="${Y(r.v) - 6}" text-anchor="end" style="fill:var(--text-2);font-weight:600">${esc(r.label)}</text>`; });
  cfg.series.forEach(se => {
    const pts = se.pts.slice().sort((a, b) => a.d < b.d ? -1 : 1);
    if (se.area && pts.length > 1) s += `<path d="M${X(pts[0].d)} ${Y(yMin)} ${pts.map(p => `L${X(p.d)} ${Y(p.v)}`).join(' ')} L${X(pts[pts.length - 1].d)} ${Y(yMin)} Z" fill="${se.color}" opacity=".1"/>`;
    if (se.line !== false && pts.length > 1) s += `<path d="${pts.map((p, i) => (i ? 'L' : 'M') + X(p.d) + ' ' + Y(p.v)).join(' ')}" fill="none" stroke="${se.color}" stroke-width="${se.width || 2}" stroke-linejoin="round" stroke-linecap="round" opacity="${se.muted ? .55 : 1}"/>`;
    if (se.dots) pts.forEach(p => { s += `<circle cx="${X(p.d)}" cy="${Y(p.v)}" r="${p.pr ? 5.5 : (se.r || 4)}" fill="${p.pr ? '#f59e0b' : se.color}" stroke="var(--solid)" stroke-width="2" opacity="${se.muted ? .6 : 1}"/>`; });
  });
  s += `<line class="xh" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" stroke="var(--line-2)" stroke-width="1" visibility="hidden"/><g class="hl"></g><rect class="hit" x="0" y="0" width="${W}" height="${H}" fill="transparent"/></svg><div class="tt hidden"></div>`;
  el.innerHTML = s;
  const svg = $('svg', el), tt = $('.tt', el), xh = $('.xh', el), hl = $('.hl', el);
  const dates = [...new Set(all.map(p => p.d))].sort();
  const hit = $('.hit', el); let touchTT = false;
  const move = ev => {
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
  };
  const hide = () => { tt.classList.add('hidden'); xh.setAttribute('visibility', 'hidden'); hl.innerHTML = ''; };
  hit.addEventListener('pointermove', ev => { if (ev.pointerType === 'mouse' || ev.buttons) move(ev); });
  hit.addEventListener('pointerdown', ev => { touchTT = ev.pointerType !== 'mouse'; move(ev); });
  hit.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') hide(); });
  if (!lineChart._doc) { lineChart._doc = true; document.addEventListener('pointerdown', ev => { $$('.chart .tt:not(.hidden)').forEach(t => { const c = t.closest('.chart'); if (c && !c.contains(ev.target) && c._hide) c._hide(); }); }); }
  el._hide = hide; el.tabIndex = 0; el.setAttribute('role', 'img'); el.setAttribute('aria-label', (cfg.label || cfg.series.map(x => x.label).join(', ')) + ' chart. Use the left and right arrow keys to read values.');
  el.onkeydown = ev => { if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return; ev.preventDefault(); const cur = el._ki == null ? (ev.key === 'ArrowLeft' ? dates.length : -1) : el._ki; el._ki = Math.max(0, Math.min(dates.length - 1, cur + (ev.key === 'ArrowLeft' ? -1 : 1)));
    const r = svg.getBoundingClientRect(); move({ clientX: r.left + X(dates[el._ki]) * r.width / W }); };
  el.onblur = () => { el._ki = null; hide(); };
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
const TOAST_MS = 10000;
function toast(msg, undoable) {
  const t = $('#toast'); if (!t) return;
  t.innerHTML = `<span>${esc(msg)}</span>${undoable ? `<button data-act="undo">Undo</button>` : ''}<button class="toast-x" data-act="toast-close" aria-label="Dismiss">${icon('x')}</button>`;
  t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
  t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), TOAST_MS);
  if (!t._hover) { t._hover = true; t.addEventListener('mouseenter', () => clearTimeout(toastTimer)); t.addEventListener('mouseleave', () => { clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 4000); }); }
}
function modal(html, cls = '', backable) {
  const old = $('#modal'); if (old) old.remove();
  const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal';
  bg.innerHTML = `<div class="modal ${cls}">${isPhone() ? '<div class="sh-hdl" role="button" tabindex="-1" aria-label="Close"><i></i></div>' : ''}${html}</div>`;
  bg.addEventListener('mousedown', e => { if (e.target === bg) closeModal(); });
  document.body.appendChild(bg); hideTip();
  if (backable) backPush('modal', closeModal);
}
/* Set when "New food" is opened from inside the recipe editor, so saving that food drops it
   straight into the recipe. It lives here rather than on UI because it is only true while that
   one dialog is open: on UI it was written to storage and stayed set when the dialog was
   cancelled. Declared beside closeModal so closing the dialog can always clear it. */
let RE_ADDFOOD = false;
/* Set while a food is being created from a receipt line, so saving binds it back to that line.
   Declared here beside RE_ADDFOOD because the food editor lives earlier in the bundle than the
   receipt code that uses it. */
let RC_PICK = null;
/* Dismissing the scanner by the backdrop or the phone back button never went through an action
   handler, so the camera stayed live behind a closed dialog. Only the scanner's own modal is
   matched, so the pantry session that reopens itself is left alone. */
function closeModal() {
  RE_ADDFOOD = false; const m = $('#modal');
  if (m && m.querySelector('.scan-m')) scanStop();
  if (m && m.querySelector('.pp-cam')) { ppCamStop(); PPC = null; }
  if (m) m.remove(); backDrop('modal');
}

const BACK_STACK = []; let BACK_SELF = false;
function backPush(name, close) {
  const top = BACK_STACK[BACK_STACK.length - 1];
  if (top && top.name === name) { top.close = close; return; }
  if (!BACK_STACK.length) { try { history.pushState({ f90: 1 }, ''); } catch (e) { } }
  BACK_STACK.push({ name, close });
}
function backDrop(name) {                       // closed by a tap, Escape or a button: take our entry back
  const i = BACK_STACK.map(x => x.name).lastIndexOf(name); if (i < 0) return;
  BACK_STACK.splice(i, 1);
  if (!BACK_STACK.length && history.state && history.state.f90) { BACK_SELF = true; try { history.back(); } catch (e) { BACK_SELF = false; } }
}
window.addEventListener('popstate', () => {
  if (BACK_SELF) { BACK_SELF = false; return; }
  const top = BACK_STACK.pop(); if (!top) return;
  if (BACK_STACK.length) { try { history.pushState({ f90: 1 }, ''); } catch (e) { } }
  try { top.close(); } catch (e) { }
});
function confirmBox(title, text, okLabel, onOk, danger) {
  modal(`<h2>${esc(title)}</h2><p class="sub">${text}</p><div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn" data-act="close-modal">Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" id="cf-ok">${esc(okLabel)}</button></div>`, 'sm');
  $('#cf-ok').onclick = () => { closeModal(); onOk(); };
}

/* ---------- undo ---------- */
const undoStack = [];
function pushUndo(label, extra) { undoStack.push({ plan: JSON.stringify(S.plan), fav: JSON.stringify(S.favRecipes || {}), share: S.settings.shareIngredients !== false, swap: JSON.stringify(S.slotSwap || {}), gym: JSON.stringify({ c: S.gymCards || [], a: S.gymActive || null }), extra: extra ? JSON.parse(JSON.stringify(extra)) : null, label }); if (undoStack.length > 40) undoStack.shift(); }
function undo() {
  const u = undoStack.pop(); if (!u) { toast('Nothing to undo'); return; }
  S.plan = JSON.parse(u.plan); if (u.fav) S.favRecipes = JSON.parse(u.fav); if (u.swap) S.slotSwap = JSON.parse(u.swap); if (u.gym) { const g = JSON.parse(u.gym); S.gymCards = g.c; S.gymActive = g.a; } if (u.share != null) S.settings.shareIngredients = u.share;
  if (u.extra) { if (u.extra.startDate) S.settings.startDate = u.extra.startDate; if ('planEnd' in u.extra) S.planEnd = u.extra.planEnd; }
  if (typeof simInvalidate === 'function') simInvalidate();
  invalidate(); saveState(); render(); refreshFavButtons();
  if (typeof renderQuickEdit === 'function' && QE && $('#modal .qe-sec')) renderQuickEdit();
  toast('Undid: ' + u.label);
}
function commitPlan(label) { saveState(); render(); toast(label, true); }
