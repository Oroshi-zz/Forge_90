// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
'use strict';
/* ============================================================
   FORGE 90 — recipe import: reads a recipe from a web page (schema.org JSON-LD or
   microdata) or from a Mealie server, and returns it in one plain shape. Matching
   ingredients to the food database happens in the browser, where the foods live.
   Link imports only reach public addresses, so a signed-in user can't use the server
   to probe the local network. The Mealie address is set by an administrator.
   ============================================================ */
const http = require('http');
const https = require('https');
const dns = require('dns');
const net = require('net');
const zlib = require('zlib');

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 FORGE90-recipe-import';
const PRIVATE = new net.BlockList();
['0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '127.0.0.0/8', '169.254.0.0/16', '172.16.0.0/12', '192.0.0.0/24', '192.168.0.0/16', '198.18.0.0/15', '224.0.0.0/3']
  .forEach(c => { const [a, p] = c.split('/'); PRIVATE.addSubnet(a, +p, 'ipv4'); });
['::/127', 'fc00::/7', 'fe80::/10', 'ff00::/8', '64:ff9b::/96', '2001:db8::/32']
  .forEach(c => { const [a, p] = c.split('/'); PRIVATE.addSubnet(a, +p, 'ipv6'); });
function isPrivateIp(ip) {
  ip = String(ip || '').replace(/^\[|\]$/g, '');
  const m = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i); if (m) ip = m[1];
  const f = net.isIP(ip); if (!f) return true;
  return PRIVATE.check(ip, f === 6 ? 'ipv6' : 'ipv4');
}
const allowPrivateEnv = () => /^(1|true|yes|on)$/i.test(process.env.IMPORT_ALLOW_PRIVATE || '');

class ImportErr extends Error { constructor(code, msg, extra) { super(msg); this.code = code; this.extra = extra; } }

