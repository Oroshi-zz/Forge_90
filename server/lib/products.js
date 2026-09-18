// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
'use strict';
const { fetchUrl, ImportErr } = require('./recipe-import');

const OFF_BASE = () => String(process.env.OFF_URL || 'https://world.openfoodfacts.org').replace(/\/+$/, '');
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
const SEARCH_FIELDS = 'code,product_name,product_name_en,generic_name,brands,quantity,product_quantity,product_quantity_unit,serving_size,serving_quantity,nutriments,categories_tags,image_front_small_url';
function offRow(p) {
  if (!p || !p.code) return null;
  const name = txt(p.product_name_en || p.product_name || p.generic_name, 100); if (!name) return null;
  const code = normGtin(p.code); if (!code) return null;
  const n = p.nutriments || {};
  let k = num(n['energy-kcal_100g']); if (k == null && num(n.energy_100g) != null) k = num(n.energy_100g) / 4.184;
  const per100 = { k, p: num(n.proteins_100g), c: num(n.carbohydrates_100g), f: num(n.fat_100g) };
  if (per100.k == null || per100.p == null || per100.c == null || per100.f == null) return null;
  const unit = /ml|cl|l\b/i.test(String(p.product_quantity_unit || '')) || /\b\d+(\.\d+)?\s?(ml|cl|l)\b/i.test(String(p.quantity || '')) ? 'ml' : 'g';
  return {
    gtin: code, name, brand: txt(String(p.brands || '').split(',')[0], 60), quantity: txt(p.quantity, 40),
    pk: num(p.product_quantity), unit, srv: num(p.serving_quantity), srvText: txt(p.serving_size, 40), per100,
    categories: (Array.isArray(p.categories_tags) ? p.categories_tags : []).slice(-8).map(c => txt(String(c).replace(/^[a-z]{2}:/, ''), 40)),
    image: /^https:\/\//.test(p.image_front_small_url || '') ? String(p.image_front_small_url).slice(0, 300) : ''
  };
}
async function offSearch(q, page) {
  const term = String(q || '').trim().slice(0, 80);
  if (term.length < 2) return [];
  const url = `${OFF_BASE()}/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1`
    + `&page_size=24&page=${Math.max(1, Math.min(5, +page || 1))}&fields=${SEARCH_FIELDS}`;
  let r;
  try { r = await fetchUrl(url, { timeout: 12000, maxBytes: 4 * 1024 * 1024, headers: { Accept: 'application/json', 'User-Agent': UA } }); }
  catch (e) { throw new ImportErr(502, 'Couldn’t reach Open Food Facts right now. You can enter the food yourself.'); }
  if (r.status >= 400) throw new ImportErr(502, `Open Food Facts returned an error (HTTP ${r.status}). You can enter the food yourself.`);
  let j; try { j = JSON.parse(r.body); } catch (e) { throw new ImportErr(502, 'Open Food Facts sent an unreadable answer. You can enter the food yourself.'); }
  const list = Array.isArray(j && j.products) ? j.products : [];
  const seen = new Set(); const out = [];
  list.forEach(p => { const row = offRow(p); if (!row || seen.has(row.gtin)) return; seen.add(row.gtin); out.push(row); });
  return out;
}

module.exports = { gtinValid, normGtin, offLookup, offSearch };
