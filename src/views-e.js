// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
/* ============================================================
   FORGE 90 — accounts: sign-in screens, server sync, account settings, admin console
   When the page is served by server.js the app requires an account; opened as a plain
   file it runs in single-user "local mode" exactly as before.
   ============================================================ */
const AUTH = { mode: 'local', user: null, config: null, rev: 0, syncT: null, pending: false, inflight: false, sync: 'ok', lastPw: null, savedAt: null };
async function api(method, url, body) {
  let r;
  try { r = await fetch(url, { method, credentials: 'same-origin', headers: body !== undefined || method !== 'GET' ? { 'Content-Type': 'application/json', 'X-F90': '1' } : {}, body: body !== undefined ? JSON.stringify(body) : (method !== 'GET' ? '{}' : undefined) }); }
  catch (e) { const x = new Error('Can’t reach the FORGE 90 server. Check your connection.'); x.status = 0; throw x; }
  let j = null; try { j = await r.json(); } catch (e) { /* not JSON */ }
  if (!r.ok) { const x = new Error((j && j.error) || `Request failed (${r.status})`); x.status = r.status; x.data = j; throw x; }
  return j;
}
const isAdmin = () => AUTH.mode === 'server' && AUTH.user && AUTH.user.role === 'admin';
function navItems() { const n = NAV.slice(); if (isAdmin()) n.push(['admin', 'Admin', 'shield']); return n; }
const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
function userChipHTML() {
  if (AUTH.mode !== 'server' || !AUTH.user) return '';
  const u = AUTH.user; const sy = { ok: 'Saved', saving: 'Saving…', offline: 'Offline — retrying', conflict: 'Updated' }[AUTH.sync] || '';
  return `<div class="user-chip"><a class="uc-main" href="#/account" title="Account settings"><span class="avatar" aria-hidden="true">${esc(initials(u.name))}</span><span class="uc-t"><b>${esc(u.name)}</b><small>${u.role === 'admin' ? 'Administrator' : esc(u.email)}</small></span></a>
    <button class="btn icon ghost uc-out" data-act="logout" title="Sign out" aria-label="Sign out">${icon('logout')}</button><span class="sync-dot ${AUTH.sync}" title="${sy}" aria-label="${sy}"></span></div>`;
}
function setSync(st) { AUTH.sync = st; const d = $('.sync-dot'); if (d) { d.className = 'sync-dot ' + st; const t = { ok: 'Saved', saving: 'Saving…', offline: 'Offline — retrying', conflict: 'Updated' }[st]; d.title = t; d.setAttribute('aria-label', t); } }

