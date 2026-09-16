// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
/* ============================================================
   FORGE 90 — Engine: state, targets, plan generation, portioning,
   leftovers/batches, PRs and trends. (No DOM in this file.)
   ============================================================ */
let STORE_KEY = 'forge90.v1';          // per-user key when signed in to the server (see views-e)
let NEW_STATE_DEFAULTS = null;
const LAUNCH_DAYS = 90;          // the original 90-day launch block (Cycle 1)
const PLAN_DAYS = LAUNCH_DAYS;   // kept for launch-block copy

/* ---------- dates ---------- */
const pad2 = n => String(n).padStart(2, '0');
function iso(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function parseISO(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(s, n) { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); }
function dayDiff(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
function todayISO() { return iso(new Date()); }
function nextMonday(from) { const d = parseISO(from); const wd = d.getDay(); const add = wd === 1 ? 0 : (8 - wd) % 7; d.setDate(d.getDate() + add); return iso(d); }
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function fmtDate(s, opts) { return parseISO(s).toLocaleDateString(undefined, opts || { weekday: 'short', month: 'short', day: 'numeric' }); }
const maxISO = (a, b) => a > b ? a : b;

/* ---------- state ---------- */
function defaultSettings() {
  return {
    startDate: nextMonday(todayISO()),
    trainDays: [1, 3, 5],
    startWeight: 230, startBF: 30,
    goalWeight: 180, goalBF: 15,
    rate: 1.25,            // lb / week
    shareIngredients: true, // plan meals so recipes share ingredients (fewer packages, less waste)
    activity: 1.4,         // non-exercise activity multiplier on BMR
    sessionKcal: 250,      // extra burn on a lifting day
    proteinPerLb: 0.85,    // g per lb bodyweight (range 0.5–1.0)
    kcalAdjust: 0,         // manual / trend-based adjustment
    minKcal: 1800,
    atGoal: 'maintain',    // 'maintain' = switch to maintenance calories once goal weight or BF% is reached
    goal: 'cut',           // 'cut' | 'maintain' | 'bulk'
    /* Bulking. Gain is set as a share of body weight per week rather than a flat pound:
       0.25–0.5 %/wk is the range trained lifters can add with most of it as lean mass, and
       the same absolute surplus means very different things at 150 lb and 250 lb.
       The surplus is capped because past roughly 500 kcal/day the extra goes on as fat,
       and the bulk stops at a body-fat ceiling, where more of every surplus calorie is
       stored rather than used. */
    bulkPct: 0.35,         // % of body weight gained per week (0.25–0.5)
    bulkMaxSurplus: 500,   // kcal/day ceiling on the surplus
    bulkMaxBF: 20,         // % body fat at which the bulk stops and holds at maintenance
    bgDim: 0.7,            // background photo dimming — fixed at 30% photo visibility
    bgPhotos: true,        // section photos behind the glass; off = plain background
    theme: 'dark',
    restDef: 90,           // rest timer: default seconds between sets
    restPlan: true,        // use each exercise's suggested rest (heavy sets longer), the default fills the gaps
    restAuto: true,        // logging a set in workout mode starts the timer
    restSound: 'beeps', restVol: 0.8, restVib: true
  };
}
let S = null;
function freshState() {
  return { v: 5, onboarded: false, profile: null, settings: defaultSettings(), plan: {}, planEnd: null, weights: [], logs: {}, done: {}, created: todayISO(), customExercises: {},
    foodPrefs: Object.assign({}, DEFAULT_FOOD_PREFS), favRecipes: {}, exOff: {}, customFoods: {}, foodOverrides: {}, customRecipes: {}, recipeOverrides: {}, recipeOff: {}, bgCustom: {}, grocery: {}, importMap: {}, favFoods: {}, pantry: [], gymCards: [] };
}
function migrateState() {
  const f = freshState();
  ['weights', 'logs', 'done', 'customExercises', 'foodPrefs', 'favRecipes', 'exOff', 'customFoods', 'foodOverrides', 'customRecipes', 'recipeOverrides', 'recipeOff', 'bgCustom', 'grocery', 'importMap', 'favFoods', 'pantry', 'gymCards'].forEach(k => { if (!S[k]) S[k] = f[k]; });
  S.settings = Object.assign(defaultSettings(), S.settings);
  if (S.onboarded === undefined) S.onboarded = true;
  // research-backed extra exercises start switched off — applied once per exercise, so a user's own choice sticks
  S.exDefaults = S.exDefaults || {}; S.exOff = S.exOff || {};
  EXTRA_EX.forEach(id => { if (S.exDefaults[id]) return; S.exDefaults[id] = 1; const per = S.exOff[id] = S.exOff[id] || []; if (!per.some(([, t]) => !t)) per.push(['0000-01-01', null]); });          // plans made before the first-run questionnaire existed
  if (!S.v || S.v < 2) { S.planEnd = S.planEnd || addDays(S.settings.startDate, LAUNCH_DAYS - 1); S.v = 2; }
  if (S.v < 4) migratePrefsV4();
}
// v4: food groups were split into finer subgroups — carry saved choices over
function migratePrefsV4() {
  const old = S.foodPrefs || {}, np = {};
  Object.entries(old).forEach(([k, v]) => {
    if (v !== false) return;
    (PREF_MIGRATE[k] || [k]).forEach(n => { if (n.startsWith('cat:') ? FOOD_CATS.some(c => 'cat:' + c.id === n) : SUB_CAT[n]) np[n] = false; });
  });
  S.foodPrefs = np;
  const fixSub = g => { if (g && g.sub && !SUB_CAT[g.sub]) g.sub = (PREF_MIGRATE[g.sub] || ['sauces'])[0]; };
  Object.values(S.customFoods || {}).forEach(fixSub);
  Object.values(S.foodOverrides || {}).forEach(fixSub);
}
// from: a saved state object (server copy or imported backup), null for a brand-new plan, or undefined to read this browser's copy
function loadState(from) {
  S = null;
  if (from !== undefined) S = from ? JSON.parse(JSON.stringify(from)) : null;
  else { let raw = null; try { raw = localStorage.getItem(STORE_KEY); } catch (e) { /* storage blocked */ } if (raw) { try { S = JSON.parse(raw); } catch (e) { S = null; } } }
  if (!S || !S.settings) { S = freshState(); if (NEW_STATE_DEFAULTS && NEW_STATE_DEFAULTS.theme) S.settings.theme = NEW_STATE_DEFAULTS.theme; }
  migrateState();
  rebuildCatalog(); rebuildExercises();
  ensureHorizon();
  migrateGrocery();
  if (!S.v || S.v < 3) { rescheduleWorkouts(maxISO(todayISO(), S.settings.startDate)); S.v = 3; }
  if (S.v < 4) { substitutePlan(maxISO(todayISO(), S.settings.startDate)); S.v = 4; }
  if (S.v < 5) { replanMeals(nextPlanWeekStart()); S.v = 5; S._sharingIntro = true; }   // v5: ingredient-sharing planner
  if (!(+S.settings.bgDim >= 0 && +S.settings.bgDim <= 1)) S.settings.bgDim = 0.7;
  saveState();
  return S;
}
/* Grocery ticks used to be keyed by week number on this device ("w5") and by the week's start
   date when synced, so turning sync on or off in the middle of a shop lost every tick. One
   scheme now, the start date, matching what the server already stores. Weeks that are no longer
   in the plan are dropped at the same time so the map can't grow inside the state blob. */
function migrateGrocery() {
  const g = S.grocery; if (!g || typeof g !== 'object') return;
  const dates = planDates(); if (!dates.length) return;
  const starts = dates.filter((d, i) => i % 7 === 0);
  Object.keys(g).forEach(k => {
    const m = /^w(\d+)$/.exec(k); if (!m) return;
    const d = starts[+m[1] - 1];
    if (d) g[d] = Object.assign({}, g[d], g[k]);
    delete g[k];
  });
  const keep = new Set(starts);
  Object.keys(g).forEach(k => { if (!keep.has(k)) delete g[k]; });
}
function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* cache only when signed in; storage may be full */ } invalidate(); if (typeof onStateSaved === 'function') onStateSaved(); }

