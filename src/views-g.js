// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
/* ================================================================
   FORGE 90 — recipe import (web links and Mealie)
   The server fetches the recipe; here each ingredient line is parsed (amount, unit,
   food), matched to the food database and converted to the food's own unit. Every
   import opens in the recipe editor for review: anything that couldn't be worked out
   is highlighted and has to be filled in before the recipe can be saved.
   ================================================================ */

/* ---------- parsing an ingredient line ---------- */
const IMP_FRAC = { '½': .5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': .25, '¾': .75, '⅕': .2, '⅖': .4, '⅗': .6, '⅘': .8, '⅙': 1 / 6, '⅚': 5 / 6, '⅛': .125, '⅜': .375, '⅝': .625, '⅞': .875 };
const IMP_WORDNUM = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, half: .5, dozen: 12, couple: 2 };
// [pattern for the unit word, kind, factor to grams (mass) or ml (volume), label]
const IMP_UNITS = [
  ['fl\\.?\\s?oz\\.?|fluid\\s+ounces?', 'vol', 29.57, 'fl oz'],
  ['kilograms?|kilos?|kgs?', 'mass', 1000, 'kg'], ['grams?|gr|g', 'mass', 1, 'g'], ['milligrams?|mg', 'mass', .001, 'mg'],
  ['ounces?|oz', 'mass', 28.35, 'oz'], ['pounds?|lbs?', 'mass', 453.6, 'lb'],
  ['millilit(?:er|re)s?|mls?|cc', 'vol', 1, 'ml'], ['decilit(?:er|re)s?|dl', 'vol', 100, 'dl'], ['lit(?:er|re)s?|l', 'vol', 1000, 'l'],
  ['tablespoons?|tbsps?|tbls?|tbs|tb', 'vol', 14.79, 'tbsp'], ['teaspoons?|tsps?', 'vol', 4.93, 'tsp'],
  ['cups?|c', 'vol', 236.6, 'cup'], ['pints?|pts?', 'vol', 473, 'pint'], ['quarts?|qts?', 'vol', 946, 'quart'], ['gallons?|gal', 'vol', 3785, 'gallon'],
  ['pinch(?:es)?', 'vol', .31, 'pinch'], ['dash(?:es)?', 'vol', .62, 'dash'], ['drops?', 'vol', .05, 'drop'],
  ['cloves?', 'count', 1, 'clove'], ['slices?', 'count', 1, 'slice'], ['pieces?|pcs?', 'count', 1, 'piece'], ['cans?|tins?', 'count', 1, 'can'], ['jars?', 'count', 1, 'jar'],
  ['packages?|pkgs?|packets?|pouch(?:es)?|bags?|box(?:es)?|containers?|tubs?|bottles?|cartons?|envelopes?', 'count', 1, 'package'], ['blocks?', 'count', 1, 'block'],
  ['sticks?', 'count', 1, 'stick'], ['bunch(?:es)?', 'count', 1, 'bunch'], ['heads?', 'count', 1, 'head'], ['stalks?|ribs?', 'count', 1, 'stalk'], ['sprigs?', 'count', 1, 'sprig'],
  ['handfuls?', 'count', 1, 'handful'], ['scoops?', 'count', 1, 'scoop'], ['fillets?|filets?', 'count', 1, 'fillet'], ['strips?|rashers?', 'count', 1, 'strip'], ['links?', 'count', 1, 'link'],
  ['leaves|leaf', 'count', 1, 'leaf'], ['ears?', 'count', 1, 'ear'], ['servings?', 'count', 1, 'serving'], ['wedges?', 'count', 1, 'wedge'], ['knobs?|thumbs?', 'count', 1, 'knob'], ['whole', 'count', 1, 'whole']
].map(([p, k, f, l]) => ({ re: new RegExp('^(?:' + p + ')$', 'i'), k, f, l }));
const IMP_SIZE = { small: .7, medium: 1, med: 1, large: 1.35, big: 1.35, 'extra-large': 1.6, xl: 1.6, jumbo: 1.6 };
function impNum(s) {
  s = String(s).trim().replace(',', '.'); let m;
  if ((m = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/))) return +m[1] + (+m[3] ? +m[2] / +m[3] : 0);
  if ((m = s.match(/^(\d+)\s*\/\s*(\d+)$/))) return +m[2] ? +m[1] / +m[2] : null;
  return isFinite(+s) ? +s : null;
}
const IMP_NUM_RE = '(?:\\d+\\s+\\d+\\s*\\/\\s*\\d+|\\d+\\s*\\/\\s*\\d+|\\d+(?:[.,]\\d+)?)';
function impUnit(tok, raw) {
  if (!tok) return null; const t = tok.replace(/\.$/, '');
  if (raw === 'T' || raw === 'T.') return IMP_UNITS.find(u => u.l === 'tbsp');
  if (raw === 't' || raw === 't.') return IMP_UNITS.find(u => u.l === 'tsp');
  return IMP_UNITS.find(u => u.re.test(t)) || null;
}
// "1 (14.5 oz) can", "about 1 lb", "400 g" → { qty, u }
function impMeasure(s) {
  const m = String(s).match(new RegExp('(' + IMP_NUM_RE + ')\\s*-?\\s*(fl\\.?\\s?oz|[a-z]+\\.?)', 'i')); if (!m) return null;
  const u = impUnit(m[2].toLowerCase(), m[2]); const q = impNum(m[1]);
  return u && u.k !== 'count' && q ? { qty: q, u } : null;
}
function impParseLine(text) {
  const src = String(text || '').trim();
  let s = src.replace(/[⁄∕]/g, '/').replace(/(\d)?\s*([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, (m, d, f) => ' ' + ((d ? +d : 0) + IMP_FRAC[f]).toFixed(3).replace(/\.?0+$/, '') + ' ')
    .replace(/^[\s•*·▢☐□\-–]+/, '').replace(/\s+/g, ' ').trim();
  const out = { src, qty: null, u: null, size: 1, paren: null, food: '', note: '', header: false, optional: /\boptional\b/i.test(s), toTaste: /\bto taste\b|\bas needed\b|\bfor (serving|garnish|the pan|greasing|dusting)\b|\bgarnish\b/i.test(s) };
  if (/:$/.test(s) && !/\d/.test(s)) { out.header = true; return out; }
  // "juice of 1 lemon", "zest of 2 limes"
  let jm = s.match(/^(juice|zest)\s+(?:from|of)\s+(\S+)\s+(?:(small|medium|large)\s+)?(lemons?|limes?|oranges?)/i);
  if (jm) { const q = impNum(jm[2]) || IMP_WORDNUM[jm[2].toLowerCase()] || 1; const fruit = jm[4].toLowerCase().replace(/s$/, ''); out.qty = q; out.u = null; out.size = IMP_SIZE[(jm[3] || '').toLowerCase()] || 1; out.food = jm[1].toLowerCase() === 'zest' ? fruit + ' zest' : fruit + ' juice'; out.juiceOf = fruit; out.zest = jm[1].toLowerCase() === 'zest'; return out; }
  // parentheses: keep any measurement in them, then drop them from the text
  const parens = []; s = s.replace(/\(([^)]*)\)/g, (m, x) => { parens.push(x); return ' '; }).replace(/\s+/g, ' ').trim();
  // leading amount
  let m = s.match(new RegExp('^(' + IMP_NUM_RE + ')(?:\\s*(?:-|–|to|or)\\s*(' + IMP_NUM_RE + '))?\\s*'));
  if (m) { const a = impNum(m[1]), b = m[2] ? impNum(m[2]) : null; out.qty = b && a ? (a + b) / 2 : a; s = s.slice(m[0].length); }
  else if ((m = s.match(/^(an?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|half|dozen|couple)\b(?:\s+of)?\s*/i))) { out.qty = IMP_WORDNUM[m[1].toLowerCase()]; s = s.slice(m[0].length); }
  // "2 x 400 g", "1 15-oz can"
  let mx = s.match(new RegExp('^(?:x|×)\\s*(' + IMP_NUM_RE + ')\\s*(fl\\.?\\s?oz|[a-z]+\\.?)\\s*', 'i'));
  if (mx) { const u = impUnit(mx[2].toLowerCase(), mx[2]); if (u && u.k !== 'count') { out.paren = { qty: impNum(mx[1]), u }; s = s.slice(mx[0].length); } }
  mx = s.match(new RegExp('^(' + IMP_NUM_RE + ')\\s*-?\\s*(fl\\.?\\s?oz|ounces?|oz\\.?|g|grams?|ml|lbs?\\.?|pounds?)\\b\\.?\\s*', 'i'));
  if (mx && out.qty) { const u = impUnit(mx[2].toLowerCase(), mx[2]); if (u) { out.paren = { qty: impNum(mx[1]), u }; s = s.slice(mx[0].length); } }
  // size word, then unit (allowing "2 large cloves", "1 heaping cup")
  const takeSize = () => { const sm = s.match(/^(small|medium|med\.?|large|big|extra-large|xl|jumbo)\b\.?\s*/i); if (sm) { out.size = IMP_SIZE[sm[1].toLowerCase().replace(/\.$/, '')] || 1; s = s.slice(sm[0].length); } };
  s = s.replace(/^(heaping|heaped|level|scant|generous|rounded|packed|about|approximately|approx\.?)\s+/i, ''); takeSize();
  const two = s.match(/^(fl\.?\s?oz\.?|fluid\s+ounces?)\b\s*/i);
  if (two) { out.u = IMP_UNITS[0]; s = s.slice(two[0].length); }
  else { const w = s.match(/^([A-Za-z]+)\.?(?=\s|$)\s*/); if (w) { const u = impUnit(w[1].toLowerCase(), w[1]); if (u && !(u.l === 'whole' && out.qty == null)) { out.u = u; s = s.slice(w[0].length); } } }
  if (out.u && out.u.k === 'count') takeSize();
  s = s.replace(/^of\s+/i, '');
  if (!out.paren) for (const p of parens) { const pm = impMeasure(p); if (pm) { out.paren = pm; break; } }
  if (out.u && out.u.k !== 'count') out.paren = null;
  const qual = parens.filter(p => !impMeasure(p) && /\d\s*%|\d+\/\d+|\blean\b|\bfat\b|\blow\b|\breduced\b|\bnonfat\b|\bskim\b/i.test(p)).join(' ');
  // food name: before the first comma; notes after it
  const ci = s.indexOf(','); out.food = (ci >= 0 ? s.slice(0, ci) : s).trim(); out.note = ci >= 0 ? s.slice(ci + 1).trim() : '';
  if (qual) out.food += ' ' + qual;
  out.food = out.food.replace(/\s+(?:or|and\/or)\s+.*$/i, '').replace(/\b(for serving|for garnish|to taste|as needed|optional|divided)\b/gi, '').replace(/\s+/g, ' ').trim();
  if (!out.food && out.note) { out.food = out.note; out.note = ''; }
  if (!out.food && out.u && out.qty == null) { out.food = out.u.l; out.u = null; }
  return out;
}

/* ---------- matching a food ---------- */
const IMP_STOP = new Set('fresh freshly chopped diced minced sliced thinly thickly finely roughly coarsely cubed julienned torn halved quartered peeled seeded cored trimmed stemmed rinsed softened melted room temperature cold warm lightly beaten whisked uncooked to taste serving garnish optional divided packed heaping level cut into piece pieces inch inches cm mm about approximately plus more for of the a an and or with without your favorite choice good quality organic homemade store bought prepared each such as like preferably needed if desired bite sized size fine thin thick small medium large extra big jumbo'.split(' '));
const IMP_WEAK = new Set('raw cooked canned drained dry dried frozen boneless skinless shredded grated crushed whole low reduced fat free sodium lean plain unsweetened sweetened light regular style natural pure baby jarred bottled leftover mix blend'.split(' '));
const IMP_TRIVIAL = new Set('raw plain large medium fresh regular natural cooked whole'.split(' '));
const IMP_COLOR = new Set('red green yellow white black brown orange purple golden'.split(' '));
const IMP_SYN = [
  [/\b(scallions?|spring onions?|chives)\b/g, 'green onion'], [/\bshallots?\b/g, 'onion'], [/\b(yellow|white|sweet|vidalia) onions?\b/g, 'onion'],
  [/\b(garbanzo beans?|garbanzos)\b/g, 'chickpeas'], [/\byoghurt\b/g, 'yogurt'], [/\bparmigiano(-| )?(reggiano)?\b/g, 'parmesan'], [/\bextra[- ]virgin olive oil\b|\bevoo\b/g, 'olive oil'],
  [/\btamari\b|\bshoyu\b/g, 'soy sauce'], [/\b(confectioners'?|powdered|icing|granulated|white|cane|caster) sugar\b/g, 'sugar'], [/\b(light|dark) brown sugar\b/g, 'brown sugar'],
  [/\b(plain|ap) flour\b|^flour$/g, 'all purpose flour'], [/\b(heavy whipping|whipping|double|heavy) cream\b/g, 'heavy cream'], [/\bcourgettes?\b/g, 'zucchini'], [/\baubergines?\b/g, 'eggplant'],
  [/\bcapsicums?\b/g, 'bell pepper'], [/\b(red|green|yellow|orange) peppers?\b(?! flakes)/g, 'bell pepper'], [/\brocket\b/g, 'arugula'], [/\bprawns?\b/g, 'shrimp'], [/\byams?\b/g, 'sweet potato'],
  [/\b(ground chuck|hamburger meat|minced beef|beef mince|ground round)\b/g, 'ground beef'], [/\b(minced|ground) (turkey|chicken|pork|lamb|bison)\b/g, 'ground $2'], [/\bstock\b/g, 'broth'],
  [/\b(spaghetti|penne|rigatoni|fettuccine|fettuccini|linguine|macaroni|rotini|farfalle|fusilli|ziti|orzo|elbows?|bucatini|pappardelle|tagliatelle|lasagna noodles?|shells)\b/g, 'pasta'],
  [/\b(cremini|crimini|baby bellas?|portobellos?|portabellas?|button mushrooms?)\b/g, 'mushrooms'], [/\bcauliflower rice\b/g, 'riced cauliflower'], [/\b(mixed greens|salad greens|salad mix|spring mix|mesclun|baby greens)\b/g, 'spring mix salad greens'], [/\bmayo\b/g, 'mayonnaise'],
  [/\b(barbecue|bbq) sauce\b/g, 'bbq sauce'], [/\b(old[- ]fashioned|rolled|quick|quick[- ]cooking) oats\b|\boatmeal\b/g, 'rolled oats'], [/\bprotein powder\b|\bwhey\b(?! protein)/g, 'whey protein powder'],
  [/\b(kosher|sea|table|flaky|coarse|fine) salt\b/g, 'salt'], [/\b(freshly )?(ground )?black pepper\b|\bpeppercorns?\b/g, 'black pepper'], [/\b(red pepper flakes|crushed red pepper|chili flakes|cayenne( pepper)?)\b/g, 'chili powder'],
  [/\bdried (oregano|thyme|basil|rosemary|sage|parsley|marjoram|dill)\b|\b(oregano|thyme|rosemary|sage|marjoram|herbes de provence)\b/g, 'italian seasoning'], [/\b(juiced|juice of)\b/g, 'juice'],
  [/\bhalf[- ]and[- ]half\b|\bhalf & half\b/g, 'half and half'],
  [/\bsriracha sauce\b/g, 'sriracha'], [/\bketchup\b|\bcatsup\b/g, 'ketchup'], [/\bchicken breasts? halves\b/g, 'chicken breast'], [/\bchicken tenders?\b/g, 'chicken tenderloins'],
  [/\bcanola\b|\bvegetable oil\b|\bneutral oil\b|\bcooking oil\b/g, 'canola oil'], [/\bnon-?stick (cooking )?spray\b/g, 'cooking spray'], [/\bshredded cheese\b|\bmexican (blend )?cheese\b/g, 'shredded cheese']
];
const IMP_IMPLIED = { cheese: 'cheese', soft_cheese: 'cheese', oils: 'oil', milk: 'milk', milk_alt: 'milk', beans: 'bean', yogurt: 'yogurt', pasta: 'pasta', rice: 'rice', whole_eggs: 'egg', leafy: 'green', berries: 'berry', broth: 'broth', spices: 'spice' };
const impAscii = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function impSing(w) {
  if (w.length <= 3 || /(ss|us|is)$/.test(w)) return w;
  if (/ies$/.test(w)) return w.slice(0, -3) + 'y';
  if (/(oes|ches|shes|sses|xes)$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w)) return w.slice(0, -1);
  return w;
}
const IMP_FILLER = new Set('of the a an and or with in to for style'.split(' '));
function impTokens(s, syn) {             // syn = true for recipe text (synonyms, descriptors dropped); false for food names (descriptors kept, as weak words)
  let t = impAscii(s).replace(/%/g, ' ').replace(/&/g, ' and ');
  if (syn) IMP_SYN.forEach(([re, rep]) => { t = t.replace(re, rep); });
  return t.replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean).map(impSing).filter(w => !(syn ? IMP_STOP : IMP_FILLER).has(w));
}
const impW = w => IMP_WEAK.has(w) || IMP_STOP.has(w) ? .25 : IMP_COLOR.has(w) ? .5 : /^\d+$/.test(w) ? .5 : 1;
let _impIdx = null, _impIdxKey = '';
const IMP_MORE = new Set(MORE_FOODS.map(f => f[0]));        // the original ~75 foods (used by the built-in recipes) win ties
function impIndex() {                         // candidate names for every food, rebuilt when the catalog changes
  const key = Object.keys(ING).length + ':' + Object.keys(S.customFoods || {}).join(',') + ':' + Object.values(S.foodOverrides || {}).map(o => o.n || '').join(',');
  if (_impIdx && _impIdxKey === key) return _impIdx;
  _impIdx = Object.values(ING).map(g => {
    const full = String(g.n || ''); const noParen = full.replace(/\([^)]*\)/g, ' '); const primary = noParen.split(',')[0];
    const cands = [noParen, primary]; if (g.sub === 'spices') cands.push(primary.replace(/^ground\s+/i, ''));
    primary.split(/\s*\/\s*|\s+or\s+/i).forEach((part, i, all) => { if (all.length < 2) return; const last = all[all.length - 1].trim().split(/\s+/); let p = part.trim(); if (i < all.length - 1 && p.split(/\s+/).length === 1 && last.length > 1) p += ' ' + last.slice(1).join(' '); cands.push(p); });
    const alias = []; (full.match(/\(([^)]*)\)/g) || []).forEach(x => x.slice(1, -1).split(/[,/]| or /).forEach(a => { a = a.replace(/-style$/i, '').trim(); if (a && !/^\d|g protein|in\b|~/.test(a)) alias.push(a); }));
    const imp = IMP_IMPLIED[g.sub] || null;
    return { g, orig: !!g.base && !IMP_MORE.has(g.id), full: impTokens(noParen), cands: [...new Set(cands.map(c => c.trim()).filter(Boolean))].map(c => impTokens(c)), alias: alias.map(a => impTokens(a)), imp };
  });
  _impIdxKey = key; return _impIdx;
}
function impScore(Q, C, imp) {
  if (!Q.length || !C.length) return 0;
  const Cs = new Set(C); if (imp) Cs.add(imp);
  const qw = Q.reduce((a, t) => a + impW(t), 0); const qm = Q.reduce((a, t) => a + (Cs.has(t) ? impW(t) : 0), 0);
  const Qs = new Set(Q); const cw = C.reduce((a, t) => a + impW(t), 0); const cm = C.reduce((a, t) => a + (Qs.has(t) ? impW(t) : 0), 0);
  let s = .55 * (qm / qw) + .45 * (cw ? cm / cw : 0);
  const strong = Q.filter(t => impW(t) === 1); const head = strong[strong.length - 1] || Q[Q.length - 1];
  s += Cs.has(head) ? .1 : -.15;
  return s;
}
function impKey(food) { return impTokens(food, true).sort().join(' '); }
function impMatch(food) {
  const Q = impTokens(food, true); if (!Q.length) return { id: '', score: 0, sugg: [], st: 'none' };
  const key = Q.slice().sort().join(' '); const learned = (S.importMap || {})[key];
  const cooked = Q.includes('cooked'); const scored = impIndex().map(x => {
    let best = 0, bestC = []; x.cands.forEach(C => { const v = impScore(Q, C, x.imp); if (v > best) { best = v; bestC = C; } }); x.alias.forEach(C => { const v = impScore(Q, C, x.imp) * .85; if (v > best) { best = v; bestC = C; } });
    const fullC = x.full.length ? impScore(Q, x.full, x.imp) : 0;
    let s = best + .05 * Math.max(0, fullC);
    if (x.orig) s += .03; if (x.g.custom) s += .02;
    if (/\braw\b/i.test(x.g.n) && !cooked) s += .02; if (/\bcooked\b/i.test(x.g.n) && !cooked && !/rice|quinoa|lentil|chickpea|bean|couscous|farro|barley|bulgur|pea/i.test(x.g.n)) s -= .04;
    if (!foodAllowed(x.g.id)) s -= .01;
    return { id: x.g.id, s, orig: x.orig, c: bestC };
  }).filter(x => x.s > .3).sort((a, b) => b.s - a.s);
  const sugg = scored.slice(0, 4).map(x => x.id);
  if (learned && ING[learned]) return { id: learned, score: 1, sugg: [learned].concat(sugg.filter(i => i !== learned)).slice(0, 4), st: 'ok', key, learned: true };
  const top = scored[0];
  if (!top || top.s < .55) return { id: '', score: top ? top.s : 0, sugg, st: 'none', key };
  // a one-word food ("1 cup yogurt") that several foods fit about equally well
  const oneWord = Q.filter(t => impW(t) === 1).length <= 1;
  const close = scored[1] && top.s - scored[1].s < .05 && oneWord && !(top.orig && !scored[1].orig);
  const vague = oneWord && top.c.some(t => !Q.includes(t) && t !== top.c.imp && !IMP_TRIVIAL.has(t) && !/^\d+$/.test(t));   // "1 lb beef" → which beef?
  return { id: top.id, score: top.s, sugg, st: top.s >= .8 && !close && !vague ? 'ok' : 'check', key };
}

