// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
'use strict';
/* ============================================================
   FORGE 90 server — accounts, sign-in, admin console API, per-user plan storage,
   and password-reset email over SMTP (Gmail). Node 18+, no npm packages needed.
   Start:  node server.js     (settings in .env next to this file)
   ============================================================ */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const net = require('net');
const { sendMail } = require('./lib/smtp');
const MAIL = require('./lib/email');

/* ---------- configuration (.env) ---------- */
(function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim(); if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (!m) continue;
    let v = m[2].trim(); if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
})(path.join(__dirname, '.env'));
(function loadEnv2(file) {   // also read a .env in the repository root (one level up) when running from source
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith('#')) continue; const m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (!m) continue; let v = m[2].trim(); if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1); if (process.env[m[1]] === undefined) process.env[m[1]] = v; }
})(path.join(__dirname, '..', '.env'));
const ENV = process.env;
const PORT = +ENV.PORT || 8090;
const HOST = ENV.HOST || '0.0.0.0';
const DATA = path.resolve(ENV.DATA_DIR || path.join(__dirname, 'data'));
const PUBLIC = path.join(__dirname, 'public');
/* Reverse proxy (Nginx Proxy Manager, SWAG, Traefik…). TRUST_PROXY:
     unset / false  → no proxy: use the connecting address, ignore X-Forwarded-* headers
     true           → trust whatever connects (use the address the proxy added — the last X-Forwarded-For entry)
     IPs / CIDRs    → only trust X-Forwarded-* from these proxies, e.g. 172.18.0.0/16 (recommended) */
const TP_RAW = String(ENV.TRUST_PROXY || '').trim();
const TP_MODE = /^(1|true|yes|on)$/i.test(TP_RAW) ? 'all' : /^(0|false|no|off|)$/i.test(TP_RAW) ? 'off' : 'list';
const TP_LIST = new net.BlockList(); const TP_BAD = [];
if (TP_MODE === 'list') TP_RAW.split(/[\s,]+/).filter(Boolean).forEach(x => {
  const [a, p] = x.split('/'); const fam = net.isIP(a); const bits = p == null ? null : +p;
  if (!fam || (bits != null && !(Number.isInteger(bits) && bits >= 0 && bits <= (fam === 6 ? 128 : 32)))) { TP_BAD.push(x); return; }
  if (bits == null) TP_LIST.addAddress(a, fam === 6 ? 'ipv6' : 'ipv4'); else TP_LIST.addSubnet(a, bits, fam === 6 ? 'ipv6' : 'ipv4');
});
if (TP_BAD.length) console.warn('  TRUST_PROXY: ignoring', TP_BAD.join(', '), '(not an IP address or CIDR range)');
const RESET_MINUTES = 30;                        // password-reset links expire after 30 minutes
const INVITE_DAYS = 7;                           // account invites expire after 7 days
const VERSION = (() => { for (const f of [path.join(__dirname, 'VERSION'), path.join(__dirname, '..', 'VERSION')]) { try { return 'v' + fs.readFileSync(f, 'utf8').trim().replace(/^v/i, ''); } catch (e) { /* try next */ } } return 'v1.0'; })();
const MAX_STATE_BYTES = 12 * 1024 * 1024;

/* ---------- storage: data/db.json + data/state/<userId>.json ---------- */
fs.mkdirSync(path.join(DATA, 'state'), { recursive: true });
const DBF = path.join(DATA, 'db.json');
const DEFAULT_SETTINGS = () => ({
  appName: 'FORGE 90',
  appUrl: ENV.APP_URL || '',
  security: { pwMinLength: 10, pwRequireMix: true, lockThreshold: 5, lockMinutes: 15, autoResetOnLock: true, sessionHours: 12, rememberDays: 30, notifyPasswordChange: true, requireHttps: true },
  email: {},        // only the values an admin changed in Admin → Email; everything else comes from the environment (.env / Docker)
  defaults: { theme: 'dark' }
});
function deepMerge(base, over) { if (!over || typeof over !== 'object' || Array.isArray(over)) return over === undefined ? base : over; const out = Object.assign({}, base); for (const k of Object.keys(over)) out[k] = (base && typeof base[k] === 'object' && !Array.isArray(base[k])) ? deepMerge(base[k], over[k]) : over[k]; return out; }
let db = { version: 1, users: [], sessions: [], resets: [], invites: [], syncs: [], audit: [], settings: {} };
if (fs.existsSync(DBF)) { try { db = JSON.parse(fs.readFileSync(DBF, 'utf8')); } catch (e) { console.error('Could not read', DBF, e.message); process.exit(1); } }
if (db.settings && db.settings.email && !db.settings.emailV2) { const p = db.settings.email.pass; db.settings.email = p ? { pass: p } : {}; }   // older builds copied .env into db.json
db.settings = deepMerge(DEFAULT_SETTINGS(), db.settings || {}); db.settings.emailV2 = true; delete db.settings.registration;   // accounts are invite-only now
['users', 'sessions', 'resets', 'invites', 'syncs', 'audit'].forEach(k => { if (!Array.isArray(db[k])) db[k] = []; });
function writeAtomic(file, data) { const tmp = `${file}.${process.pid}.tmp`; fs.writeFileSync(tmp, data, { mode: 0o600 }); fs.renameSync(tmp, file); }
let saveT = null;
function saveDb(now) { clearTimeout(saveT); const f = () => { saveT = null; writeAtomic(DBF, JSON.stringify(db, null, 1)); }; if (now) f(); else saveT = setTimeout(f, 120); }
const stateFile = id => path.join(DATA, 'state', String(id).replace(/[^A-Za-z0-9_-]/g, '') + '.json');
function readState(id) { try { return JSON.parse(fs.readFileSync(stateFile(id), 'utf8')); } catch (e) { return { rev: 0, state: null, updatedAt: null }; } }