/* ---------- food catalog (built-in + overrides + custom) ---------- */
let SHARED_FOODS = {};        // products everyone on the server can use (barcode scans), loaded from /api/foods/shared
function rebuildCatalog() {
  Object.keys(ING).forEach(k => delete ING[k]);
  Object.entries(BASE_ING).forEach(([id, g]) => { const o = (S.foodOverrides || {})[id]; ING[id] = Object.assign({ id, sub: BASE_SUB[id] || 'sauces', base: true }, g, o || {}, { edited: !!o }); });
  Object.entries(SHARED_FOODS || {}).forEach(([id, g]) => { if (ING[id] || !g) return; ING[id] = Object.assign({ sub: 'sauces', a: 'Pantry' }, g, { id, shared: true, sub: SUB_CAT[g.sub] ? g.sub : 'sauces', a: AISLES.includes(g.a) ? g.a : 'Pantry', r: g.r || suggestRole(g.k, g.p, g.c, g.f) }); });
  Object.entries(S.customFoods || {}).forEach(([id, g]) => { ING[id] = Object.assign({ sub: 'sauces', a: 'Pantry', r: 'V' }, g, { id, custom: true }); });
  RECIPES.length = 0;
  BASE_RECIPES.forEach(r => { const o = (S.recipeOverrides || {})[r.id]; const x = Object.assign({}, r, o || {}, { id: r.id, base: true, edited: !!o }); x.links = ((o && o.links) || r.links || []).map(l => Object.assign({}, l)); RECIPES.push(x); });
  Object.values(S.customRecipes || {}).forEach(r => RECIPES.push(Object.assign({ tags: [], steps: [], links: [], storage: 'fridge', time: 0 }, r, { custom: true })));
  Object.keys(RECIPE).forEach(k => delete RECIPE[k]);
  RECIPES.forEach(r => { r.ing = (r.ing || []).filter(([id]) => ING[id]); RECIPE[r.id] = r; });
  Object.keys(_rps).forEach(k => delete _rps[k]);
  invalidate();
}
function subOn(sub) { const p = S.foodPrefs || {}; return p[sub] !== false && p['cat:' + SUB_CAT[sub]] !== false; }
function foodAllowed(id) { const g = ING[id]; return !g || (subOn(g.sub) && (S.foodPrefs || {})['f:' + id] !== false); }
function recipeAllowed(r) { if (typeof r === 'string') r = RECIPE[r]; return !!r && !(S.recipeOff || {})[r.id] && r.ing.length > 0 && r.ing.every(([id]) => foodAllowed(id)); }
function blockedBy(r) { return [...new Set(r.ing.filter(([id]) => !foodAllowed(id)).map(([id]) => subOn(ING[id].sub) ? ING[id].n : (SUB_LABEL[ING[id].sub] || ING[id].sub)))]; }
function suggestRole(k, p, c, f) { const kc = Math.max(1, k); if (p * 4 / kc >= 0.4) return 'P'; if (f * 9 / kc >= 0.5) return 'F'; if (k < 60) return 'V'; return 'C'; }

/* ---------- plan structure (Cycle 1 = 90-day launch, then repeating 13-week cycles) ---------- */
function planEnd() { return S.planEnd || addDays(S.settings.startDate, LAUNCH_DAYS - 1); }
function planDates() { const out = []; const n = dayDiff(S.settings.startDate, planEnd()); for (let i = 0; i <= n; i++) out.push(addDays(S.settings.startDate, i)); return out; }
function planIndex(date) { return dayDiff(S.settings.startDate, date); }               // 0-based
function inPlan(date) { return !!date && planIndex(date) >= 0 && date <= planEnd(); }
function planWeek(date) { return Math.floor(planIndex(date) / 7) + 1; }
function cycleOfWeek(wk) { return wk <= 13 ? 1 : 2 + Math.floor((wk - 14) / 13); }
function weekInCycle(wk) { return wk <= 13 ? wk : ((wk - 14) % 13) + 1; }
function cycleStartWeek(c) { return c === 1 ? 1 : 14 + (c - 2) * 13; }
function cycleEndDate(c) { return addDays(S.settings.startDate, (cycleStartWeek(c) - 1 + 13) * 7 - 1); }
function cycleStartDate(c) { return addDays(S.settings.startDate, (cycleStartWeek(c) - 1) * 7); }
function phaseForWeek(wk) {
  const c = cycleOfWeek(wk), w = weekInCycle(wk); const list = c === 1 ? CYCLE1 : CYCLEN;
  const p = list.find(x => w >= x.weeks[0] && w <= x.weeks[1]) || list[list.length - 1];
  return Object.assign({}, p, { cycle: c, wic: w });
}
function weekInPhase(wk) { const p = phaseForWeek(wk); return p.key === 'test' ? 1 : ((p.wic - p.weeks[0]) % 4) + 1; }
function ensurePlanThrough(date) {
  if (!date || date <= planEnd()) return false;
  const c = cycleOfWeek(planWeek(date));
  const end = cycleEndDate(c);
  S.plan = generatePlan(S.settings, end, S.plan); S.planEnd = end; invalidate();
  return true;
}
function ensureHorizon() {
  const ref = maxISO(todayISO(), S.settings.startDate);
  const c = cycleOfWeek(planWeek(ref));
  // always keep the current cycle plus the next one planned
  ensurePlanThrough(cycleEndDate(c + 1));
}

const BASE_SEQ = {
  breakfast: ['breakfast_burritos', 'overnight_oats', 'protein_pancakes', 'egg_white_omelette', 'egg_bites', 'yogurt_parfait', 'cottage_bowl', 'protein_pancakes', 'egg_white_omelette',
              'breakfast_sandwiches', 'overnight_oats', 'protein_pancakes', 'egg_white_omelette', 'egg_bites', 'yogurt_parfait', 'cottage_bowl', 'protein_pancakes', 'egg_white_omelette'],
  lunch: ['burrito_bowls', 'tuna_wrap', 'caesar_wrap', 'poke_bowl', 'turkey_chili', 'tuna_wrap', 'caesar_wrap', 'poke_bowl',
          'greek_chicken', 'tuna_wrap', 'caesar_wrap', 'poke_bowl', 'beef_broccoli', 'tuna_wrap', 'caesar_wrap', 'poke_bowl', 'shrimp_bowls', 'tuna_wrap', 'caesar_wrap', 'poke_bowl'],
  dinner: ['fajitas', 'steak_potato', 'teriyaki_stirfry', 'pork_tenderloin', 'burger_bowl', 'honey_garlic_thighs', 'bolognese', 'sushi_night',
           'steak_potato', 'burger_bowl', 'teriyaki_stirfry', 'sushi_night', 'pork_tenderloin', 'salmon_rice', 'tofu_teriyaki'],
  snack1_train: ['protein_shake'], snack2_train: ['rice_cakes_pb'],
  snack1_rest: ['protein_pudding', 'cottage_pineapple', 'yogurt_berries', 'edamame_snack'],
  snack2_rest: ['jerky_apple', 'boiled_eggs', 'turkey_rollups', 'protein_bar']
};
const SEQ_CAT = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snack1_train: 'snack', snack2_train: 'snack', snack1_rest: 'snack', snack2_rest: 'snack' };
/* v1.2 widened the rotation; the original entries stay at the front of each list. */
if (typeof R2_SEQ === 'object') Object.keys(R2_SEQ).forEach(k => { if (BASE_SEQ[k]) BASE_SEQ[k] = BASE_SEQ[k].concat(R2_SEQ[k].filter(id => !BASE_SEQ[k].includes(id))); });
/* Joint planning for synced meal plans: PLAN_CTX narrows recipes to ones both people can eat, adds the partner's favorites,
   and cooks multi-serving recipes for two (a 4-serving batch covers 2 days instead of 4). */