/* ---------- converting the amount to the food's unit ---------- */
const IMP_DENS = [                // g per ml for measuring by volume (checked against the food's name, then its subgroup)
  [/peanut butter|almond butter|nut butter/, 1.08], [/\bbutter\b|ghee/, .95], [/honey/, 1.42], [/maple|agave|syrup/, 1.32], [/brown sugar/, .9], [/powdered sugar/, .5], [/sugar|sweetener/, .85],
  [/salt/, 1.2], [/flour|pancake mix|baking mix/, .53], [/cornstarch/, .53], [/cocoa/, .36], [/oats|oat\b/, .36], [/granola|cereal|flakes/, .3], [/rice, cooked|rice cup/, .66], [/\brice\b/, .78],
  [/quinoa|couscous|farro|barley|bulgur/, .75], [/lentil|chickpea|split pea/, .8], [/bean/, .72], [/pasta|noodle/, .45], [/panko|breadcrumb/, .25], [/shredded|mozzarella|cheddar|swiss|provolone|pepper jack|cotija|feta/, .45],
  [/parmesan/, .4], [/cottage|ricotta/, 1.0], [/yogurt|skyr|sour cream|cream cheese|hummus|guacamole|refried|pumpkin/, 1.03], [/spinach|arugula|spring mix|lettuce|romaine|greens/, .13], [/kale|cabbage|coleslaw|bok choy/, .3],
  [/broccoli|cauliflower|brussels/, .38], [/onion|pepper|jalape/, .65], [/garlic|ginger/, .57], [/carrot|beet|parsnip|radish|celery/, .55], [/zucchini|squash/, .5], [/cherry tomato/, .63], [/tomato/, .75],
  [/mushroom/, .3], [/corn|peas|edamame|mixed vegetables/, .65], [/berr|cherries|grapes/, .6], [/raisin|cranberr|dates|prune/, .65], [/coconut milk|coconut cream/, 1.0], [/coconut/, .35], [/avocado/, .63], [/mango|pineapple|papaya|melon|apple|pear|peach|banana/, .6],
  [/chia|flax|hemp|seeds|pepitas/, .65], [/peanut|almond|cashew|walnut|pecan|pistachio|nuts/, .55], [/chocolate chips/, .7], [/whey|casein|protein powder|collagen|pb2|powdered peanut/, .4],
  [/oil|mayo|dressing|vinaigrette/, .92], [/sauce|salsa|ketchup|mustard|pesto|relish|paste|jam/, 1.05], [/powder|seasoning|spice|cinnamon|paprika|cumin|pepper/, .5]
];
const IMP_SUB_DENS = { oils: .92, dressings: .95, sweeteners: 1.3, spices: .55, sauces: 1.05, condiments: 1.05, yogurt: 1.03, cottage: 1, cheese: .45, soft_cheese: 1, butter_cream: .95, rice: .78, ancient: .75, oats: .36, cereal: .3, baking: .53, pasta: .45, beans: .72, lentils: .8, leafy: .13, cruciferous: .38, alliums: .65, root_veg: .55, squash: .5, tomatoes: .7, other_veg: .6, berries: .6, tree_fruit: .6, tropical: .6, melon: .65, dried_fruit: .65, avocado: .63, peanuts: .6, tree_nuts: .55, seeds: .65, whey: .4, other_protein: .4, chips: .12, sweets: .6 };
const IMP_EACH = [               // grams (ml for per-ml foods) of one item, by name
  [/egg white/, 33], [/egg yolk/, 17], [/\beggs?\b/, 50], [/chicken breast/, 225], [/chicken thigh/, 115], [/drumstick/, 105], [/chicken wing/, 90], [/chicken tender/, 45], [/pork tenderloin/, 450], [/pork chop|lamb chop/, 170],
  [/steak|filet/, 225], [/salmon|trout|cod|tilapia|halibut|mahi|swordfish|fillet/, 170], [/bratwurst|kielbasa|sausage/, 75], [/patty|burger/, 113], [/garlic/, 5], [/shallot/, 40], [/green onion|scallion/, 15],
  [/onion/, 150], [/bell pepper/, 150], [/jalape/, 15], [/serrano|chile|chili pepper|thai chili/, 8], [/sweet potato/, 180], [/potato/, 215], [/carrot/, 60], [/celery/, 40], [/zucchini|yellow squash/, 200], [/cucumber/, 300],
  [/cherry tomato|grape tomato/, 17], [/tomato/, 125], [/avocado/, 150], [/mushroom/, 18], [/broccoli/, 350], [/cauliflower/, 600], [/cabbage/, 900], [/lettuce|romaine/, 450], [/eggplant/, 450], [/\bcorn\b/, 90],
  [/lemon juice/, 45], [/lime juice/, 30], [/orange juice/, 80], [/lemon/, 60], [/lime/, 45], [/orange/, 130], [/apple/, 180], [/banana/, 118], [/pear/, 178], [/peach/, 150], [/mango/, 200], [/kiwi/, 75], [/date/, 24],
  [/lasagna/, 20], [/tortilla/, 45], [/bagel/, 100], [/\bbun\b/, 50], [/pita/, 64], [/naan/, 90], [/english muffin/, 66], [/bread/, 30], [/bacon/, 8], [/ginger/, 15], [/tofu/, 400], [/tempeh/, 225], [/shrimp/, 12], [/scallop/, 30]
];
const IMP_UNIT_EACH = {          // grams per count unit, by name (falls back to IMP_EACH)
  can: [[/tuna|chicken breast, drained|salmon, drained/, 142], [/bean|chickpea|lentil|corn|pea|artichoke/, 425], [/tomato|pumpkin|enchilada|marinara|sauce/, 411], [/broth|milk|coconut/, 400], [/./, 400]],
  jar: [[/salsa|pesto/, 450], [/marinara|sauce/, 680], [/pepper|artichoke/, 340], [/./, 450]], package: [[/tofu/, 400], [/tempeh/, 225], [/spinach|greens|arugula|lettuce/, 142], [/cream cheese/, 227], [/./, 450]], block: [[/tofu/, 400], [/./, 227]],
  stick: [[/butter/, 113], [/celery/, 40], [/cinnamon/, 3], [/./, 28]], bunch: [[/cilantro|parsley|herb|basil|dill|mint/, 60], [/green onion|scallion/, 100], [/spinach/, 280], [/kale|chard/, 200], [/asparagus/, 450], [/./, 150]],
  head: [[/garlic/, 50], [/broccoli/, 350], [/cauliflower/, 600], [/lettuce|romaine/, 450], [/cabbage/, 900], [/./, 400]], clove: [[/./, 5]], slice: [[/cheese/, 21], [/bacon/, 8], [/bread|toast/, 30], [/tomato/, 20], [/onion/, 15], [/lemon|lime/, 5], [/./, 25]],
  stalk: [[/./, 40]], sprig: [[/./, 1]], leaf: [[/./, .5]], handful: [[/spinach|greens|arugula|kale/, 30], [/./, 28]], scoop: [[/./, 31]], fillet: [[/./, 170]], strip: [[/bacon/, 8], [/./, 20]], link: [[/./, 75]], ear: [[/./, 90]],
  wedge: [[/lemon|lime/, 10], [/./, 30]], knob: [[/ginger/, 15], [/butter/, 10], [/./, 10]]
};
const IMP_DRY_COOKED = [[/rice/, 3], [/quinoa|couscous|farro|barley|bulgur/, 2.8], [/lentil|split pea/, 2.5], [/bean|chickpea/, 2.4]];
const impFind = (list, s) => { const x = list.find(([re]) => re.test(s)); return x ? x[1] : null; };
function impRound(v, unit) { if (!(v > 0)) return null; if (unit) return Math.max(.5, Math.round(v * 2) / 2); return v < 20 ? Math.round(v * 2) / 2 : v < 100 ? Math.round(v) : Math.round(v / 5) * 5; }
const impQtyText = (q, u) => { const n = q == null ? 1 : q; const f = Math.abs(n - Math.round(n)) < .01 ? String(Math.round(n)) : fmt(n, 2); return u ? `${f} ${u.l}${n > 1 && !/oz|ml|g$|kg|lb|tbsp|tsp/.test(u.l) ? 's' : ''}` : f; };
// → { amt, est } in the food's own unit (items, ml or g), or null when it can't be worked out
function impAmount(id, p) {
  const g = ING[id]; if (!g || !p) return null;
  const gn = impAscii(g.n), fd = impAscii(p.food || ''); const qty = p.qty == null ? (p.u || p.paren ? 1 : null) : p.qty;
  if (qty == null) return null;
  const dens = () => impFind(IMP_DENS, gn) || IMP_SUB_DENS[g.sub] || .7;
  let meas = null, est = null, check = false;
  if (p.juiceOf) {
    if (p.zest) return { amt: impRound(qty * 2 * (g.u ? 1 / (+g.g || 1) : 1), !!g.u), est: `zest of ${impQtyText(qty)} ${p.juiceOf}${qty > 1 ? 's' : ''}`, check: true };
    meas = { k: 'vol', v: { lemon: 45, lime: 30, orange: 80 }[p.juiceOf] * qty * (p.size || 1) }; est = `juice of ${impQtyText(qty)} ${p.juiceOf}${qty > 1 ? 's' : ''}`;
  } else if (p.u && p.u.k !== 'count') meas = { k: p.u.k, v: qty * p.u.f };
  else if (p.paren) {
    meas = { k: p.paren.u.k, v: qty * p.paren.qty * p.paren.u.f }; est = `${impQtyText(qty, p.u)} × ${impQtyText(p.paren.qty, p.paren.u)}`;
    if ((/drained/.test(gn) || /bean|chickpea|lentil|artichoke|corn|pea\b/.test(gn)) && (!p.u || /can|jar/.test(p.u.l))) { meas.v *= .6; est += ', drained'; }
  }
  // per-item foods (eggs, tortillas, slices…)
  if (g.u) {
    if (!meas) { if (p.u && /can|jar|package|block|bunch|head|handful|scoop|serving/.test(p.u.l)) return null; return { amt: impRound(qty, true), est: null }; }
    const per = +g.g || 0; if (!per) return null; const grams = meas.k === 'mass' ? meas.v : meas.v * dens();
    return { amt: impRound(grams / per, true), est: est || impQtyText(qty, p.u || (p.paren && p.paren.u)) };
  }
  let v;
  if (meas) {
    v = g.ml ? meas.v : meas.k === 'mass' ? meas.v : meas.v * dens();
    if (!est && (g.ml ? meas.k === 'mass' : meas.k === 'vol')) est = impQtyText(qty, p.u);
  } else {
    const ul = p.u ? p.u.l : null; let each = null;
    if (g.ml && /juice/.test(gn)) each = impFind([[/lemon/, 45], [/lime/, 30], [/orange/, 80]], fd) || impFind([[/lemon/, 45], [/lime/, 30], [/orange/, 80]], gn);
    if (each == null && ul && IMP_UNIT_EACH[ul]) each = impFind(IMP_UNIT_EACH[ul], fd + ' ' + gn);
    if (each == null && (!ul || /whole|piece|serving/.test(ul))) each = impFind(IMP_EACH, fd) || impFind(IMP_EACH, gn);
    if (each == null) return null;
    v = qty * each * (p.size || 1);
    if (ul === 'can' && (/drained/.test(gn) || /bean|chickpea|lentil|artichoke|corn|pea\b/.test(gn))) v *= .6;
    est = `${impQtyText(qty, p.u)}${p.size !== 1 ? (p.size < 1 ? ' small' : ' large') : ''} × ~${fmt(each * (p.size || 1))} ${g.ml ? 'ml' : 'g'} each`;
  }
  // measured dry, but the database has it cooked (rice, quinoa, lentils…)
  const x = !g.ml && /\bcooked\b|\bcanned\b/.test(gn) ? impFind(IMP_DRY_COOKED, gn) : null;
  if (x && !/\bcooked\b|\bcanned\b|\bleftover\b/.test(fd + ' ' + impAscii(p.note || ''))) {
    const said = /\b(uncooked|dry|dried|raw)\b/.test(impAscii(p.src || '') + ' ' + fd);
    if (said || /rice|quinoa|couscous|farro|barley|bulgur|lentil|split pea/.test(gn)) {
      const dryG = meas && meas.k === 'vol' ? meas.v * (/rice/.test(gn) ? .78 : /lentil|pea/.test(gn) ? .8 : .75) : v;
      v = dryG * x; est = `${est || impQtyText(qty, p.u)} ${said ? 'dry' : 'uncooked (assumed)'} → ×${x} cooked`; check = !said;
    }
  }
  return { amt: impRound(v, false), est, check };
}
/* ---------- turning an ingredient into an editor row ---------- */
const IMP_NEGLIGIBLE = /^(water|cold water|warm water|hot water|boiling water|ice|ice cube|ice water|baking soda|baking powder|cream tartar|salt|black pepper|pepper|salt pepper|salt black pepper|cooking spray|nonstick spray|parchment|foil)$/;
function impRow(it) {
  const p = impParseLine(it.text);
  if (it.header || p.header) return { header: true };
  if (it.food) {                // Mealie already split it up
    p.food = it.food; if (it.qty != null) p.qty = +it.qty; if (it.unit) { const us = impAscii(it.unit).replace(/[^a-z. ]/g, '').trim(); p.u = impUnit(us, it.unit) || impUnit(us.split(' ')[0], it.unit) || p.u; if (p.u && p.u.k !== 'count') p.paren = null; }
    if (it.note && !p.note) p.note = it.note;
  }
  const foodKey = impTokens(p.food, true).join(' ');
  if (!foodKey) return { skip: 'no food in this line' };
  if (IMP_NEGLIGIBLE.test(foodKey) && (p.qty == null || p.toTaste || /water|ice|baking|tartar|spray|parchment|foil/.test(foodKey))) return { skip: 'no calories' };
  if (p.qty == null && !p.u && (p.toTaste || p.optional)) return { skip: p.optional ? 'optional' : 'to taste' };
  if (/^pepper$/.test(foodKey) && (!p.u || p.u.k === 'vol')) p.food = 'black pepper';
  const m = impMatch(p.food);
  let amt = '', est = null, st = m.st;
  if (m.id) { const a = impAmount(m.id, p); if (a && a.amt) { amt = a.amt; est = a.est; if (a.check && st === 'ok') st = 'check'; } else if (st !== 'none') st = 'amt'; }
  return { row: [m.id, amt, { src: it.text, st: m.id ? st : 'none', est, sugg: m.sugg, key: m.key, p, learned: !!m.learned }] };
}
function impGuessCat(rec) {
  const cats = impAscii((rec.categories || []).join(' ')); const all = cats + ' ' + impAscii((rec.keywords || []).join(' ')) + ' ' + impAscii(rec.name);
  if (/\bbreakfast|brunch\b/.test(cats)) return 'breakfast'; if (/\b(snack|dessert|appetizer|treat)s?\b/.test(cats)) return 'snack'; if (/\blunch\b/.test(cats)) return 'lunch'; if (/\b(dinner|main|entree|supper)/.test(cats)) return 'dinner';
  if ((/\b(breakfast|brunch|pancakes?|waffles?|oatmeal|overnight oats|omelett?e|frittata|french toast|granola|egg muffins?|breakfast burrito|scrambled eggs)\b/).test(all)) return 'breakfast';
  if ((/\b(snacks?|desserts?|energy bites?|protein balls?|bites|bars?|cookies?|brownies?|muffins?|dip|smoothie|shake|trail mix)\b/).test(all)) return 'snack';
  if (/\blunch\b/.test(all)) return 'lunch'; if (/\b(dinner|main dish|main course|entree|supper)\b/.test(all)) return 'dinner';
  return '';
}
function impGuessEmoji(name, cat) {
  const words = impTokens(name || ''); let best = null;
  FOOD_EMOJI.forEach(([, list]) => list.forEach(([em, n]) => { if (best) return; const ns = impTokens(n); if (ns.some(w => words.includes(w) && w.length > 2)) best = em; }));
  return best || { breakfast: '🍳', lunch: '🥗', dinner: '🍽️', snack: '🍎' }[cat] || '🍽️';
}
function impExisting(rec) { const u = rec.url || rec.mealieUrl; const n = impAscii(rec.name).trim(); return RECIPES.find(r => (u && (r.links || []).some(l => l.url === u || l.url === rec.mealieUrl)) || (n && impAscii(r.name).trim() === n)) || null; }
function importToEditor(rec, extra = {}) {
  const rows = [], skipped = [];
  (rec.ingredients || []).forEach(it => { const r = impRow(it); if (r.header) return; if (r.skip) skipped.push({ text: it.text, why: r.skip }); else rows.push(r.row); });
  const cat = impGuessCat(rec); const sv = rec.servings > 0 ? Math.round(rec.servings) : null;
  const links = []; if (rec.url) links.push({ title: rec.name || linkHost(rec.url), url: rec.url, site: rec.site || linkHost(rec.url) }); if (rec.mealieUrl) links.push({ title: 'Mealie', url: rec.mealieUrl, site: 'Mealie' });
  const dup = impExisting(rec);
  RE = { id: null, base: false, name: rec.name || '', emoji: impGuessEmoji(rec.name, cat), cat, yield: sv && sv <= 12 ? sv : '', storage: 'fridge', time: rec.minutes || 20, tags: '', fixed: false, rotate: true,
    ing: rows, steps: (rec.steps || []).join('\n'), links,
    imp: { from: rec.source, site: rec.source === 'mealie' ? 'Mealie' : (rec.site || linkHost(rec.url)), nut: rec.nutrition || null, bigYield: sv > 12 ? sv : null, yieldText: rec.yieldText || '', skipped, noIng: !rows.length, error: extra.error || '', dup: dup ? dup.name : '', q: IMPQ && IMPQ.list.length > 1 ? { i: IMPQ.i + 1, n: IMPQ.list.length } : null, paste: !rows.length } };
  renderRecipeEditor();
}

