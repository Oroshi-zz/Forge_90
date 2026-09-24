// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
'use strict';
const { fetchUrl, ImportErr } = require('./recipe-import');

const OFF_BASE = () => String(process.env.OFF_URL || 'https://world.openfoodfacts.org').replace(/\/+$/, '');
/* Name search moved off the main site. The Perl endpoint behind /cgi/search.pl was retired and
   now answers 503 for everyone, while barcode lookups on /api/v2/product still work, which is
   why scanning kept working and searching did not. Search-a-licious replaces it.
   Overridable so a self-hoster can point at their own instance. */
const OFF_SEARCH = () => String(process.env.OFF_SEARCH_URL || 'https://search.openfoodfacts.org').replace(/\/+$/, '');
const UA = 'FORGE90/1.0 (self-hosted meal planner; +https://github.com/Oroshi-zz/Forge_90)';

function gtinValid(code) {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
  const d = code.split('').map(Number); const check = d.pop();
  const sum = d.reverse().reduce((a, n, i) => a + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}
function normGtin(code) {
  code = String(code || '').replace(/\D/g, '');
  if (code.length === 12) code = '0' + code;
  if (code.length === 14 && code.startsWith('0')) code = code.slice(1);
  return gtinValid(code) ? code : null;
}
const num = v => { const n = typeof v === 'number' ? v : parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : null; };
const txt = (s, max = 120) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max);

async function offLookup(code) {
  const fields = 'code,product_name,product_name_en,generic_name,brands,quantity,product_quantity,product_quantity_unit,serving_size,serving_quantity,serving_quantity_unit,nutriments,nutrition_data_per,categories_tags,image_front_small_url';
  let r;
  try { r = await fetchUrl(`${OFF_BASE()}/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`, { timeout: 9000, maxBytes: 2 * 1024 * 1024, headers: { Accept: 'application/json', 'User-Agent': UA } }); }
  catch (e) { throw new ImportErr(502, 'Couldn’t reach Open Food Facts right now. You can enter the product yourself.'); }
  if (r.status === 404) return null;
  if (r.status >= 400) throw new ImportErr(502, `Open Food Facts returned an error (HTTP ${r.status}). You can enter the product yourself.`);
  let j; try { j = JSON.parse(r.body); } catch (e) { throw new ImportErr(502, 'Open Food Facts sent an unreadable answer. You can enter the product yourself.'); }
  if (!j || j.status === 0 || !j.product) return null;
  const p = j.product; const n = p.nutriments || {};
  let k = num(n['energy-kcal_100g']); if (k == null && num(n.energy_100g) != null) k = num(n.energy_100g) / 4.184;
  const per100 = { k, p: num(n.proteins_100g), c: num(n.carbohydrates_100g), f: num(n.fat_100g) };
  const unit = /ml|cl|l\b/i.test(String(p.product_quantity_unit || '')) || /\b\d+(\.\d+)?\s?(ml|cl|l)\b/i.test(String(p.quantity || '')) ? 'ml' : 'g';
  return {
    gtin: code, name: txt(p.product_name_en || p.product_name || p.generic_name, 100), brand: txt(String(p.brands || '').split(',')[0], 60),
    quantity: txt(p.quantity, 40), pk: num(p.product_quantity), unit,
    srv: num(p.serving_quantity), srvText: txt(p.serving_size, 40), per100: Object.values(per100).some(v => v != null) ? per100 : null,
    categories: (Array.isArray(p.categories_tags) ? p.categories_tags : []).slice(-8).map(c => txt(String(c).replace(/^[a-z]{2}:/, ''), 40)),
    image: /^https:\/\//.test(p.image_front_small_url || '') ? String(p.image_front_small_url).slice(0, 300) : ''
  };
}

/* Search Open Food Facts by name. A barcode is no use for loose produce, for anything already
   out of its packaging, or when the camera will not read the label, so the same catalog is
   reachable by typing. Only products with usable per-100 nutrition come back: a hit you cannot
   turn into a food is worse than no hit. */
/* The barcode endpoint returns brands as a comma-joined string; the search index returns an
   array, and language-keyed fields can arrive as an object. This takes the first sensible
   value from any of those without caring which shape it got. */