let PLAN_CTX = null;
function planAllowed(r) { if (typeof r === 'string') r = RECIPE[r]; return recipeAllowed(r) && (!PLAN_CTX || !PLAN_CTX.allowed || PLAN_CTX.allowed.has(r.id)); }
function planFav(id) { return isFav(id) || !!(PLAN_CTX && PLAN_CTX.favs && PLAN_CTX.favs.has(id)); }
function pickSubstitute(cat, wantYield, k) {
  const pool = RECIPES.filter(r => r.cat === cat && planAllowed(r));
  if (!pool.length) return null;
  const same = pool.filter(r => (r.yield > 1) === (wantYield > 1)); const src = same.length ? same : pool;
  return src[k % src.length].id;
}
// Recipes disallowed by food preferences are swapped for allowed ones of the same meal type (batch recipes preferred for batch slots)
function filterSeq(list, cat, key) {
  const extra = RECIPES.filter(r => r.cat === cat && r.custom && r.rotate && planAllowed(r)).map(r => r.id);
  let k = 0;
  const out = list.filter(id => RECIPE[id]).concat(extra).map(id => planAllowed(id) ? id : pickSubstitute(cat, RECIPE[id].yield, k++)).filter(Boolean);
  return weightFavs(out, cat, key);
}
/* ---------- favorites: ★ recipes come up about twice as often ---------- */
const FAV_WEIGHT = 2;
function isFav(id) { return !!(S && S.favRecipes && S.favRecipes[id]); }
function weightFavs(list, cat, key) {
  if (!key || /_train$/.test(key)) return list;            // training-day snacks are fixed (shake + pre-workout carbs)
  const favs = RECIPES.filter(r => r.cat === cat && planFav(r.id) && planAllowed(r)).map(r => r.id);
  if (!favs.length) return list;
  const per = favs.map(id => {
    let c = list.filter(x => x === id).length;
    if (!c && cat === 'snack') {                          // a snack not in either rest-day list joins one of them
      const inRest = BASE_SEQ.snack1_rest.includes(id) || BASE_SEQ.snack2_rest.includes(id);
      const home = BASE_SEQ.snack2_train.includes(id) ? 'snack2_rest' : 'snack1_rest';
      if (inRest || key !== home) return [];
    }
    return Array(Math.max(1, c) * (FAV_WEIGHT - 1)).fill(id);
  });
  const extra = []; for (let i = 0; per.some(a => a.length > i); i++) per.forEach(a => { if (a[i]) extra.push(a[i]); });
  if (!extra.length) return list;
  const out = list.slice(); const step = (list.length || 1) / extra.length;
  extra.forEach((id, j) => {
    let pos = Math.min(out.length, Math.round(step * j + step / 2) + j), tries = 0;
    while (tries++ <= out.length && out.length && (out[pos - 1] === id || out[pos] === id)) pos = (pos + 1) % (out.length + 1);
    out.splice(pos, 0, id);
  });
  return out;
}
// Re-plan meals from a date forward (e.g. favorites changed). Slots the user set by hand (drag, swap, pick) are kept.
function replanMeals(fromDate) {
  const P = makePlanner(S.settings.shareIngredients !== false); let n = 0;
  planDates().forEach((d, i) => {
    if (i % 7 === 0) P.newWeek();
    const e = S.plan[d]; if (!e) return; e.m = e.m || {}; const me = e.me || {};
    const keepAll = d < fromDate; const synced = sl => typeof syncKeyOn === 'function' && syncKeyOn(d, sl);   // shared meals are planned together with the partner
    const m = planDay(P, !!e.w, sl => (keepAll || me[sl] || synced(sl)) ? (e.m[sl] || null) : undefined);
    if (keepAll) return;
    MEAL_SLOTS.forEach(sl => { if (!me[sl] && !synced(sl) && e.m[sl] !== m[sl]) { e.m[sl] = m[sl]; n++; } });
  });
  invalidate(); return n;
}
function markMealEdit(date, slot) { const e = S.plan[date]; if (!e || !slot) return; (e.me = e.me || {})[slot] = 1; }
// First day that a plan-wide meal change should touch: the next plan week (this week's groceries are left alone)
function nextPlanWeekStart() { const t = todayISO(), st = S.settings.startDate; return t < st ? st : addDays(st, 7 * planWeek(t)); }
/* ---------- shopping model & ingredient-sharing planner ----------
   Package size P (grams / ml / items) and spoil weight w (1 = fresh, 0 = pantry) for every food. */
function defaultPack(id, sub, g) {
  let P = FOOD_PACK[id] || SUB_PACK[sub] || (g.u ? 1 : 454);
  if (g.u && !FOOD_PACK[id] && P > 60) P = 1;                             // per-item food in a grams-sized subgroup
  if (!g.u && P < 20) P = g.ml ? 1000 : 454;                              // grams food in an items-sized subgroup
  return P;
}
function packInfo(id) {
  const g = ING[id]; if (!g) return { P: 1, w: 0 };
  const P = +g.pk > 0 ? +g.pk : defaultPack(id, g.sub, g);
  let w = id in FOOD_W ? FOOD_W[id] : (SUB_W[g.sub] != null ? SUB_W[g.sub] : .3);
  if (g.a === 'Frozen') w = Math.min(w, .3);
  if (g.r === 'V' && (g.sub === 'spices' || g.sub === 'condiments')) w = Math.min(w, .03);
  return { P, w };
}
// Standard-serving amount of each ingredient in one serving of a recipe
function servingAmounts(id) { const r = RECIPE[id]; if (!r) return []; const y = Math.max(1, r.yield || 1); return r.ing.map(([i, a]) => [i, a / y]); }
/* Shopping score for adding one serving of recipe r to this week's list (higher = cheaper):
     score = Σ_i w_i × ( min(a_i, R_i) / P_i  −  ⌈ max(0, a_i − R_i) / P_i ⌉ ) ÷ servings
   a_i = amount the recipe needs (a whole batch for batch recipes), R_i = what's left in packages
   already on this week's list, P_i = package size, w_i = spoil weight. */
function shareScore(id, basket) {
  const r = RECIPE[id]; if (!r) return -99; const y = Math.max(1, r.yield || 1); let sc = 0;
  r.ing.forEach(([i, amt]) => { const { P, w } = packInfo(i); if (!w) return;
    const N = basket[i] || 0; const R = N > 0 ? Math.ceil(N / P - 1e-9) * P - N : 0;
    sc += w * (Math.min(amt, R) / P - Math.ceil(Math.max(0, amt - R) / P - 1e-9)); });
  return sc / y;
}
const SHARE_WINDOW = 3;   // look at the next 3 recipes in each rotation; none waits more than 2 turns
function makePlanner(share) {
  const Q = {}; let basket = {};
  Object.keys(BASE_SEQ).forEach(k => { Q[k] = { list: filterSeq(BASE_SEQ[k], SEQ_CAT[k], k), ptr: 0, pending: [], carry: [], last: null }; });
  return {
    newWeek() { basket = {}; },
    next(key) {
      const q = Q[key]; if (!q || !q.list.length) return null;
      if (q.carry.length) return q.carry.shift();
      const distinct = () => new Set(q.pending.map(p => p.id)).size;
      let guard = 0; while (distinct() < Math.min(SHARE_WINDOW, new Set(q.list).size) && guard++ < 50) q.pending.push({ id: q.list[q.ptr++ % q.list.length], skip: 0 });
      const seen = new Set(); const cand = []; for (const p of q.pending) { if (!seen.has(p.id)) { seen.add(p.id); cand.push(p); } if (cand.length >= SHARE_WINDOW) break; }
      let pick = cand[0];
      if (share && cand.length > 1) {
        const forced = cand.find(c => c.skip >= SHARE_WINDOW - 1);
        if (forced) pick = forced;
        else { let best = -Infinity; cand.forEach(c => { if (c.id === q.last && cand.some(o => o.id !== q.last)) return; const sc = shareScore(c.id, basket) + (c === cand[0] ? 1e-6 : 0); if (sc > best) { best = sc; pick = c; } }); }
      }
      const at = q.pending.indexOf(pick); q.pending.slice(0, at).forEach(p => p.skip++); q.pending.splice(at, 1);
      const r = RECIPE[pick.id]; const ppl = PLAN_CTX && PLAN_CTX.people > 1 ? PLAN_CTX.people : 1; const y = r ? Math.ceil(r.yield / ppl) : 1; for (let k = 1; k < y; k++) q.carry.push(pick.id);
      q.last = pick.id; return pick.id;
    },
    use(id) { servingAmounts(id).forEach(([i, a]) => { basket[i] = (basket[i] || 0) + a; }); }
  };
}
// Fill one day's meals from the planner. keep(slot) → a recipe id to keep instead of the planner's pick (or undefined)
function planDay(P, isT, keep) {
  const keys = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snack1: isT ? 'snack1_train' : 'snack1_rest', snack2: isT ? 'snack2_train' : 'snack2_rest' };
  const m = {};
  MEAL_SLOTS.forEach(sl => { const gen = P.next(keys[sl]); const k = keep ? keep(sl) : undefined; const fin = k !== undefined ? k : gen; m[sl] = gen; if (fin) P.use(fin); });
  return m;
}
// Simulate the auto-planner over the whole plan (for comparisons); returns { date: meals }
function simulateMeals(share) {
  const P = makePlanner(share); const out = {};
  planDates().forEach((d, i) => { if (i % 7 === 0) P.newWeek(); out[d] = planDay(P, !!(S.plan[d] && S.plan[d].w)); });
  return out;
}
// Shopping summary for a set of days' meals (standard servings): items, fresh packages, spoil-prone leftovers, shared ingredients
function shoppingStats(mealsByDate) {
  const need = {}, users = {};
  Object.values(mealsByDate).forEach(m => MEAL_SLOTS.forEach(sl => { const id = m && m[sl]; if (!id || !RECIPE[id]) return;
    servingAmounts(id).forEach(([i, a]) => { need[i] = (need[i] || 0) + a; (users[i] = users[i] || new Set()).add(id); }); }));
  let items = 0, packs = 0, leftG = 0; const shared = [];
  Object.entries(need).forEach(([i, n]) => { const { P, w } = packInfo(i); if (!w) return; items++;
    const pk = Math.ceil(n / P - 1e-9);
    if (w >= .3) { packs += pk; const g = ING[i]; leftG += (pk * P - n) * (g.u ? (g.g || 50) : 1) * w; }
    if (users[i].size > 1) shared.push({ id: i, n: users[i].size, recipes: [...users[i]] }); });
  shared.sort((a, b) => b.n - a.n || packInfo(b.id).w - packInfo(a.id).w);
  return { items, packs, leftG, shared };
}
function makeQueue(list) { let i = 0, q = []; return () => { if (!list.length) return null; if (!q.length) { const id = list[i % list.length]; i++; const r = id && RECIPE[id]; const y = r ? r.yield : 1; for (let k = 0; k < y; k++) q.push(id); } return q.shift(); }; }
// Assign sessions to training days: each phase runs its Push/Pull/Legs sequence in a rolling order that continues across
// weeks (so any number of training days works) and restarts when a new phase begins.
/* ---------- training styles ----------
   Three switches: strength, hypertrophy, cardio. With both lifting styles on, the program is
   exactly what it has always been — the S and H rows in each template stand as written. Turn one
   off and the rows that used the other style are re-prescribed rather than dropped, so the
   session still covers the same movements, at reps and rests that match what you asked for. */