/* ---------- saving to the server ---------- */
function onStateSaved() { if (AUTH.mode !== 'server' || !AUTH.user || AUTH.booting) return; if (typeof syncOnSave === 'function') syncOnSave(); AUTH.pending = true; setSync('saving'); clearTimeout(AUTH.syncT); AUTH.syncT = setTimeout(pushState, 700); }
async function pushState() {
  if (!AUTH.user || !S) return;
  if (AUTH.inflight) { clearTimeout(AUTH.syncT); AUTH.syncT = setTimeout(pushState, 400); return; }
  AUTH.inflight = true; AUTH.pending = false;
  try { const r = await api('PUT', '/api/state', { baseRev: AUTH.rev, state: S }); AUTH.rev = r.rev; AUTH.savedAt = r.updatedAt; if (!AUTH.pending) setSync('ok'); }
  catch (e) {
    if (e.status === 409 && e.data) { AUTH.rev = e.data.rev; AUTH.booting = true; loadState(e.data.state); AUTH.booting = false; applyTheme(); render(); setSync('ok'); toast('Your plan was changed on another device — showing the latest version.'); }
    else if (e.status === 401) { AUTH.user = null; showAuth('login', { info: 'Your session ended. Sign in again — your latest changes are kept on this device until you do.' }); }
    else { AUTH.pending = true; setSync('offline'); clearTimeout(AUTH.syncT); AUTH.syncT = setTimeout(pushState, 5000); }
  } finally { AUTH.inflight = false; }
}
window.addEventListener('beforeunload', e => { if (AUTH.mode === 'server' && (AUTH.pending || AUTH.inflight)) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- start-up ---------- */
async function boot() {
  const qs = new URLSearchParams(location.search);
  if (/^https?:$/.test(location.protocol)) {
    try { const s = await api('GET', '/api/session'); AUTH.mode = 'server'; AUTH.user = s.user; AUTH.config = s.config; NEW_STATE_DEFAULTS = s.config.defaults || null; }
    catch (e) { if (e.status === 0) { AUTH.mode = 'server'; return showAuth('down'); } AUTH.mode = 'local'; }
  }
  if (AUTH.mode === 'local') { loadState(); applyTheme(); if (!S.onboarded) return showOnboarding(() => { shell(); render(); afterStart(); }); shell(); render(); afterStart(); return; }
  if (qs.get('token') && location.pathname.replace(/\/+$/, '') === '/reset') return showAuth('reset', { token: qs.get('token') });
  if (qs.get('token') && location.pathname.replace(/\/+$/, '') === '/invite') return showAuth('invite', { token: qs.get('token') });
  if (!AUTH.user) return showAuth('login');
  if (AUTH.user.mustChange) return showAuth('first');
  startApp();
}
async function startApp() {
  let st; try { st = await api('GET', '/api/state'); } catch (e) { if (e.status === 401) return showAuth('login'); if (e.data && e.data.mustChange) return showAuth('first'); return showAuth('down'); }
  AUTH.rev = st.rev || 0; AUTH.savedAt = st.updatedAt; STORE_KEY = 'forge90.v1:' + AUTH.user.id;
  let legacy = null; if (!st.state) { try { legacy = localStorage.getItem('forge90.v1'); } catch (e) { /* ignore */ } }
  AUTH.booting = true; loadState(st.state || null); AUTH.booting = false;
  if (!st.state) pushState();                       // first save for a brand-new account
  if (location.pathname !== '/') history.replaceState(null, '', '/' + location.hash);
  applyTheme();
  if (!S.onboarded) {
    showOnboarding(() => enterApp());
    if (legacy && !(UI.legacyAsked || {})[AUTH.user.id]) {
      UI.legacyAsked = Object.assign({}, UI.legacyAsked, { [AUTH.user.id]: true }); saveUI();
      confirmBox('Use the plan saved in this browser?', 'This browser has a FORGE 90 plan from before accounts were added. Copy it into your new account instead of starting fresh? (Your weigh-ins, logs, custom foods and recipes come with it.)', 'Use it', () => { try { loadState(JSON.parse(legacy)); S.onboarded = true; saveState(); OB = null; applyTheme(); enterApp(); toast('Plan copied into your account'); } catch (e) { toast('That saved plan couldn’t be read'); } });
    }
    return;
  }
  enterApp();
}
function enterApp() { shell(); render(); setSync('ok'); afterStart(); if (typeof syncStart === 'function') syncStart(); }
function afterStart() {
  if (S._sharingIntro) { delete S._sharingIntro; saveState(); setTimeout(() => toast(`New: meals from ${fmtDate(nextPlanWeekStart())} on were re-planned to share ingredients (fewer packages to buy). This week and hand-picked meals weren’t touched — see Grocery & prep → Money saver.`), 600); }
}
async function logout() {
  if (AUTH.pending || AUTH.inflight) { clearTimeout(AUTH.syncT); await pushState().catch(() => {}); }
  try { await api('POST', '/api/logout'); } catch (e) { /* ignore */ }
  try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
  AUTH.user = null; S = null; undoStack.length = 0; STORE_KEY = 'forge90.v1'; showAuth('login', { info: 'You’re signed out.' });
}

/* ---------- sign-in, invite, forgot, reset, first sign-in ---------- */
let AS = { screen: 'login' };
// Sign-in page photo (Unsplash License): a personal trainer coaching a man through a push-up
const AUTH_PHOTO = { url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1800&q=75', page: 'https://unsplash.com/photos/R0y_bEUjiOM', who: 'Jonathan Borba',
  fallback: 'radial-gradient(900px 600px at 30% 20%, #2d4a1a, transparent 60%), linear-gradient(160deg, #141b10, #07090c)' };
function pwMeter(pw) {
  const c = AUTH.config || { pwMinLength: 10, pwRequireMix: true }; pw = pw || '';
  let sc = 0; if (pw.length >= c.pwMinLength) sc++; if (pw.length >= c.pwMinLength + 4) sc++; if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) sc++; if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) sc++;
  if (pw.length < c.pwMinLength) sc = Math.min(sc, 1);
  const lbl = ['Too short', 'Weak', 'OK', 'Good', 'Strong'][sc];
  const rules = [[pw.length >= c.pwMinLength, `${c.pwMinLength}+ characters`]].concat(c.pwRequireMix ? [[/[A-Za-z]/.test(pw) && /[^A-Za-z]/.test(pw), 'letters + a number or symbol']] : []);
  return `<div class="pw-meter s${sc}" aria-live="polite"><i></i><i></i><i></i><i></i><span>${pw ? lbl : ''}</span></div><div class="pw-rules">${rules.map(([ok, t]) => `<span class="${ok ? 'ok' : ''}">${icon(ok ? 'check' : 'x')}${t}</span>`).join('')}</div>`;
}
const pwField = (name, label, auto, extra = '') => `<div class="field"><label for="af-${name}">${label}</label><div class="pw-wrap"><input class="inp" id="af-${name}" name="${name}" type="password" autocomplete="${auto}" required ${extra}><button type="button" class="pw-eye" data-act="pw-eye" aria-label="Show password" tabindex="-1">${icon('eye')}</button></div></div>`;
function showAuth(screen, opts = {}) {
  AS = Object.assign({ screen }, opts); closeModal();
  if (!$('#auth')) {
    document.body.className = 'auth-page'; bgCurrent = null;
    document.body.innerHTML = `<div class="auth-split"><section class="auth-hero" aria-label="A personal trainer coaching a man through a push-up"><div class="auth-photo" style="background-image:url('${AUTH_PHOTO.url}'), ${AUTH_PHOTO.fallback}"></div>
        <div class="auth-hero-copy"><div class="auth-brand">${LOGO}<b class="wm">FORGE<em>90</em></b></div><p>Your training plan, meals, groceries and progress — in one place.</p></div>
        <a class="auth-credit" href="${AUTH_PHOTO.page}" target="_blank" rel="noopener noreferrer">Photo · ${AUTH_PHOTO.who} / Unsplash</a></section>
      <main id="auth" class="auth-wrap"></main></div><div id="tip"></div><div id="toast"></div>`;
  }
  document.body.dataset.sec = 'auth'; applyTheme();
  if (screen === 'reset' || screen === 'invite') AS.checking = true;
  renderAuth(); if (screen === 'reset') checkResetToken(); if (screen === 'invite') checkInvite();
}
function renderAuth() {
  const c = AUTH.config || {}; const s = AS; const msg = s.error ? `<div class="auth-msg err" role="alert">${icon('info')}<span>${esc(s.error)}</span></div>` : s.info ? `<div class="auth-msg" role="status">${icon('info')}<span>${esc(s.info)}</span></div>` : '';
  let body = '';
  if (s.screen === 'login') body = `<h1>Welcome back</h1><p class="sub">Sign in to your plan.</p>${msg}
    <form data-form="auth-login" class="auth-form" novalidate>
      <div class="field"><label for="af-email">Email</label><input class="inp" id="af-email" name="email" type="email" autocomplete="username" required value="${esc(s.email || '')}"></div>
      ${pwField('password', 'Password', 'current-password')}
      <div class="row" style="justify-content:space-between;gap:10px"><label class="small chk"><input type="checkbox" name="remember" ${s.remember !== false ? 'checked' : ''}> Keep me signed in for ${c.rememberDays || 30} days</label><a href="#" data-act="auth-go" data-v="forgot" class="small">Forgot password?</a></div>
      ${s.locked ? `<button type="button" class="btn" data-act="auth-go" data-v="forgot">${icon('mail')}Email me a reset link</button>` : ''}
      <button class="btn primary big" type="submit">Sign in</button></form>
    <div class="auth-foot">New here? FORGE 90 accounts are by invitation — ask your administrator to send you an invite.</div>`;
  else if (s.screen === 'invite') body = s.checking ? `<h1>Checking your invite…</h1><div class="auth-spin"></div>` : s.expired
    ? `<div class="auth-ic warn">${icon('clock')}</div><h1>This invite has expired</h1><p class="sub">Invites work for ${c.inviteDays || 7} days and only once. Ask your FORGE 90 administrator to send you a new one.</p>${msg}<div class="auth-foot"><a href="#" data-act="auth-go" data-v="login">${icon('left')}Back to sign in</a></div>`
    : `<div class="auth-ic">${icon('mail')}</div><h1>Join FORGE 90</h1><p class="sub"><b>${esc(s.invitedBy || 'An administrator')}</b> invited you${s.role === 'admin' ? ' as an <b>administrator</b>' : ''}. Choose a password, then answer a few quick questions to set up your plan.</p>${msg}
      <form data-form="auth-invite" class="auth-form" novalidate>
      <div class="field"><label for="af-email">Email</label><input class="inp" id="af-email" name="email" type="email" autocomplete="username" value="${esc(s.inviteEmail || '')}" readonly><span class="tiny muted">You’ll sign in with this address.</span></div>
      ${pwField('password', 'Password', 'new-password', 'data-meter="1"')}<div id="af-meter">${pwMeter('')}</div>
      ${pwField('confirm', 'Confirm password', 'new-password')}
      <label class="small chk"><input type="checkbox" name="remember" checked> Keep me signed in for ${c.rememberDays || 30} days</label>
      <button class="btn primary big" type="submit">Create my account</button></form>
      <div class="auth-foot">Invite expires ${s.expiresAt ? esc(new Date(s.expiresAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })) : 'in ' + (c.inviteDays || 7) + ' days'}. Already have an account? <a href="#" data-act="auth-go" data-v="login">Sign in</a></div>`;
  else if (s.screen === 'forgot') body = `<h1>Reset your password</h1><p class="sub">Enter the email you sign in with and we’ll send you a link to choose a new password. The link works for ${c.resetMinutes || 30} minutes.</p>${msg}
    <form data-form="auth-forgot" class="auth-form" novalidate><div class="field"><label for="af-email">Email</label><input class="inp" id="af-email" name="email" type="email" autocomplete="username" required value="${esc(s.email || '')}"></div>
      <button class="btn primary big" type="submit">${icon('mail')}Send reset link</button></form>
    <div class="auth-foot"><a href="#" data-act="auth-go" data-v="login">${icon('left')}Back to sign in</a></div>`;
  else if (s.screen === 'sent') body = `<div class="auth-ic">${icon('mail')}</div><h1>Check your email</h1><p class="sub">If an account exists for <b>${esc(s.email)}</b>, a reset link is on its way. It expires in <b>${c.resetMinutes || 30} minutes</b> and works once.</p>
    <div class="auth-msg">${icon('info')}<span>Nothing after a few minutes? Check spam, or ask your administrator to send it from Admin → Users.</span></div>
    <div class="auth-foot"><a href="#" data-act="auth-go" data-v="login">${icon('left')}Back to sign in</a></div>`;
  else if (s.screen === 'reset') body = s.checking ? `<h1>Checking your link…</h1><div class="auth-spin"></div>` : s.expired
    ? `<div class="auth-ic warn">${icon('clock')}</div><h1>This link has expired</h1><p class="sub">Reset links work for ${c.resetMinutes || 30} minutes and only once. Request a new one below.</p>${msg}<button class="btn primary big" data-act="auth-go" data-v="forgot" style="width:100%">Send a new link</button><div class="auth-foot"><a href="#" data-act="auth-go" data-v="login">Back to sign in</a></div>`
    : `<h1>Choose a new password</h1><p class="sub">For <b>${esc(s.maskedEmail || '')}</b>. <span class="reset-timer" data-exp="${s.expiresAt || 0}"></span></p>${msg}
      <form data-form="auth-reset" class="auth-form" novalidate>${pwField('password', 'New password', 'new-password', 'data-meter="1"')}<div id="af-meter">${pwMeter('')}</div>${pwField('confirm', 'Confirm new password', 'new-password')}
      <button class="btn primary big" type="submit">Save password & sign in</button></form><div class="auth-foot">Signing in elsewhere will stop — for your security every other session is signed out.</div>`;
  else if (s.screen === 'first') { const u = AUTH.user || {}; const adminDefault = /@forge90\.local$/.test(u.email || '');
    body = `<div class="auth-ic">${icon('key')}</div><h1>${u.role === 'admin' && adminDefault ? 'Set up the administrator account' : 'Choose a new password'}</h1><p class="sub">${u.role === 'admin' && adminDefault ? 'You signed in with the default administrator password. Choose your own, and use a real email address so password-reset emails can reach you.' : 'An administrator set a temporary password for you. Choose your own to continue.'}</p>${msg}
    <form data-form="auth-first" class="auth-form" novalidate>
      ${adminDefault ? `<div class="field"><label for="af-email">Email</label><input class="inp" id="af-email" name="email" type="email" required value="${esc(u.email || '')}"><span class="tiny muted">Used for sign-in and password resets.</span></div>` : ''}
      ${AUTH.lastPw ? '' : pwField('current', 'Current (temporary) password', 'current-password')}
      ${pwField('password', 'New password', 'new-password', 'data-meter="1"')}<div id="af-meter">${pwMeter('')}</div>${pwField('confirm', 'Confirm new password', 'new-password')}
      <button class="btn primary big" type="submit">Save and continue</button></form><div class="auth-foot"><a href="#" data-act="logout">Sign out</a></div>`; }
  else if (s.screen === 'down') body = `<div class="auth-ic warn">${icon('info')}</div><h1>Can’t reach the server</h1><p class="sub">FORGE 90 couldn’t connect to its server. Make sure it’s running, then try again.</p><button class="btn primary big" data-act="auth-retry" style="width:100%">Try again</button>`;
  document.title = appTitle() + ({ login: ' · Sign in', invite: ' · Join', forgot: ' · Reset password', sent: ' · Check your email', reset: ' · Reset password', first: ' · Set up' }[s.screen] || '');
  $('#auth').innerHTML = `<div class="auth-card"><div class="auth-brand">${LOGO}<b class="wm">FORGE<em>90</em></b></div>${body}</div>
    ${c.appName && c.appName !== 'FORGE 90' ? `<div class="auth-legal">${esc(c.appName)}</div>` : ''}`;
  const f = $('#auth form input:not([type=checkbox])'); if (f && !s.noFocus) setTimeout(() => { const e = $('#auth input[name="email"]'); (s.screen === 'login' && e && e.value ? $('#auth input[name="password"]') : s.screen === 'invite' ? $('#auth input[name="password"]') : f).focus(); }, 30);
  resetTimer();
}
function resetTimer() {
  clearInterval(resetTimer.t); const el = $('.reset-timer'); if (!el) return;
  if (!+el.dataset.exp) return;
  const tick = () => { const ms = +el.dataset.exp - Date.now(); if (ms <= 0) { clearInterval(resetTimer.t); AS.expired = true; AS.error = null; renderAuth(); return; } const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60; el.textContent = `Link expires in ${m}:${String(s).padStart(2, '0')}.`; };
  tick(); resetTimer.t = setInterval(tick, 1000);
}
async function checkResetToken() {
  AS.checking = true; renderAuth();
  try { const r = await api('GET', '/api/reset/' + encodeURIComponent(AS.token)); Object.assign(AS, { checking: false, expired: false, maskedEmail: r.email, expiresAt: r.expiresAt }); }
  catch (e) { Object.assign(AS, { checking: false, expired: true, error: e.status === 410 ? null : e.message }); }
  renderAuth();
}
async function checkInvite() {
  try { const r = await api('GET', '/api/invite/' + encodeURIComponent(AS.token)); Object.assign(AS, { checking: false, expired: false, inviteEmail: r.email, name: AS.name || r.name, role: r.role, invitedBy: r.invitedBy, expiresAt: r.expiresAt });
    if (r.exists) Object.assign(AS, { error: 'An account already exists for this email. Sign in instead, or use “Forgot password”.' }); }
  catch (e) { Object.assign(AS, { checking: false, expired: true, error: e.status === 410 ? null : e.message }); }
  renderAuth();
}
function authBusy(form, on) { const b = form.querySelector('button[type=submit]'); if (b) { b.disabled = on; b.classList.toggle('loading', on); } }
async function authSubmit(form) {
  const fd = Object.fromEntries(new FormData(form)); const kind = form.dataset.form.slice(5);
  const bad = m => { AS.error = m; AS.info = null; AS.noFocus = true; Object.assign(AS, { email: fd.email || AS.email, name: fd.name || AS.name }); renderAuth(); AS.noFocus = false; };
  if ((kind === 'invite' || kind === 'reset' || kind === 'first') && fd.password !== fd.confirm) return bad('The two passwords don’t match.');
  if ((kind === 'login' || kind === 'forgot') && !/^\S+@\S+\.\S+$/.test(fd.email || '')) return bad('Enter a valid email address.');
  authBusy(form, true);
  try {
    if (kind === 'login') { const r = await api('POST', '/api/login', { email: fd.email, password: fd.password, remember: !!fd.remember }); AUTH.user = r.user; AUTH.lastPw = r.user.mustChange ? fd.password : null; if (r.user.mustChange) return showAuth('first'); return startApp(); }
    if (kind === 'invite') { const r = await api('POST', '/api/invite/accept', { token: AS.token, password: fd.password, remember: !!fd.remember }); history.replaceState(null, '', '/'); AUTH.user = r.user; return startApp(); }
    if (kind === 'forgot') { await api('POST', '/api/forgot', { email: fd.email }); return showAuth('sent', { email: fd.email }); }
    if (kind === 'reset') { const r = await api('POST', '/api/reset', { token: AS.token, password: fd.password }); history.replaceState(null, '', '/'); if (r.user) { AUTH.user = r.user; toast('Password saved — you’re signed in'); return startApp(); } return showAuth('login', { info: 'Password saved. Sign in with your new password.' }); }
    if (kind === 'first') {
      if (fd.email != null) { const r = await api('PATCH', '/api/account', { email: fd.email }); AUTH.user = r.user; }
      const r = await api('POST', '/api/account/password', { current: AUTH.lastPw || fd.current, next: fd.password }); AUTH.user = r.user; AUTH.lastPw = null; toast('Password saved'); return startApp();
    }
  } catch (e) {
    authBusy(form, false);
    if (kind === 'login' && e.data && e.data.locked) { AS.locked = true; return bad(e.message); }
    if ((kind === 'reset' || kind === 'invite') && e.status === 410) { AS.expired = true; return bad(null); }
    return bad(e.message);
  }
}
document.addEventListener('submit', e => { const f = e.target; if (f.dataset && /^auth-/.test(f.dataset.form || '')) { e.preventDefault(); authSubmit(f); } });
document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.meter) { const m = t.closest('form').querySelector('#af-meter, .af-meter'); if (m) m.innerHTML = pwMeter(t.value); } });
Object.assign(ACT, {
  'auth-go': el => { const v = el.dataset.v; const em = ($('#auth input[name="email"]') || {}).value; if (location.pathname !== '/') history.replaceState(null, '', '/'); showAuth(v, { email: em || AS.email || AS.inviteEmail }); },
  'auth-retry': () => { location.reload(); },
  'pw-eye': el => { const i = el.parentElement.querySelector('input'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; el.innerHTML = icon(show ? 'eyeOff' : 'eye'); el.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); },
  logout: () => logout()
});