/* ---------- a small, careful HTTP client ---------- */
function lookupFor(allowPrivate) {
  return (host, opts, cb) => {
    if (typeof opts === 'function') { cb = opts; opts = {}; }
    dns.lookup(host, { all: true }, (e, addrs) => {
      if (e) return cb(e);
      const ok = (addrs || []).filter(a => allowPrivate || !isPrivateIp(a.address));
      if (!ok.length) return cb(Object.assign(new Error('private address'), { code: 'EPRIVATE' }));
      if (opts && opts.all) return cb(null, ok);
      cb(null, ok[0].address, ok[0].family);
    });
  };
}
function fetchUrl(url, { allowPrivate = false, headers = {}, maxBytes = 4 * 1024 * 1024, timeout = 15000, redirects = 5, method = 'GET', body = null } = {}) {
  allowPrivate = allowPrivate || allowPrivateEnv();
  return new Promise((resolve, reject) => {
    let u; try { u = new URL(url); } catch (e) { return reject(new ImportErr(400, 'That doesn’t look like a web address.')); }
    if (!/^https?:$/.test(u.protocol)) return reject(new ImportErr(400, 'Only http:// and https:// links can be imported.'));
    if (u.username || u.password) return reject(new ImportErr(400, 'Links with a username or password can’t be imported.'));
    const host = u.hostname.replace(/^\[|\]$/g, '');
    if (net.isIP(host) && !allowPrivate && isPrivateIp(host)) return reject(new ImportErr(400, 'That address is on a private network. Link import only reaches public websites.'));
    const lib = u.protocol === 'https:' ? https : http;
    /* POST is supported so an API that takes a JSON body can reuse this helper and everything
       guarding it: the private-network check, the redirect cap, the size cap and the decoders. */
    const payload = body == null ? null : (typeof body === 'string' ? body : JSON.stringify(body));
    const baseHeaders = { 'User-Agent': UA, 'Accept-Encoding': 'gzip, deflate, br', 'Accept-Language': 'en-US,en;q=0.9' };
    if (payload != null) { baseHeaders['Content-Type'] = 'application/json'; baseHeaders['Content-Length'] = Buffer.byteLength(payload); }
    const req = lib.request(u, { method, lookup: lookupFor(allowPrivate), headers: Object.assign(baseHeaders, headers) }, res => {
      const code = res.statusCode;
      if (code >= 300 && code < 400 && res.headers.location) {
        res.resume(); clearTimeout(t);
        if (redirects <= 0) return reject(new ImportErr(502, 'That link redirects too many times.'));
        let next; try { next = new URL(res.headers.location, u).toString(); } catch (e) { return reject(new ImportErr(502, 'That link redirects to an invalid address.')); }
        /* 307 and 308 preserve the method and body; everything else becomes a GET, as browsers do. */
        const keep = code === 307 || code === 308;
        return fetchUrl(next, { allowPrivate, headers, maxBytes, timeout, redirects: redirects - 1,
          method: keep ? method : 'GET', body: keep ? body : null }).then(resolve, reject);
      }
      const enc = String(res.headers['content-encoding'] || '').toLowerCase();
      let stream = res;
      if (enc === 'gzip' || enc === 'x-gzip') stream = res.pipe(zlib.createGunzip());
      else if (enc === 'deflate') stream = res.pipe(zlib.createInflate());
      else if (enc === 'br') stream = res.pipe(zlib.createBrotliDecompress());
      const chunks = []; let size = 0;
      stream.on('data', c => { size += c.length; if (size > maxBytes) { req.destroy(); stream.destroy(); clearTimeout(t); reject(new ImportErr(413, 'That page is too large to import.')); } else chunks.push(c); });
      stream.on('end', () => {
        clearTimeout(t);
        const buf = Buffer.concat(chunks); const ct = String(res.headers['content-type'] || '');
        const cs = (ct.match(/charset=["']?([\w-]+)/i) || [])[1] || 'utf-8';
        let body; try { body = new TextDecoder(cs.toLowerCase()).decode(buf); } catch (e) { body = buf.toString('utf8'); }
        resolve({ status: code, headers: res.headers, contentType: ct, body, url: u.toString() });
      });
      stream.on('error', e => { clearTimeout(t); reject(new ImportErr(502, 'The page couldn’t be read (' + (e.code || e.message) + ').')); });
    });
    const t = setTimeout(() => { req.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })); }, timeout);
    req.on('error', e => {
      clearTimeout(t);
      if (e instanceof ImportErr) return reject(e);
      if (e.code === 'EPRIVATE') return reject(new ImportErr(400, 'That address is on a private network. Link import only reaches public websites.'));
      if (e.code === 'ENOTFOUND' || e.code === 'EAI_AGAIN') return reject(new ImportErr(502, `Couldn’t find ${u.hostname}. Check the link.`, { reach: true }));
      if (e.code === 'ETIMEDOUT') return reject(new ImportErr(504, `${u.hostname} took too long to respond.`, { reach: true }));
      if (e.code === 'ECONNREFUSED') return reject(new ImportErr(502, `${u.hostname} refused the connection.`, { reach: true }));
      if (/CERT|SSL|TLS/i.test(e.code || '') || /certificate/i.test(e.message)) return reject(new ImportErr(502, `${u.hostname} has a certificate problem, so it wasn’t trusted.`, { reach: true }));
      reject(new ImportErr(502, `Couldn’t reach ${u.hostname} (${e.code || e.message}).`, { reach: true }));
    });
    if (payload != null) req.write(payload);
    req.end();
  });
}