const styles = () => Object.assign({ strength: true, hypertrophy: true, cardio: false }, (S && S.settings && S.settings.styles) || {});
function liftStyles() { const st = styles(); const s = st.strength !== false, h = st.hypertrophy !== false; return s || h ? { s, h } : { s: true, h: true }; }
const liftingOn = () => { const st = styles(); return st.strength !== false || st.hypertrophy !== false; };
const cardioOn = () => styles().cardio === true;
/* Reps and rest are shifted by the same rule for every row, so a session reads consistently
   instead of mixing a 5-rep row with a 15-rep row when only one style is on. */
function styleRow(type, sets, reps, rest) {
  const { s, h } = liftStyles();
  if (type === 'T' || (s && h)) return { type, sets, reps, rest };
  const want = s ? 'S' : 'H';
  if (want === type) return { type, sets, reps, rest };
  const rr = repRange(reps);   // declared further down; always returns a [lo, hi] pair
  if (want === 'S') { const lo = clamp(Math.round(rr[0] * 0.55), 3, 8); return { type: 'S', sets, reps: `${lo}–${lo + 2}`, rest: Math.max(rest, 150) }; }
  const lo = clamp(Math.round(rr[0] * 1.6), 8, 15); return { type: 'H', sets, reps: `${lo}–${lo + 4}`, rest: Math.min(rest, 90) };
}
/* ---------- cardio ----------
   kcal/min = MET x 3.5 x kg / 200. An estimate from body weight and the clock, nothing more. */
function cardioKcal(kind, minutes, lb) {
  const c = CARDIO[kind]; if (!c) return 0;
  const w = +lb > 0 ? +lb : (S && S.settings ? S.settings.startWeight : 180);
  return Math.round(c.met * 3.5 * (w * 0.45359237) / 200 * (+minutes || 0));
}
const cardioPlan = () => Object.assign({ perWeek: 3, minutes: 30, types: CARDIO_DEFAULT.slice() }, (S && S.settings && S.settings.cardio) || {});
function cardioTypes() { const t = (cardioPlan().types || []).filter(k => CARDIO[k]); return t.length ? t : CARDIO_DEFAULT.slice(); }
/* Cardio goes on the days without a lifting session, so the lifting week is untouched. If a week
   has fewer free days than sessions asked for, the remainder doubles up on lifting days — the
   day holds both, and the macros still only count the lifting session. */
function assignCardio(plan, settings, dates, fromDate, overwrite) {
  const on = cardioOn(); const cp = cardioPlan(); const kinds = cardioTypes();
  let n = 0;
  for (let wk = 1; wk <= Math.ceil(dates.length / 7); wk++) {
    const wkDates = dates.slice((wk - 1) * 7, wk * 7);
    const free = wkDates.filter(d => plan[d] && !plan[d].w);
    const busy = wkDates.filter(d => plan[d] && plan[d].w);
    const want = on ? clamp(Math.round(+cp.perWeek || 0), 0, 7) : 0;
    const spread = a => { const out = []; if (!a.length || !want) return out; const step = a.length / Math.min(want, a.length); for (let i = 0; i < Math.min(want, a.length); i++) out.push(a[Math.floor(i * step)]); return out; };
    const pick = spread(free).concat(busy.slice(0, Math.max(0, want - free.length)));
    wkDates.forEach(d => {
      if (d < fromDate || !plan[d]) return;
      const keep = !overwrite && plan[d].c && plan[d].c.by === 'user';
      if (keep) { n++; return; }
      if (pick.includes(d)) plan[d].c = { k: kinds[n++ % kinds.length], min: clamp(Math.round(+cp.minutes || 30), 5, 180) };
      else if (plan[d].c && plan[d].c.by !== 'user') delete plan[d].c;
      else if (!on && plan[d].c) delete plan[d].c;
    });
  }
}
const dayCardio = e => (e && e.c && CARDIO[e.c.k]) ? e.c : null;
const dayHasWork = e => !!(e && (e.w || dayCardio(e)));
function assignWorkouts(plan, settings, dates, fromDate, overwrite) {
  const days = settings.trainDays || [];
  let ptr = 0, curKey = null;
  for (let wk = 1; wk <= Math.ceil(dates.length / 7); wk++) {
    const ph = phaseForWeek(wk); const key = ph.cycle + ':' + ph.key + ':' + ph.weeks[0];
    if (key !== curKey) { ptr = 0; curKey = key; }
    const wkDates = dates.slice((wk - 1) * 7, wk * 7);
    const tr = wkDates.filter(d => days.includes(parseISO(d).getDay()));
    const seq = ph.key === 'test' ? testWeekSeq(tr.length) : ph.seq;
    wkDates.forEach(d => {
      if (d < fromDate) return;
      const i = tr.indexOf(d);
      const w = (i < 0 || !liftingOn()) ? null : { t: seq[(ph.key === 'test' ? i : ptr + i) % seq.length], wk };
      if (!plan[d]) plan[d] = { w, m: {} }; else if (overwrite) plan[d].w = w;
    });
    if (ph.key !== 'test') ptr += tr.length;
  }
  assignCardio(plan, settings, dates, fromDate, overwrite);
}
// Re-plan workouts from a date forward (e.g. training days changed). Snacks follow the new training/rest pattern.
function rescheduleWorkouts(fromDate) {
  const dates = planDates(); const before = {};
  dates.forEach(d => { before[d] = !!(S.plan[d] && S.plan[d].w); });
  assignWorkouts(S.plan, S.settings, dates, fromDate, true);
  const r1 = makeQueue(filterSeq(BASE_SEQ.snack1_rest, 'snack', 'snack1_rest')), r2 = makeQueue(filterSeq(BASE_SEQ.snack2_rest, 'snack', 'snack2_rest'));
  const t1 = filterSeq(BASE_SEQ.snack1_train, 'snack', 'snack1_train')[0] || null, t2 = filterSeq(BASE_SEQ.snack2_train, 'snack', 'snack2_train')[0] || null;
  let changed = 0;
  dates.forEach(d => {
    if (d < fromDate) return; const isT = !!S.plan[d].w; if (isT === before[d]) return;
    const m = S.plan[d].m = S.plan[d].m || {};
    if (isT) { m.snack1 = t1; m.snack2 = t2; } else { m.snack1 = r1(); m.snack2 = r2(); }
    changed++;
  });
  invalidate();
  return changed;
}