/* ---------- shared helpers ---------- */
function ago(t) { if (!t) return '—'; const s = Math.round((Date.now() - t) / 1000); if (s < 45) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; if (s < 86400 * 30) return Math.round(s / 86400) + ' d ago'; return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
const when = t => t ? new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
function uaLabel(ua) { ua = ua || ''; const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const o = /Windows/.test(ua) ? 'Windows' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : ''; return b + (o ? ' on ' + o : ''); }
const kb = n => n > 1048576 ? fmt(n / 1048576, 1) + ' MB' : fmt(Math.max(1, n / 1024)) + ' KB';
const EV = { login_ok: 'Signed in', login_fail: 'Failed sign-in', locked: 'Account locked', unlocked: 'Unlocked by admin', logout: 'Signed out', reset_requested: 'Password reset requested', reset_email_sent: 'Reset email sent', reset_email_failed: 'Reset email failed', reset_done: 'Password reset', password_changed: 'Password changed', temp_password_set: 'Temporary password set', register: 'Signed up', user_created: 'Account created by admin', user_deleted: 'Account deleted by admin', account_deleted: 'Deleted own account', email_changed: 'Email changed', profile_updated: 'Profile updated', session_revoked: 'Signed out a device', sessions_revoked: 'Signed out other devices', role_changed: 'Role changed', status_changed: 'Status changed', settings_changed: 'Settings changed', email_test: 'Test email', email_failed: 'Email failed', backup_downloaded: 'Backup downloaded', admin_created: 'Default admin created', invite_sent: 'Invite sent', invite_resent: 'Invite re-sent', invite_revoked: 'Invite revoked', invite_accepted: 'Joined from invite', invite_failed: 'Invite email failed', sync_requested: 'Meal sync requested', sync_started: 'Meal sync started', sync_declined: 'Meal sync declined', sync_cancelled: 'Meal sync request cancelled', sync_ended: 'Meal sync ended' };
const EV_BAD = /fail|locked|deleted/;
function downloadJSON(obj, name) { const blob = new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
const serverOnly = title => `<div class="page-head"><div class="t"><h1>${title}</h1></div></div><div class="card"><div class="note">${icon('info')}<span>Accounts need the FORGE 90 server. You opened the app as a file, so it runs in single-user mode with data saved in this browser. Start the server (see README) and open <b>http://localhost:8090</b> to sign in.</span></div></div>`;

/* ---------- account settings (#/account) ---------- */
let ACC = null;
function viewAccount() {
  if (AUTH.mode !== 'server' || !AUTH.user) return serverOnly('Account');
  return `<div class="page-head"><div class="t"><h1>Account</h1><p>Your profile, password, signed-in devices and account data.</p></div>${isAdmin() ? `<a class="btn" href="#/admin">${icon('shield')}Admin console</a>` : ''}</div><div id="acc-root">${ACC ? accountHTML(ACC) : '<div class="card"><div class="auth-spin"></div></div>'}</div>`;
}
async function accountAfter() { try { ACC = await api('GET', '/api/account'); AUTH.user = ACC.user; const r = $('#acc-root'); if (r) { r.innerHTML = accountHTML(ACC); } } catch (e) { toast(e.message); } syncFetch(true); }
function accountHTML(d) {
  const u = d.user; const notify = u.notify || {};
  const sessions = d.sessions.map(s => `<div class="sess-row"><span class="lk-ic">${icon('device')}</span><div style="flex:1;min-width:0"><b>${esc(uaLabel(s.ua))}</b> ${s.current ? '<span class="pill acc">This device</span>' : ''}${s.remember ? '<span class="pill">Kept signed in</span>' : ''}
      <div class="tiny muted">IP ${esc(s.ip || '—')} · active ${ago(s.lastSeen)} · signed in ${when(s.createdAt)}</div></div>
      <button class="btn sm ${s.current ? 'ghost' : ''}" data-act="acc-revoke" data-id="${s.id}" data-self="${s.current ? 1 : 0}">${s.current ? 'Sign out' : 'Sign out device'}</button></div>`).join('');
  const events = d.events.map(e => `<div class="ev-row"><span class="ev-dot ${EV_BAD.test(e.type) ? 'bad' : ''}"></span><div style="flex:1;min-width:0"><b>${esc(EV[e.type] || e.type)}</b>${e.detail ? `<span class="tiny muted"> · ${esc(e.detail)}</span>` : ''}<div class="tiny muted">${when(e.t)}${e.ip ? ' · IP ' + esc(e.ip) : ''}</div></div></div>`).join('') || '<div class="muted small">No activity yet.</div>';
  return `<div class="grid g2">
    <div class="card"><div class="card-h"><h2>${icon('user')}Profile</h2><span class="pill ${u.role === 'admin' ? 'acc' : ''}">${u.role === 'admin' ? 'Administrator' : 'Member'}</span></div>
      <div class="acc-id"><span class="avatar lg">${esc(initials(u.name))}</span><div><b>${esc(u.name)}</b>${u.firstName || u.lastName ? `<div class="small">${esc([u.firstName, u.lastName].filter(Boolean).join(' '))}</div>` : ''}<div class="small muted">${esc(u.email)}</div><div class="tiny muted">Member since ${new Date(u.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div></div></div>
      <form data-form="acc-profile" class="grid" style="gap:12px;margin-top:14px">
        <div class="grid g2" style="gap:12px"><div class="field"><label>First name</label><input class="inp" name="firstName" value="${esc(u.firstName || '')}" maxlength="40" autocomplete="given-name"></div><div class="field"><label>Last name</label><input class="inp" name="lastName" value="${esc(u.lastName || '')}" maxlength="40" autocomplete="family-name"></div></div>
        <div class="field"><label>Nickname <span class="muted" style="font-weight:500">— your display name</span></label><input class="inp" name="name" value="${esc(u.name)}" maxlength="40" required><span class="tiny muted">Shown in the app and to anyone you sync meal plans with.</span></div>
        <div class="field"><label>Email (used to sign in and for password resets)</label><input class="inp" name="email" type="email" value="${esc(u.email)}" required data-input="acc-email"></div>
        <div class="field hidden" id="acc-cur"><label>Current password — needed to change your email</label><input class="inp" name="currentPassword" type="password" autocomplete="current-password"></div>
        <div><button class="btn primary" type="submit">Save profile</button></div></form></div>
    <div class="card"><div class="card-h"><h2>${icon('lock')}Password</h2><span class="tiny muted">Last changed ${ago(d.pwChangedAt)}</span></div>
      <form data-form="acc-password" class="grid" style="gap:12px">
        ${pwField('current', 'Current password', 'current-password')}
        ${pwField('password', 'New password', 'new-password', 'data-meter="1"')}<div class="af-meter">${pwMeter('')}</div>
        ${pwField('confirm', 'Confirm new password', 'new-password')}
        <div class="row wrap"><button class="btn primary" type="submit">Change password</button><span class="tiny muted">Your other devices will be signed out.</span></div></form>
      <hr class="sep"><label class="row small" style="gap:10px;cursor:pointer"><input type="checkbox" data-input="acc-notify" ${notify.passwordChange !== false ? 'checked' : ''}> Email me when my password is changed or reset</label>
      <div class="tiny muted" style="margin-top:6px">Forgot it? Sign out and use “Forgot password” — the reset link is emailed to ${esc(u.email)} and expires after ${(d.config && d.config.resetMinutes) || 30} minutes.</div></div>
  </div><div style="height:16px"></div>
  <div class="card" id="acc-sync">${syncCardHTML()}</div><div style="height:16px"></div>
  <div class="card"><div class="card-h"><h2>${icon('device')}Signed-in devices</h2>${d.sessions.length > 1 ? `<button class="btn sm" data-act="acc-revoke-others">Sign out all other devices</button>` : ''}</div>${sessions || '<div class="muted small">No active sessions.</div>'}</div>
  <div style="height:16px"></div>
  <div class="grid g2">
    <div class="card"><div class="card-h"><h2>${icon('activity')}Recent activity</h2></div><div class="ev-list">${events}</div></div>
    <div class="card"><div class="card-h"><h2>${icon('download')}Your data</h2></div>
      <div class="small sub">Your plan, weigh-ins, strength logs, custom foods and recipes are saved to your account and follow you to any device you sign in on.</div>
      <div class="grid g2" style="gap:10px;margin-top:12px"><div class="ms-stat"><span class="tiny muted">Last saved</span><b style="font-size:16px">${ago(AUTH.savedAt || d.data.updatedAt)}</b></div><div class="ms-stat"><span class="tiny muted">Size</span><b style="font-size:16px">${kb(d.data.bytes)}</b></div></div>
      <div class="row wrap" style="margin-top:12px"><button class="btn" data-act="export">${icon('download')}Export backup</button><label class="btn">${icon('upload')}Import backup<input type="file" accept="application/json" data-input="import" hidden></label><a class="btn ghost" href="#/settings">Plan settings ${icon('right')}</a></div>
      <hr class="sep"><div class="danger-zone"><div><b>Delete account</b><div class="tiny muted">Permanently removes your account and all of its data. This can’t be undone.</div></div><button class="btn danger" data-act="acc-delete">${icon('trash')}Delete account</button></div></div>
  </div>`;
}
async function accSubmit(form) {
  const fd = Object.fromEntries(new FormData(form)); const b = form.querySelector('button[type=submit]'); b.disabled = true;
  try {
    if (form.dataset.form === 'acc-profile') { const r = await api('PATCH', '/api/account', { name: fd.name, firstName: fd.firstName, lastName: fd.lastName, email: fd.email, currentPassword: fd.currentPassword }); AUTH.user = r.user; toast('Profile saved'); sideFoot(); }
    else { if (fd.password !== fd.confirm) throw new Error('The two new passwords don’t match.'); const r = await api('POST', '/api/account/password', { current: fd.current, next: fd.password }); AUTH.user = r.user; toast(`Password changed${r.signedOut ? ` — ${r.signedOut} other device${r.signedOut === 1 ? '' : 's'} signed out` : ''}`); }
    await accountAfter();
  } catch (e) { toast(e.message); b.disabled = false; }
}
document.addEventListener('submit', e => { const f = e.target; if (f.dataset && /^acc-/.test(f.dataset.form || '')) { e.preventDefault(); accSubmit(f); } });
document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.input === 'acc-email') { const c = $('#acc-cur'); if (c) c.classList.toggle('hidden', t.value.trim().toLowerCase() === (AUTH.user.email || '')); } });
document.addEventListener('change', async e => { const t = e.target; if (t.dataset && t.dataset.input === 'acc-notify') { try { const r = await api('PATCH', '/api/account', { notify: { passwordChange: t.checked } }); AUTH.user = r.user; toast(t.checked ? 'You’ll get an email when your password changes' : 'Password-change emails turned off'); } catch (x) { toast(x.message); t.checked = !t.checked; } } });
Object.assign(ACT, {
  'acc-revoke': async el => { const self = el.dataset.self === '1'; const go = async () => { try { await api('DELETE', '/api/account/sessions/' + el.dataset.id); if (self) { AUTH.user = null; return showAuth('login', { info: 'You’re signed out.' }); } toast('Device signed out'); accountAfter(); } catch (e) { toast(e.message); } }; if (self) logout(); else go(); },
  'acc-revoke-others': () => confirmBox('Sign out other devices?', 'Every other browser signed in to your account will need to sign in again.', 'Sign them out', async () => { try { const r = await api('POST', '/api/account/sessions/revoke-others'); toast(`${r.revoked} device${r.revoked === 1 ? '' : 's'} signed out`); accountAfter(); } catch (e) { toast(e.message); } }),
  'acc-delete': () => { modal(`<h2>Delete your account?</h2><p class="sub small">This permanently deletes <b>${esc(AUTH.user.email)}</b> with its plan, weigh-ins, logs, custom foods and recipes. Export a backup first if you want to keep anything.</p>
      <form data-form="acc-del" style="margin-top:12px">${pwField('password', 'Your password', 'current-password')}<div class="row" style="justify-content:flex-end;margin-top:14px"><button type="button" class="btn" data-act="close-modal">Cancel</button><button class="btn danger" type="submit">${icon('trash')}Delete forever</button></div></form>`, 'sm'); }
});
document.addEventListener('submit', async e => { const f = e.target; if (!f.dataset || f.dataset.form !== 'acc-del') return; e.preventDefault();
  try { await api('DELETE', '/api/account', { password: new FormData(f).get('password') }); try { localStorage.removeItem(STORE_KEY); } catch (x) { /* ignore */ } AUTH.user = null; S = null; showAuth('login', { info: 'Your account was deleted.' }); } catch (x) { toast(x.message); } });