/* ---------- text helpers ---------- */
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…', deg: '°', frac12: '½', frac14: '¼', frac34: '¾', frac13: '⅓', frac23: '⅔', frac18: '⅛', times: '×', eacute: 'é', egrave: 'è', ntilde: 'ñ', uuml: 'ü', ouml: 'ö', auml: 'ä', ccedil: 'ç', reg: '®', trade: '™', copy: '©', bull: '•', middot: '·', frasl: '/' };
function decode(s) {
  return String(s == null ? '' : s)
    .replace(/&#(\d+);?/g, (m, d) => { const n = +d; return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ''; })
    .replace(/&#x([0-9a-f]+);?/gi, (m, h) => { const n = parseInt(h, 16); return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ''; })
    .replace(/&([a-z][a-z0-9]*);/gi, (m, n) => ENT[n.toLowerCase()] != null ? ENT[n.toLowerCase()] : m);
}
const stripTags = s => String(s == null ? '' : s).replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|li|div|h\d)>/gi, '\n').replace(/<[^>]*>/g, '');
const clean = (s, max = 500) => decode(stripTags(decode(s))).replace(/[ \t\u00a0]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim().slice(0, max);
const oneLine = (s, max) => clean(s, max).replace(/\n+/g, ' ');
const arr = v => v == null ? [] : Array.isArray(v) ? v : [v];
const txt = v => { if (v == null) return ''; if (typeof v === 'string' || typeof v === 'number') return String(v); if (Array.isArray(v)) return v.map(txt).filter(Boolean).join(', '); if (typeof v === 'object') return txt(v.name || v.text || v['@value'] || ''); return ''; };

function minutes(v) {
  if (v == null || v === '') return 0; if (typeof v === 'number') return Math.round(v);
  const s = String(v).trim(); let m = s.match(/^P(?:(\d+)D)?T?(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+)S)?$/i);
  if (m) return Math.round((+m[1] || 0) * 1440 + (+m[2] || 0) * 60 + (+m[3] || 0));
  const h = s.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)\b/i), mi = s.match(/(\d+)\s*(m|min|mins|minute|minutes)\b/i);
  if (h || mi) return Math.round((h ? +h[1] * 60 : 0) + (mi ? +mi[1] : 0));
  return /^\d+$/.test(s) ? +s : 0;
}
const num = v => { const m = String(v == null ? '' : v).replace(',', '.').match(/-?\d+(?:\.\d+)?/); return m ? +m[0] : null; };
function nutritionOf(n) {
  if (!n || typeof n !== 'object') return null;
  const o = { k: num(n.calories), p: num(n.proteinContent), c: num(n.carbohydrateContent), f: num(n.fatContent) };
  if (o.k != null && /kj/i.test(String(n.calories)) && !/kcal|cal(orie)?s?\b/i.test(String(n.calories))) o.k = Math.round(o.k / 4.184);
  return o.k || o.p ? o : null;
}
function servingsOf(y) {                // → { n, text }
  const list = arr(y).map(v => typeof v === 'object' ? txt(v) : String(v)).map(s => clean(s, 80)).filter(Boolean);
  let n = null; for (const s of list) { const m = s.match(/\d+(?:\.\d+)?/); if (m) { n = +m[0]; break; } }
  return { n: n && n > 0 ? n : null, text: list.sort((a, b) => b.length - a.length)[0] || '' };
}
function stepsOf(v) {
  const out = [];
  const walk = x => {
    if (x == null) return;
    if (typeof x === 'string') { clean(x, 4000).split(/\n+/).map(s => s.trim()).filter(Boolean).forEach(s => out.push(s)); return; }
    if (Array.isArray(x)) return x.forEach(walk);
    if (typeof x === 'object') {
      const t = arr(x['@type']).join(' ');
      if (/HowToSection/i.test(t) || x.itemListElement) { if (x.name) out.push(clean(x.name, 200) + ':'); return walk(x.itemListElement); }
      walk(x.text || x.name || '');
    }
  };
  walk(v); return out.map(s => s.slice(0, 1000)).slice(0, 60);
}
function ingredientsOf(v) {
  let list = arr(v);
  if (list.length === 1 && typeof list[0] === 'string' && /\n/.test(list[0])) list = list[0].split(/\n+/);
  return list.map(x => oneLine(typeof x === 'object' ? txt(x) : x, 300)).filter(Boolean).slice(0, 80).map(t => ({ text: t }));
}