/* ---------- custom exercises ---------- */
const CUSTOM_SLOT = {};
function rebuildExercises() {
  Object.keys(EX).forEach(k => { if (EX[k].custom) delete EX[k]; });
  Object.keys(CUSTOM_SLOT).forEach(k => delete CUSTOM_SLOT[k]);
  Object.values(S.customExercises || {}).forEach(e => {
    EX[e.id] = Object.assign({ steps: [], cues: [], mistake: '', primary: [], secondary: [], equip: '', compound: false }, e, { custom: true });
    if (e.slot && SLOTS[e.slot]) (CUSTOM_SLOT[e.slot] = CUSTOM_SLOT[e.slot] || []).push(e);
  });
  invalidate();
}
// Variations for a slot in a given plan week (custom exercises join the rotation from the week they were added)
/* ---------- exercises switched off ----------
   S.exOff = { exerciseId: [[fromWeekStart, toWeekStart|null], …] } — periods keep past weeks showing what was actually planned.
   Muscle groups for the "keep at least one on" rule: the library groups, with rear delts on their own (they're trained on pull days). */
const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Rear delts', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'];
function exGroupOf(e) { if (!e) return null; if (e.group === 'Shoulders' && (e.primary || []).includes('rearDelt')) return 'Rear delts'; return e.group; }
function exOffOn(id, date) { const p = (S.exOff || {})[id]; return !!p && p.some(([f, t]) => date >= f && (!t || date < t)); }
function exOffNow(id) { const p = (S.exOff || {})[id]; return !!p && p.some(([, t]) => !t); }
function planWeekStart(wk) { return addDays(S.settings.startDate, ((wk || 1) - 1) * 7); }
/* program swaps: S.slotSwap[slot] = [[fromId, toId, fromWeekStart, untilWeekStart|null], …] — "use Y where the rotation has X" */
function slotSwapsOn(slot, wStart) { return ((S.slotSwap || {})[slot] || []).filter(([a, b, f, t]) => EX[b] && wStart >= f && (!t || wStart < t)); }
function slotVars(slot, wk) {
  const base = SLOTS[slot].vars; const cx = CUSTOM_SLOT[slot];
  const wStart = planWeekStart(wk), wEnd = addDays(wStart, 6);
  let all = cx && cx.length ? base.concat(cx.filter(e => !e.since || e.since <= wEnd).map(e => e.id)) : base;
  const pinned = new Set();
  const sw = S.slotSwap ? slotSwapsOn(slot, wStart) : [];
  if (sw.length) { all = all.slice(); sw.forEach(([a, b]) => { const i = all.indexOf(a); if (i >= 0) { all[i] = b; pinned.add(b); } }); all = all.filter((id, i) => all.indexOf(id) === i); }
  if (!S.exOff || !Object.keys(S.exOff).length) return all;
  const on = all.filter(id => pinned.has(id) || !exOffOn(id, wStart));
  if (on.length) return on;
  // every variation for this slot is switched off → borrow switched-on exercises from the same muscle group,
  // preferring ones that train the same muscles (keeps push and pull sessions separate)
  const g = exGroupOf(EX[base[0]]); const prim = new Set(base.flatMap(id => EX[id].primary || []));
  const pool = Object.values(EX).filter(e => exGroupOf(e) === g && !exOffOn(e.id, wStart) && (!e.custom || !e.since || e.since <= wEnd));
  pool.sort((a, b) => (b.primary || []).filter(m => prim.has(m)).length - (a.primary || []).filter(m => prim.has(m)).length || a.name.localeCompare(b.name));
  return pool.length ? pool.slice(0, 3).map(e => e.id) : all;
}
function generatePlan(settings, through, existing) {
  const plan = existing || {};
  const start = settings.startDate;
  through = through || addDays(start, LAUNCH_DAYS - 1);
  const n = dayDiff(start, through) + 1;
  const dates = []; for (let i = 0; i < n; i++) dates.push(addDays(start, i));
  const fresh = new Set(dates.filter(d => !plan[d]));
  assignWorkouts(plan, settings, dates, start, false);
  const train = new Set(dates.filter(d => plan[d].w));
  const P = makePlanner(settings.shareIngredients !== false);
  dates.forEach((d, i) => {
    if (i % 7 === 0) P.newWeek();
    const isF = fresh.has(d); const cur = plan[d].m || {};
    const m = planDay(P, train.has(d), isF ? null : sl => cur[sl] || null);
    if (isF) plan[d].m = m;
  });
  return plan;
}
// Swap planned meals (from a date onward) that are no longer allowed
/* Returns { n, empty }: how many meals were swapped, and any category that had no legal
   recipe left. Callers warn about `empty` — silently nulling a meal loses the day's calories. */
function substitutePlan(fromDate) {
  let n = 0; const map = {}; const counters = {}; const empty = {};
  Object.keys(S.plan).sort().forEach(d => {
    if (d < fromDate) return; const m = S.plan[d].m || {};
    MEAL_SLOTS.forEach(slot => {
      const id = m[slot]; if (!id || (RECIPE[id] && recipeAllowed(id))) return;
      if (!(id in map)) { const cat = RECIPE[id] ? RECIPE[id].cat : SLOT_CAT[slot]; counters[cat] = counters[cat] || 0; map[id] = pickSubstitute(cat, RECIPE[id] ? RECIPE[id].yield : 1, counters[cat]++); }
      if (map[id] == null) { empty[RECIPE[id] ? RECIPE[id].cat : SLOT_CAT[slot]] = true; return; }   // nothing left to swap to: keep the meal rather than blanking the day
      m[slot] = map[id]; n++;
    });
  });
  return { n, empty: Object.keys(empty) };
}

/* ---------- workouts ---------- */
function sessionRows(inst) {
  if (!inst) return [];
  const t = TEMPLATES[inst.t]; const wk = inst.wk || 1; const wip = weekInPhase(wk);
  const used = new Set(); const daySw = inst.sw || {}; const wStart = planWeekStart(wk);
  return t.rows.map(([slot, type, sets, reps, rest, off, note, pin], i) => {
    const vars = slotVars(slot, wk);
    /* A PR test only means something if it measures the same lift every cycle. Rotating by week
       number did not do that: test week lands on a different week each cycle, so the number you
       compared against was often a different exercise. Test rows hold still instead — on the
       pinned barbell lift where the library has it switched on, otherwise on the first variation
       in the slot, which is stable for as long as the rotation is. */
    const pi = type === 'T' && pin && EX[pin] ? vars.indexOf(pin) : -1;
    let vi = pi >= 0 ? pi : type === 'T' ? 0 : ((wk - 1 + (off || 0)) % vars.length + vars.length) % vars.length;
    for (let k = 0; k < vars.length && used.has(vars[vi]); k++) vi = (vi + 1) % vars.length;   // don't repeat an exercise within a session
    used.add(vars[vi]); const planned = EX[vars[vi]];
    const ex = daySw[i] && EX[daySw[i]] ? EX[daySw[i]] : planned;   // swapped for this day only
    const prog = S.slotSwap ? slotSwapsOn(slot, wStart).find(x => x[1] === planned.id) : null;
    const sr = styleRow(type, sets, reps, rest);
    const rir = sr.type === 'T' ? 'Top set @ 1 RIR' : (t.phase === 4 ? '3–4' : RIR[sr.type][wip - 1]);
    return { i, slot, ex, planned, daySwap: ex !== planned, progSwap: prog ? prog[0] : null, type: sr.type, styled: sr.type !== type,
      sets: sr.sets, reps: sr.reps, rest: sr.rest, note: note || '', rir, vi, nv: vars.length };
  });
}
function sessionSetCount(inst) { return sessionRows(inst).reduce((a, r) => a + r.sets, 0); }
function repRange(reps) { const m = String(reps).match(/(\d+)\D+(\d+)/); if (m) return [+m[1], +m[2]]; const n = String(reps).match(/\d+/); return n ? [+n[0], +n[0]] : [8, 12]; }

/* ---------- bodyweight stats ---------- */
function sortedWeights() { return S.weights.slice().sort((a, b) => a.d < b.d ? -1 : 1); }
// Latest weigh-in on/before date. Missing BF is estimated by holding the last known lean mass constant.
function statsOn(date) {
  const ws = sortedWeights();
  let w = S.settings.startWeight, bf = S.settings.startBF, est = false, src = 'start';
  let lbm = w * (1 - bf / 100);
  for (const x of ws) {
    if (date && x.d > date) break;
    w = x.w; src = x.d;
    if (x.bf != null && x.bf !== '') { bf = +x.bf; lbm = w * (1 - bf / 100); est = false; }
    else { bf = Math.max(3, (1 - lbm / w) * 100); est = true; }
  }
  return { w, bf, lbm: w * (1 - bf / 100), est, src };
}
function latestStats() { return statsOn(null); }