function firstOf(v) {
  if (v == null) return '';
  if (Array.isArray(v)) return v.length ? String(v[0]) : '';
  if (typeof v === 'object') { const k = v.en || v.main || Object.values(v)[0]; return k == null ? '' : String(k); }
  return String(v).split(',')[0];
}
function offRow(p) {
  if (!p || !p.code) return null;
  const name = txt(firstOf(p.product_name_en) || firstOf(p.product_name) || firstOf(p.generic_name), 100); if (!name) return null;
  const code = normGtin(p.code); if (!code) return null;
  const n = p.nutriments || {};
  let k = num(n['energy-kcal_100g']); if (k == null && num(n.energy_100g) != null) k = num(n.energy_100g) / 4.184;
  const per100 = { k, p: num(n.proteins_100g), c: num(n.carbohydrates_100g), f: num(n.fat_100g) };
  if (per100.k == null || per100.p == null || per100.c == null || per100.f == null) return null;
  const unit = /ml|cl|l\b/i.test(String(p.product_quantity_unit || '')) || /\b\d+(\.\d+)?\s?(ml|cl|l)\b/i.test(String(p.quantity || '')) ? 'ml' : 'g';
  return {
    gtin: code, name, brand: txt(firstOf(p.brands), 60), quantity: txt(p.quantity, 40),
    pk: num(p.product_quantity), unit, srv: num(p.serving_quantity), srvText: txt(p.serving_size, 40), per100,
    categories: (Array.isArray(p.categories_tags) ? p.categories_tags : []).slice(-8).map(c => txt(String(c).replace(/^[a-z]{2}:/, ''), 40)),
    image: /^https:\/\//.test(p.image_front_small_url || '') ? String(p.image_front_small_url).slice(0, 300) : ''
  };
}
/* Search-a-licious answers POST /search with a JSON body. Its own OpenAPI schema types the 200
   response as an opaque string, so the envelope is read defensively: the products have been
   seen under hits, results and products, and may or may not arrive wrapped in Elasticsearch's
   _source. Whatever the wrapper, the documents inside are ordinary Open Food Facts records, so
   offRow maps them unchanged.
   No `fields` list is sent. Naming a field the index does not hold risks a 422 on an API that
   cannot be exercised from here, and offRow already tolerates anything missing. */
function offRows(j) {
  const pick = j && (Array.isArray(j) ? j
    : Array.isArray(j.hits) ? j.hits
    : Array.isArray(j.results) ? j.results
    : Array.isArray(j.products) ? j.products
    : (j.hits && Array.isArray(j.hits.hits)) ? j.hits.hits
    : null);
  if (!pick) return null;
  return pick.map(x => (x && typeof x === 'object' && x._source && typeof x._source === 'object') ? x._source : x);
}
/* Search-a-licious documents are very large: one product carries an ecoscore block with a
   per-country transportation map, twice over. Twenty-four of those blow past any sane size cap,
   so a field list is essential rather than optional. If the index rejects the list the request
   is retried once without it at a smaller page size, so an unknown field name degrades into a
   slower search rather than a broken one. */
const SEARCH_FIELDS = ['code', 'product_name', 'product_name_en', 'generic_name', 'brands', 'quantity',
  'product_quantity', 'product_quantity_unit', 'serving_size', 'serving_quantity', 'nutriments',
  'categories_tags', 'image_front_small_url'];

async function offPost(body) {
  return fetchUrl(`${OFF_SEARCH()}/search`, { method: 'POST', body, timeout: 12000,
    maxBytes: 8 * 1024 * 1024, headers: { Accept: 'application/json', 'User-Agent': UA } });
}
async function offSearch(q, page) {
  const term = String(q || '').trim().slice(0, 80);
  if (term.length < 2) return [];
  const pg = Math.max(1, Math.min(5, +page || 1));
  let r;
  try { r = await offPost({ q: term, langs: ['en'], page_size: 24, page: pg, fields: SEARCH_FIELDS }); }
  catch (e) { throw new ImportErr(502, 'Couldn\u2019t reach Open Food Facts right now. You can enter the food yourself.'); }
  if (r.status === 422 || r.status === 400) {
    try { r = await offPost({ q: term, langs: ['en'], page_size: 10, page: pg }); }
    catch (e) { throw new ImportErr(502, 'Couldn\u2019t reach Open Food Facts right now. You can enter the food yourself.'); }
  }
  if (r.status >= 400) throw new ImportErr(502, `Open Food Facts search returned an error (HTTP ${r.status}). You can enter the food yourself.`);
  let j; try { j = JSON.parse(r.body); } catch (e) { throw new ImportErr(502, 'Open Food Facts sent an unreadable answer. You can enter the food yourself.'); }
  const list = offRows(j);
  if (!list) throw new ImportErr(502, `Open Food Facts answered in a shape this version does not know (keys: ${Object.keys(j || {}).slice(0, 6).join(', ') || 'none'}). You can enter the food yourself.`);
  const seen = new Set(); const out = [];
  list.forEach(p => { const row = offRow(p); if (!row || seen.has(row.gtin)) return; seen.add(row.gtin); out.push(row); });
  return out;
}

module.exports = { gtinValid, normGtin, offLookup, offSearch, offRows };