/* ---------- web pages ---------- */
const isRecipe = o => o && typeof o === 'object' && arr(o['@type']).some(t => /(^|\/)Recipe$/i.test(String(t)));
function findRecipeNodes(html) {
  const out = []; const re = /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi; let m;
  const walk = (j, depth) => {
    if (!j || depth > 6) return;
    if (Array.isArray(j)) return j.forEach(x => walk(x, depth + 1));
    if (typeof j !== 'object') return;
    if (isRecipe(j)) out.push(j);
    ['@graph', 'mainEntity', 'mainEntityOfPage', 'hasPart', 'itemListElement', 'item'].forEach(k => { if (j[k] && typeof j[k] === 'object') walk(j[k], depth + 1); });
  };
  while ((m = re.exec(html))) {
    const raw = m[1].trim().replace(/^<!--|-->$/g, '').replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, '');
    let j = null; try { j = JSON.parse(raw); } catch (e) { try { j = JSON.parse(raw.replace(/[\u0000-\u001f]+/g, ' ')); } catch (e2) { j = null; } }
    walk(j, 0);
  }
  return out;
}
function meta(html, key) {
  const re = new RegExp(`<meta\\b[^>]*(?:property|name)\\s*=\\s*["']${key}["'][^>]*>`, 'i'); const tag = (html.match(re) || [])[0]; if (!tag) return '';
  return oneLine((tag.match(/content\s*=\s*"([^"]*)"/i) || tag.match(/content\s*=\s*'([^']*)'/i) || [])[1] || '', 200);
}
function microdata(html) {
  const ing = []; const re = /<(\w+)\b[^>]*itemprop\s*=\s*["'](?:recipeIngredient|ingredients)["'][^>]*>([\s\S]*?)<\/\1>/gi; let m;
  while ((m = re.exec(html)) && ing.length < 80) { const t = oneLine(m[2], 300); if (t) ing.push({ text: t }); }
  if (!ing.length) return null;
  const steps = []; const rs = /<(\w+)\b[^>]*itemprop\s*=\s*["']recipeInstructions["'][^>]*>([\s\S]*?)<\/\1>/gi;
  while ((m = rs.exec(html)) && steps.length < 60) steps.push(...stepsOf(m[2]));
  const nm = (html.match(/<(\w+)\b[^>]*itemprop\s*=\s*["']name["'][^>]*>([\s\S]*?)<\/\1>/i) || [])[2];
  const y = (html.match(/itemprop\s*=\s*["']recipeYield["'][^>]*?(?:content\s*=\s*["']([^"']*)["'][^>]*>|>([\s\S]*?)<)/i) || []);
  return { name: oneLine(nm || '', 200), ingredients: ing, steps, yield: y[1] || y[2] || '' };
}
function pageTitle(html) { return meta(html, 'og:title') || oneLine((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '', 200); }
const hostName = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };

function fromJsonLd(r, pageUrl, html) {
  const sv = servingsOf(r.recipeYield || r.yield);
  let url = typeof r.url === 'string' && /^https?:\/\//i.test(r.url) ? r.url : pageUrl;
  if (hostName(url) !== hostName(pageUrl)) url = pageUrl;
  const pub = txt(r.publisher) || meta(html, 'og:site_name') || hostName(pageUrl);
  return {
    source: 'web', name: oneLine(r.name || r.headline || pageTitle(html), 200), url, site: oneLine(pub, 80) || hostName(pageUrl),
    servings: sv.n, yieldText: sv.text, minutes: minutes(r.totalTime) || (minutes(r.prepTime) + minutes(r.cookTime)),
    categories: [...arr(r.recipeCategory).map(txt), ...arr(r.recipeCuisine).map(txt)].map(s => oneLine(s, 60)).filter(Boolean).slice(0, 12),
    keywords: (Array.isArray(r.keywords) ? r.keywords.map(txt) : String(r.keywords || '').split(',')).map(s => oneLine(s, 40)).filter(Boolean).slice(0, 20),
    ingredients: ingredientsOf(r.recipeIngredient || r.ingredients), steps: stepsOf(r.recipeInstructions), nutrition: nutritionOf(r.nutrition)
  };
}
/* ---------- last resort: a plain blog post with no structured data at all ----------
   Plenty of recipe sites (Shopify and older WordPress blogs especially) publish nothing
   machine-readable. Find an "Ingredients" heading and take the list under it; treat the
   prose after the ingredient lists as the method. Flagged loose so the review screen says so. */
const ING_HEAD = /^\s*(?:\d+[.)]\s*)?(ingredients?|what you(?:'|’)?ll need)\b/i;
const STEP_HEAD = /^\s*(?:\d+[.)]\s*)?(instructions?|directions?|method|steps|how to make)\b/i;
const STOP_HEAD = /^\s*(?:\d+[.)]\s*)?(instructions?|directions?|method|steps|how to make|notes?|tips?|equipment|supplies|nutrition|related|comments?|you may also|leave a)\b/i;
function closeAt(html, start, tag) {
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi'); re.lastIndex = start; let d = 0, m;
  while ((m = re.exec(html))) { if (m[1]) { if (--d === 0) return re.lastIndex; } else d++; if (d > 24) break; }
  return -1;
}
function liFlat(block) {
  const out = []; const re = /<li\b[^>]*>/gi; let m;
  while ((m = re.exec(block)) && out.length < 80) {
    const end = closeAt(block, m.index, 'li');
    const own = (end > 0 ? block.slice(m.index, end) : block.slice(m.index, m.index + 500)).replace(/<(ul|ol)\b[\s\S]*$/i, '');
    const t = oneLine(own, 300); if (t) out.push({ text: t, links: (own.match(/<a\b/gi) || []).length });
  }
  return out;
}
function listsIn(html) {
  const out = []; const re = /<(ul|ol)\b[^>]*>/gi; let m;
  while ((m = re.exec(html))) {
    const end = closeAt(html, m.index, m[1]); if (end < 0) continue;
    out.push({ at: m.index, end, items: liFlat(html.slice(m.index, end)) });
    re.lastIndex = end;
  }
  return out;
}
const realList = l => l.items.length >= 2 && l.items.filter(i => i.links).length <= l.items.length * 0.5;
function fromHtml(html, pageUrl) {
  const body = html.replace(/<(script|style|nav|header|footer|template|noscript)\b[\s\S]*?<\/\1>/gi, ' ');
  const heads = []; let m;
  const hre = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  while ((m = hre.exec(body))) heads.push({ at: m.index, end: hre.lastIndex, t: oneLine(m[2], 120) });
  const bre = /<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  while ((m = bre.exec(body))) heads.push({ at: m.index, end: bre.lastIndex, t: oneLine(m[2], 120) });
  heads.sort((a, b) => a.at - b.at);
  if (!heads.length) return null;
  const lists = listsIn(body);

  const ih = heads.filter(h => ING_HEAD.test(h.t))
    .map(h => { const stop = heads.find(x => x.at > h.end && STOP_HEAD.test(x.t)); const lim = stop ? stop.at : h.end + 8000;
      return { h, l: lists.find(l => l.at >= h.end && l.at < lim && realList(l)) }; })
    .find(x => x.l);
  if (!ih) return null;
  const ingredients = ih.l.items.map(i => ({ text: i.text })).slice(0, 80);

  let tail = ih.l.end;
  for (;;) { const nx = lists.find(l => l.at >= tail && l.at - tail < 600 && realList(l)); if (!nx) break; tail = nx.end; }

  let steps = [];
  const sh = heads.find(h => h.at > ih.h.at && STEP_HEAD.test(h.t));
  if (sh) {
    const l = lists.find(x => x.at >= sh.end && x.at < sh.end + 4000 && realList(x));
    if (l) steps = l.items.map(i => i.text);
    else steps = clean(body.slice(sh.end, sh.end + 9000), 9000).split(/\n+/).map(s2 => s2.trim()).filter(s2 => s2.length > 20);
  } else {
    steps = clean(body.slice(tail, tail + 12000), 12000).split(/\n+/).map(s2 => s2.trim()).filter(s2 => s2.length > 24);
  }

  const near = clean(body.slice(Math.max(0, ih.h.at - 3000), ih.h.at + 3000), 6000);
  const sv = (near.match(/\b(?:serves|servings?|yields?|makes)\b[^\d]{0,12}(\d+)/i) || [])[1];
  return { source: 'web', loose: true, name: pageTitle(html), url: pageUrl, site: meta(html, 'og:site_name') || hostName(pageUrl),
    servings: sv ? +sv : null, yieldText: sv ? `Serves ${sv}` : '', minutes: 0,
    categories: [], keywords: [], ingredients, steps: steps.slice(0, 60), nutrition: null };
}
function parsePage(html, pageUrl) {
  const nodes = findRecipeNodes(html);
  const withIng = nodes.find(n => arr(n.recipeIngredient || n.ingredients).length) || nodes[0];
  if (withIng) { const r = fromJsonLd(withIng, pageUrl, html); if (r.ingredients.length) return r; }
  const md = microdata(html);
  if (md) { const sv = servingsOf(md.yield); return { source: 'web', name: md.name || pageTitle(html), url: pageUrl, site: meta(html, 'og:site_name') || hostName(pageUrl), servings: sv.n, yieldText: sv.text, minutes: 0, categories: [], keywords: [], ingredients: md.ingredients, steps: md.steps, nutrition: null }; }
  return fromHtml(html, pageUrl);
}
async function importFromUrl(url) {
  url = String(url || '').trim(); if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url) && /^[\w-]+(\.[\w-]+)+(:\d+)?(\/|$)/.test(url)) url = 'https://' + url;
  const r = await fetchUrl(url, { headers: { Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5' } });
  if (r.status === 401 || r.status === 403 || r.status === 429 || r.status === 503) throw new ImportErr(422, `${hostName(r.url)} blocked the request (HTTP ${r.status}). Some sites don’t allow automated access.`, { partial: { url: r.url, site: hostName(r.url) } });
  if (r.status === 404 || r.status === 410) throw new ImportErr(422, 'That page wasn’t found (HTTP ' + r.status + '). Check the link.');
  if (r.status >= 400) throw new ImportErr(422, `${hostName(r.url)} returned an error (HTTP ${r.status}).`);
  if (!/html|xml/i.test(r.contentType) && !/^\s*</.test(r.body)) throw new ImportErr(422, 'That link isn’t a web page.');
  const rec = parsePage(r.body, r.url);
  if (!rec || !rec.ingredients.length) throw new ImportErr(422, 'No recipe data was found on that page.', { partial: { name: (rec && rec.name) || pageTitle(r.body), url: r.url, site: (rec && rec.site) || meta(r.body, 'og:site_name') || hostName(r.url), steps: rec ? rec.steps : [], servings: rec ? rec.servings : null } });
  return rec;
}

/* ---------- Mealie ---------- */
const mealieBase = u => String(u || '').trim().replace(/\/+$/, '').replace(/\/api$/i, '');
async function mealieGet(cfg, pathAndQuery) {
  if (!cfg || !cfg.url || !cfg.token) throw new ImportErr(409, 'Mealie isn’t connected. An administrator can connect it in Settings.');
  const base = mealieBase(cfg.url);
  let r;
  try { r = await fetchUrl(base + pathAndQuery, { allowPrivate: true, timeout: 12000, maxBytes: 8 * 1024 * 1024, headers: { Accept: 'application/json', Authorization: 'Bearer ' + cfg.token } }); }
  catch (e) { if (e.extra && e.extra.reach) throw new ImportErr(502, 'Can’t reach Mealie: ' + e.message); throw e; }
  if (r.status === 401 || r.status === 403) throw new ImportErr(502, 'Mealie rejected the API token. Create a new token in Mealie and save it here.');
  if (r.status === 404) throw new ImportErr(404, 'Not found in Mealie. Check the Mealie address.');
  if (r.status >= 400) throw new ImportErr(502, `Mealie returned an error (HTTP ${r.status}).`);
  try { return JSON.parse(r.body); } catch (e) { throw new ImportErr(502, 'Mealie didn’t answer with JSON. Check the Mealie address (it should be the address you open Mealie at).'); }
}
async function mealieTest(cfg) {
  const me = await mealieGet(cfg, '/api/users/self');
  if (!me || typeof me !== 'object' || !(me.username || me.email || me.id)) throw new ImportErr(502, 'That address answered, but it doesn’t look like Mealie.');
  let version = ''; try { const a = await mealieGet(cfg, '/api/app/about'); version = String(a.version || '').slice(0, 20); } catch (e) { }
  return { user: String(me.fullName || me.username || me.email || '').slice(0, 80), group: String(me.groupSlug || me.group || '').slice(0, 80), version };
}
async function mealieSearch(cfg, q, page) {
  const qs = new URLSearchParams({ page: String(Math.max(1, Math.min(500, +page || 1))), perPage: '30', orderBy: 'name', orderDirection: 'asc' });
  if (q) qs.set('search', String(q).slice(0, 100));
  const j = await mealieGet(cfg, '/api/recipes?' + qs.toString());
  const items = arr(j && j.items).map(r => ({ slug: String(r.slug || '').slice(0, 200), name: oneLine(r.name, 200), description: oneLine(r.description || '', 220), yield: oneLine(r.recipeYield || (r.recipeServings ? r.recipeServings + ' servings' : ''), 60), minutes: minutes(r.totalTime) || (minutes(r.prepTime) + minutes(r.performTime || r.cookTime)) })).filter(r => r.slug && r.name);
  return { items, page: +(j && j.page) || 1, pages: +(j && (j.total_pages || j.totalPages)) || 1, total: +(j && j.total) || items.length };
}
async function mealieRecipe(cfg, slug, groupSlug) {
  if (!/^[\w.~%-]{1,200}$/.test(String(slug || ''))) throw new ImportErr(400, 'Invalid recipe.');
  const r = await mealieGet(cfg, '/api/recipes/' + encodeURIComponent(slug));
  const base = mealieBase(cfg.url);
  const ings = arr(r.recipeIngredient).map(i => {
    if (!i || typeof i !== 'object') return null;
    const food = i.food && typeof i.food === 'object' ? oneLine(i.food.name, 120) : '';
    const unit = i.unit && typeof i.unit === 'object' ? oneLine(i.unit.name || i.unit.abbreviation, 40) : '';
    const note = oneLine(i.note || '', 200);
    const text = oneLine(i.originalText || i.display || (i.disableAmount || !food ? note : [i.quantity || '', unit, food, note].filter(Boolean).join(' ')) || note, 300);
    if (!text && i.title) return { text: oneLine(i.title, 120) + ':', header: true };
    if (!text) return null;
    const q = +i.quantity;
    return food && !i.disableAmount ? { text, qty: q > 0 ? q : null, unit: unit || null, food, note } : { text };
  }).filter(Boolean);
  const sv = r.recipeServings > 0 ? { n: +r.recipeServings, text: oneLine(r.recipeYield || '', 60) } : servingsOf(r.recipeYield || r.recipeYieldQuantity);
  const steps = []; arr(r.recipeInstructions).forEach(s => { if (!s) return; if (s.title) steps.push(oneLine(s.title, 200) + ':'); stepsOf(s.text || '').forEach(x => steps.push(x)); });
  const link = groupSlug ? `${base}/g/${encodeURIComponent(groupSlug)}/r/${encodeURIComponent(r.slug || slug)}` : '';
  return {
    source: 'mealie', name: oneLine(r.name, 200), url: /^https?:\/\//i.test(r.orgURL || '') ? String(r.orgURL).slice(0, 500) : '', mealieUrl: link, site: r.orgURL ? hostName(r.orgURL) : 'Mealie',
    servings: sv.n, yieldText: sv.text, minutes: minutes(r.totalTime) || (minutes(r.prepTime) + minutes(r.performTime || r.cookTime)),
    categories: arr(r.recipeCategory).map(txt).map(s => oneLine(s, 60)).filter(Boolean), keywords: arr(r.tags).map(txt).map(s => oneLine(s, 40)).filter(Boolean),
    ingredients: ings.slice(0, 80), steps: steps.slice(0, 60), nutrition: nutritionOf(r.nutrition)
  };
}

module.exports = { ImportErr, fetchUrl, isPrivateIp, parsePage, importFromUrl, mealieBase, mealieTest, mealieSearch, mealieRecipe, minutes, decode };