/* ---------- energy targets (Katch–McArdle) ---------- */
const goalKind = () => { const g = S.settings.goal; return g === 'bulk' || g === 'maintain' ? g : 'cut'; };
// lb/week the plan expects the scale to move: negative cutting, positive bulking, 0 at maintenance
function planRate(w) {
  const st = S.settings; const k = goalKind();
  if (k === 'maintain') return 0;
  if (k === 'bulk') return bulkLb(w == null ? (latestStats() || {}).w || st.startWeight : w);
  return -st.rate;
}
function bulkLb(w) {
  const st = S.settings; const raw = (+w || st.startWeight) * (+st.bulkPct || 0.35) / 100;
  return Math.min(raw, (+st.bulkMaxSurplus || 500) * 7 / 3500);        // the cap can bind at low body weights
}
function goalReached(w, bf) {
  const st = S.settings; const k = goalKind();
  if (k === 'maintain') return true;
  if (k === 'bulk') return bf >= (+st.bulkMaxBF || 20) || (st.atGoal === 'maintain' && w >= st.goalWeight);
  return st.atGoal === 'maintain' && (w <= st.goalWeight || bf <= st.goalBF);
}
function targetsFor(w, bf, isTrain) {
  const st = S.settings;
  const lbm = w * (1 - bf / 100);
  const bmr = 370 + 21.6 * (lbm * 0.453592);
  const restMaint = bmr * st.activity;
  const maint = restMaint + (isTrain ? st.sessionKcal : 0);
  const kind = goalKind();
  const maintMode = goalReached(w, bf);
  const bulking = kind === 'bulk' && !maintMode;
  const deficit = maintMode || kind !== 'cut' ? 0 : st.rate * 3500 / 7;
  const surplus = bulking ? Math.min(+st.bulkMaxSurplus || 500, bulkLb(w) * 3500 / 7) : 0;
  const kcal = Math.max(st.minKcal, maint - deficit + surplus + (+st.kcalAdjust || 0));
  const nTrain = st.trainDays.length;
  const weeklyMaint = restMaint + st.sessionKcal * nTrain / 7;
  const kr = Math.round(kcal / 10) * 10;
  /* Fat sits lower on a bulk so the extra calories land in carbohydrate, which is what fuels
     training volume, but never below ~0.3 g/lb, the floor tied to hormone production. */
  const fatPct = bulking ? 0.25 : 0.27;
  let pr = Math.round(st.proteinPerLb * w);
  let fat = Math.max(Math.round(0.3 * w), Math.round(kr * fatPct / 9));
  /* At a low calorie floor a big lifter's protein and fat minimums can exceed the target on
     their own. Carbs clamped at zero used to hide that and the macros stopped summing to the
     number on screen, so trim fat first (down to its floor) and then protein, and flag it. */
  let over = pr * 4 + fat * 9 - kr;
  const fatFloor = Math.round(0.3 * w);
  if (over > 0) { const cut = Math.min(over, Math.max(0, (fat - fatFloor) * 9)); fat -= Math.round(cut / 9); over -= cut; }
  const protFloor = Math.round(0.5 * w);            // the bottom of the app's own 0.5–1.0 g/lb band
  if (over > 0) { const cut = Math.min(over, Math.max(0, (pr - protFloor) * 4)); pr -= Math.round(cut / 4); over -= cut; }
  const macroSqueeze = over > 0;                    // even at both floors the target is unreachable
  const carbs = Math.max(0, Math.round((kr - pr * 4 - fat * 9) / 4));
  return { fat, carbs, lbm, bmr: Math.round(bmr), maint: Math.round(maint), weeklyMaint: Math.round(weeklyMaint), deficit: Math.round(deficit),
           surplus: Math.round(surplus), kind, bulking, bfCap: kind === 'bulk' && bf >= (+st.bulkMaxBF || 20),
           maintMode, kcal: kr, protein: pr, proteinTrimmed: pr < Math.round(st.proteinPerLb * w), macroSqueeze,
           floorHit: maint - deficit + surplus + (+st.kcalAdjust || 0) < st.minKcal };
}

/* ---------- recipes & portions ---------- */
function ingMacros(id, amt) { const g = ING[id]; const m = g.u ? amt : amt / 100; return { k: g.k * m, p: g.p * m, c: g.c * m, f: g.f * m }; }
function addM(a, b, s = 1) { a.k += b.k * s; a.p += b.p * s; a.c += b.c * s; a.f += b.f * s; return a; }
const zeroM = () => ({ k: 0, p: 0, c: 0, f: 0 });
function recipePerServing(r) { const m = zeroM(); r.ing.forEach(([id, amt]) => addM(m, ingMacros(id, amt / r.yield))); return m; }
const _rps = {}; function RPS(id) { return _rps[id] || (_rps[id] = recipePerServing(RECIPE[id])); }
function roleOf(r, ingId) { return r.fixed ? 'X' : ING[ingId].r; }
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const round05 = x => Math.round(x * 20) / 20;

let _cache = null;
function invalidate() { _cache = null; }
function computeAll() {
  if (_cache) return _cache;
  const days = {};
  planDates().forEach(d => { days[d] = computeDay(d); });
  if (typeof attachPartner === 'function') attachPartner(days);        // meal sync: partner's portions of shared meals
  const batches = computeBatches(days);
  _cache = { days, batches };
  return _cache;
}
function computeDay(date) {
  const entry = S.plan[date] || { w: null, m: {} };
  const isTrain = !!entry.w;
  const st = statsOn(date);
  const tg = targetsFor(st.w, st.bf, isTrain);
  const meals = [];
  DAY_SLOTS.forEach(slot => { const id = entry.m && entry.m[slot]; if (id && RECIPE[id]) meals.push({ slot, r: RECIPE[id] }); });
  const lines = [];
  meals.forEach((m, mi) => m.r.ing.forEach(([id, amt]) => {
    const role = roleOf(m.r, id);
    lines.push({ mi, id, base: amt / m.r.yield, role, unit: !!ING[id].u && (role === 'P' || role === 'C' || role === 'F') });
  }));
  // quick-added extras (a scanned snack, a bar…) count as fixed food, so the planned portions make room for them
  const extras = (entry.x || []).map((x, i) => x && ING[x.id] && +x.amt > 0 ? { i, id: x.id, amt: +x.amt, slot: DAY_SLOTS.includes(x.slot) ? x.slot : 'snack1', m: ingMacros(x.id, +x.amt) } : null).filter(Boolean);
  const exM = extras.reduce((a, x) => addM(a, x.m), zeroM());
  const factor = (role, pF, cF) => role === 'P' ? pF : (role === 'C' || role === 'F') ? cF : 1;
  const roundUnit = (base, a) => { const step = base % 1 ? 0.5 : 1; return Math.max(step, Math.round(a / step) * step); };
  // solve protein factor (pF) and carb/fat factor (cF); pass 2 locks count-based items (eggs, tortillas…) to whole units
  function solve(unitAmt) {
    const sum = { P: zeroM(), CF: zeroM(), V: zeroM(), X: addM(zeroM(), exM) };
    lines.forEach((l, i) => {
      if (unitAmt && l.unit) { addM(sum.X, ingMacros(l.id, unitAmt[i])); return; }
      addM(sum[l.role === 'P' ? 'P' : l.role === 'X' ? 'X' : l.role === 'V' ? 'V' : 'CF'], ingMacros(l.id, l.base));
    });
    let pF = 1, cF = 1;
    for (let it = 0; it < 6; it++) {
      if (sum.P.p > 0) pF = clamp((tg.protein - sum.X.p - sum.V.p - sum.CF.p * cF) / sum.P.p, 0.85, 1.25);
      if (sum.CF.k > 0) cF = clamp((tg.kcal - sum.X.k - sum.V.k - sum.P.k * pF) / sum.CF.k, 0.5, 1.9);
    }
    return [round05(pF), round05(cF)];
  }
  let pF = 1, cF = 1, unitAmt = null;
  if (lines.length) {
    [pF, cF] = solve(null);
    unitAmt = lines.map(l => l.unit ? roundUnit(l.base, l.base * factor(l.role, pF, cF)) : null);
    [pF, cF] = solve(unitAmt);
  }
  const totals = zeroM();
  const outMeals = meals.map(({ slot, r }, mi) => {
    const items = lines.map((l, i) => [l, i]).filter(([l]) => l.mi === mi).map(([l, i]) => {
      const a = l.unit ? unitAmt[i] : l.base * factor(l.role, pF, cF);
      return { id: l.id, amt: a, role: l.role, m: ingMacros(l.id, a) };
    });
    const m = items.reduce((acc, x) => addM(acc, x.m), zeroM());
    addM(totals, m);
    return { slot, r, items, m };
  });
  addM(totals, exM);
  return { date, isTrain, entry, stats: st, tg, pF, cF, meals: outMeals, extras, totals };
}