/* ---------- helpers ---------- */
const now = () => Date.now();
const uid = () => crypto.randomBytes(9).toString('base64url');
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const normEmail = e => String(e || '').trim().toLowerCase();
const validEmail = e => e.length <= 254 && /^[^\s@<>()"',;:\\]+@[^\s@<>()"',;:\\]+\.[a-z]{2,}$/i.test(e);
const scryptA = (pw, salt, len, o) => new Promise((res, rej) => crypto.scrypt(pw, salt, len, o, (e, k) => e ? rej(e) : res(k)));
const SC = { N: 32768, r: 8, p: 1, maxmem: 96 * 1024 * 1024 };
async function hashPw(pw) { const salt = crypto.randomBytes(16); const h = await scryptA(String(pw).normalize('NFKC'), salt, 64, SC); return `scrypt$${SC.N}$${SC.r}$${SC.p}$${salt.toString('base64')}$${h.toString('base64')}`; }
async function verifyPw(pw, stored) {
  try { const [, N, r, p, s, h] = String(stored).split('$'); const hb = Buffer.from(h, 'base64');
    const out = await scryptA(String(pw).normalize('NFKC'), Buffer.from(s, 'base64'), hb.length, { N: +N, r: +r, p: +p, maxmem: SC.maxmem });
    return crypto.timingSafeEqual(out, hb); } catch (e) { return false; }
}
const DUMMY_HASH = 'scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(64).toString('base64');
const COMMON = new Set(['password', 'password1', 'password123', '123456789', '1234567890', 'qwertyuiop', 'iloveyou', 'letmein123', 'forge90', 'forge90admin', 'changeme', 'welcome123', 'administrator']);
function pwProblem(pw, email) {
  const s = db.settings.security; pw = String(pw || '');
  if (pw.length < s.pwMinLength) return `Use at least ${s.pwMinLength} characters.`;
  if (pw.length > 200) return 'That password is too long (200 characters max).';
  if (s.pwRequireMix && !(/[A-Za-z]/.test(pw) && /[^A-Za-z]/.test(pw))) return 'Mix letters with numbers or symbols.';
  if (COMMON.has(pw.toLowerCase()) || (email && pw.toLowerCase().includes(normEmail(email).split('@')[0]) && normEmail(email).split('@')[0].length > 3)) return 'That password is too easy to guess.';
  return null;
}
const findUser = email => db.users.find(u => u.email === normEmail(email));
const userById = id => db.users.find(u => u.id === id);
const admins = () => db.users.filter(u => u.role === 'admin' && u.status === 'active');
const isLocked = u => !!(u.lockedUntil && u.lockedUntil > now());
const avatarUrl = u => u && u.avatar ? `/api/avatar/${u.id}?v=${encodeURIComponent(u.avatarV || '1')}` : null;
function pubUser(u) { return u && { id: u.id, email: u.email, name: u.name, firstName: u.firstName || '', lastName: u.lastName || '', avatarUrl: avatarUrl(u), role: u.role, status: u.status, mustChange: !!u.mustChange, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt || null, notify: Object.assign({ passwordChange: true, newSignIn: false }, u.notify || {}) }; }
function audit(type, { userId = null, actorId = null, ip = null, detail = '' } = {}) {
  db.audit.push({ id: uid(), t: now(), type, userId, actorId, ip, detail: String(detail).slice(0, 300) });
  if (db.audit.length > 5000) db.audit.splice(0, db.audit.length - 5000);
  saveDb();
}
const normIp = ip => String(ip || '').trim().replace(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/, '$1');
function ipTrusted(ip) { if (TP_MODE === 'all') return true; if (TP_MODE !== 'list') return false; ip = normIp(ip); const f = net.isIP(ip); return !!f && TP_LIST.check(ip, f === 6 ? 'ipv6' : 'ipv4'); }
const peerIp = req => normIp(req.socket.remoteAddress);
const fromProxy = req => ipTrusted(peerIp(req));
// The visitor's address. Entries a client puts in X-Forwarded-For itself come first, so read from the right: the proxy appends the real address last.
function clientIp(req) {
  const peer = peerIp(req); if (!fromProxy(req)) return peer;
  const xff = String(req.headers['x-forwarded-for'] || '').split(',').map(normIp).filter(ip => net.isIP(ip));
  if (!xff.length) { const xr = normIp(req.headers['x-real-ip']); return net.isIP(xr) ? xr : peer; }
  if (TP_MODE === 'all') return xff[xff.length - 1];
  for (let i = xff.length - 1; i >= 0; i--) if (!ipTrusted(xff[i])) return xff[i];      // step back past our own proxies
  return xff[0];
}
function isHttps(req) { return !!req.socket.encrypted || (fromProxy(req) && /^https$/i.test(String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim())); }
/* "Require HTTPS": plain-HTTP visits to any other address (e.g. http://192.168.1.10:8090) are sent to the https:// App address */
function httpsTarget() { const u = String(db.settings.appUrl || ENV.APP_URL || '').trim().replace(/\/+$/, ''); return /^https:\/\/[^\s/]+/i.test(u) ? u : null; }
const httpsEnvOff = () => /^(0|false|no|off)$/i.test(ENV.REQUIRE_HTTPS || '');
function requireHttpsOn() { return !httpsEnvOff() && db.settings.security.requireHttps !== false && !!httpsTarget(); }
const hostOf = u => { try { return new URL(u).host.toLowerCase(); } catch (e) { return ''; } };
const isLoopback = ip => ip === '127.0.0.1' || ip === '::1';
function baseUrl(req) { const u = (db.settings.appUrl || ENV.APP_URL || '').replace(/\/+$/, ''); return u || `${isHttps(req) ? 'https' : 'http'}://${req.headers.host}`; }
function maskEmail(e) { const [a, d] = e.split('@'); return (a.length <= 2 ? a[0] + '*' : a[0] + '*'.repeat(Math.min(6, a.length - 2)) + a.slice(-1)) + '@' + d; }

/* ---------- rate limiting (in memory) ---------- */
const buckets = new Map();
function limited(key, max, windowMs) { const t = now(); let b = buckets.get(key); if (!b || b.reset < t) { b = { n: 0, reset: t + windowMs }; buckets.set(key, b); } b.n++; return b.n > max; }
setInterval(() => { const t = now(); for (const [k, b] of buckets) if (b.reset < t) buckets.delete(k); }, 60000).unref();

/* ---------- sessions (HttpOnly cookie, hashed server-side) ---------- */
const COOKIE = 'f90_sid';
function parseCookies(req) { const out = {}; String(req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }); return out; }
function cookieSecure(req) { const v = (ENV.COOKIE_SECURE || 'auto').toLowerCase(); return v === 'true' || (v === 'auto' && isHttps(req)); }
function setCookie(res, req, value, maxAgeSec) { const parts = [`${COOKIE}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Lax']; if (cookieSecure(req)) parts.push('Secure'); if (maxAgeSec != null) parts.push(`Max-Age=${maxAgeSec}`); res.setHeader('Set-Cookie', parts.join('; ')); }
function createSession(req, res, user, remember) {
  const s = db.settings.security; const tok = crypto.randomBytes(32).toString('base64url');
  const life = remember ? s.rememberDays * 86400000 : s.sessionHours * 3600000;
  db.sessions.push({ id: uid(), h: sha256(tok), userId: user.id, createdAt: now(), lastSeen: now(), expiresAt: now() + life, remember: !!remember, ip: clientIp(req), ua: String(req.headers['user-agent'] || '').slice(0, 200) });
  setCookie(res, req, tok, remember ? Math.round(life / 1000) : null); saveDb();
}
function getSession(req) {
  const tok = parseCookies(req)[COOKIE]; if (!tok) return null;
  const h = sha256(tok); const s = db.sessions.find(x => x.h === h); if (!s) return null;
  if (s.expiresAt < now()) { db.sessions = db.sessions.filter(x => x !== s); saveDb(); return null; }
  const u = userById(s.userId); if (!u || u.status !== 'active') return null;
  if (now() - s.lastSeen > 60000) { s.lastSeen = now(); s.ip = clientIp(req); if (!s.remember) s.expiresAt = now() + db.settings.security.sessionHours * 3600000; saveDb(); }
  return { s, u };
}
const revokeSessions = (userId, exceptId) => { const n = db.sessions.length; db.sessions = db.sessions.filter(s => s.userId !== userId || s.id === exceptId); saveDb(); return n - db.sessions.length; };

/* ---------- email ---------- */
function emailDefaults() { return { host: ENV.SMTP_HOST || 'smtp.gmail.com', port: +ENV.SMTP_PORT || 465, security: ENV.SMTP_SECURITY || 'tls', user: ENV.SMTP_USER || '', fromName: ENV.MAIL_FROM_NAME || 'FORGE 90', fromEmail: ENV.MAIL_FROM || ENV.SMTP_USER || '' }; }
const EMAIL_KEYS = ['host', 'port', 'security', 'user', 'fromName', 'fromEmail'];
function mailConfig() {
  const d = emailDefaults(), o = db.settings.email || {}; const out = {};
  EMAIL_KEYS.forEach(k => { out[k] = o[k] != null && o[k] !== '' ? o[k] : d[k]; });
  out.pass = String(o.pass || ENV.SMTP_PASS || '').replace(/\s+/g, '');          // Google shows app passwords as 4 groups of 4
  return out;
}
function emailReady() { const e = mailConfig(); return !!(e.host && e.fromEmail && (!e.user || e.pass)); }
let LOGO_PNG = null; try { LOGO_PNG = fs.readFileSync(path.join(PUBLIC, 'email-logo.png')); } catch (e) { /* optional */ }
function friendlySmtp(e, host) {
  const m = String(e && e.message || e);
  if (/535|534|Username and Password not accepted|Application-specific password/i.test(m) && /gmail|google/i.test(host)) return m + ' — Gmail needs an App Password (Google account → Security → 2-Step Verification → App passwords), not the normal account password.';
  if (/ENOTFOUND|EAI_AGAIN/.test(m)) return `Can’t find the mail server “${host}”. Check the SMTP server name and this machine’s internet connection.`;
  if (/ECONNREFUSED|timed out|ETIMEDOUT/i.test(m)) return `Can’t connect to ${host}. Check the port/security setting and that your network allows outgoing mail.`;
  return m;
}
async function deliver(to, toName, msg) {
  const e = mailConfig(); if (!emailReady()) throw new Error('Email isn’t set up yet (Admin → Email).');
  try { return await sendMailRaw(e, to, toName, msg); } catch (x) { throw new Error(friendlySmtp(x, e.host)); }
}
function sendMailRaw(e, to, toName, msg) {
  return sendMail({ host: e.host, port: +e.port, security: e.security, user: e.user, pass: e.pass, fromName: e.fromName || db.settings.appName, fromEmail: e.fromEmail, to, toName,
    subject: msg.subject, text: msg.text, html: msg.html, attachments: LOGO_PNG ? [{ filename: 'forge90.png', contentType: 'image/png', cid: 'logo@forge90', content: LOGO_PNG }] : [] });
}
async function sendReset(user, reason, req, extra = {}) {
  const tok = crypto.randomBytes(32).toString('base64url');
  db.resets.forEach(r => { if (r.userId === user.id && !r.usedAt) r.usedAt = -1; });           // older links stop working
  const expiresAt = now() + RESET_MINUTES * 60000;
  db.resets.push({ h: sha256(tok), userId: user.id, createdAt: now(), expiresAt, usedAt: null, reason, ip: clientIp(req) });
  saveDb();
  const link = `${baseUrl(req)}/reset?token=${tok}`;
  const msg = MAIL.resetEmail({ name: user.name, link, minutes: RESET_MINUTES, expiresAt: new Date(expiresAt), reason, attempts: extra.attempts, ip: clientIp(req), ua: req.headers['user-agent'], appUrl: baseUrl(req), appName: db.settings.appName });
  try { await deliver(user.email, user.name, msg); audit('reset_email_sent', { userId: user.id, actorId: extra.actorId || null, ip: clientIp(req), detail: reason }); return { sent: true }; }
  catch (e) { audit('reset_email_failed', { userId: user.id, actorId: extra.actorId || null, ip: clientIp(req), detail: `${reason}: ${e.message}` }); console.error('[email] reset to', user.email, 'failed:', e.message); return { sent: false, error: e.message }; }
}
function notifyPasswordChanged(user, req, via) {
  if (!db.settings.security.notifyPasswordChange || (user.notify && user.notify.passwordChange === false) || !emailReady()) return;
  deliver(user.email, user.name, MAIL.passwordChangedEmail({ name: user.name, when: new Date(), ip: clientIp(req), appUrl: baseUrl(req), appName: db.settings.appName, via }))
    .catch(e => audit('email_failed', { userId: user.id, detail: 'password-changed notice: ' + e.message }));
}

/* ---------- HTTP plumbing ---------- */
const SEC_HEADERS = {
  'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer', 'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'"
};
function send(res, code, obj, headers = {}) { const body = JSON.stringify(obj); res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, SEC_HEADERS, headers)); res.end(body); }
class HttpErr extends Error { constructor(code, msg, extra) { super(msg); this.code = code; this.extra = extra; } }
const err = (code, msg, extra) => { throw new HttpErr(code, msg, extra); };
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new HttpErr(413, 'That request is too large.')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { if (!chunks.length) return resolve({}); try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (e) { reject(new HttpErr(400, 'Invalid JSON')); } });
    req.on('error', reject);
  });
}
const MIME = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };
function serveStatic(req, res, pathname) {
  let file = pathname === '/' || !path.extname(pathname) ? path.join(PUBLIC, 'index.html') : path.join(PUBLIC, path.normalize(pathname).replace(/^([/\\])+/, ''));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (e, buf) => {
    if (e) { res.writeHead(404, SEC_HEADERS); return res.end('Not found'); }
    res.writeHead(200, Object.assign({ 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': file.endsWith('.html') ? 'no-store' : 'public, max-age=86400' }, SEC_HEADERS));
    res.end(req.method === 'HEAD' ? undefined : buf);
  });
}

/* ---------- routes ---------- */
const routes = [];
const route = (method, pattern, opts, fn) => { if (typeof opts === 'function') { fn = opts; opts = {}; } routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), opts, fn }); };
function publicConfig() { const s = db.settings; return { appName: s.appName, defaults: s.defaults, inviteDays: INVITE_DAYS, version: VERSION, pwMinLength: s.security.pwMinLength, pwRequireMix: !!s.security.pwRequireMix, emailReady: emailReady(), resetMinutes: RESET_MINUTES, rememberDays: s.security.rememberDays }; }

route('GET', '/api/health', async (req, res) => send(res, 200, { ok: true, version: VERSION, uptime: Math.round(process.uptime()) }));
route('GET', '/api/session', async (req, res, ctx) => send(res, 200, { user: ctx.me ? pubUser(ctx.me.u) : null, config: publicConfig() }));

/* invitations — the only way new accounts are created */
function findInvite(tok) { const h = sha256(String(tok || '')); const i = db.invites.find(x => x.h === h); return i && i.expiresAt > now() ? i : null; }
route('GET', '/api/invite/:token', async (req, res, ctx) => {
  const i = findInvite(ctx.params.token); if (!i) err(410, 'This invite has expired or was already used. Ask your administrator to send a new one.');
  send(res, 200, { email: i.email, name: i.name || '', role: i.role, expiresAt: i.expiresAt, invitedBy: (userById(i.invitedBy) || {}).name || 'An administrator', exists: !!findUser(i.email) });
});
route('POST', '/api/invite/accept', { limit: 'auth' }, async (req, res, ctx) => {
  const b = ctx.body; const i = findInvite(b.token); if (!i) err(410, 'This invite has expired or was already used. Ask your administrator to send a new one.');
  if (findUser(i.email)) { db.invites = db.invites.filter(x => x !== i); saveDb(); err(409, 'An account already exists for this email. Sign in, or use “Forgot password”.'); }
  const name = String(b.name || i.name || i.email.split('@')[0]).trim().slice(0, 80);
  const pp = pwProblem(b.password, i.email); if (pp) err(400, pp);
  const nm = String(i.name || '').trim().split(/\s+/);
  const u = { id: uid(), email: i.email, name, firstName: i.name ? nm[0] : '', lastName: i.name ? nm.slice(1).join(' ') : '', role: i.role === 'admin' ? 'admin' : 'user', status: 'active', pw: await hashPw(b.password), mustChange: false, createdAt: now(), pwChangedAt: now(), invitedBy: i.invitedBy || null, failed: 0, lockedUntil: null, notify: { passwordChange: true } };
  db.users.push(u); db.invites = db.invites.filter(x => x !== i);
  audit('invite_accepted', { userId: u.id, actorId: i.invitedBy || null, ip: clientIp(req), detail: `${u.email} (${u.role})` });
  u.lastLoginAt = now(); u.lastLoginIp = clientIp(req); createSession(req, res, u, !!b.remember); send(res, 201, { user: pubUser(u) });
});

route('POST', '/api/login', { limit: 'auth' }, async (req, res, ctx) => {
  const b = ctx.body; const ip = clientIp(req); const sec = db.settings.security;
  const u = findUser(b.email);
  if (!u) { await verifyPw(String(b.password || ''), DUMMY_HASH); audit('login_fail', { ip, detail: 'unknown ' + normEmail(b.email).slice(0, 80) }); err(401, 'That email and password don’t match.'); }
  if (isLocked(u)) { const m = Math.max(1, Math.ceil((u.lockedUntil - now()) / 60000)); err(423, `This account is locked after too many sign-in attempts. Try again in ${m} minute${m === 1 ? '' : 's'}, or reset your password${sec.autoResetOnLock ? ' with the link we emailed' : ''}.`, { locked: true, until: u.lockedUntil }); }
  const ok = await verifyPw(String(b.password || ''), u.pw);
  if (!ok) {
    u.failed = (u.failed || 0) + 1; audit('login_fail', { userId: u.id, ip, detail: `attempt ${u.failed}` });
    if (u.failed >= sec.lockThreshold) {
      const attempts = u.failed; u.lockedUntil = now() + sec.lockMinutes * 60000; u.failed = 0; audit('locked', { userId: u.id, ip, detail: `${attempts} failed attempts · ${sec.lockMinutes} min` }); saveDb();
      let sent = false; if (sec.autoResetOnLock && u.status !== 'disabled') sent = (await sendReset(u, 'lockout', req, { attempts })).sent;
      err(423, `Too many attempts — this account is locked for ${sec.lockMinutes} minutes.${sent ? ' We emailed a password-reset link to the account’s address.' : ''}`, { locked: true, until: u.lockedUntil, resetSent: sent });
    }
    saveDb(); const left = sec.lockThreshold - u.failed;
    err(401, `That email and password don’t match.${left <= 2 ? ` ${left} attempt${left === 1 ? '' : 's'} left before the account is locked.` : ''}`);
  }
  if (u.status === 'pending') err(403, 'Your account is waiting for an administrator to approve it.');
  if (u.status === 'disabled') err(403, 'This account has been disabled. Contact your FORGE 90 administrator.');
  u.failed = 0; u.lockedUntil = null; u.lastLoginAt = now(); u.lastLoginIp = ip;
  createSession(req, res, u, !!b.remember); audit('login_ok', { userId: u.id, ip }); send(res, 200, { user: pubUser(u) });
});

route('POST', '/api/logout', async (req, res, ctx) => { if (ctx.me) { db.sessions = db.sessions.filter(s => s !== ctx.me.s); saveDb(); audit('logout', { userId: ctx.me.u.id, ip: clientIp(req) }); } setCookie(res, req, '', 0); send(res, 200, { ok: true }); });

route('POST', '/api/forgot', { limit: 'auth' }, async (req, res, ctx) => {
  const email = normEmail(ctx.body.email); if (!validEmail(email)) err(400, 'Enter the email address you signed up with.');
  const u = findUser(email); audit('reset_requested', { userId: u ? u.id : null, ip: clientIp(req), detail: u ? '' : 'unknown ' + email.slice(0, 80) });
  if (u && u.status !== 'disabled' && !limited('forgot:' + u.id, 3, 3600000)) {
    const recent = db.resets.find(r => r.userId === u.id && now() - r.createdAt < 60000);
    if (!recent) await sendReset(u, 'forgot', req);
  }
  send(res, 200, { ok: true, minutes: RESET_MINUTES });           // same answer whether or not the account exists
});
function findReset(tok) { const h = sha256(String(tok || '')); const r = db.resets.find(x => x.h === h); if (!r || r.usedAt || r.expiresAt < now()) return null; const u = userById(r.userId); return u && u.status !== 'disabled' ? { r, u } : null; }
route('GET', '/api/reset/:token', async (req, res, ctx) => { const f = findReset(ctx.params.token); if (!f) err(410, 'This reset link has expired or was already used. Request a new one.'); send(res, 200, { ok: true, email: maskEmail(f.u.email), expiresAt: f.r.expiresAt }); });
route('POST', '/api/reset', { limit: 'auth' }, async (req, res, ctx) => {
  const f = findReset(ctx.body.token); if (!f) err(410, 'This reset link has expired or was already used. Request a new one.');
  const pp = pwProblem(ctx.body.password, f.u.email); if (pp) err(400, pp);
  f.u.pw = await hashPw(ctx.body.password); f.u.mustChange = false; f.u.failed = 0; f.u.lockedUntil = null; f.u.pwChangedAt = now();
  f.r.usedAt = now(); revokeSessions(f.u.id); audit('reset_done', { userId: f.u.id, ip: clientIp(req) });
  notifyPasswordChanged(f.u, req, 'reset');
  if (f.u.status === 'active') { f.u.lastLoginAt = now(); createSession(req, res, f.u, false); return send(res, 200, { user: pubUser(f.u) }); }
  send(res, 200, { ok: true, pending: f.u.status === 'pending' });
});

/* per-user plan data */
route('GET', '/api/state', { auth: true }, async (req, res, ctx) => send(res, 200, readState(ctx.me.u.id)));
route('PUT', '/api/state', { auth: true, limit: 'state' }, async (req, res, ctx) => {
  const cur = readState(ctx.me.u.id); const b = ctx.body;
  if (!b.state || typeof b.state !== 'object') err(400, 'Missing state');
  if (b.baseRev != null && +b.baseRev !== +cur.rev && !b.force) return send(res, 409, cur);
  const next = { rev: (cur.rev || 0) + 1, updatedAt: now(), state: b.state };
  writeAtomic(stateFile(ctx.me.u.id), JSON.stringify(next)); send(res, 200, { rev: next.rev, updatedAt: next.updatedAt });
});

/* personal account */
function sessionList(userId, curId) { return db.sessions.filter(s => s.userId === userId && s.expiresAt > now()).sort((a, b) => b.lastSeen - a.lastSeen).map(s => ({ id: s.id, current: s.id === curId, createdAt: s.createdAt, lastSeen: s.lastSeen, ip: s.ip, ua: s.ua, remember: s.remember, expiresAt: s.expiresAt })); }
route('GET', '/api/account', { auth: true, allowMustChange: true }, async (req, res, ctx) => {
  const u = ctx.me.u; const st = readState(u.id);
  send(res, 200, { user: pubUser(u), sessions: sessionList(u.id, ctx.me.s.id), events: db.audit.filter(a => a.userId === u.id).slice(-40).reverse(), data: { rev: st.rev, updatedAt: st.updatedAt, bytes: st.state ? JSON.stringify(st.state).length : 0 }, pwChangedAt: u.pwChangedAt || u.createdAt, config: publicConfig() });
});
route('PATCH', '/api/account', { auth: true, allowMustChange: true }, async (req, res, ctx) => {
  const u = ctx.me.u, b = ctx.body; const changes = [];
  if (b.name != null) { const n = String(b.name).trim().slice(0, 80); if (!n) err(400, 'Display name can’t be empty.'); if (n !== u.name) { u.name = n; changes.push('display name'); } }
  ['firstName', 'lastName'].forEach(k => { if (b[k] != null) { const v = String(b[k]).trim().slice(0, 40); if (v !== (u[k] || '')) { u[k] = v; changes.push(k === 'firstName' ? 'first name' : 'last name'); } } });
  if (b.notify && typeof b.notify === 'object') { u.notify = Object.assign({ passwordChange: true, newSignIn: false }, u.notify || {}, { passwordChange: !!b.notify.passwordChange, newSignIn: !!b.notify.newSignIn }); changes.push('notifications'); }
  if (b.email != null && normEmail(b.email) !== u.email) {
    const e = normEmail(b.email); if (!validEmail(e)) err(400, 'Enter a valid email address.');
    if (!u.mustChange && !(await verifyPw(String(b.currentPassword || ''), u.pw))) err(403, 'Your current password is needed to change your email — and it didn’t match.');
    if (findUser(e)) err(409, 'Another account already uses that email.');
    const old = u.email; u.email = e; changes.push('email');
    audit('email_changed', { userId: u.id, ip: clientIp(req), detail: `${old} → ${e}` });
    if (emailReady() && !u.mustChange) deliver(old, u.name, MAIL.simpleEmail({ title: 'Your FORGE 90 email address was changed', heading: 'Your sign-in email was changed', lines: [`Your FORGE 90 account now signs in with ${e}.`, 'If you didn’t make this change, contact your administrator right away.'], appUrl: baseUrl(req), appName: db.settings.appName })).catch(() => {});
  }
  saveDb(); if (changes.length) audit('profile_updated', { userId: u.id, ip: clientIp(req), detail: changes.join(', ') });
  send(res, 200, { user: pubUser(u) });
});
/* ---------- profile pictures: DATA/avatars/<userId>-<version>.<ext> — a new upload deletes the old file ---------- */
const AVATAR_DIR = path.join(DATA, 'avatars'); fs.mkdirSync(AVATAR_DIR, { recursive: true });
const AVATAR_MAX = 512 * 1024;
const AVATAR_TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const avatarPath = u => u && u.avatar ? path.join(AVATAR_DIR, path.basename(String(u.avatar))) : null;
function removeAvatar(u) { const f = avatarPath(u); if (f) { try { fs.unlinkSync(f); } catch (e) { /* already gone */ } } delete u.avatar; delete u.avatarV; }
function imageExt(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}
route('PUT', '/api/account/avatar', { auth: true, maxBody: 1024 * 1024 }, async (req, res, ctx) => {
  const u = ctx.me.u; if (limited('avatar:' + u.id, 30, 60 * 60000)) err(429, 'Too many picture changes. Try again later.');
  const m = String(ctx.body.data || '').match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/); if (!m) err(400, 'Upload a JPEG, PNG or WebP image.');
  const buf = Buffer.from(m[2], 'base64'); if (!buf.length) err(400, 'That image is empty.'); if (buf.length > AVATAR_MAX) err(413, 'That picture is too large (512 KB max).');
  const ext = imageExt(buf); if (!ext) err(400, 'That file isn’t a JPEG, PNG or WebP image.');
  const v = Date.now().toString(36); const name = `${u.id.replace(/[^A-Za-z0-9_-]/g, '')}-${v}.${ext}`;
  writeAtomic(path.join(AVATAR_DIR, name), buf);
  const had = !!u.avatar; removeAvatar(u);                 // the old picture is deleted, not kept
  u.avatar = name; u.avatarV = v; saveDb();
  audit('avatar_changed', { userId: u.id, ip: clientIp(req), detail: had ? 'replaced' : 'added' });
  send(res, 200, { user: pubUser(u) });
});
route('DELETE', '/api/account/avatar', { auth: true }, async (req, res, ctx) => {
  const u = ctx.me.u; if (u.avatar) { removeAvatar(u); saveDb(); audit('avatar_changed', { userId: u.id, ip: clientIp(req), detail: 'removed' }); }
  send(res, 200, { user: pubUser(u) });
});
route('GET', '/api/avatar/:id', { auth: true }, async (req, res, ctx) => {
  const u = userById(ctx.params.id); const f = avatarPath(u); if (!f || (ctx.query.v && ctx.query.v !== u.avatarV)) err(404, 'No picture.');   // an old version's URL stops working once it's replaced
  let buf; try { buf = fs.readFileSync(f); } catch (e) { err(404, 'No picture.'); }
  const type = AVATAR_TYPES[path.extname(f).slice(1)] || 'application/octet-stream';
  res.writeHead(200, Object.assign({}, SEC_HEADERS, { 'Content-Type': type, 'Content-Length': buf.length, 'Cache-Control': 'private, max-age=31536000, immutable', 'Content-Security-Policy': "default-src 'none'" }));
  res.end(buf);
});
route('POST', '/api/account/password', { auth: true, allowMustChange: true, limit: 'auth' }, async (req, res, ctx) => {
  const u = ctx.me.u, b = ctx.body;
  if (!(await verifyPw(String(b.current || ''), u.pw))) err(403, 'Your current password didn’t match.');
  const pp = pwProblem(b.next, u.email); if (pp) err(400, pp);
  if (await verifyPw(String(b.next), u.pw)) err(400, 'Choose a password you haven’t just used.');
  u.pw = await hashPw(b.next); u.mustChange = false; u.pwChangedAt = now();
  const n = revokeSessions(u.id, ctx.me.s.id); audit('password_changed', { userId: u.id, ip: clientIp(req), detail: n ? `${n} other session(s) signed out` : '' });
  notifyPasswordChanged(u, req, 'user'); send(res, 200, { user: pubUser(u), signedOut: n });
});
route('DELETE', '/api/account/sessions/:id', { auth: true }, async (req, res, ctx) => {
  const s = db.sessions.find(x => x.id === ctx.params.id && x.userId === ctx.me.u.id); if (!s) err(404, 'Session not found.');
  db.sessions = db.sessions.filter(x => x !== s); saveDb(); audit('session_revoked', { userId: ctx.me.u.id, ip: clientIp(req) });
  if (s === ctx.me.s) setCookie(res, req, '', 0); send(res, 200, { ok: true, self: s === ctx.me.s });
});
route('POST', '/api/account/sessions/revoke-others', { auth: true }, async (req, res, ctx) => { const n = revokeSessions(ctx.me.u.id, ctx.me.s.id); audit('sessions_revoked', { userId: ctx.me.u.id, ip: clientIp(req), detail: `${n} session(s)` }); send(res, 200, { revoked: n }); });
route('DELETE', '/api/account', { auth: true, limit: 'auth' }, async (req, res, ctx) => {
  const u = ctx.me.u; if (!(await verifyPw(String(ctx.body.password || ''), u.pw))) err(403, 'Your password didn’t match.');
  if (u.role === 'admin' && admins().length <= 1) err(400, 'You’re the only administrator. Make someone else an admin before deleting your account.');
  deleteUser(u); audit('account_deleted', { userId: u.id, ip: clientIp(req), detail: u.email }); setCookie(res, req, '', 0); send(res, 200, { ok: true });
});
function deleteUser(u) { removeAvatar(u); const sy = syncOf(u.id); if (sy) dropSync(sy); db.users = db.users.filter(x => x !== u); db.sessions = db.sessions.filter(s => s.userId !== u.id); db.resets = db.resets.filter(r => r.userId !== u.id); try { fs.unlinkSync(stateFile(u.id)); } catch (e) { /* none */ } saveDb(); }

/* ---------- meal-plan sync between two accounts ----------
   A sync links two users. Both agree which meal slots are shared. `agreed` holds the shared meal for every
   date|slot; an edit by either side becomes a pending change that the partner accepts (both match again)
   or declines (that meal stays different for that day — `div` remembers it so it isn't re-sent). */
const SYNC_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2'];
const SYNC_DIR = path.join(DATA, 'sync'); fs.mkdirSync(SYNC_DIR, { recursive: true });
const snapFile = (sid, userId) => path.join(SYNC_DIR, `${String(sid).replace(/[^A-Za-z0-9_-]/g, '')}-${String(userId).replace(/[^A-Za-z0-9_-]/g, '')}.json`);
const isoDate = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const ridOk = r => r === null || (typeof r === 'string' && /^[A-Za-z0-9_.:-]{1,80}$/.test(r));
const syncOf = userId => db.syncs.find(s => s.a === userId || s.b === userId);
const partnerId = (s, me) => s.a === me ? s.b : s.a;
function cleanSlots(o) { const out = {}; SYNC_SLOTS.forEach(k => { out[k] = !!(o && o[k]); }); if (!SYNC_SLOTS.some(k => out[k])) err(400, 'Share at least one meal.'); return out; }
function syncEvent(s, by, type, text) { s.events.push({ id: uid(), t: now(), by, type, text: String(text).slice(0, 300) }); if (s.events.length > 40) s.events.splice(0, s.events.length - 40); }
function bumpSync(s) { s.rev = (s.rev || 0) + 1; saveDb(); }
function dropSync(s) { db.syncs = db.syncs.filter(x => x !== s); [s.a, s.b].forEach(u => { try { fs.unlinkSync(snapFile(s.id, u)); } catch (e) { /* none */ } }); saveDb(); }
function pruneSync(s) {                          // forget days that are over
  const cut = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
  let n = 0; Object.keys(s.agreed).forEach(k => { if (k.slice(0, 10) < cut) { delete s.agreed[k]; n++; } }); Object.keys(s.div).forEach(k => { if (k.slice(0, 10) < cut) delete s.div[k]; });
  const before = s.changes.length; s.changes = s.changes.filter(c => c.date >= cut); return n || before !== s.changes.length;
}
function syncView(s, me) {
  const p = userById(partnerId(s, me)); let snapAt = null; try { snapAt = fs.statSync(snapFile(s.id, partnerId(s, me))).mtimeMs; } catch (e) { /* none yet */ }
  return { id: s.id, status: s.status, role: s.by === me ? 'requester' : 'recipient', partner: p ? { id: p.id, name: p.name, email: p.email, avatarUrl: avatarUrl(p) } : null,
    slots: s.slots, slotReq: s.slotReq, since: s.since, agreed: s.agreed, through: s.through, div: s.div, baseRev: s.baseRev, rev: s.rev,
    changesIn: s.changes.filter(c => c.from !== me), changesOut: s.changes.filter(c => c.from === me), events: s.events.slice(-20), grocery: s.grocery, pantry: { on: !!(s.pantry && s.pantry.on), items: (s.pantry && s.pantry.on && s.pantry.items) || [], rev: (s.pantry && s.pantry.rev) || 0, by: (s.pantry && s.pantry.by) || null }, partnerSnapAt: snapAt, createdAt: s.createdAt, activeAt: s.activeAt };
}
function syncMail(req, to, subject, heading, lines, label) {
  if (!to || !emailReady()) return;
  deliver(to.email, to.name, MAIL.simpleEmail({ title: subject, heading, lines, buttonUrl: baseUrl(req) + '/#/account', buttonLabel: label || 'Open FORGE 90', appUrl: baseUrl(req), appName: db.settings.appName })).catch(e => audit('email_failed', { userId: to.id, detail: 'sync notice: ' + e.message }));
}
const needSync = (ctx, status) => { const s = syncOf(ctx.me.u.id); if (!s || (status && s.status !== status)) err(409, status === 'active' ? 'Meal sync isn’t active.' : 'No meal sync request found.'); return s; };
route('GET', '/api/sync', { auth: true }, async (req, res, ctx) => {
  const s = syncOf(ctx.me.u.id); if (!s) return send(res, 200, { sync: null });
  if (pruneSync(s)) bumpSync(s);
  if (ctx.query.rev && +ctx.query.rev === s.rev) return send(res, 200, { unchanged: true, rev: s.rev });
  send(res, 200, { sync: syncView(s, ctx.me.u.id) });
});
route('POST', '/api/sync/request', { auth: true, limit: 'auth' }, async (req, res, ctx) => {
  const me = ctx.me.u; const email = normEmail(ctx.body.email);
  if (syncOf(me.id)) err(409, 'You already have a meal sync (or a pending request). End it first.');
  if (!validEmail(email)) err(400, 'Enter your partner’s email address.');
  const p = findUser(email); if (!p || p.status !== 'active') err(404, 'No active FORGE 90 account uses that email. Ask an administrator to invite them first.');
  if (p.id === me.id) err(400, 'That’s your own email.');
  if (syncOf(p.id)) err(409, `${p.name} is already syncing meal plans with someone else.`);
  const s = { id: uid(), a: me.id, b: p.id, by: me.id, status: 'pending', slots: cleanSlots(ctx.body.slots || { breakfast: 1, lunch: 1, dinner: 1, snack1: 1, snack2: 1 }), slotReq: null, createdAt: now(), activeAt: null,
    since: null, agreed: {}, through: null, div: {}, baseRev: 0, rev: 1, changes: [], events: [], grocery: {} };
  db.syncs.push(s); syncEvent(s, me.id, 'request', `${me.name} asked to sync meal plans`); saveDb();
  audit('sync_requested', { userId: me.id, ip: clientIp(req), detail: 'with ' + p.email });
  syncMail(req, p, `${me.name} wants to sync meal plans with you`, 'Sync meal plans?', [`${me.name} (${me.email}) wants to sync FORGE 90 meal plans with you.`, 'You’d share the meals you both agree on, get one combined shopping list, and approve each other’s changes. Accept or decline it in Account settings.'], 'Review the request');
  send(res, 201, { sync: syncView(s, me.id) });
});
route('POST', '/api/sync/respond', { auth: true }, async (req, res, ctx) => {
  const me = ctx.me.u; const s = needSync(ctx, 'pending'); if (s.by === me.id) err(403, 'Waiting for your partner to answer.');
  const p = userById(s.by);
  if (!ctx.body.accept) { dropSync(s); audit('sync_declined', { userId: me.id, ip: clientIp(req), detail: p ? p.email : '' }); if (p) syncMail(req, p, `${me.name} declined meal-plan sync`, 'Sync request declined', [`${me.name} declined your request to sync meal plans.`]); return send(res, 200, { sync: null }); }
  if (!isoDate(ctx.body.since)) err(400, 'Missing start date.');
  Object.assign(s, { status: 'active', activeAt: now(), since: ctx.body.since }); if (ctx.body.slots) s.slots = cleanSlots(ctx.body.slots);
  syncEvent(s, me.id, 'active', `${me.name} accepted — meal plans are synced`); bumpSync(s);
  audit('sync_started', { userId: me.id, ip: clientIp(req), detail: p ? 'with ' + p.email : '' });
  if (p) syncMail(req, p, `${me.name} accepted meal-plan sync`, 'Your meal plans are synced', [`${me.name} accepted — your shared meals and shopping list are now combined.`, 'Changes either of you make to a shared meal show up for the other person to accept.']);
  send(res, 200, { sync: syncView(s, me.id) });
});
route('DELETE', '/api/sync', { auth: true }, async (req, res, ctx) => {      // cancel a request or unsync
  const me = ctx.me.u; const s = needSync(ctx); const p = userById(partnerId(s, me.id)); const was = s.status;
  dropSync(s); audit(was === 'active' ? 'sync_ended' : 'sync_cancelled', { userId: me.id, ip: clientIp(req), detail: p ? p.email : '' });
  if (p && was === 'active') syncMail(req, p, `${me.name} stopped syncing meal plans`, 'Meal sync ended', [`${me.name} stopped syncing meal plans with you. Your current meals stay as they are, and from now on your plans change independently.`]);
  send(res, 200, { sync: null });
});
route('POST', '/api/sync/slots', { auth: true }, async (req, res, ctx) => {    // propose / approve / decline a change to the shared meals
  const me = ctx.me.u; const s = needSync(ctx, 'active'); const b = ctx.body;
  if (b.approve != null) {
    if (!s.slotReq || s.slotReq.by === me.id) err(409, 'There’s no change to approve.');
    if (b.approve) { const old = s.slots; s.slots = s.slotReq.slots; SYNC_SLOTS.forEach(k => { if (old[k] && !s.slots[k]) { Object.keys(s.agreed).forEach(x => { if (x.endsWith('|' + k)) delete s.agreed[x]; }); s.changes = s.changes.filter(c => c.slot !== k); } }); syncEvent(s, me.id, 'slots', `${me.name} approved the new shared meals`); }
    else syncEvent(s, me.id, 'slots', `${me.name} kept the shared meals as they were`);
    s.slotReq = null; bumpSync(s); return send(res, 200, { sync: syncView(s, me.id) });
  }
  const want = cleanSlots(b.slots); if (SYNC_SLOTS.every(k => want[k] === s.slots[k])) { s.slotReq = null; bumpSync(s); return send(res, 200, { sync: syncView(s, me.id) }); }
  s.slotReq = { slots: want, by: me.id, at: now() }; syncEvent(s, me.id, 'slots', `${me.name} asked to change which meals are shared`); bumpSync(s);
  send(res, 200, { sync: syncView(s, me.id) });
});
route('PUT', '/api/sync/snapshot', { auth: true, limit: 'state' }, async (req, res, ctx) => {  // my shared-meal portions, so the partner's shopping list can include them
  const s = needSync(ctx); const snap = ctx.body.snap; if (!snap || typeof snap !== 'object') err(400, 'Missing snapshot');
  writeAtomic(snapFile(s.id, ctx.me.u.id), JSON.stringify(Object.assign(snap, { at: now() }))); bumpSync(s); send(res, 200, { ok: true, rev: s.rev });
});
route('GET', '/api/sync/partner', { auth: true }, async (req, res, ctx) => {
  const s = needSync(ctx); let snap = null; try { snap = JSON.parse(fs.readFileSync(snapFile(s.id, partnerId(s, ctx.me.u.id)), 'utf8')); } catch (e) { /* not yet */ } send(res, 200, { snap });
});
route('POST', '/api/sync/baseline', { auth: true, limit: 'state' }, async (req, res, ctx) => {   // shared meals planned together (start of sync, new weeks, newly shared meals)
  const me = ctx.me.u; const s = needSync(ctx, 'active'); const b = ctx.body;
  if (b.baseRev != null && +b.baseRev !== s.baseRev) return send(res, 409, { sync: syncView(s, me.id) });
  if (!b.meals || typeof b.meals !== 'object') err(400, 'Missing meals');
  let n = 0; for (const [k, rid] of Object.entries(b.meals)) { const [d, sl] = k.split('|'); if (!isoDate(d) || !SYNC_SLOTS.includes(sl) || !s.slots[sl] || !ridOk(rid)) continue; s.agreed[k] = rid; delete s.div[k]; n++; if (n > 5000) break; }
  if (isoDate(b.through) && (!s.through || b.through > s.through)) s.through = b.through;
  s.changes = s.changes.filter(c => !(b.meals[c.date + '|' + c.slot] !== undefined));
  s.baseRev++; bumpSync(s); send(res, 200, { sync: syncView(s, me.id) });
});
route('POST', '/api/sync/changes', { auth: true, limit: 'state' }, async (req, res, ctx) => {    // my edits to shared meals
  const me = ctx.me.u; const s = needSync(ctx, 'active'); const list = Array.isArray(ctx.body.changes) ? ctx.body.changes.slice(0, 400) : [];
  let n = 0;
  list.forEach(c => {
    if (!c || !isoDate(c.date) || !SYNC_SLOTS.includes(c.slot) || !s.slots[c.slot] || !ridOk(c.rid) || c.date < s.since) return;
    const k = c.date + '|' + c.slot; s.changes = s.changes.filter(x => !(x.from === me.id && x.date === c.date && x.slot === c.slot));
    if (c.rid === (s.agreed[k] === undefined ? null : s.agreed[k])) { n++; return; }                 // back to the shared meal → nothing to approve
    delete s.div[k];
    const rec = c.recipe && typeof c.recipe === 'object' && JSON.stringify(c.recipe).length < 20000 ? c.recipe : null;
    const foods = c.foods && typeof c.foods === 'object' && JSON.stringify(c.foods).length < 40000 ? c.foods : null;
    s.changes.push({ id: uid(), from: me.id, date: c.date, slot: c.slot, rid: c.rid, prev: s.agreed[k] === undefined ? null : s.agreed[k], name: String(c.name || '').slice(0, 120), emoji: String(c.emoji || '').slice(0, 8), prevName: String(c.prevName || '').slice(0, 120), recipe: rec, foods, at: now() }); n++;
  });
  if (s.changes.length > 1500) s.changes.splice(0, s.changes.length - 1500);
  if (n) bumpSync(s); send(res, 200, { sync: syncView(s, me.id) });
});
route('POST', '/api/sync/resolve', { auth: true }, async (req, res, ctx) => {    // accept / decline the partner's changes, or cancel my own
  const me = ctx.me.u; const s = needSync(ctx, 'active'); const b = ctx.body; const ids = new Set(Array.isArray(b.ids) ? b.ids : []);
  if (!['accept', 'decline', 'cancel'].includes(b.action)) err(400, 'Unknown action');
  const done = []; const pn = (userById(partnerId(s, me.id)) || {}).name || 'Your partner';
  s.changes.filter(c => ids.has(c.id)).forEach(c => {
    const mine = c.from === me.id; if (b.action === 'cancel' ? !mine : mine) return;
    const k = c.date + '|' + c.slot;
    if (b.action === 'accept') { s.agreed[k] = c.rid; delete s.div[k]; s.changes = s.changes.filter(x => !(x.date === c.date && x.slot === c.slot)); }
    else { if (b.action === 'decline') s.div[k] = c.rid; s.changes = s.changes.filter(x => x !== c); }
    done.push(c);
  });
  if (done.length) {
    const lbl = c => `${c.date.slice(5).replace('-', '/')} ${c.slot.replace(/\d$/, ' $&').replace('snack 1', 'snack')}`;
    if (b.action !== 'cancel') syncEvent(s, me.id, b.action, `${me.name} ${b.action === 'accept' ? 'accepted' : 'declined'} ${done.length === 1 ? `${lbl(done[0])} → ${done[0].name || done[0].rid}` : done.length + ' changes'}`);
    bumpSync(s);
  }
  send(res, 200, { done, sync: syncView(s, me.id) });
});
route('PUT', '/api/sync/grocery', { auth: true }, async (req, res, ctx) => {       // shared shopping-list check-offs
  // { week, id, got } for one tick, or { week, set: { id: 1 | 0 | null } } for many (0 = unticked on purpose, for items the pantry covers)
  const s = needSync(ctx, 'active'); const b = ctx.body;
  const changes = b.set && typeof b.set === 'object' && !Array.isArray(b.set) ? Object.entries(b.set).slice(0, 500) : Array.isArray(b.ids) ? b.ids.slice(0, 500).map(id => [id, b.got ? 1 : null]) : [[b.id, b.got ? 1 : null]];
  if (!isoDate(b.week) || !changes.length || changes.some(([id, v]) => typeof id !== 'string' || !/^[A-Za-z0-9_.:-]{1,80}$/.test(id) || /^(__proto__|constructor|prototype)$/.test(id) || ![1, 0, null, true, false].includes(v))) err(400, 'Bad item');
  const w = s.grocery[b.week] = s.grocery[b.week] || {}; changes.forEach(([id, v]) => { if (v === null || v === false) delete w[id]; else w[id] = v ? 1 : 0; });
  const weeks = Object.keys(s.grocery).sort(); while (weeks.length > 20) delete s.grocery[weeks.shift()];
  bumpSync(s); send(res, 200, { ok: true, rev: s.rev });
});

/* shared household pantry (optional, either synced user can switch it on or off) */
const PANTRY_MAX = 600;
function cleanPantryItem(it) {
  if (!it || typeof it !== 'object') err(400, 'Bad pantry item');
  const id = String(it.id || ''); const food = String(it.food || '');
  if (!/^[A-Za-z0-9_.:-]{1,60}$/.test(id) || !/^[A-Za-z0-9_.:-]{1,80}$/.test(food) || /^(__proto__|constructor|prototype)$/.test(food)) err(400, 'Bad pantry item');
  const qty = Math.max(0, Math.min(1e6, +it.qty || 0)); const exp = it.exp && isoDate(it.exp) ? it.exp : null; const added = isoDate(it.added) ? it.added : new Date().toISOString().slice(0, 10);
  return { id, food, qty: Math.round(qty * 100) / 100, exp, added, by: null };
}
route('POST', '/api/sync/pantry/share', { auth: true }, async (req, res, ctx) => {
  const s = needSync(ctx, 'active'); const on = !!ctx.body.on; const me = ctx.me.u;
  s.pantry = s.pantry || { on: false, items: [], used: {}, rev: 0 };
  const prev = s.pantry.items.slice();
  if (on && !s.pantry.on) { s.pantry.on = true; s.pantry.items = []; s.pantry.used = {}; }
  if (!on && s.pantry.on) { s.pantry.on = false; s.pantry.items = []; }
  s.pantry.by = me.id; s.pantry.rev = (s.pantry.rev || 0) + 1;
  syncEvent(s, me.id, 'pantry', on ? `${me.name} started sharing the pantry` : `${me.name} stopped sharing the pantry`); bumpSync(s);
  send(res, 200, { pantry: { on: s.pantry.on, items: s.pantry.items, rev: s.pantry.rev }, previous: on ? [] : prev });
});
route('POST', '/api/sync/pantry', { auth: true, limit: 'state' }, async (req, res, ctx) => {
  const s = needSync(ctx, 'active'); if (!s.pantry || !s.pantry.on) err(409, 'The pantry isn’t shared.');
  const P = s.pantry; const me = ctx.me.u.id; const ops = Array.isArray(ctx.body.ops) ? ctx.body.ops.slice(0, 400) : [];
  ops.forEach(o => {
    if (!o || typeof o !== 'object') return;
    if (o.op === 'add') { const it = cleanPantryItem(o.item); it.by = me; if (!P.items.some(x => x.id === it.id) && P.items.length < PANTRY_MAX) P.items.push(it); }
    else if (o.op === 'set') { const it = P.items.find(x => x.id === o.id); if (it) { if (o.qty != null) it.qty = Math.max(0, Math.min(1e6, Math.round(+o.qty * 100) / 100 || 0)); if (o.exp !== undefined) it.exp = o.exp && isoDate(o.exp) ? o.exp : null; if (o.food && /^[A-Za-z0-9_.:-]{1,80}$/.test(o.food) && !/^(__proto__|constructor|prototype)$/.test(o.food)) it.food = o.food; } }
    else if (o.op === 'del') P.items = P.items.filter(x => x.id !== o.id);
  });
  // automatic use-up: each person sends what their own planned meals used, once per day
  const c = ctx.body.consume;
  if (c && isoDate(c.through) && c.use && typeof c.use === 'object') {
    P.used = P.used || {}; const last = P.used[me] || '';
    if (c.through > last) {
      Object.entries(c.use).slice(0, 400).forEach(([food, amt]) => {
        let left = Math.max(0, +amt || 0); if (!left) return;
        P.items.filter(x => x.food === food && x.qty > 0).sort((a, b) => (a.exp || '9999') < (b.exp || '9999') ? -1 : 1).forEach(x => { const t = Math.min(left, x.qty); x.qty = Math.round((x.qty - t) * 100) / 100; left -= t; });
      });
      P.items = P.items.filter(x => x.qty > 0.001); P.used[me] = c.through;
    }
  }
  P.rev = (P.rev || 0) + 1; bumpSync(s);
  send(res, 200, { pantry: { on: true, items: P.items, rev: P.rev }, used: (P.used || {})[me] || null });
});

/* ---------- shared product database (barcode-scanned foods everyone can use) ---------- */
const PROD = require('./lib/products');
const FOODS_FILE = path.join(DATA, 'foods.json');
let sharedFoods = { rev: 0, foods: {} };
try { if (fs.existsSync(FOODS_FILE)) sharedFoods = Object.assign({ rev: 0, foods: {} }, JSON.parse(fs.readFileSync(FOODS_FILE, 'utf8'))); } catch (e) { console.error('Could not read', FOODS_FILE, e.message); }
let foodsT = null; const saveFoods = () => { clearTimeout(foodsT); foodsT = setTimeout(() => writeAtomic(FOODS_FILE, JSON.stringify(sharedFoods, null, 1)), 100); };
const SUB_RE = /^[a-z_]{2,30}$/;
const AISLE_OK = ['Meat & Seafood', 'Dairy & Eggs', 'Produce', 'Grains & Bread', 'Frozen', 'Pantry', 'Snacks', 'Beverages', 'Deli & Prepared'];
function cleanSharedFood(b, cur) {
  const n = String(b.n || '').replace(/\s+/g, ' ').trim().slice(0, 80); if (!n) err(400, 'Give the product a name.');
  const numv = (k, max) => { const v = +b[k]; if (!isFinite(v) || v < 0 || v > max) err(400, `Check the ${({ k: 'calories', p: 'protein', c: 'carbs', f: 'fat', g: 'item weight', pk: 'package size', srv: 'serving size' })[k] || k} value.`); return Math.round(v * 100) / 100; };
  const basis = ['g', 'ml', 'u'].includes(b.basis) ? b.basis : 'g';
  const out = { n, brand: String(b.brand || '').replace(/\s+/g, ' ').trim().slice(0, 60), sub: SUB_RE.test(b.sub || '') ? b.sub : 'sauces', a: AISLE_OK.includes(b.a) ? b.a : 'Pantry',
    r: ['P', 'C', 'F', 'V'].includes(b.r) ? b.r : null, k: numv('k', basis === 'u' ? 5000 : 950), p: numv('p', basis === 'u' ? 500 : 100), c: numv('c', basis === 'u' ? 500 : 100), f: numv('f', basis === 'u' ? 500 : 100),
    ml: basis === 'ml', u: basis === 'u' ? (String(b.u || 'item').trim().slice(0, 20) || 'item') : null, g: basis === 'u' ? numv('g', 5000) || null : null,
    pk: b.pk ? numv('pk', 1e5) : null, srv: b.srv ? numv('srv', 1e4) : null, src: cur ? cur.src : (b.src === 'off' ? 'off' : 'user') };
  if (out.p + out.c + out.f > (basis === 'u' ? 5000 : 101)) err(400, 'Protein, carbs and fat add up to more than the total weight.');
  return out;
}
route('GET', '/api/foods/shared', { auth: true }, async (req, res) => send(res, 200, sharedFoods));
route('GET', '/api/barcode/:code', { auth: true }, async (req, res, ctx) => {
  if (limited('barcode:' + ctx.me.u.id, 150, 10 * 60000)) err(429, 'Too many lookups. Wait a few minutes.');
  const code = PROD.normGtin(ctx.params.code); if (!code) err(400, 'That isn’t a valid barcode number.');
  const hit = Object.values(sharedFoods.foods).find(f => f.gtin === code);
  if (hit) return send(res, 200, { gtin: code, food: hit });
  let off = null; let offError = null;
  try { off = await PROD.offLookup(code); } catch (e) { offError = e.message; }
  send(res, 200, { gtin: code, suggest: off, error: offError });
});
route('POST', '/api/foods/shared', { auth: true }, async (req, res, ctx) => {
  if (limited('foodadd:' + ctx.me.u.id, 60, 60 * 60000)) err(429, 'Too many new products in an hour.');
  const b = ctx.body; const gtin = b.gtin ? PROD.normGtin(b.gtin) : null; if (b.gtin && !gtin) err(400, 'That isn’t a valid barcode number.');
  if (gtin) { const hit = Object.values(sharedFoods.foods).find(f => f.gtin === gtin); if (hit) return send(res, 200, { food: hit, existed: true, rev: sharedFoods.rev }); }
  if (Object.keys(sharedFoods.foods).length >= 20000) err(400, 'The product list is full.');
  const food = Object.assign(cleanSharedFood(b), { id: gtin ? 'bc_' + gtin : 'sf_' + uid().replace(/[^A-Za-z0-9]/g, ''), gtin, by: ctx.me.u.id, byName: ctx.me.u.name, at: now() });
  sharedFoods.foods[food.id] = food; sharedFoods.rev++; saveFoods();
  audit('product_added', { userId: ctx.me.u.id, ip: clientIp(req), detail: `${food.n}${gtin ? ' · ' + gtin : ''}` });
  send(res, 200, { food, rev: sharedFoods.rev });
});
route('PATCH', '/api/foods/shared/:id', { auth: true }, async (req, res, ctx) => {
  const cur = sharedFoods.foods[ctx.params.id]; if (!cur) err(404, 'Product not found.');
  if (cur.by !== ctx.me.u.id && ctx.me.u.role !== 'admin') err(403, 'Only the person who added this product or an administrator can edit it.');
  const food = Object.assign({}, cur, cleanSharedFood(Object.assign({}, cur, { basis: cur.u ? 'u' : cur.ml ? 'ml' : 'g' }, ctx.body), cur), { id: cur.id, gtin: cur.gtin, by: cur.by, byName: cur.byName, at: cur.at, editedAt: now() });
  sharedFoods.foods[cur.id] = food; sharedFoods.rev++; saveFoods();
  audit('product_edited', { userId: ctx.me.u.id, ip: clientIp(req), detail: food.n });
  send(res, 200, { food, rev: sharedFoods.rev });
});
route('DELETE', '/api/foods/shared/:id', { admin: true }, async (req, res, ctx) => {
  const cur = sharedFoods.foods[ctx.params.id]; if (!cur) err(404, 'Product not found.');
  delete sharedFoods.foods[cur.id]; sharedFoods.rev++; saveFoods();
  audit('product_deleted', { userId: ctx.me.u.id, actorId: ctx.me.u.id, ip: clientIp(req), detail: cur.n });
  send(res, 200, { ok: true, rev: sharedFoods.rev });
});

/* ---------- recipe import: web links and Mealie ---------- */
const IMP = require('./lib/recipe-import');
if (!db.integrations || typeof db.integrations !== 'object' || Array.isArray(db.integrations)) db.integrations = {};
const mealieCfg = () => { const m = db.integrations.mealie; return m && m.url && m.token ? m : null; };
function mealieView(u) { const m = db.integrations.mealie || {}; return { configured: !!mealieCfg(), url: m.url || '', tokenSet: !!m.token, user: m.user || '', version: m.version || '', checkedAt: m.checkedAt || null, canEdit: u.role === 'admin' }; }
function importLimit(ctx, kind) { if (limited(`import-${kind}:` + ctx.me.u.id, kind === 'search' ? 240 : 60, 10 * 60000)) err(429, 'Too many imports in a short time. Wait a few minutes and try again.'); }
async function impCall(fn) { try { return await fn(); } catch (e) { if (e instanceof IMP.ImportErr) err(e.code, e.message, e.extra && e.extra.partial ? { partial: e.extra.partial } : undefined); throw e; } }
function mealieInput(body) {
  const cur = db.integrations.mealie || {};
  const url = IMP.mealieBase(body.url != null ? body.url : cur.url);
  if (!/^https?:\/\/[^\s/]+/i.test(url) || url.length > 300) err(400, 'Enter the address you open Mealie at, e.g. http://192.168.1.10:9925');
  const token = body.token ? String(body.token).trim() : cur.token;
  if (!token) err(400, 'Paste a Mealie API token.');
  if (token.length > 4000 || /\s/.test(token)) err(400, 'That API token doesn’t look right.');
  return { url, token };
}
route('GET', '/api/integrations', { auth: true }, async (req, res, ctx) => send(res, 200, { mealie: mealieView(ctx.me.u) }));
route('POST', '/api/integrations/mealie/test', { admin: true }, async (req, res, ctx) => { const r = await impCall(() => IMP.mealieTest(mealieInput(ctx.body))); send(res, 200, Object.assign({ ok: true }, r)); });
route('PUT', '/api/integrations/mealie', { admin: true }, async (req, res, ctx) => {
  const cfg = mealieInput(ctx.body); const r = await impCall(() => IMP.mealieTest(cfg));
  db.integrations.mealie = { url: cfg.url, token: cfg.token, user: r.user, group: r.group, version: r.version, checkedAt: now(), updatedAt: now(), by: ctx.me.u.id }; saveDb();
  audit('integration_changed', { userId: ctx.me.u.id, actorId: ctx.me.u.id, ip: clientIp(req), detail: `Mealie connected (${cfg.url})` });
  send(res, 200, { mealie: mealieView(ctx.me.u) });
});
route('DELETE', '/api/integrations/mealie', { admin: true }, async (req, res, ctx) => {
  delete db.integrations.mealie; saveDb(); audit('integration_changed', { userId: ctx.me.u.id, actorId: ctx.me.u.id, ip: clientIp(req), detail: 'Mealie disconnected' });
  send(res, 200, { mealie: mealieView(ctx.me.u) });
});
route('GET', '/api/import/mealie/recipes', { auth: true }, async (req, res, ctx) => { importLimit(ctx, 'search'); send(res, 200, await impCall(() => IMP.mealieSearch(mealieCfg(), ctx.query.q, ctx.query.page))); });
route('GET', '/api/import/mealie/recipes/:slug', { auth: true }, async (req, res, ctx) => { importLimit(ctx, 'get'); const m = mealieCfg(); send(res, 200, { recipe: await impCall(() => IMP.mealieRecipe(m, ctx.params.slug, m && m.group)) }); });
route('POST', '/api/import/url', { auth: true }, async (req, res, ctx) => {
  importLimit(ctx, 'get'); const u = String(ctx.body.url || '').trim(); if (!u || u.length > 2000) err(400, 'Paste a link to a recipe page.');
  send(res, 200, { recipe: await impCall(() => IMP.importFromUrl(u)) });
});

/* administrator */
function adminUserRow(u) {
  const st = (() => { try { return fs.statSync(stateFile(u.id)); } catch (e) { return null; } })();
  return Object.assign(pubUser(u), { locked: isLocked(u), lockedUntil: isLocked(u) ? u.lockedUntil : null, failed: u.failed || 0, lastLoginIp: u.lastLoginIp || null, sessions: db.sessions.filter(s => s.userId === u.id && s.expiresAt > now()).length, dataBytes: st ? st.size : 0, dataUpdatedAt: st ? st.mtimeMs : null, pwChangedAt: u.pwChangedAt || u.createdAt });
}
const target = ctx => { const u = userById(ctx.params.id); if (!u) err(404, 'User not found.'); return u; };
route('GET', '/api/admin/users', { admin: true }, async (req, res) => send(res, 200, { users: db.users.map(adminUserRow) }));
function inviteRow(i) { return { id: i.id, email: i.email, name: i.name || '', role: i.role, createdAt: i.createdAt, sentAt: i.sentAt, expiresAt: i.expiresAt, sends: i.sends || 0, expired: i.expiresAt <= now(), invitedBy: (userById(i.invitedBy) || {}).name || null }; }
async function sendInvite(inv, req, actor) {
  if (!emailReady()) err(400, 'Set up email first (Admin → Email) — invites are sent by email.');
  const tok = crypto.randomBytes(32).toString('base64url'); const prev = { h: inv.h, sentAt: inv.sentAt, expiresAt: inv.expiresAt };
  inv.h = sha256(tok); inv.sentAt = now(); inv.expiresAt = now() + INVITE_DAYS * 86400000;      // a new link replaces the old one
  const link = `${baseUrl(req)}/invite?token=${tok}`;
  const msg = MAIL.inviteEmail({ name: inv.name, email: inv.email, inviter: actor.name, role: inv.role, link, days: INVITE_DAYS, expiresAt: new Date(inv.expiresAt), appUrl: baseUrl(req), appName: db.settings.appName });
  try { await deliver(inv.email, inv.name, msg); inv.sends = (inv.sends || 0) + 1; saveDb(); }
  catch (e) { Object.assign(inv, prev); audit('invite_failed', { actorId: actor.id, ip: clientIp(req), detail: `${inv.email}: ${e.message}`.slice(0, 300) }); err(502, 'The invite email couldn’t be sent: ' + e.message); }
}
route('GET', '/api/admin/invites', { admin: true }, async (req, res) => send(res, 200, { invites: db.invites.slice().sort((a, b) => b.sentAt - a.sentAt).map(inviteRow), days: INVITE_DAYS }));
route('POST', '/api/admin/invites', { admin: true }, async (req, res, ctx) => {
  const b = ctx.body; const email = normEmail(b.email), name = String(b.name || '').trim().slice(0, 80); const role = b.role === 'admin' ? 'admin' : 'user';
  if (!validEmail(email)) err(400, 'Enter a valid email address.'); if (findUser(email)) err(409, 'An account with this email already exists.');
  let inv = db.invites.find(x => x.email === email); const again = !!inv;
  if (inv) Object.assign(inv, { name: name || inv.name, role, invitedBy: ctx.me.u.id });
  else inv = { id: uid(), email, name, role, invitedBy: ctx.me.u.id, createdAt: now(), sends: 0 };
  await sendInvite(inv, req, ctx.me.u);
  if (!again) db.invites.push(inv); saveDb();
  audit(again ? 'invite_resent' : 'invite_sent', { actorId: ctx.me.u.id, ip: clientIp(req), detail: `${email} (${role})` });
  send(res, 201, { invite: inviteRow(inv), resent: again });
});
route('POST', '/api/admin/invites/:id/resend', { admin: true }, async (req, res, ctx) => {
  const inv = db.invites.find(x => x.id === ctx.params.id); if (!inv) err(404, 'That invite no longer exists.');
  if (findUser(inv.email)) { db.invites = db.invites.filter(x => x !== inv); saveDb(); err(409, 'That person already has an account.'); }
  await sendInvite(inv, req, ctx.me.u); audit('invite_resent', { actorId: ctx.me.u.id, ip: clientIp(req), detail: inv.email }); send(res, 200, { invite: inviteRow(inv) });
});
route('DELETE', '/api/admin/invites/:id', { admin: true }, async (req, res, ctx) => {
  const inv = db.invites.find(x => x.id === ctx.params.id); if (!inv) err(404, 'That invite no longer exists.');
  db.invites = db.invites.filter(x => x !== inv); saveDb(); audit('invite_revoked', { actorId: ctx.me.u.id, ip: clientIp(req), detail: inv.email }); send(res, 200, { ok: true });
});
route('PATCH', '/api/admin/users/:id', { admin: true }, async (req, res, ctx) => {
  const u = target(ctx), b = ctx.body, me = ctx.me.u; const log = [];
  const lastAdmin = u.role === 'admin' && u.status === 'active' && admins().length <= 1;
  if (b.role != null && b.role !== u.role) { if (!['admin', 'user'].includes(b.role)) err(400, 'Unknown role.'); if (lastAdmin && b.role !== 'admin') err(400, 'There has to be at least one active administrator.'); u.role = b.role; log.push('role → ' + b.role); audit('role_changed', { userId: u.id, actorId: me.id, ip: clientIp(req), detail: b.role }); }
  if (b.status != null && b.status !== u.status) {
    if (!['active', 'disabled', 'pending'].includes(b.status)) err(400, 'Unknown status.');
    if (lastAdmin && b.status !== 'active') err(400, 'There has to be at least one active administrator.');
    if (u.id === me.id && b.status !== 'active') err(400, 'You can’t disable your own account.');
    const was = u.status; u.status = b.status; if (b.status !== 'active') revokeSessions(u.id);
    audit('status_changed', { userId: u.id, actorId: me.id, ip: clientIp(req), detail: `${was} → ${b.status}` }); log.push('status → ' + b.status);
    if (was === 'pending' && b.status === 'active' && emailReady()) deliver(u.email, u.name, MAIL.simpleEmail({ title: 'Your FORGE 90 account is ready', heading: 'You’re approved!', lines: [`Hi ${u.name.split(' ')[0]}, an administrator approved your FORGE 90 account.`, 'Sign in with the email and password you signed up with.'], buttonUrl: baseUrl(req), buttonLabel: 'Sign in', appUrl: baseUrl(req), appName: db.settings.appName })).catch(() => {});
  }
  if (b.name != null) { const n = String(b.name).trim().slice(0, 80); if (n && n !== u.name) { u.name = n; log.push('name'); } }
  if (b.email != null && normEmail(b.email) !== u.email) { const e = normEmail(b.email); if (!validEmail(e)) err(400, 'Enter a valid email address.'); if (findUser(e)) err(409, 'Another account already uses that email.'); audit('email_changed', { userId: u.id, actorId: me.id, ip: clientIp(req), detail: `${u.email} → ${e}` }); u.email = e; log.push('email'); }
  saveDb(); send(res, 200, { user: adminUserRow(u), changed: log });
});
route('DELETE', '/api/admin/users/:id/avatar', { admin: true }, async (req, res, ctx) => { const u = target(ctx); if (u.avatar) { removeAvatar(u); saveDb(); audit('avatar_changed', { userId: u.id, actorId: ctx.me.u.id, ip: clientIp(req), detail: 'removed by admin' }); } send(res, 200, { user: adminUserRow(u) }); });
route('POST', '/api/admin/users/:id/unlock', { admin: true }, async (req, res, ctx) => { const u = target(ctx); u.failed = 0; u.lockedUntil = null; saveDb(); audit('unlocked', { userId: u.id, actorId: ctx.me.u.id, ip: clientIp(req) }); send(res, 200, { user: adminUserRow(u) }); });
route('POST', '/api/admin/users/:id/send-reset', { admin: true }, async (req, res, ctx) => { const u = target(ctx); if (u.status === 'disabled') err(400, 'Enable the account first.'); const r = await sendReset(u, 'admin', req, { actorId: ctx.me.u.id }); if (!r.sent) err(502, 'The reset email couldn’t be sent: ' + r.error); send(res, 200, { ok: true, minutes: RESET_MINUTES }); });
route('POST', '/api/admin/users/:id/temp-password', { admin: true }, async (req, res, ctx) => {
  const u = target(ctx); const pw = String(ctx.body.password || ''); const pp = pwProblem(pw, u.email); if (pp) err(400, pp);
  u.pw = await hashPw(pw); u.mustChange = true; u.failed = 0; u.lockedUntil = null; u.pwChangedAt = now(); const n = revokeSessions(u.id, u.id === ctx.me.u.id ? ctx.me.s.id : null);
  audit('temp_password_set', { userId: u.id, actorId: ctx.me.u.id, ip: clientIp(req), detail: `${n} session(s) signed out` }); notifyPasswordChanged(u, req, 'admin'); send(res, 200, { user: adminUserRow(u) });
});
route('POST', '/api/admin/users/:id/revoke-sessions', { admin: true }, async (req, res, ctx) => { const u = target(ctx); const n = revokeSessions(u.id, u.id === ctx.me.u.id ? ctx.me.s.id : null); audit('sessions_revoked', { userId: u.id, actorId: ctx.me.u.id, ip: clientIp(req), detail: `${n} session(s)` }); send(res, 200, { revoked: n, user: adminUserRow(u) }); });
route('DELETE', '/api/admin/users/:id', { admin: true }, async (req, res, ctx) => {
  const u = target(ctx); if (u.id === ctx.me.u.id) err(400, 'Delete your own account from Account settings instead.');
  if (u.role === 'admin' && admins().length <= 1 && u.status === 'active') err(400, 'There has to be at least one active administrator.');
  deleteUser(u); audit('user_deleted', { userId: u.id, actorId: ctx.me.u.id, ip: clientIp(req), detail: u.email }); send(res, 200, { ok: true });
});
route('GET', '/api/admin/users/:id/state', { admin: true }, async (req, res, ctx) => { const u = target(ctx); send(res, 200, readState(u.id), { 'Content-Disposition': `attachment; filename="forge90-${u.email.replace(/[^a-z0-9]+/gi, '_')}.json"` }); });
function adminSettingsView() {
  const s = JSON.parse(JSON.stringify(db.settings)); const o = db.settings.email || {}; const eff = mailConfig();
  s.email = Object.assign({}, eff, { pass: '', passSet: !!eff.pass, passSource: o.pass ? 'admin' : ENV.SMTP_PASS ? 'env' : null, ready: emailReady(),
    source: Object.fromEntries(EMAIL_KEYS.map(k => [k, o[k] != null && o[k] !== '' ? 'admin' : 'env'])) });
  s.resetMinutes = RESET_MINUTES; s.inviteDays = INVITE_DAYS; s.envAppUrl = ENV.APP_URL || ''; s.httpsTarget = httpsTarget(); s.httpsEnvOff = httpsEnvOff(); delete s.emailV2; return s;
}
route('GET', '/api/admin/settings', { admin: true }, async (req, res) => send(res, 200, adminSettingsView()));
route('PATCH', '/api/admin/settings', { admin: true }, async (req, res, ctx) => {
  const b = ctx.body, s = db.settings; const changed = [];
  const int = (v, lo, hi, label) => { v = Math.round(+v); if (!Number.isFinite(v) || v < lo || v > hi) err(400, `${label} must be between ${lo} and ${hi}.`); return v; };
  if (b.appName != null) { s.appName = String(b.appName).trim().slice(0, 40) || 'FORGE 90'; changed.push('app name'); }
  if (b.appUrl != null) { const u = String(b.appUrl).trim().replace(/\/+$/, ''); if (u && !/^https?:\/\/[^\s/]+/i.test(u)) err(400, 'App address must start with http:// or https://'); s.appUrl = u; changed.push('app address'); }
  if (b.security) { const x = b.security, q = s.security;
    if (x.pwMinLength != null) q.pwMinLength = int(x.pwMinLength, 8, 64, 'Minimum password length');
    if (x.pwRequireMix != null) q.pwRequireMix = !!x.pwRequireMix;
    if (x.lockThreshold != null) q.lockThreshold = int(x.lockThreshold, 3, 20, 'Failed attempts before lockout');
    if (x.lockMinutes != null) q.lockMinutes = int(x.lockMinutes, 1, 1440, 'Lockout duration');
    if (x.autoResetOnLock != null) q.autoResetOnLock = !!x.autoResetOnLock;
    if (x.sessionHours != null) q.sessionHours = int(x.sessionHours, 1, 168, 'Session length');
    if (x.rememberDays != null) q.rememberDays = int(x.rememberDays, 1, 365, '“Keep me signed in” length');
    if (x.notifyPasswordChange != null) q.notifyPasswordChange = !!x.notifyPasswordChange;
    if (x.requireHttps != null) q.requireHttps = !!x.requireHttps;
    changed.push('security'); }
  if (b.email) { const x = b.email, q = s.email = s.email || {}; const d = emailDefaults();
    const put = (k, v) => { if (String(v) === String(d[k])) delete q[k]; else q[k] = v; };   // only store what differs from the environment
    ['host', 'user', 'fromName', 'fromEmail'].forEach(k => { if (x[k] != null) put(k, String(x[k]).trim().slice(0, 200)); });
    if (x.port != null) put('port', int(x.port, 1, 65535, 'Port'));
    if (x.security != null) { if (!['tls', 'starttls', 'none'].includes(x.security)) err(400, 'Unknown connection security.'); put('security', x.security); }
    if (x.pass) q.pass = String(x.pass).replace(/\s+/g, '');          // Google shows app passwords with spaces
    if (x.clearPass) delete q.pass;
    if (x.useEnv) EMAIL_KEYS.concat('pass').forEach(k => delete q[k]);
    const fe = mailConfig().fromEmail; if (fe && !validEmail(normEmail(fe))) err(400, 'From address isn’t a valid email.');
    changed.push('email'); }
  if (b.defaults && b.defaults.theme) { if (['dark', 'light', 'system'].includes(b.defaults.theme)) s.defaults.theme = b.defaults.theme; changed.push('defaults'); }
  saveDb(); audit('settings_changed', { actorId: ctx.me.u.id, ip: clientIp(req), detail: changed.join(', ') }); send(res, 200, adminSettingsView());
});
route('POST', '/api/admin/email/test', { admin: true }, async (req, res, ctx) => {
  const to = normEmail(ctx.body.to || ctx.me.u.email); if (!validEmail(to)) err(400, 'Enter a valid address to send the test to.');
  try { await deliver(to, '', MAIL.simpleEmail({ title: 'FORGE 90 test email', heading: 'Email is working ✔', lines: ['This is a test from FORGE 90 → Admin → Email.', 'Password-reset emails will be sent from this account.'], buttonUrl: baseUrl(req), buttonLabel: 'Open FORGE 90', appUrl: baseUrl(req), appName: db.settings.appName }));
    audit('email_test', { actorId: ctx.me.u.id, ip: clientIp(req), detail: 'sent to ' + to }); send(res, 200, { ok: true, to }); }
  catch (e) { audit('email_test', { actorId: ctx.me.u.id, ip: clientIp(req), detail: 'FAILED: ' + e.message.slice(0, 200) }); err(502, e.message); }
});
route('GET', '/api/admin/proxy', { admin: true }, async (req, res) => {
  const h = req.headers; const au = String(db.settings.appUrl || ENV.APP_URL || '').replace(/\/+$/, '');
  send(res, 200, { peer: peerIp(req), clientIp: clientIp(req), trusted: fromProxy(req), trustMode: TP_MODE, trustRaw: TP_RAW, trustBad: TP_BAD,
    headers: { xff: h['x-forwarded-for'] || null, xRealIp: h['x-real-ip'] || null, proto: h['x-forwarded-proto'] || null, host: h.host || null },
    https: isHttps(req), cookieSecure: cookieSecure(req), cookieSetting: (ENV.COOKIE_SECURE || 'auto').toLowerCase(),
    appUrl: au || null, appUrlSource: db.settings.appUrl ? 'admin' : ENV.APP_URL ? 'env' : null,
    requireHttps: { setting: db.settings.security.requireHttps !== false, envOff: httpsEnvOff(), active: requireHttpsOn(), target: httpsTarget() },
    hsts: isHttps(req) && requireHttpsOn(), port: PORT, host: HOST, version: VERSION });
});
route('GET', '/api/admin/audit', { admin: true }, async (req, res, ctx) => {
  const q = ctx.query; const lim = Math.min(1000, +q.limit || 300); let list = db.audit.slice().reverse();
  if (q.type) list = list.filter(a => a.type === q.type);
  if (q.user) list = list.filter(a => a.userId === q.user || a.actorId === q.user);
  const names = {}; db.users.forEach(u => { names[u.id] = u.email; });
  send(res, 200, { events: list.slice(0, lim).map(a => Object.assign({}, a, { user: names[a.userId] || null, actor: names[a.actorId] || null })), total: db.audit.length });
});
route('GET', '/api/admin/stats', { admin: true }, async (req, res) => {
  const day = now() - 86400000; const a = db.audit.filter(x => x.t > day);
  let bytes = 0; try { fs.readdirSync(path.join(DATA, 'state')).forEach(f => { bytes += fs.statSync(path.join(DATA, 'state', f)).size; }); bytes += fs.statSync(DBF).size; } catch (e) { /* ignore */ }
  send(res, 200, { users: db.users.length, admins: admins().length, pending: db.users.filter(u => u.status === 'pending').length, invites: db.invites.filter(i => i.expiresAt > now()).length, disabled: db.users.filter(u => u.status === 'disabled').length, locked: db.users.filter(isLocked).length,
    sessions: db.sessions.filter(s => s.expiresAt > now()).length, logins24: a.filter(x => x.type === 'login_ok').length, failed24: a.filter(x => x.type === 'login_fail').length,
    emails24: a.filter(x => x.type === 'reset_email_sent').length, emailFail24: a.filter(x => /email_failed|reset_email_failed/.test(x.type)).length, dataBytes: bytes, dataDir: DATA, node: process.version, version: VERSION, uptime: Math.round(process.uptime()) });
});
route('GET', '/api/admin/backup', { admin: true }, async (req, res, ctx) => {
  const out = { app: 'FORGE 90', exportedAt: new Date().toISOString(), settings: adminSettingsView(), invites: db.invites.map(inviteRow), users: db.users.map(u => Object.assign(pubUser(u), { state: readState(u.id) })), sharedFoods: sharedFoods.foods };
  audit('backup_downloaded', { actorId: ctx.me.u.id, ip: clientIp(req) });
  send(res, 200, out, { 'Content-Disposition': `attachment; filename="forge90-backup-${new Date().toISOString().slice(0, 10)}.json"` });
});

/* ---------- dispatcher ---------- */
async function handle(req, res) {
  const url = new URL(req.url, 'http://x'); const pathname = decodeURIComponent(url.pathname);
  const secure = isHttps(req);
  if (!secure && requireHttpsOn() && !isLoopback(peerIp(req)) && pathname !== '/api/health') {
    const target = httpsTarget();
    // Only redirect visits that came in on a different address; if the https hostname itself arrives as plain HTTP the proxy isn't
    // passing X-Forwarded-Proto (or TRUST_PROXY is off) — redirecting would loop, so serve it and flag it in Admin → Server & proxy.
    if (String(req.headers.host || '').toLowerCase() !== hostOf(target)) {
      if (pathname.startsWith('/api/')) return send(res, 403, { error: `Use the secure address: ${target}`, httpsUrl: target });
      res.writeHead(302, Object.assign({ Location: target + url.pathname + url.search, 'Cache-Control': 'no-store' }, SEC_HEADERS)); return res.end();
    }
  }
  if (secure && requireHttpsOn()) res.setHeader('Strict-Transport-Security', 'max-age=15552000');
  if (!pathname.startsWith('/api/')) { if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); } return serveStatic(req, res, pathname); }
  const r = routes.find(x => x.method === req.method && x.re.test(pathname));
  if (!r) return send(res, 404, { error: 'Not found' });
  const ip = clientIp(req);
  try {
    if (req.method !== 'GET') {
      if (req.headers['x-f90'] !== '1' || !/application\/json/i.test(req.headers['content-type'] || '')) err(403, 'Blocked request');
      const origin = req.headers.origin; if (origin) { let oh = ''; try { oh = new URL(origin).host; } catch (e) { /* bad origin */ } if (oh !== req.headers.host) err(403, 'Blocked cross-site request'); }
    }
    if (r.opts.limit === 'auth' && limited('auth:' + ip, 40, 15 * 60000)) err(429, 'Too many attempts from this network. Wait a few minutes and try again.');
    const me = getSession(req);
    if ((r.opts.auth || r.opts.admin) && !me) err(401, 'Please sign in again.');
    if (me && me.u.mustChange && (r.opts.auth || r.opts.admin) && !r.opts.allowMustChange) err(403, 'Set a new password first.', { mustChange: true });
    if (r.opts.admin && me.u.role !== 'admin') err(403, 'Administrators only.');
    const body = req.method === 'GET' || req.method === 'HEAD' ? {} : await readBody(req, r.opts.limit === 'state' ? MAX_STATE_BYTES : r.opts.maxBody || 256 * 1024);
    await r.fn(req, res, { me, body, params: pathname.match(r.re).groups || {}, query: Object.fromEntries(url.searchParams) });
  } catch (e) {
    if (e instanceof HttpErr) return send(res, e.code, Object.assign({ error: e.message }, e.extra || {}));
    console.error(e); send(res, 500, { error: 'Something went wrong on the server.' });
  }
}

/* ---------- command-line recovery:  node server.js --set-password <email> <password>  |  --make-admin <email> ---------- */
async function cli() {
  const a = process.argv.slice(2); if (!a.length || !/^--/.test(a[0])) return false;
  const u = findUser(a[1] || ''); if (!u) { console.error('No account with email', a[1]); process.exit(1); }
  if (a[0] === '--set-password') { const pp = pwProblem(a[2], u.email); if (!a[2] || pp) { console.error(pp || 'Give the new password as the third argument.'); process.exit(1); } u.pw = await hashPw(a[2]); u.mustChange = false; u.failed = 0; u.lockedUntil = null; u.pwChangedAt = now(); revokeSessions(u.id); audit('password_changed', { userId: u.id, detail: 'set from the server command line' }); }
  else if (a[0] === '--make-admin') { u.role = 'admin'; u.status = 'active'; u.failed = 0; u.lockedUntil = null; audit('role_changed', { userId: u.id, detail: 'admin (server command line)' }); }
  else { console.error('Unknown option', a[0]); process.exit(1); }
  saveDb(true); console.log('Done:', a[0], u.email); process.exit(0);
}

/* ---------- first run: default administrator ---------- */
(async function boot() {
  if (await cli()) return;
  if (!db.users.some(u => u.role === 'admin')) {
    const email = normEmail(ENV.ADMIN_EMAIL || 'admin@forge90.local'); const pw = ENV.ADMIN_PASSWORD || 'forge90-admin';
    const existing = findUser(email);
    if (existing) { existing.role = 'admin'; existing.status = 'active'; }
    else db.users.push({ id: uid(), email, name: ENV.ADMIN_NAME || 'Administrator', role: 'admin', status: 'active', pw: await hashPw(pw), mustChange: true, createdAt: now(), failed: 0, lockedUntil: null, notify: { passwordChange: true } });
    audit('admin_created', { detail: email }); saveDb(true);
    console.log(`\n  Default administrator created → ${email} / ${existing ? '(existing password)' : pw}\n  You'll be asked to choose a new password the first time you sign in.\n`);
  }
  setInterval(() => { const t = now(); const n1 = db.sessions.length, n2 = db.resets.length, n3 = db.invites.length;
    db.sessions = db.sessions.filter(s => s.expiresAt > t); db.resets = db.resets.filter(r => t - r.createdAt < 86400000); db.invites = db.invites.filter(i => t - i.expiresAt < 30 * 86400000);
    if (n1 !== db.sessions.length || n2 !== db.resets.length || n3 !== db.invites.length) saveDb(); }, 10 * 60000).unref();
  const server = http.createServer((req, res) => { handle(req, res).catch(e => { console.error(e); try { send(res, 500, { error: 'Server error' }); } catch (x) { /* ignore */ } }); });
  server.headersTimeout = 20000; server.requestTimeout = 60000;
  server.listen(PORT, HOST, () => {
    console.log(`  FORGE 90 ${VERSION} is running → ${ENV.APP_URL || `http://localhost:${PORT}`}`);
    console.log(`  Data folder: ${DATA}`);
    console.log(`  Email: ${emailReady() ? `${mailConfig().host}:${mailConfig().port} as ${mailConfig().user || mailConfig().fromEmail}` : 'not configured (Admin → Email)'}\n`);
  });
  const stop = () => { saveDb(true); process.exit(0); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
})();