/* ---------- admin console (#/admin) ---------- */
const ADM = { tab: 'overview', users: null, invites: null, settings: null, stats: null, audit: null, q: '', filter: 'all', evType: '', evUser: '' };
const ADM_TABS = [['overview', 'Overview', 'grid'], ['users', 'Users', 'users'], ['security', 'Security', 'lock'], ['app', 'App settings', 'sliders'], ['email', 'Email', 'mail'], ['proxy', 'Server & proxy', 'shield'], ['activity', 'Activity log', 'activity'], ['data', 'Data & backup', 'download']];
function viewAdmin() {
  if (AUTH.mode !== 'server' || !AUTH.user) return serverOnly('Admin');
  if (!isAdmin()) return `<div class="page-head"><div class="t"><h1>Admin</h1></div></div><div class="card"><div class="note warn">${icon('lock')}<span>Only administrators can open the admin console.</span></div></div>`;
  return `<div class="page-head"><div class="t"><h1>Admin console</h1><p>Invite people, manage accounts and admin privileges, sign-in security and email.</p></div></div>
    <div class="adm-tabs" role="tablist">${ADM_TABS.map(([k, l, i]) => `<button role="tab" aria-selected="${ADM.tab === k}" class="${ADM.tab === k ? 'on' : ''}" data-act="adm-tab" data-v="${k}">${icon(i)}<span>${l}</span></button>`).join('')}</div>
    <div id="adm-root">${admTabHTML()}</div>`;
}
async function adminAfter(force) {
  if (!isAdmin()) return; const t = ADM.tab;
  try {
    const need = { overview: ['stats', 'users', 'settings', 'invites'], users: ['users', 'invites'], security: ['settings'], app: ['settings'], email: ['settings'], proxy: ['proxy', 'settings'], activity: ['audit', 'users'], data: ['stats'] }[t];
    await Promise.all(need.filter(k => force || !ADM[k] || k === 'stats' || k === 'audit' || k === 'invites' || k === 'proxy' || (k === 'users' && t === 'users')).map(async k => {
      if (k === 'users') ADM.users = (await api('GET', '/api/admin/users')).users;
      if (k === 'invites') ADM.invites = (await api('GET', '/api/admin/invites')).invites;
      if (k === 'settings') ADM.settings = await api('GET', '/api/admin/settings');
      if (k === 'stats') ADM.stats = await api('GET', '/api/admin/stats');
      if (k === 'proxy') ADM.proxy = await api('GET', '/api/admin/proxy');
      if (k === 'audit') ADM.audit = (await api('GET', `/api/admin/audit?limit=400${ADM.evType ? '&type=' + ADM.evType : ''}${ADM.evUser ? '&user=' + ADM.evUser : ''}`)).events;
    }));
  } catch (e) { toast(e.message); if (e.status === 403 || e.status === 401) { AUTH.user && (AUTH.user.role = 'user'); return render(); } }
  if (ADM.tab === t) { const r = $('#adm-root'); if (r) r.innerHTML = admTabHTML(); }
}
const spin = '<div class="card"><div class="auth-spin"></div></div>';
const statusPill = u => u.status === 'pending' ? '<span class="pill warn-pill">Waiting for approval</span>' : u.status === 'disabled' ? '<span class="pill">Disabled</span>' : u.locked ? `<span class="pill warn-pill" title="Locked until ${when(u.lockedUntil)}">${icon('lock')}Locked</span>` : '<span class="pill acc">Active</span>';
function invDue(i) { const ms = i.expiresAt - Date.now(); if (i.expired || ms <= 0) return '<span class="pill warn-pill">Expired</span>'; const h = Math.round(ms / 3600000); return `<span class="small">in ${h < 24 ? h + ' h' : Math.round(h / 24) + ' day' + (Math.round(h / 24) === 1 ? '' : 's')}</span>`; }
const invActs = i => `<button class="btn sm" data-act="adm-inv-resend" data-id="${i.id}" title="Send a fresh link that lasts another ${(ADM.settings && ADM.settings.inviteDays) || 7} days">${icon('mail')}Resend</button><button class="btn sm ghost danger" data-act="adm-inv-revoke" data-id="${i.id}">Revoke</button>`;
function admTabHTML() {
  const t = ADM.tab, st = ADM.settings;
  if (t === 'overview') {
    if (!ADM.stats || !ADM.users || !st) return spin; const s = ADM.stats; const pend = ADM.users.filter(u => u.status === 'pending'); const locked = ADM.users.filter(u => u.locked);
    const tile = (l, v, sub, bad) => `<div class="ms-stat"><span class="tiny muted">${l}</span><b class="num">${v}</b><span class="tiny ${bad ? 'bad' : 'muted'}">${sub}</span></div>`;
    return `${st.email.ready ? '' : `<div class="note warn" style="margin-bottom:14px">${icon('mail')}<span><b>Email isn’t working yet</b> — invites and password-reset emails can’t be sent. Finish setup in <a href="#" data-act="adm-tab" data-v="email">Email</a>.</span></div>`}
      <div class="grid g4" style="gap:10px">${tile('Accounts', s.users, `${s.admins} admin${s.admins === 1 ? '' : 's'} · ${s.invites || 0} invite${s.invites === 1 ? '' : 's'} pending`)}${tile('Signed-in sessions', s.sessions, 'active right now or kept signed in')}${tile('Sign-ins · 24 h', s.logins24, `${s.failed24} failed attempt${s.failed24 === 1 ? '' : 's'}`, s.failed24 > 10)}${tile('Reset emails · 24 h', s.emails24, s.emailFail24 ? `${s.emailFail24} failed to send` : 'no failures', s.emailFail24 > 0)}</div>
      <div style="height:16px"></div><div class="grid g2">
      <div class="card"><div class="card-h"><h2>Pending invites</h2><span class="pill">${(ADM.invites || []).length}</span><button class="btn sm ghost" style="margin-left:auto" data-act="adm-new">${icon('plus')}Invite</button></div>${(ADM.invites || []).slice(0, 6).map(i => `<div class="sess-row"><span class="avatar">${esc(initials(i.name || i.email))}</span><div style="flex:1;min-width:0"><b>${esc(i.name || i.email)}</b>${i.role === 'admin' ? ' <span class="pill acc">Admin</span>' : ''}<div class="tiny muted">${i.name ? esc(i.email) + ' · ' : ''}sent ${ago(i.sentAt)} · ${i.expired ? 'expired' : 'expires ' + invDue(i).replace(/<[^>]+>/g, '')}</div></div>${invActs(i)}</div>`).join('') || `<div class="muted small">No invites waiting. New accounts are invite-only — use <b>Invite</b> to email someone a link (it lasts ${st.inviteDays || 7} days).</div>`}
        ${pend.length ? `<div class="tiny muted" style="margin-top:10px">${pend.length} older sign-up${pend.length === 1 ? ' is' : 's are'} still waiting for approval — see Users.</div>` : ''}</div>
      <div class="card"><div class="card-h"><h2>Locked accounts</h2><span class="pill">${locked.length}</span></div>${locked.map(u => `<div class="sess-row"><span class="avatar">${esc(initials(u.name))}</span><div style="flex:1;min-width:0"><b>${esc(u.name)}</b><div class="tiny muted">${esc(u.email)} · until ${when(u.lockedUntil)}</div></div><button class="btn sm" data-act="adm-unlock" data-id="${u.id}">Unlock</button></div>`).join('') || `<div class="muted small">No locked accounts. Accounts lock after ${st.security.lockThreshold} failed sign-ins for ${st.security.lockMinutes} minutes${st.security.autoResetOnLock ? ', and the owner is emailed a reset link' : ''}.</div>`}</div></div>
      <div style="height:16px"></div><div class="card"><div class="card-h"><h2>Quick settings</h2></div><div class="grid g3" style="gap:10px">
        ${admSwitch('Email a reset link on lockout', 'security.autoResetOnLock', st.security.autoResetOnLock)}${admSwitch('Email people when their password changes', 'security.notifyPasswordChange', st.security.notifyPasswordChange)}</div></div>`;
  }
  if (t === 'users') {
    if (!ADM.users) return spin; const q = ADM.q.toLowerCase();
    const list = ADM.users.filter(u => (!q || (u.name + ' ' + u.email).toLowerCase().includes(q)) && (ADM.filter === 'all' || (ADM.filter === 'admin' && u.role === 'admin') || (ADM.filter === 'locked' && u.locked) || u.status === ADM.filter))
      .sort((a, b) => (a.status === 'pending' ? -1 : 0) - (b.status === 'pending' ? -1 : 0) || (b.role === 'admin') - (a.role === 'admin') || a.name.localeCompare(b.name));
    const counts = { all: ADM.users.length, admin: ADM.users.filter(u => u.role === 'admin').length, pending: ADM.users.filter(u => u.status === 'pending').length, locked: ADM.users.filter(u => u.locked).length, disabled: ADM.users.filter(u => u.status === 'disabled').length };
    const rows = list.map(u => { const me = u.id === AUTH.user.id;
      return `<tr><td><div class="row" style="gap:10px;flex-wrap:nowrap"><span class="avatar">${esc(initials(u.name))}</span><div style="min-width:0"><b>${esc(u.name)}</b>${me ? ' <span class="pill">You</span>' : ''}<div class="tiny muted">${esc(u.email)}</div></div></div></td>
        <td><label class="adm-role" title="${me ? 'You can’t remove your own admin access here' : 'Give or remove administrator privileges'}"><input type="checkbox" data-input="adm-role" data-id="${u.id}" ${u.role === 'admin' ? 'checked' : ''} ${me || u.status !== 'active' ? 'disabled' : ''}><i class="switch ${u.role === 'admin' ? 'on' : ''}" aria-hidden="true"><i></i></i><span class="small">${u.role === 'admin' ? 'Admin' : 'Member'}</span></label></td>
        <td>${statusPill(u)}${u.mustChange ? ' <span class="pill" title="Must choose a new password at next sign-in">Temp password</span>' : ''}</td>
        <td class="small">${u.lastLoginAt ? ago(u.lastLoginAt) : '<span class="muted">never</span>'}</td><td class="small num">${u.sessions}</td><td class="small num">${u.dataBytes ? kb(u.dataBytes) : '—'}</td>
        <td style="text-align:right;white-space:nowrap">${u.status === 'pending' ? `<button class="btn sm primary" data-act="adm-approve" data-id="${u.id}">Approve</button> ` : ''}${u.locked ? `<button class="btn sm" data-act="adm-unlock" data-id="${u.id}">Unlock</button> ` : ''}<button class="btn sm" data-act="adm-user" data-id="${u.id}">Manage</button></td></tr>`; }).join('');
    const invs = ADM.invites || [];
    const invCard = invs.length ? `<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Pending invites</h2><span class="pill">${invs.length}</span><span class="tiny muted" style="margin-left:auto">Links last ${(ADM.settings && ADM.settings.inviteDays) || 7} days and work once</span></div><div class="scroll-x"><table class="tbl adm-invites"><thead><tr><th>Invited</th><th>Role</th><th>Sent</th><th>Expires</th><th></th></tr></thead><tbody>${invs.map(i => `<tr><td><div class="row" style="gap:10px;flex-wrap:nowrap"><span class="avatar">${esc(initials(i.name || i.email))}</span><div style="min-width:0"><b>${esc(i.name || i.email)}</b>${i.name ? `<div class="tiny muted">${esc(i.email)}</div>` : ''}</div></div></td><td><span class="pill ${i.role === 'admin' ? 'acc' : ''}">${i.role === 'admin' ? 'Admin' : 'Member'}</span></td><td class="small">${ago(i.sentAt)}${i.invitedBy ? `<div class="tiny muted">by ${esc(i.invitedBy)}${i.sends > 1 ? ` · sent ${i.sends}×` : ''}</div>` : ''}</td><td>${invDue(i)}</td><td style="text-align:right;white-space:nowrap">${invActs(i)}</td></tr>`).join('')}</tbody></table></div></div>` : '';
    return `${invCard}<div class="card"><div class="row wrap" style="margin-bottom:12px"><input class="inp" style="max-width:260px" placeholder="Search name or email…" data-input="adm-q" value="${esc(ADM.q)}" aria-label="Search users">
        <div class="filters">${[['all', 'All'], ['admin', 'Admins']].concat(counts.pending ? [['pending', 'Waiting approval']] : [], [['locked', 'Locked'], ['disabled', 'Disabled']]).map(([k, l]) => `<button class="${ADM.filter === k ? 'on' : ''}" data-act="adm-filter" data-v="${k}">${l} ${counts[k]}</button>`).join('')}</div>
        <button class="btn primary" style="margin-left:auto" data-act="adm-new">${icon('mail')}Invite user</button></div>
      <div class="scroll-x"><table class="tbl adm-users"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last sign-in</th><th>Devices</th><th>Data</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="muted">No users match.</td></tr>'}</tbody></table></div></div>`;
  }
  if (!st && (t === 'security' || t === 'app' || t === 'email')) return spin;
  if (t === 'security') { const s = st.security;
    return `<form data-form="adm-security" class="card"><div class="card-h"><h2>Sign-in security</h2></div><div class="grid g2" style="gap:14px">
      ${admNum('Minimum password length', 'pwMinLength', s.pwMinLength, 8, 64, 'characters')}${admChk('Require letters and a number or symbol', 'pwRequireMix', s.pwRequireMix)}
      ${admNum('Failed sign-ins before lockout', 'lockThreshold', s.lockThreshold, 3, 20, 'attempts')}${admNum('Lockout lasts', 'lockMinutes', s.lockMinutes, 1, 1440, 'minutes')}
      ${admChk('When an account locks, email its owner a password-reset link', 'autoResetOnLock', s.autoResetOnLock)}${admChk('Email users when their password is changed or reset', 'notifyPasswordChange', s.notifyPasswordChange)}
      ${admChk(`<b>Require HTTPS</b> — send plain-HTTP visits to the secure App address<br><span class="tiny muted">${st.httpsEnvOff ? 'Turned off by <code>REQUIRE_HTTPS=false</code> in the container settings.' : st.httpsTarget ? `Visits like <code>http://&lt;server-ip&gt;:8090</code> go to <b>${esc(st.httpsTarget)}</b>, and browsers are told to always use HTTPS.` : 'Takes effect once the App address starts with https:// (Admin → App settings).'} See <a href="#" data-act="adm-tab" data-v="proxy">Server &amp; proxy</a>.</span>`, 'requireHttps', s.requireHttps !== false)}
      ${admNum('Signed-in session lasts (idle)', 'sessionHours', s.sessionHours, 1, 168, 'hours')}${admNum('“Keep me signed in” lasts', 'rememberDays', s.rememberDays, 1, 365, 'days')}
      <div class="field"><label>Password-reset links expire after</label><div class="row"><input class="inp" value="${st.resetMinutes}" disabled style="max-width:90px"><span class="small muted">minutes · single use</span></div></div></div>
      <div class="note" style="margin-top:14px">${icon('info')}<span>Passwords are stored as salted scrypt hashes; reset links are random 256-bit tokens stored hashed, and every password change signs the account out everywhere else. New rules apply the next time someone chooses a password.</span></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" type="submit">Save security settings</button></div></form>`; }
  if (t === 'app') {
    return `<form data-form="adm-app" class="card"><div class="card-h"><h2>App settings</h2></div>
      <div class="note acc" style="margin-bottom:14px">${icon('mail')}<span><b>New accounts are invite-only.</b> An administrator invites people from <a href="#" data-act="adm-tab" data-v="users">Users → Invite user</a>. Each invite link lasts ${st.inviteDays || 7} days and works once; nobody can create an account on their own.</span></div>
      <div class="grid g2" style="gap:14px">
      <div class="field"><label>App name (shown in emails)</label><input class="inp" name="appName" value="${esc(st.appName)}" maxlength="40"></div>
      <div class="field"><label>Default theme for new accounts</label><select class="inp" name="theme">${['dark', 'light', 'system'].map(v => `<option ${st.defaults.theme === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field" style="grid-column:1/-1"><label>App address <span class="muted" style="font-weight:500">— used for the links in invite and reset emails</span></label><input class="inp" name="appUrl" value="${esc(st.appUrl)}" placeholder="${esc(st.envAppUrl || location.origin)}"><span class="tiny muted">Set this to the address people open FORGE 90 at (for example http://192.168.1.20:8090 or https://forge.example.com). If it’s blank, links use ${esc(st.envAppUrl || 'the address in each request')}.</span></div></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" type="submit">Save</button></div></form>`; }
  if (t === 'email') { const e = st.email;
    return `<div class="grid g-split"><form data-form="adm-email" class="card"><div class="card-h"><h2>Outgoing email (SMTP)</h2>${e.ready ? '<span class="pill acc">Ready</span>' : '<span class="pill warn-pill">Not set up</span>'}</div><div class="grid g2" style="gap:14px">
      <div class="field"><label>SMTP server</label><input class="inp" name="host" value="${esc(e.host)}" placeholder="smtp.gmail.com"></div>
      <div class="field"><label>Port & security</label><div class="row" style="gap:6px;flex-wrap:nowrap"><input class="inp" name="port" type="number" value="${e.port}" style="max-width:100px"><select class="inp" name="security">${[['tls', 'SSL/TLS (465)'], ['starttls', 'STARTTLS (587)'], ['none', 'None (local relay)']].map(([v, l]) => `<option value="${v}" ${e.security === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
      <div class="field"><label>Username</label><input class="inp" name="user" value="${esc(e.user)}" autocomplete="off"></div>
      <div class="field"><label>Password / app password</label><input class="inp" name="pass" type="password" autocomplete="new-password" placeholder="${e.passSet ? '•••••••• saved' + (e.passSource === 'env' ? ' in the environment' : ' here') + ' — type to replace' : 'Not set'}">${e.passSource === 'admin' ? `<label class="tiny chk"><input type="checkbox" name="clearPass"> Remove the saved password${ENV_HINT()}</label>` : ''}</div>
      <div class="field"><label>From name</label><input class="inp" name="fromName" value="${esc(e.fromName)}"></div>
      <div class="field"><label>From address</label><input class="inp" name="fromEmail" type="email" value="${esc(e.fromEmail)}"></div></div>
      <div class="tiny muted" style="margin-top:10px">${Object.values(e.source || {}).includes('admin') || e.passSource === 'admin' ? 'Some values are set here and override the server environment (Docker variables / .env).' : 'All values come from the server environment (Docker variables / .env). Anything you save here overrides them.'}</div>
      <div class="row" style="justify-content:flex-end;margin-top:12px">${Object.values(e.source || {}).includes('admin') || e.passSource === 'admin' ? `<button class="btn ghost" type="button" data-act="adm-email-env">Use environment values</button>` : ''}<button class="btn primary" type="submit">Save email settings</button></div></form>
      <div><div class="card"><div class="card-h"><h2>Send a test</h2></div><div class="row" style="gap:6px;flex-wrap:nowrap"><input class="inp" id="adm-test-to" type="email" value="${esc(AUTH.user.email)}" aria-label="Send test to"><button class="btn" data-act="adm-test-email">${icon('mail')}Send</button></div><div class="tiny muted" style="margin-top:8px" id="adm-test-out">Sends a sample message using the saved settings.</div></div>
      <div style="height:16px"></div><div class="card"><div class="card-h"><h2>Using Gmail</h2></div><ol class="small sub" style="padding-left:18px;margin:0">
        <li>Google no longer accepts an account’s normal password over SMTP. Turn on <b>2-Step Verification</b> for the sending account.</li>
        <li>Create an <b>App password</b> at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">myaccount.google.com/apppasswords</a> (16 letters).</li>
        <li>Paste it into <b>Password</b> here (or <code>SMTP_PASS</code> in <code>.env</code>), keep smtp.gmail.com · 465 · SSL/TLS, and send a test.</li></ol></div></div></div>`; }
  if (t === 'activity') {
    if (!ADM.audit) return spin; const users = ADM.users || [];
    const rows = ADM.audit.map(a => `<tr><td class="small nowrap">${when(a.t)}</td><td><span class="ev-dot ${EV_BAD.test(a.type) ? 'bad' : ''}"></span>${esc(EV[a.type] || a.type)}</td><td class="small">${esc(a.user || '—')}</td><td class="small">${a.actor && a.actor !== a.user ? esc(a.actor) : '<span class="muted">—</span>'}</td><td class="small nowrap">${esc(a.ip || '—')}</td><td class="small muted">${esc(a.detail || '')}</td></tr>`).join('');
    return `<div class="card"><div class="row wrap" style="margin-bottom:12px"><select class="inp" style="max-width:220px" data-input="adm-evtype"><option value="">All events</option>${Object.entries(EV).map(([k, l]) => `<option value="${k}" ${ADM.evType === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <select class="inp" style="max-width:240px" data-input="adm-evuser"><option value="">All users</option>${users.map(u => `<option value="${u.id}" ${ADM.evUser === u.id ? 'selected' : ''}>${esc(u.email)}</option>`).join('')}</select><button class="btn" data-act="adm-refresh">${icon('loop')}Refresh</button><span class="tiny muted" style="margin-left:auto">Newest first · last 400 matching events</span></div>
      <div class="scroll-x"><table class="tbl"><thead><tr><th>When</th><th>Event</th><th>Account</th><th>By</th><th>IP</th><th>Details</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="muted">No events.</td></tr>'}</tbody></table></div></div>`;
  }
  if (t === 'proxy') return admProxyHTML();
  if (t === 'data') { if (!ADM.stats) return spin; const s = ADM.stats;
    return `<div class="grid g2"><div class="card"><div class="card-h"><h2>Full backup</h2></div><div class="small sub">Downloads every account (without passwords), each account’s plan data and the app settings (without the email password) as one JSON file.</div>
      <div class="row" style="margin-top:12px"><button class="btn primary" data-act="adm-backup">${icon('download')}Download backup</button></div>
      <div class="note" style="margin-top:12px">${icon('info')}<span>To back up everything including passwords, copy the server’s <code>data</code> folder while it’s stopped.</span></div></div>
      <div class="card"><div class="card-h"><h2>Server</h2></div><table class="tbl"><tbody><tr><td>Data folder</td><td class="small"><code>${esc(s.dataDir)}</code></td></tr><tr><td>Stored data</td><td class="num">${kb(s.dataBytes)}</td></tr><tr><td>Accounts</td><td class="num">${s.users} · ${s.invites || 0} invited · ${s.disabled} disabled</td></tr><tr><td>FORGE 90</td><td>${esc(s.version || APP_VERSION)}</td></tr><tr><td>License</td><td><a href="${SOURCE_URL}/blob/main/LICENSE" target="_blank" rel="noopener">AGPL-3.0</a> · <a href="${SOURCE_URL}" target="_blank" rel="noopener">Source code</a></td></tr><tr><td>Node.js</td><td>${esc(s.node)}</td></tr><tr><td>Up for</td><td>${s.uptime > 86400 ? fmt(s.uptime / 86400, 1) + ' days' : s.uptime > 3600 ? fmt(s.uptime / 3600, 1) + ' h' : Math.round(s.uptime / 60) + ' min'}</td></tr></tbody></table></div></div>`; }
  return '';
}
/* Admin → Server & proxy: what the server sees for this very request, with fixes for common reverse-proxy mistakes */
const urlHost = u => { try { return new URL(u).host.toLowerCase(); } catch (e) { return ''; } };
function trustSuggestion(peer) { const m = /^(\d+)\.(\d+)\.\d+\.\d+$/.exec(peer || ''); if (m && +m[1] === 172 && +m[2] >= 16 && +m[2] <= 31) return `${m[1]}.${m[2]}.0.0/16`; return peer || 'your-proxy-ip'; }
function admProxyHTML() {
  const p = ADM.proxy; if (!p) return spin;
  const via = !!(p.headers.xff || p.headers.proto || p.headers.xRealIp); const reqHost = String(p.headers.host || '').toLowerCase(); const appHost = urlHost(p.appUrl);
  const sug = esc(trustSuggestion(p.peer)); const code = v => `<code>${esc(v)}</code>`; const checks = []; const add = (st, title, text) => checks.push({ st, title, text });
  if (p.https) add('ok', 'Connected over HTTPS', via ? 'Your proxy passes <code>X-Forwarded-Proto: https</code> and FORGE 90 trusts it.' : 'This connection is encrypted.');
  else if (via && !p.trusted) add('bad', 'HTTPS isn’t detected', `Your proxy at ${code(p.peer)} sends forwarded headers, but FORGE 90 isn’t set to trust it. Set ${code('TRUST_PROXY=' + trustSuggestion(p.peer))} in the Unraid template, then restart the container.`);
  else if (appHost && reqHost === appHost) add('bad', 'HTTPS isn’t detected', `You opened ${code(reqHost)}, but the request reached FORGE 90 as plain HTTP. In Nginx Proxy Manager, give the proxy host an SSL certificate and turn on <b>Force SSL</b>.`);
  else add('warn', 'Plain HTTP', `You’re connected straight to ${code(reqHost)} without encryption, so passwords cross your network in plain text. Use your https:// address.`);
  if (via && p.trusted) add(p.trustMode === 'all' ? 'warn' : 'ok', 'Visitor IP addresses', `FORGE 90 sees you as <b>${esc(p.clientIp)}</b>, through your proxy at ${code(p.peer)}.` + (p.trustMode === 'all' ? `<br><code>TRUST_PROXY=true</code> trusts forwarded headers from anything that can reach port ${p.port}, so someone on your network could fake their address. Lock it to your proxy: ${code('TRUST_PROXY=' + trustSuggestion(p.peer))}.` : ''));
  else if (via) add('bad', 'Visitor IP addresses', `Every visitor looks like ${code(p.peer)} (your proxy), so sign-in limits and lockouts would hit everyone at once and the activity log shows the proxy. Set ${code('TRUST_PROXY=' + trustSuggestion(p.peer))}.`);
  else add('ok', 'Visitor IP addresses', `Direct connection — FORGE 90 sees you as <b>${esc(p.clientIp)}</b>.`);
  if (!p.appUrl) add('warn', 'App address', 'Not set, so links in invite and reset emails use whatever address each request came in on. Set <code>APP_URL</code> (or Admin → App settings) to your https:// address.');
  else if (!/^https:/i.test(p.appUrl)) add('warn', 'App address', `${code(p.appUrl)} isn’t https. Change it to your https:// address so email links are secure and Require HTTPS can work.`);
  else if (appHost !== reqHost) add('info', 'App address', `Emails link to <b>${esc(p.appUrl)}</b>; right now you’re using ${code(reqHost)}.`);
  else add('ok', 'App address', `Invite and reset emails link to <b>${esc(p.appUrl)}</b>${p.appUrlSource === 'admin' ? ' (set in App settings)' : ''}.`);
  if (p.https && p.cookieSecure) add('ok', 'Secure sign-in cookie', 'The session cookie is only ever sent over HTTPS.');
  else if (p.https) add('warn', 'Secure sign-in cookie', `<code>COOKIE_SECURE=${esc(p.cookieSetting)}</code> — remove it or set it to <code>auto</code>.`);
  else add('info', 'Secure sign-in cookie', 'Turns on automatically once you connect over HTTPS.');
  const rh = p.requireHttps;
  if (rh.envOff) add('info', 'Require HTTPS', 'Turned off by <code>REQUIRE_HTTPS=false</code> in the container settings.');
  else if (!rh.setting) add('warn', 'Require HTTPS', 'Off (Admin → Security), so plain-HTTP visits by IP address are allowed.');
  else if (!rh.target) add('info', 'Require HTTPS', 'Waiting for an https:// App address. Once it’s set, plain-HTTP visits such as <code>http://&lt;server-ip&gt;:8090</code> are sent there.');
  else add('ok', 'Require HTTPS', `Plain-HTTP visits to any other address are sent to <b>${esc(rh.target)}</b>${p.hsts ? ', and browsers are told to always use HTTPS (HSTS).' : '.'}`);
  if (p.trustBad.length) add('bad', 'TRUST_PROXY', `Ignored because they aren’t IP addresses or CIDR ranges: ${p.trustBad.map(code).join(', ')}.`);
  const ic = { ok: 'check', warn: 'info', bad: 'x', info: 'info' };
  const bad = checks.filter(c => c.st === 'bad' || c.st === 'warn').length;
  const rows = [['Connected from', p.peer], ['X-Forwarded-For', p.headers.xff], ['X-Forwarded-Proto', p.headers.proto], ['X-Real-IP', p.headers.xRealIp], ['Host', p.headers.host], ['TRUST_PROXY', p.trustRaw || '(not set)'], ['Listening on', `${p.host}:${p.port}`], ['Version', p.version]];
  const appUrlEx = p.appUrl && /^https:/i.test(p.appUrl) ? p.appUrl : 'https://forge.yourdomain.com';
  return `<div class="grid g-split"><div class="card"><div class="card-h"><h2>Connection checks</h2>${bad ? `<span class="pill warn-pill">${bad} to fix</span>` : '<span class="pill acc">All good</span>'}<button class="btn sm ghost" style="margin-left:auto" data-act="adm-refresh">${icon('loop')}Re-check</button></div>
      <div class="px-checks">${checks.map(c => `<div class="px-row ${c.st}"><span class="px-ic">${icon(ic[c.st])}</span><div><b>${c.title}</b><div class="small sub">${c.text}</div></div></div>`).join('')}</div>
      <div class="tiny muted" style="margin-top:10px">Checks describe this browser’s connection. Open this page through your https:// address to test the proxy.</div></div>
    <div><div class="card"><div class="card-h"><h2>What the server received</h2></div><table class="tbl"><tbody>${rows.map(([k, v]) => `<tr><td class="small">${k}</td><td class="small">${v ? `<code>${esc(v)}</code>` : '<span class="muted">—</span>'}</td></tr>`).join('')}</tbody></table></div>
      <div style="height:16px"></div><div class="card"><div class="card-h"><h2>Nginx Proxy Manager setup</h2></div><ol class="small sub px-steps">
        <li><b>Proxy host:</b> domain <code>${esc(urlHost(appUrlEx))}</code>, scheme <code>http</code>, forward to the FORGE 90 container (its name or IP) on port <code>${p.port}</code>. Turn on <b>Block Common Exploits</b>.</li>
        <li><b>SSL tab:</b> pick your certificate and turn on <b>Force SSL</b>, <b>HTTP/2</b> and <b>HSTS</b>.</li>
        <li><b>Unraid template:</b> <code>APP_URL=${esc(appUrlEx)}</code> and <code>TRUST_PROXY=${via ? sug : '&lt;proxy IP or subnet&gt;'}</code>, then apply.</li>
        <li><b>Best:</b> put FORGE 90 and Nginx Proxy Manager on the same custom Docker network and remove FORGE 90’s port mapping, so it can only be reached through the proxy.</li></ol></div></div></div>`;
}
const ENV_HINT = () => ' (falls back to the environment)';
const admNum = (label, name, v, lo, hi, unit) => `<div class="field"><label>${label}</label><div class="row" style="gap:8px;flex-wrap:nowrap"><input class="inp" type="number" name="${name}" value="${v}" min="${lo}" max="${hi}" style="max-width:110px"><span class="small muted">${unit}</span></div></div>`;
const admChk = (label, name, v) => `<label class="adm-chk"><input type="checkbox" name="${name}" ${v ? 'checked' : ''}><span>${label}</span></label>`;
const admSwitch = (label, key, v) => `<label class="adm-chk"><input type="checkbox" data-input="adm-quick" data-k="${key}" ${v ? 'checked' : ''}><span>${label}</span></label>`;
async function admSave(patch, msg) { try { ADM.settings = await api('PATCH', '/api/admin/settings', patch); AUTH.config = Object.assign({}, AUTH.config, { appName: ADM.settings.appName }); document.title = appTitle() + ' · Admin'; toast(msg || 'Settings saved'); const r = $('#adm-root'); if (r) r.innerHTML = admTabHTML(); } catch (e) { toast(e.message); } }
async function admUserAction(id, method, path, body, msg) { try { const r = await api(method, `/api/admin/users/${id}${path}`, body); if (msg) toast(typeof msg === 'function' ? msg(r) : msg); ADM.users = (await api('GET', '/api/admin/users')).users; ADM.stats = null; const rt = $('#adm-root'); if (rt) rt.innerHTML = admTabHTML(); if ($('#modal .adm-user-modal')) admUserModal(id); if (ADM.tab === 'overview') adminAfter(); return r; } catch (e) { toast(e.message); return null; } }
function admUserModal(id) {
  const u = (ADM.users || []).find(x => x.id === id); if (!u) return closeModal(); const me = u.id === AUTH.user.id;
  const info = [['Joined', when(u.createdAt)], ['Last sign-in', u.lastLoginAt ? `${when(u.lastLoginAt)}${u.lastLoginIp ? ' · ' + esc(u.lastLoginIp) : ''}` : 'never'], ['Password changed', ago(u.pwChangedAt)], ['Signed-in devices', u.sessions], ['Plan data', u.dataBytes ? `${kb(u.dataBytes)} · saved ${ago(u.dataUpdatedAt)}` : 'none yet'], ['Failed sign-ins', u.failed]];
  modal(`<div class="adm-user-modal"><div class="row" style="align-items:flex-start"><span class="avatar lg">${esc(initials(u.name))}</span><div style="flex:1;min-width:0"><h2>${esc(u.name)}${me ? ' <span class="pill">You</span>' : ''}</h2><div class="small muted">${esc(u.email)}</div><div class="row wrap" style="gap:6px;margin-top:6px"><span class="pill ${u.role === 'admin' ? 'acc' : ''}">${u.role === 'admin' ? 'Administrator' : 'Member'}</span>${statusPill(u)}</div></div><button class="btn icon ghost" data-act="close-modal">${icon('x')}</button></div>
    <div class="grid g3 adm-info">${info.map(([k, v]) => `<div><span class="tiny muted">${k}</span><b class="small">${v}</b></div>`).join('')}</div>
    <h3>Access</h3><div class="adm-acts">
      ${u.status === 'pending' ? `<button class="btn primary" data-act="adm-approve" data-id="${id}">${icon('check')}Approve account</button>` : ''}
      ${me ? '' : u.role === 'admin' ? `<button class="btn" data-act="adm-setrole" data-id="${id}" data-v="user">${icon('shield')}Remove admin privileges</button>` : `<button class="btn" data-act="adm-setrole" data-id="${id}" data-v="admin" ${u.status !== 'active' ? 'disabled title="Activate the account first"' : ''}>${icon('shield')}Make administrator</button>`}
      ${me ? '' : u.status === 'disabled' ? `<button class="btn" data-act="adm-status" data-id="${id}" data-v="active">Enable account</button>` : u.status === 'active' ? `<button class="btn" data-act="adm-status" data-id="${id}" data-v="disabled">Disable account</button>` : ''}</div>
    <h3>Sign-in help</h3><div class="adm-acts">
      ${u.locked || u.failed ? `<button class="btn" data-act="adm-unlock" data-id="${id}">${icon('lock')}Unlock${u.locked ? '' : ' / clear failed attempts'}</button>` : ''}
      <button class="btn" data-act="adm-reset" data-id="${id}" ${u.status === 'disabled' ? 'disabled' : ''}>${icon('mail')}Email a password-reset link</button>
      <button class="btn" data-act="adm-temp" data-id="${id}">${icon('key')}Set a temporary password</button>
      <button class="btn" data-act="adm-signout" data-id="${id}" ${u.sessions ? '' : 'disabled'}>${icon('logout')}Sign out of all devices</button></div>
    <h3>Profile & data</h3><form data-form="adm-profile" data-id="${id}" class="grid g2" style="gap:10px"><div class="field"><label>Name</label><input class="inp" name="name" value="${esc(u.name)}"></div><div class="field"><label>Email</label><input class="inp" name="email" type="email" value="${esc(u.email)}"></div>
      <div class="row wrap" style="grid-column:1/-1"><button class="btn" type="submit">Save profile</button><button class="btn ghost" type="button" data-act="adm-userdata" data-id="${id}" ${u.dataBytes ? '' : 'disabled'}>${icon('download')}Download their plan data</button>
      ${me ? '' : `<button class="btn danger" type="button" data-act="adm-delete" data-id="${id}" style="margin-left:auto">${icon('trash')}Delete account</button>`}</div></form></div>`);
}
function admNewUser() {
  const st = ADM.settings; const ready = !st || st.email.ready;
  modal(`<div class="row"><h2 style="flex:1">Invite someone</h2><button class="btn icon ghost" data-act="close-modal">${icon('x')}</button></div>
    <p class="sub small" style="margin:6px 0 0">They’ll get an email with a link to create their account and choose a password. The link lasts <b>${(st && st.inviteDays) || 7} days</b> and works once.</p>
    ${ready ? '' : `<div class="note warn" style="margin-top:12px">${icon('mail')}<span>Email isn’t set up yet, so invites can’t be sent. <a href="#" data-act="adm-tab" data-v="email">Set up email</a> first.</span></div>`}
    <form data-form="adm-new" class="grid g2" style="gap:12px;margin-top:12px"><div class="field" style="grid-column:1/-1"><label>Email</label><input class="inp" name="email" type="email" required autocomplete="off" placeholder="name@example.com"></div>
      <div class="field"><label>Name <span class="muted" style="font-weight:500">— optional</span></label><input class="inp" name="name" maxlength="80" placeholder="They can change it"></div>
      <div class="field"><label>Role</label><select class="inp" name="role"><option value="user">Member</option><option value="admin">Administrator</option></select></div>
      <div class="row" style="grid-column:1/-1;justify-content:flex-end"><button type="button" class="btn" data-act="close-modal">Cancel</button><button class="btn primary" type="submit" ${ready ? '' : 'disabled'}>${icon('mail')}Send invite</button></div></form>`);
  setTimeout(() => { const e = $('#modal input[name="email"]'); if (e) e.focus(); }, 30);
}
async function admInvAction(id, method, path, msg) { try { const r = await api(method, `/api/admin/invites/${id}${path}`); toast(msg); ADM.stats = null; await adminAfter(true); return r; } catch (e) { toast(e.message); return null; } }
Object.assign(ACT, {
  'adm-tab': el => { closeModal(); ADM.tab = el.dataset.v; if (location.hash !== '#/admin') { location.hash = '#/admin'; return; } $$('.adm-tabs button').forEach(b => { const on = b.dataset.v === ADM.tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }); const r = $('#adm-root'); if (r) r.innerHTML = admTabHTML(); adminAfter(); },
  'adm-filter': el => { ADM.filter = el.dataset.v; $('#adm-root').innerHTML = admTabHTML(); },
  'adm-refresh': () => adminAfter(true),
  'adm-new': () => admNewUser(),
  'adm-inv-resend': el => { const i = (ADM.invites || []).find(x => x.id === el.dataset.id); if (!i) return; el.disabled = true; admInvAction(i.id, 'POST', '/resend', `New invite sent to ${i.email} — it lasts ${(ADM.settings && ADM.settings.inviteDays) || 7} days`).then(() => { el.disabled = false; }); },
  'adm-inv-revoke': el => { const i = (ADM.invites || []).find(x => x.id === el.dataset.id); if (!i) return; confirmBox('Revoke this invite?', `The link sent to <b>${esc(i.email)}</b> will stop working. You can invite them again later.`, 'Revoke invite', () => admInvAction(i.id, 'DELETE', '', 'Invite revoked'), true); },
  'adm-user': el => admUserModal(el.dataset.id),
  'adm-approve': el => admUserAction(el.dataset.id, 'PATCH', '', { status: 'active' }, 'Account approved — they’ve been emailed'),
  'adm-decline': el => { const u = ADM.users.find(x => x.id === el.dataset.id); confirmBox('Decline this sign-up?', `Delete the pending account for <b>${esc(u.email)}</b>?`, 'Decline', () => admUserAction(u.id, 'DELETE', '', undefined, 'Sign-up declined'), true); },
  'adm-unlock': el => admUserAction(el.dataset.id, 'POST', '/unlock', undefined, 'Account unlocked'),
  'adm-setrole': el => { const u = ADM.users.find(x => x.id === el.dataset.id); const up = el.dataset.v === 'admin';
    confirmBox(up ? 'Give administrator privileges?' : 'Remove administrator privileges?', up ? `<b>${esc(u.name)}</b> will be able to manage every account, change security and email settings, and give admin access to others.` : `<b>${esc(u.name)}</b> will become a regular member.`, up ? 'Make admin' : 'Remove admin', () => admUserAction(u.id, 'PATCH', '', { role: el.dataset.v }, up ? `${u.name} is now an administrator` : `${u.name} is now a member`), !up); },
  'adm-status': el => { const u = ADM.users.find(x => x.id === el.dataset.id); const off = el.dataset.v === 'disabled';
    const go = () => admUserAction(u.id, 'PATCH', '', { status: el.dataset.v }, off ? 'Account disabled and signed out' : 'Account enabled');
    if (off) confirmBox('Disable this account?', `<b>${esc(u.email)}</b> will be signed out and won’t be able to sign in until you enable it again. Their data is kept.`, 'Disable', go, true); else go(); },
  'adm-reset': el => { const u = ADM.users.find(x => x.id === el.dataset.id); confirmBox('Email a reset link?', `Send <b>${esc(u.email)}</b> a password-reset link that expires in ${ADM.settings ? ADM.settings.resetMinutes : 30} minutes?`, 'Send email', () => admUserAction(u.id, 'POST', '/send-reset', undefined, 'Reset email sent')); },
  'adm-temp': el => { const u = ADM.users.find(x => x.id === el.dataset.id); const sug = Array.from(crypto.getRandomValues(new Uint8Array(9)), b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('') + '-' + (10 + crypto.getRandomValues(new Uint8Array(1))[0] % 90);
    modal(`<h2>Temporary password for ${esc(u.name)}</h2><p class="sub small">They’ll be signed out everywhere and asked to choose a new password the next time they sign in. Share it with them privately.</p><form data-form="adm-temp" data-id="${u.id}" style="margin-top:12px"><div class="field"><label>Temporary password</label><input class="inp" name="password" value="${sug}" autocomplete="off" required></div><div class="row" style="justify-content:flex-end;margin-top:14px"><button type="button" class="btn" data-act="adm-user" data-id="${u.id}">Back</button><button class="btn primary" type="submit">Set password</button></div></form>`, 'sm'); },
  'adm-signout': el => admUserAction(el.dataset.id, 'POST', '/revoke-sessions', undefined, r => `${r.revoked} session${r.revoked === 1 ? '' : 's'} signed out`),
  'adm-delete': el => { const u = ADM.users.find(x => x.id === el.dataset.id); confirmBox('Delete this account?', `Permanently delete <b>${esc(u.email)}</b> and all of their plan data? This can’t be undone.`, 'Delete account', async () => { await admUserAction(u.id, 'DELETE', '', undefined, 'Account deleted'); closeModal(); }, true); },
  'adm-userdata': async el => { const u = ADM.users.find(x => x.id === el.dataset.id); try { const d = await api('GET', `/api/admin/users/${u.id}/state`); downloadJSON(d.state || {}, `forge90-${u.email.replace(/[^a-z0-9]+/gi, '_')}.json`); } catch (e) { toast(e.message); } },
  'adm-backup': async () => { try { downloadJSON(await api('GET', '/api/admin/backup'), `forge90-backup-${todayISO()}.json`); toast('Backup downloaded'); } catch (e) { toast(e.message); } },
  'adm-email-env': () => confirmBox('Use the environment values?', 'Clears the email settings saved here so the server uses its Docker variables / .env again.', 'Use environment', () => admSave({ email: { useEnv: true } }, 'Email now uses the environment settings')),
  'adm-test-email': async el => { const to = $('#adm-test-to').value.trim(); const out = $('#adm-test-out'); el.disabled = true; out.textContent = 'Sending…'; out.className = 'tiny muted';
    try { await api('POST', '/api/admin/email/test', { to }); out.textContent = `✔ Sent to ${to}. Check the inbox (and spam).`; out.className = 'tiny good'; } catch (e) { out.textContent = '✖ ' + e.message; out.className = 'tiny bad'; } el.disabled = false; }
});
document.addEventListener('submit', async e => {
  const f = e.target; const k = f.dataset && f.dataset.form; if (!k || !/^adm-/.test(k)) return; e.preventDefault();
  const fd = new FormData(f); const g = n => fd.get(n); const on = n => !!f.elements[n] && f.elements[n].checked;
  if (k === 'adm-security') return admSave({ security: { pwMinLength: +g('pwMinLength'), pwRequireMix: on('pwRequireMix'), lockThreshold: +g('lockThreshold'), lockMinutes: +g('lockMinutes'), autoResetOnLock: on('autoResetOnLock'), notifyPasswordChange: on('notifyPasswordChange'), requireHttps: on('requireHttps'), sessionHours: +g('sessionHours'), rememberDays: +g('rememberDays') } }, 'Security settings saved');
  if (k === 'adm-app') return admSave({ appName: g('appName'), appUrl: g('appUrl'), defaults: { theme: g('theme') } }, 'App settings saved');
  if (k === 'adm-email') { const p = { host: g('host'), port: +g('port'), security: g('security'), user: g('user'), fromName: g('fromName'), fromEmail: g('fromEmail') }; if (g('pass')) p.pass = g('pass'); if (on('clearPass')) p.clearPass = true; return admSave({ email: p }, 'Email settings saved — send a test to check them'); }
  if (k === 'adm-profile') return admUserAction(f.dataset.id, 'PATCH', '', { name: g('name'), email: g('email') }, 'Profile saved');
  if (k === 'adm-temp') { const r = await admUserAction(f.dataset.id, 'POST', '/temp-password', { password: g('password') }, 'Temporary password set — they’ll choose a new one at sign-in'); if (r) admUserModal(f.dataset.id); return; }
  if (k === 'adm-new') {
    const btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.classList.add('loading');
    try { const r = await api('POST', '/api/admin/invites', { name: g('name'), email: g('email'), role: g('role') }); closeModal(); toast(r.resent ? `${r.invite.email} was already invited — a fresh link was sent` : `Invite sent to ${r.invite.email}`); ADM.stats = null; adminAfter(true); }
    catch (x) { btn.disabled = false; btn.classList.remove('loading'); toast(x.message); }
  }
});
document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.input === 'adm-q') { ADM.q = t.value; const pos = t.selectionStart; $('#adm-root').innerHTML = admTabHTML(); const n = $('[data-input="adm-q"]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } } });
document.addEventListener('change', e => {
  const t = e.target; if (!t.dataset) return;
  if (t.dataset.input === 'adm-role') { const u = ADM.users.find(x => x.id === t.dataset.id); t.checked = u.role === 'admin'; ACT['adm-setrole']({ dataset: { id: u.id, v: u.role === 'admin' ? 'user' : 'admin' } }); }
  if (t.dataset.input === 'adm-quick') { const [a, b] = t.dataset.k.split('.'); admSave({ [a]: { [b]: t.checked } }); }
  if (t.dataset.input === 'adm-evtype') { ADM.evType = t.value; adminAfter(true); }
  if (t.dataset.input === 'adm-evuser') { ADM.evUser = t.value; adminAfter(true); }
});
// When you come back to this tab, pick up changes made on another device (avoids editing a stale copy)
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible' || AUTH.mode !== 'server' || !AUTH.user || !S || AUTH.pending || AUTH.inflight) return;
  try { const st = await api('GET', '/api/state'); if (st.rev > AUTH.rev && !AUTH.pending) { AUTH.rev = st.rev; AUTH.booting = true; loadState(st.state); AUTH.booting = false; applyTheme(); render(); toast('Updated with changes from another device'); } }
  catch (e) { if (e.status === 401) showAuth('login', { info: 'Your session ended — sign in again.' }); }
});