/* What a day's meals use, by food. mine: only this user's portions (pantry use-up); otherwise what the
   shopping list covers (batches cooked that day, single meals, the sync partner's portions of shared meals). */
function dayUse(A, d, mine, extras = mine) {
  const out = {}; const add = (id, a) => { if (a > 0) out[id] = (out[id] || 0) + a; }; const day = A.days[d]; if (!day) return out;
  day.meals.forEach(m => {
    const b = A.batches.info[d + '|' + m.slot];
    if (b && b.role === 'leftover') return;
    if (b && b.role === 'cook') { const share = mine && b.batch.partnerServ ? (b.batch.size - b.batch.partnerServ) / b.batch.size : 1; Object.entries(b.batch.amounts).forEach(([id, a]) => add(id, a * share)); return; }
    m.items.forEach(it => add(it.id, it.amt)); if (!mine && m.partner) m.partner.items.forEach(([id, a]) => add(id, a));
  });
  if (extras) (day.extras || []).forEach(x => add(x.id, x.amt));
  return out;
}

/* Leftovers: group occurrences of multi-serving recipes into batches.
   A leftover joins the current batch while it has room and is within the recipe's keep window. */
function keepDays(r) { if (r.keep) return r.keep; if (r.id === 'boiled_eggs') return 6; return r.storage === 'freezer' ? 60 : r.storage === 'fridge' ? 4 : 1; }
function computeBatches(days) {
  const occ = {}; // recipeId -> [{date, slot}]
  Object.keys(days).sort().forEach(d => {
    days[d].meals.forEach((m, i) => { if (m.r.yield > 1) (occ[m.r.id] = occ[m.r.id] || []).push({ date: d, slot: m.slot, order: DAY_SLOTS.indexOf(m.slot), n: m.partner ? 2 : 1 }); });
  });
  const info = {}; const list = [];
  Object.entries(occ).forEach(([rid, arr]) => {
    const r = RECIPE[rid]; const keep = keepDays(r);
    arr.sort((a, b) => a.date === b.date ? a.order - b.order : (a.date < b.date ? -1 : 1));
    let cur = null;
    arr.forEach(o => {
      if (!cur || cur.servings + o.n > Math.max(r.yield, o.n) || dayDiff(cur.cook, o.date) > keep - 1) {
        cur = { id: rid + '@' + o.date + ':' + o.slot, rid, cook: o.date, members: [], servings: 0 }; list.push(cur);
      }
      cur.members.push(o); cur.servings += o.n;
    });
  });
  list.forEach(b => {
    const r = RECIPE[b.rid];
    // batch ingredient totals = sum of each member's scaled portion
    const amounts = {};
    let acc = 0;
    b.members.forEach((o, idx) => {
      const day = days[o.date]; const meal = day.meals.find(m => m.slot === o.slot); acc += o.n;
      meal.items.forEach(it => { amounts[it.id] = (amounts[it.id] || 0) + it.amt; });
      if (meal.partner) meal.partner.items.forEach(([id, a]) => { amounts[id] = (amounts[id] || 0) + a; });
      info[o.date + '|' + o.slot] = { batch: b, idx: acc, role: idx === 0 ? 'cook' : 'leftover',
        frozen: r.storage === 'freezer' && dayDiff(b.cook, o.date) > 3 };
    });
    b.amounts = amounts; b.size = b.servings; b.partnerServ = b.members.filter(o => o.n > 1).length; b.scale = b.size / r.yield;
  });
  return { info, list };
}

/* ---------- friendly amounts ---------- */
const TBSP = { olive_oil: 13.5, sesame_oil: 13.6, honey: 21, pb: 16, light_mayo: 15, soy_sauce: 16, chia: 12, cocoa: 5.4, pb2: 6.5, sriracha: 6, ketchup: 17, cornstarch: 8, parmesan: 5, teriyaki: 18, syrup_sf: 15 };
const CUP = { greek_yogurt: 245, cottage: 226, rice: 158, sushi_rice: 160, quinoa: 185, berries: 140, oats: 80, granola: 60, marinara: 250, crushed_tomatoes: 240, salsa: 260, fairlife: 240, egg_whites: 243, black_beans: 172, kidney_beans: 177, corn: 145, edamame: 155, pineapple: 165, spinach: 30, broccoli: 90, stir_fry_veg: 130, cheese_shred: 113, feta: 150, cherry_tomato: 150, carrots: 128, romaine: 47, green_beans: 110, cucumber: 120 };
function fracStr(x) {
  const w = Math.floor(x + 1e-6); const f = x - w; const fr = [[0, ''], [0.25, '¼'], [0.33, '⅓'], [0.5, '½'], [0.67, '⅔'], [0.75, '¾'], [1, '']];
  let best = fr[0], bd = 9; fr.forEach(q => { const dd = Math.abs(f - q[0]); if (dd < bd) { bd = dd; best = q; } });
  const whole = best[0] === 1 ? w + 1 : w; const s = (whole ? whole : '') + best[1];
  return s || '0';
}
function amountText(id, amt) {
  const g = ING[id];
  if (g.u) { const n = Math.max(0.5, Math.round(amt * 2) / 2); const lab = n <= 1 ? g.u : g.u + (g.u.endsWith('ch') ? 'es' : 's'); return { main: (n % 1 ? fracStr(n) : n) + ' ' + lab, sub: '' }; }
  let grams = amt >= 60 ? Math.round(amt / 5) * 5 : Math.round(amt);
  const unit = g.ml ? 'ml' : 'g';
  let sub = '';
  if (TBSP[id] && amt < TBSP[id] * 4) { const t = amt / TBSP[id]; sub = t < 0.9 ? fracStr(t * 3) + ' tsp' : fracStr(t) + ' tbsp'; }
  else if (id === 'whey') sub = fracStr(amt / 30) + ' scoop' + (amt / 30 > 1.2 ? 's' : '');
  else if (CUP[id]) { const c = amt / CUP[id]; sub = c < 0.2 ? Math.max(1, Math.round(c * 16)) + ' tbsp' : fracStr(c) + ' cup'; }
  else if (g.a === 'Meat & Seafood' || id === 'tuna_can' || id === 'jerky') sub = (amt / 28.35).toFixed(1) + ' oz';
  return { main: grams + ' ' + unit, sub };
}
function groceryText(id, amt) {
  const g = ING[id];
  if (g.dry) { const d = amt * g.dry; return { name: g.dryName, qty: Math.round(d / 10) * 10 + ' g', sub: (d / 453.6).toFixed(1) + ' lb' }; }
  if (g.u) { const n = Math.ceil(amt); return { name: g.n, qty: n + ' ' + (n === 1 ? g.u : g.u + (g.u.endsWith('ch') ? 'es' : 's')), sub: '' }; }
  if (g.a === 'Meat & Seafood') return { name: g.n, qty: (amt / 453.6).toFixed(2) + ' lb', sub: Math.round(amt) + ' g' };
  if (g.ml) return { name: g.n, qty: Math.round(amt / 10) * 10 + ' ml', sub: (amt / 946).toFixed(2) + ' qt' };
  if (amt >= 900) return { name: g.n, qty: (amt / 453.6).toFixed(1) + ' lb', sub: Math.round(amt) + ' g' };
  return { name: g.n, qty: Math.round(amt) + ' g', sub: CUP[id] ? fracStr(amt / CUP[id]) + ' cup' : (TBSP[id] ? fracStr(amt / TBSP[id]) + ' tbsp' : '') };
}