/* ---------- review UI inside the recipe editor ---------- */
const IMP_ST = { none: ['Needs a food', 'imp-none'], amt: ['Needs an amount', 'imp-amt'], check: ['Check', 'imp-check'], ok: ['Matched', 'imp-ok'] };
function impRowState(r) { const m = r[2]; if (!m) return null; if (!ING[r[0]]) return 'none'; if (!(+r[1] > 0)) return 'amt'; return m.st === 'check' ? 'check' : 'ok'; }
function impSrcHTML(r, i) {
  const m = r[2]; if (!m) return ''; const st = impRowState(r); const [lbl, cls] = IMP_ST[st];
  return `<div class="re-src ${cls}" data-src="${i}"><span class="pill">${st === 'ok' ? icon('check') : ''}${lbl}</span><span class="re-src-t">“${esc(m.src)}”${m.est ? ` <span class="muted">· ≈ ${esc(m.est)}</span>` : ''}${m.learned ? ' <span class="muted">· matched like last time</span>' : ''}</span>${st === 'check' ? `<button type="button" class="btn sm ghost" data-act="re-imp-ok" data-i="${i}">${icon('check')}Looks right</button>` : ''}</div>`;
}
function impNeeds() {
  const e = RE; if (!e || !e.imp) return [];
  const out = []; const nf = e.ing.filter(r => r[2] && impRowState(r) === 'none').length; const na = e.ing.filter(r => r[2] && impRowState(r) === 'amt').length;
  if (!e.cat) out.push('Choose which meal this is');
  if (!(+e.yield >= 1)) out.push(e.imp.bigYield ? `Enter the servings — the source says it makes ${e.imp.bigYield}; recipes here go up to 12` : `Enter how many servings it makes${e.imp.yieldText ? ` (the source says “${e.imp.yieldText}”)` : ''}`);
  else if (+e.yield > 12) out.push('Recipes can make up to 12 servings');
  if (!e.ing.length) out.push('Add the ingredients');
  if (nf) out.push(`Pick a food for ${nf} ingredient${nf > 1 ? 's' : ''} (or remove the line)`);
  if (na) out.push(`Enter the amount for ${na} ingredient${na > 1 ? 's' : ''}`);
  return out;
}
function impBannerHTML() {
  const e = RE; if (!e || !e.imp) return ''; const im = e.imp; const needs = impNeeds(); const nc = e.ing.filter(r => r[2] && impRowState(r) === 'check').length;
  return `<div class="imp-banner ${needs.length ? 'need' : 'ready'}" id="re-imp-banner">
    <div class="row wrap" style="gap:8px"><b>${icon('download')}Imported from ${esc(im.site || 'the web')}</b>${im.q ? `<span class="pill">Recipe ${im.q.i} of ${im.q.n}</span>` : ''}${im.dup ? `<span class="pill warn-pill" title="You already have a recipe with this name or link">Already have “${esc(im.dup)}”</span>` : ''}</div>
    ${im.error ? `<div class="small" style="margin-top:6px">${esc(im.error)}</div>` : ''}
    ${needs.length ? `<div class="small" style="margin-top:6px">Fill in the highlighted items before saving:</div><ul class="imp-needs">${needs.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`
      : `<div class="small" style="margin-top:6px">${icon('check')} Everything was filled in.${nc ? ` ${nc} food match${nc > 1 ? 'es are' : ' is'} marked <b>Check</b> — make sure ${nc > 1 ? 'they’re' : 'it’s'} right.` : ''} Review the amounts, then save.</div>`}
    ${im.skipped.length ? `<div class="imp-skipped tiny"><span class="muted">Left out:</span> ${im.skipped.map((s, i) => `<span class="imp-sk">${esc(s.text)} <button type="button" class="linkish" data-act="re-imp-add" data-i="${i}" title="Add this line as an ingredient">Add</button></span>`).join('')}</div>` : ''}
    ${im.paste ? `<div class="imp-paste"><label class="small"><b>Paste the ingredients</b>, one per line</label><textarea class="inp" id="re-imp-paste" rows="5" placeholder="2 lb chicken breast&#10;1 cup rice&#10;2 tbsp olive oil"></textarea><div class="row" style="margin-top:6px"><button type="button" class="btn sm primary" data-act="re-imp-paste">Add ingredients</button></div></div>`
      : `<button type="button" class="linkish tiny" data-act="re-imp-paste-show" style="margin-top:6px">Paste more ingredients</button>`}
  </div>`;
}
function impRefresh() {
  if (!RE || !RE.imp) return;
  const b = $('#re-imp-banner'); if (b) { const keep = $('#re-imp-paste') ? $('#re-imp-paste').value : null; b.outerHTML = impBannerHTML(); if (keep != null && $('#re-imp-paste')) $('#re-imp-paste').value = keep; }
  RE.ing.forEach((r, i) => { const el = $(`#modal [data-src="${i}"]`); if (el) el.outerHTML = impSrcHTML(r, i); const row = $(`#modal .re-row[data-row="${i}"]`); if (row) { row.classList.remove('imp-none', 'imp-amt', 'imp-check', 'imp-ok'); const st = impRowState(r); if (st) row.classList.add(IMP_ST[st][1]); } });
  const cf = $('#modal [data-re="cat"]'); if (cf) cf.closest('.field').classList.toggle('imp-need', !RE.cat);
  const yf = $('#modal [data-re="yield"]'); if (yf) yf.closest('.field').classList.toggle('imp-need', !(+RE.yield >= 1) || +RE.yield > 12);
}
function impFoodChanged(i) {
  const r = RE.ing[i]; const m = r[2]; if (!m) return;
  m.st = 'ok'; m.learned = false;
  if (!m.userAmt && m.p) { const a = impAmount(r[0], m.p); if (a && a.amt) { r[1] = a.amt; m.est = a.est; } else { r[1] = ''; m.est = null; } }
}
function impAddLines(lines) {
  let n = 0; lines.forEach(t => { t = String(t).trim(); if (!t) return; const r = impRow({ text: t }); if (r.row) { RE.ing.push(r.row); n++; } else if (r.skip && RE.imp) RE.imp.skipped.push({ text: t, why: r.skip }); });
  return n;
}
function impValidate() {
  const needs = impNeeds(); if (!needs.length) return true;
  impRefresh(); toast(needs[0]);
  const first = $('#modal .imp-need, #modal .re-row.imp-none, #modal .re-row.imp-amt'); if (first) { first.scrollIntoView({ block: 'center', behavior: 'smooth' }); const f = first.querySelector('select, input'); if (f) setTimeout(() => f.focus(), 250); }
  return false;
}
function impRemember() {
  if (!RE || !RE.imp) return; S.importMap = S.importMap || {};
  RE.ing.forEach(([id, , m]) => { if (m && m.key && ING[id]) { delete S.importMap[m.key]; S.importMap[m.key] = id; } });
  const keys = Object.keys(S.importMap); if (keys.length > 500) keys.slice(0, keys.length - 500).forEach(k => delete S.importMap[k]);
}

/* ---------- the import dialog ---------- */
let INTEG = null;                        // { mealie: {...} } from the server
let IMPQ = null;                         // queue of Mealie recipes being reviewed one after another
const IMPUI = { tab: 'url', url: '', q: '', items: [], page: 1, pages: 1, total: 0, sel: {}, busy: false, err: '', loaded: false };
async function loadInteg(force) { if (INTEG && !force) return INTEG; try { INTEG = await api('GET', '/api/integrations'); } catch (e) { INTEG = { mealie: { configured: false, canEdit: isAdmin() }, error: e.message }; } return INTEG; }
function importModal(tab) {
  if (AUTH.mode !== 'server') { toast('Importing recipes needs the FORGE 90 server.'); return; }
  if (tab) IMPUI.tab = tab; IMPUI.err = '';
  renderImportModal(); loadInteg(true).then(() => { if (!$('#modal .imp-modal')) return; renderImportModal(); if (IMPUI.tab === 'mealie' && INTEG.mealie.configured && !IMPUI.loaded) impSearch(); });
}
function renderImportModal() {
  const t = IMPUI.tab; const mc = INTEG && INTEG.mealie;
  const body = t === 'url' ? `<form class="imp-url" data-form="imp-url"><label class="small" for="imp-url-in">Recipe page link</label>
      <div class="row" style="gap:8px"><input class="inp" id="imp-url-in" type="url" inputmode="url" placeholder="https://…" value="${esc(IMPUI.url)}" autocomplete="off" style="flex:1" required><button class="btn primary" type="submit" ${IMPUI.busy ? 'disabled' : ''}>${IMPUI.busy ? 'Importing…' : 'Import'}</button></div></form>
      <div class="tiny muted" style="margin-top:8px">Works with most recipe sites (anything that publishes standard recipe data). You’ll review the recipe before it’s saved, and anything the page doesn’t say — like which foods to use — is highlighted for you to fill in.</div>`
    : !mc ? `<div class="muted small">Checking the Mealie connection…</div>`
    : !mc.configured ? `<div class="note">${icon('info')}<span>Mealie isn’t connected. ${mc.canEdit ? `Connect it in <a href="#/settings" data-act="close-modal">Settings → API connections</a>.` : 'Ask an administrator to connect it in Settings.'}</span></div>`
    : `<div class="row" style="gap:8px"><input class="inp" type="search" id="imp-q" placeholder="Search your Mealie recipes…" value="${esc(IMPUI.q)}" data-input="imp-q" autocomplete="off" style="flex:1"></div>
      <div class="imp-list" id="imp-list">${impListHTML()}</div>
      <div class="row" style="justify-content:space-between;margin-top:10px;gap:8px;flex-wrap:wrap"><span class="tiny muted" id="imp-count">${impCountText()}</span>
        <button class="btn primary" data-act="imp-mealie-go" id="imp-go" ${Object.keys(IMPUI.sel).length && !IMPUI.busy ? '' : 'disabled'}>${impGoLabel()}</button></div>`;
  modal(`<div class="imp-modal"><div class="row"><h2 style="flex:1">Import a recipe</h2><button class="btn icon ghost" data-act="close-modal">${icon('x')}</button></div>
    <div class="seg" style="margin:12px 0 14px">${[['url', 'Web link'], ['mealie', 'Mealie']].map(([k, l]) => `<button class="${t === k ? 'on' : ''}" data-act="imp-tab" data-v="${k}">${l}</button>`).join('')}</div>
    ${IMPUI.err ? `<div class="note warn" style="margin-bottom:10px">${icon('info')}<span>${esc(IMPUI.err)}</span></div>` : ''}${body}</div>`);
  const f = $(t === 'url' ? '#imp-url-in' : '#imp-q'); if (f && !IMPUI.busy) { f.focus(); if (f.value) f.setSelectionRange(f.value.length, f.value.length); }
}
const impGoLabel = () => { const n = Object.keys(IMPUI.sel).length; return IMPUI.busy ? 'Importing…' : n ? `Import ${n} recipe${n > 1 ? 's' : ''}` : 'Import'; };
const impCountText = () => IMPUI.total ? `${IMPUI.total} recipe${IMPUI.total === 1 ? '' : 's'} in Mealie${IMPUI.q ? ' match' : ''} · ${Object.keys(IMPUI.sel).length} selected` : '';
function impListHTML() {
  if (!IMPUI.loaded) return `<div class="muted small" style="padding:12px">Loading recipes…</div>`;
  if (!IMPUI.items.length) return `<div class="muted small" style="padding:12px">${IMPUI.q ? 'No recipes match.' : 'No recipes in Mealie yet.'}</div>`;
  return IMPUI.items.map(r => { const on = !!IMPUI.sel[r.slug]; const have = RECIPES.find(x => impAscii(x.name).trim() === impAscii(r.name).trim());
    return `<label class="imp-item ${on ? 'on' : ''}"><input type="checkbox" data-input="imp-sel" value="${esc(r.slug)}" ${on ? 'checked' : ''}><span class="imp-it"><span class="imp-nm"><b>${esc(r.name)}</b>${have ? '<span class="pill">Already in your recipes</span>' : ''}</span><small>${esc([r.yield, r.minutes ? r.minutes + ' min' : '', r.description].filter(Boolean).join(' · '))}</small></span></label>`; }).join('')
    + (IMPUI.page < IMPUI.pages ? `<button class="btn sm ghost" data-act="imp-more" style="margin:8px auto;display:flex">Load more</button>` : '');
}
async function impSearch(more) {
  const q = IMPUI.q; const page = more ? IMPUI.page + 1 : 1;
  try {
    const r = await api('GET', `/api/import/mealie/recipes?q=${encodeURIComponent(q)}&page=${page}`);
    if (q !== IMPUI.q) return;
    IMPUI.items = more ? IMPUI.items.concat(r.items) : r.items; IMPUI.page = r.page; IMPUI.pages = r.pages; IMPUI.total = r.total; IMPUI.loaded = true; IMPUI.err = '';
  } catch (e) { IMPUI.err = e.message; IMPUI.loaded = true; IMPUI.items = more ? IMPUI.items : []; if ($('#modal .imp-modal')) renderImportModal(); return; }
  const l = $('#imp-list'); if (l) l.innerHTML = impListHTML(); const c = $('#imp-count'); if (c) c.textContent = impCountText();
}
async function impFromUrl() {
  const inp = $('#imp-url-in'); const url = (inp ? inp.value : IMPUI.url).trim(); IMPUI.url = url; if (!url) return;
  IMPUI.busy = true; IMPUI.err = ''; renderImportModal();
  try { const r = await api('POST', '/api/import/url', { url }); IMPUI.busy = false; IMPQ = null; IMPUI.url = ''; importToEditor(r.recipe); }
  catch (e) {
    IMPUI.busy = false;
    if (e.status === 422 && e.data && e.data.partial) { const p = e.data.partial; IMPQ = null;
      importToEditor({ source: 'web', name: p.name || '', url: p.url || url, site: p.site || linkHost(url), servings: p.servings || null, steps: p.steps || [], ingredients: [] }, { error: e.message + ' Paste the ingredient list below and the rest is worked out for you.' }); return; }
    IMPUI.err = e.message; if ($('#modal .imp-modal')) renderImportModal();
  }
}
async function impNext() {
  if (!IMPQ) return;
  IMPQ.i++;
  if (IMPQ.i >= IMPQ.list.length) { const d = IMPQ.done, n = IMPQ.list.length; IMPQ = null; closeModal(); render(); toast(`Imported ${d} of ${n} recipe${n > 1 ? 's' : ''} from Mealie`); return; }
  const slug = IMPQ.list[IMPQ.i];
  modal(`<div class="imp-loading"><h2>Importing from Mealie</h2><p class="sub small">Recipe ${IMPQ.i + 1} of ${IMPQ.list.length}…</p></div>`, 'sm');
  try { const r = await api('GET', '/api/import/mealie/recipes/' + encodeURIComponent(slug)); if (!IMPQ) return; importToEditor(r.recipe); }
  catch (e) { toast(`Couldn’t import “${(IMPUI.items.find(x => x.slug === slug) || {}).name || slug}”: ${e.message}`); impNext(); }
}
function impStartQueue() {
  const list = IMPUI.items.filter(r => IMPUI.sel[r.slug]).map(r => r.slug); Object.keys(IMPUI.sel).forEach(s => { if (!list.includes(s)) list.push(s); });
  if (!list.length) return; IMPQ = { list, i: -1, done: 0 }; IMPUI.sel = {}; impNext();
}

/* ---------- Settings → API connections ---------- */
function apiCardHTML() {
  if (AUTH.mode !== 'server') return '';
  return `<div style="height:16px"></div><div class="card" id="api-card"><div class="card-h"><h2>API connections</h2></div><div id="api-body"><div class="muted small">Loading…</div></div></div>`;
}
function apiBodyHTML() {
  const m = (INTEG && INTEG.mealie) || {}; const on = m.configured;
  const status = on ? `<span class="pill acc">${icon('check')}Connected</span>` : `<span class="pill">Not connected</span>`;
  const detail = on ? `<div class="tiny muted" style="margin-top:6px">${esc(m.url)}${m.user ? ` · signed in as ${esc(m.user)}` : ''}${m.version ? ` · Mealie ${esc(m.version)}` : ''}${m.checkedAt ? ` · checked ${ago(m.checkedAt)}` : ''}</div>` : '';
  const head = `<div class="row wrap" style="gap:8px"><b>Mealie</b>${status}</div><div class="small sub" style="margin-top:4px">Import recipes from a Mealie server on the Foods &amp; recipes page. Everyone on this server can import from it.</div>${detail}`;
  if (!m.canEdit) return head + `<div class="tiny muted" style="margin-top:10px">${on ? 'Managed by an administrator.' : 'An administrator can connect Mealie here.'}</div>`;
  return head + `<form data-form="mealie" class="grid g2" style="gap:12px;margin-top:12px" autocomplete="off">
      <div class="field"><label>Mealie address</label><input class="inp" name="url" value="${esc(m.url || '')}" placeholder="http://192.168.1.10:9925" inputmode="url" required><span class="tiny muted">The address you open Mealie at.</span></div>
      <div class="field"><label>API token</label><input class="inp" name="token" type="password" autocomplete="new-password" placeholder="${m.tokenSet ? 'Saved — leave blank to keep it' : 'Paste a token'}" ${m.tokenSet ? '' : 'required'}><span class="tiny muted">In Mealie: your profile → API Tokens → create one.</span></div>
      <div class="row wrap" style="grid-column:1/-1;gap:8px"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="mealie-test">Test connection</button>${on ? `<button class="btn ghost danger" type="button" data-act="mealie-off" style="margin-left:auto">Disconnect</button>` : ''}</div>
      <div id="mealie-msg" class="small" style="grid-column:1/-1"></div></form>`;
}
async function settingsAfter() { if (AUTH.mode !== 'server') return; await loadInteg(true); const b = $('#api-body'); if (b) b.innerHTML = apiBodyHTML(); }
function mealieMsg(ok, text) { const el = $('#mealie-msg'); if (el) el.innerHTML = `<div class="note ${ok ? 'acc' : 'warn'}">${icon(ok ? 'check' : 'info')}<span>${esc(text)}</span></div>`; }
function mealieFormData() { const f = $('form[data-form="mealie"]'); return f ? { url: f.elements.url.value.trim(), token: f.elements.token.value.trim() } : {}; }

Object.assign(ACT, {
  'imp-open': el => importModal(el.dataset.v),
  'imp-tab': el => { IMPUI.tab = el.dataset.v; IMPUI.err = ''; renderImportModal(); if (IMPUI.tab === 'mealie' && INTEG && INTEG.mealie.configured && !IMPUI.loaded) impSearch(); },
  'imp-more': () => impSearch(true),
  'imp-mealie-go': () => impStartQueue(),
  're-imp-ok': el => { const r = RE && RE.ing[+el.dataset.i]; if (r && r[2]) { r[2].st = 'ok'; impRefresh(); } },
  're-imp-add': el => { if (!RE || !RE.imp) return; const s = RE.imp.skipped.splice(+el.dataset.i, 1)[0]; if (!s) return; const r = impRow({ text: s.text }); const row = r.row || ['', '', { src: s.text, st: 'none', est: null, sugg: [], key: impKey(impParseLine(s.text).food), p: impParseLine(s.text) }];
    if (!row[0] && row[2]) row[2].st = 'none'; RE.ing.push(row); renderRecipeEditor(); },
  're-imp-paste-show': () => { if (!RE || !RE.imp) return; RE.imp.paste = true; impRefresh(); const t = $('#re-imp-paste'); if (t) t.focus(); },
  're-imp-paste': () => { const t = $('#re-imp-paste'); if (!t || !RE) return; const n = impAddLines(t.value.split(/\n+/)); if (!n) { toast('No ingredients found in that text'); return; } RE.imp.paste = false; RE.imp.noIng = false; RE.imp.error = ''; renderRecipeEditor(); toast(`Added ${n} ingredient${n > 1 ? 's' : ''}`); },
  're-skip': () => { if (IMPQ) impNext(); else closeModal(); },
  'mealie-test': async el => { el.disabled = true; mealieMsg(true, 'Testing…'); try { const r = await api('POST', '/api/integrations/mealie/test', mealieFormData()); mealieMsg(true, `Connected${r.user ? ' as ' + r.user : ''}${r.version ? ' · Mealie ' + r.version : ''}. Save to use it.`); } catch (e) { mealieMsg(false, e.message); } el.disabled = false; },
  'mealie-off': () => confirmBox('Disconnect Mealie?', 'Nobody on this server will be able to import from Mealie until it’s connected again. Recipes already imported stay.', 'Disconnect', async () => { try { INTEG = { mealie: (await api('DELETE', '/api/integrations/mealie')).mealie }; IMPUI.loaded = false; IMPUI.items = []; render(); toast('Mealie disconnected'); } catch (e) { toast(e.message); } }, true)
});
document.addEventListener('submit', async e => {
  const f = e.target; if (!f.dataset) return;
  if (f.dataset.form === 'imp-url') { e.preventDefault(); impFromUrl(); }
  if (f.dataset.form === 'mealie') { e.preventDefault(); const b = f.querySelector('button[type="submit"]'); b.disabled = true; mealieMsg(true, 'Checking the connection…');
    try { INTEG = { mealie: (await api('PUT', '/api/integrations/mealie', mealieFormData())).mealie }; IMPUI.loaded = false; IMPUI.items = []; const body = $('#api-body'); if (body) body.innerHTML = apiBodyHTML(); mealieMsg(true, 'Saved. Mealie is connected.'); toast('Mealie connected'); }
    catch (err) { mealieMsg(false, err.message); b.disabled = false; } }
});
let _impQT = null;
document.addEventListener('input', e => {
  const t = e.target; if (!t.dataset) return;
  if (t.dataset.input === 'imp-q') { IMPUI.q = t.value.trim(); clearTimeout(_impQT); _impQT = setTimeout(() => impSearch(), 300); }
});
document.addEventListener('change', e => {
  const t = e.target; if (!t.dataset || t.dataset.input !== 'imp-sel') return;
  if (t.checked) IMPUI.sel[t.value] = 1; else delete IMPUI.sel[t.value];
  const l = t.closest('.imp-item'); if (l) l.classList.toggle('on', t.checked);
  const g = $('#imp-go'); if (g) { g.disabled = !Object.keys(IMPUI.sel).length; g.textContent = impGoLabel(); } const c = $('#imp-count'); if (c) c.textContent = impCountText();
});