/* ---------- strength log / PRs ---------- */
function e1rm(w, r) { if (!w || !r) return 0; return r === 1 ? w : w * (1 + r / 30); }
function effLoad(exId, w, date) { const ex = EX[exId]; if (ex && ex.assist) return Math.max(0, statsOn(date).w - (+w || 0)); return +w || 0; }
function isBW(exId) { return ['hanging_knee_raise', 'ab_wheel', 'ball_leg_curl'].includes(exId) || !!(EX[exId] && EX[exId].bw); }
function exerciseHistory(exId) {
  const out = [];
  Object.keys(S.logs).sort().forEach(d => {
    const sets = (S.logs[d] || {})[exId]; if (!sets || !sets.length) return;
    const valid = sets.filter(s => s && +s.r > 0);
    if (!valid.length) return;
    let best = 0, top = 0, vol = 0, bestReps = 0, bestSet = null;
    valid.forEach(s => {
      const L = effLoad(exId, s.w, d); const e = isBW(exId) ? +s.r : e1rm(L, +s.r);
      if (e > best) { best = e; bestSet = s; }
      top = Math.max(top, L); vol += L * (+s.r); bestReps = Math.max(bestReps, +s.r);
    });
    out.push({ d, sets: valid, best, top, vol, bestReps, bestSet });
  });
  let run = 0; out.forEach(h => { h.pr = h.best > run + 0.01; if (h.pr) run = h.best; });
  return out;
}
function allLoggedExercises() { const s = new Set(); Object.values(S.logs).forEach(day => Object.keys(day || {}).forEach(k => { if (EX[k] && (day[k] || []).some(x => x && +x.r > 0)) s.add(k); })); return [...s]; }
function lastPerformance(exId, beforeDate) {
  const h = exerciseHistory(exId).filter(x => x.d < beforeDate); return h.length ? h[h.length - 1] : null;
}
function suggestion(exId, reps, beforeDate) {
  const last = lastPerformance(exId, beforeDate); if (!last) return null;
  const [lo, hi] = repRange(reps);
  const ex = EX[exId];
  const w = last.bestSet ? +last.bestSet.w : 0;
  const allTop = last.sets.every(s => +s.r >= hi);
  const inc = /Dumbbell|DB/.test(ex.name) || ex.group === 'Shoulders' || ex.group === 'Biceps' || ex.group === 'Triceps' ? 5 : 10;
  if (isBW(exId)) return { text: `Last best: ${last.bestReps} reps → aim for ${last.bestReps + 1}+`, last };
  if (ex.assist) return { text: allTop ? `Hit the top of the range — drop assistance to ${Math.max(0, w - 10)} lb` : `Keep ${w} lb assist, add a rep per set`, last };
  if (allTop) return { text: `Hit ${hi}+ on all sets → go up to ${w + inc} lb and aim for ${lo}+`, last };
  return { text: `Stay at ${w} lb and beat ${last.sets.map(s => s.r).join('/')} reps`, last };
}

/* ---------- trend & projections ---------- */
function linreg(pts) { const n = pts.length; if (n < 2) return null; let sx = 0, sy = 0, sxx = 0, sxy = 0; pts.forEach(([x, y]) => { sx += x; sy += y; sxx += x * x; sxy += x * y; }); const den = n * sxx - sx * sx; if (!den) return null; const m = (n * sxy - sx * sy) / den; return { m, b: (sy - m * sx) / n }; }
const TREND_STALE_DAYS = 10;                        // a trend older than this says nothing about today
function weightTrend() {
  const ws = sortedWeights(); if (ws.length < 3) return null;
  const last = ws[ws.length - 1].d;
  if (dayDiff(last, todayISO()) > TREND_STALE_DAYS) return { stale: true, since: last, days: dayDiff(last, todayISO()), rate: null, delta: 0, advice: `No weigh-in for ${dayDiff(last, todayISO())} days, so there's no current trend to go on. Log one and the coach picks up again.` };
  const from = addDays(last, -21);
  const pts = ws.filter(x => x.d >= from).map(x => [dayDiff(from, x.d), x.w]);
  if (pts.length < 3 || pts[pts.length - 1][0] - pts[0][0] < 7) return null;
  const lr = linreg(pts); if (!lr) return null;
  const rate = -lr.m * 7;                       // lb lost per week (negative while gaining)
  const kind = goalKind(); const st0 = latestStats() || {};
  let advice = null, delta = 0;
  if (kind === 'maintain') {
    const drift = -rate;                        // lb/wk on the scale
    if (Math.abs(drift) <= 0.35) advice = `Holding steady: ${drift >= 0 ? '+' : ''}${drift.toFixed(2)} lb/wk. Maintenance calories look right.`;
    else { delta = drift > 0 ? -150 : 150; advice = `You’re ${drift > 0 ? 'gaining' : 'losing'} ${Math.abs(drift).toFixed(2)} lb/wk while aiming to hold. ${delta > 0 ? 'Add' : 'Trim'} ${Math.abs(delta)} kcal/day.`; }
    return { rate, advice, delta, points: pts.length, kind };
  }
  if (kind === 'bulk') {
    const gain = -rate;                         // lb/wk gained
    const target = bulkLb(st0.w);
    if (gain < target * 0.5) { delta = gain < 0 ? 300 : 200; advice = `You’re gaining ${gain.toFixed(2)} lb/wk against a ${target.toFixed(2)} lb/wk target. Add ${delta} kcal/day.`; }
    else if (gain > target * 1.6) { delta = -150; advice = `You’re gaining ${gain.toFixed(2)} lb/wk — faster than the ${target.toFixed(2)} lb/wk target, and the extra is mostly fat. Trim ${-delta} kcal/day.`; }
    else advice = `On track: ${gain.toFixed(2)} lb/wk against a ${target.toFixed(2)} lb/wk target. Keep going.`;
    return { rate, advice, delta, points: pts.length, kind };
  }
  const target = S.settings.rate;
  if (rate < target * 0.7) { delta = rate < target * 0.4 ? -200 : -125; advice = `You’re losing ${rate.toFixed(2)} lb/wk vs a ${target} lb/wk target. Trim ${-delta} kcal/day.`; }
  else if (rate > target * 1.35 && rate > 1.5) { delta = 150; advice = `You’re losing ${rate.toFixed(2)} lb/wk — faster than planned. Add ${delta} kcal/day to protect muscle and training quality.`; }
  else advice = `On track: ${rate.toFixed(2)} lb/wk vs ${target} lb/wk target. Keep going.`;
  return { rate, advice, delta, points: pts.length, kind };
}
function movingAvg(ws, days = 7) {
  return ws.map((x, i) => { const from = addDays(x.d, -(days - 1)); const win = ws.filter(y => y.d >= from && y.d <= x.d); return { d: x.d, v: win.reduce((a, y) => a + y.w, 0) / win.length }; });
}
function projection() {
  const st = latestStats(); const kind = goalKind();
  const ws0 = sortedWeights(); const staleBy = ws0.length ? dayDiff(ws0[ws0.length - 1].d, todayISO()) : null;
  const signed = planRate(st.w);                                  // negative cutting, positive bulking
  const rate = Math.abs(signed) || 0.0001;
  const toGoal = kind === 'bulk' ? Math.max(0, S.settings.goalWeight - st.w) : Math.max(0, st.w - S.settings.goalWeight);
  const weeks = toGoal / rate;
  // measure forward from today, not from a weigh-in that might be months old
  const refDate = maxISO(ws0.length ? ws0[ws0.length - 1].d : S.settings.startDate, todayISO());
  const ref = maxISO(maxISO(todayISO(), refDate), S.settings.startDate);
  const launchEnd = addDays(S.settings.startDate, LAUNCH_DAYS - 1);
  const cyc = ref <= launchEnd ? 1 : cycleOfWeek(planWeek(ref));
  const endPlan = cyc === 1 ? launchEnd : cycleEndDate(cyc);
  const daysLeft = Math.max(0, dayDiff(refDate, endPlan));
  const endW = kind === 'bulk' ? Math.min(S.settings.goalWeight, st.w + rate * daysLeft / 7) : Math.max(S.settings.goalWeight, st.w - rate * daysLeft / 7);
  const goalDate = addDays(refDate, Math.round(weeks * 7));
  // weight at goal BF if lean mass is held
  const wAtGoalBF = st.lbm / (1 - S.settings.goalBF / 100);
  return { weeks, goalDate, endW, endPlan, cyc, wAtGoalBF, lbm: st.lbm, kind, rate: signed, staleBy, stale: staleBy != null && staleBy > TREND_STALE_DAYS, reached: goalReached(st.w, st.bf) };
}

/* ---------- export for node tests ---------- */
if (typeof module !== 'undefined') module.exports = { get S() { return S; }, set S(v) { S = v; }, loadState, foodAllowed, subOn, replanMeals, exOffOn, exGroupOf, simulateMeals, shoppingStats, shareScore, packInfo, defaultPack, isFav, filterSeq, nextPlanWeekStart, markMealEdit, rescheduleWorkouts, rebuildExercises, slotVars, rebuildCatalog, ensureHorizon, ensurePlanThrough, substitutePlan, recipeAllowed, planEnd, phaseForWeek, cycleOfWeek, freshState, generatePlan, computeAll, computeDay, sessionRows, targetsFor, goalKind, planRate, bulkLb, statsOn, amountText, groceryText, exerciseHistory, weightTrend, projection, RPS, planDates, invalidate };
