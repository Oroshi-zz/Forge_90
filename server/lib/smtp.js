'use strict';
/* Minimal, dependency-free SMTP client: implicit TLS (465), STARTTLS (587) or plain (local relays / testing).
   Supports AUTH PLAIN / LOGIN, UTF-8 subjects, multipart/alternative text+HTML and inline (CID) images. */
const net = require('net');
const tls = require('tls');
const os = require('os');
const crypto = require('crypto');

function b64wrap(buf) { return Buffer.from(buf).toString('base64').replace(/.{1,76}/g, '$&\r\n'); }
function encWord(s) { return /^[\x20-\x7e]*$/.test(s) ? s : '=?UTF-8?B?' + Buffer.from(s, 'utf8').toString('base64') + '?='; }
function addr(name, email) { return name ? `"${encWord(String(name).replace(/["\\\r\n]/g, ''))}" <${email}>` : `<${email}>`; }
function clean(s) { return String(s || '').replace(/[\r\n]+/g, ' ').trim(); }

function buildMessage({ fromName, fromEmail, to, toName, subject, text, html, attachments = [], replyTo }) {
  const b = () => '=_f90_' + crypto.randomBytes(12).toString('hex');
  const domain = (fromEmail.split('@')[1] || 'localhost').replace(/[^a-z0-9.-]/gi, '');
  const head = [
    `From: ${addr(clean(fromName), clean(fromEmail))}`,
    `To: ${addr(clean(toName), clean(to))}`,
    replyTo ? `Reply-To: <${clean(replyTo)}>` : null,
    `Subject: ${encWord(clean(subject))}`,
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${crypto.randomBytes(16).toString('hex')}@${domain}>`,
    'MIME-Version: 1.0',
    'Auto-Submitted: auto-generated',
    'X-Auto-Response-Suppress: All'
  ].filter(Boolean);
  const alt = b();
  const altPart = [
    `Content-Type: multipart/alternative; boundary="${alt}"`, '',
    `--${alt}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64wrap(Buffer.from(text || '', 'utf8')),
    `--${alt}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64wrap(Buffer.from(html || '', 'utf8')),
    `--${alt}--`, ''
  ].join('\r\n');
  let body;
  if (attachments.length) {
    const rel = b();
    body = [`Content-Type: multipart/related; boundary="${rel}"`, '', `--${rel}`, altPart,
      ...attachments.map(a => [`--${rel}`, `Content-Type: ${a.contentType}; name="${a.filename}"`, 'Content-Transfer-Encoding: base64',
        `Content-ID: <${a.cid}>`, `Content-Disposition: inline; filename="${a.filename}"`, '', b64wrap(a.content)].join('\r\n')),
      `--${rel}--`, ''].join('\r\n');
  } else body = altPart;
  return head.join('\r\n') + '\r\n' + body;
}

function sendMail(opts) {
  const { host, port = 465, security = 'tls', user, pass, fromEmail, to, timeout = 20000, rejectUnauthorized = true } = opts;
  const message = buildMessage(opts);
  const helo = opts.heloName || os.hostname().replace(/[^a-z0-9.-]/gi, '') || 'localhost';
  return new Promise((resolve, reject) => {
    let sock, buf = '', waiter = null, lines = [], done = false;
    const fail = e => { if (done) return; done = true; try { sock && sock.destroy(); } catch (x) { /* ignore */ } reject(e instanceof Error ? e : new Error(String(e))); };
    const onData = d => {
      buf += d.toString('utf8'); let i;
      while ((i = buf.indexOf('\r\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 2); lines.push(line);
        if (/^\d{3} /.test(line) || /^\d{3}$/.test(line)) { const res = { code: +line.slice(0, 3), text: lines.join('\n') }; lines = []; const w = waiter; waiter = null; if (w) w(res); }
      }
    };
    const read = () => new Promise(r => { waiter = r; });
    const cmd = async (c, ok, label) => { if (c != null) sock.write(c + '\r\n'); const res = await read(); if (!ok.includes(res.code)) throw new Error(`SMTP ${label || (c || '').split(' ')[0]} failed: ${res.text.replace(/\s+/g, ' ').slice(0, 300)}`); return res; };
    const attach = s => { sock = s; sock.setTimeout(timeout, () => fail(new Error('SMTP connection timed out'))); sock.on('data', onData); sock.on('error', fail); };
    const run = async () => {
      await cmd(null, [220], 'greeting');
      let ehlo = await cmd(`EHLO ${helo}`, [250]);
      if (security === 'starttls') {
        if (!/STARTTLS/i.test(ehlo.text)) throw new Error('Server does not offer STARTTLS');
        await cmd('STARTTLS', [220]);
        sock.removeListener('data', onData);
        await new Promise((res, rej) => { const t = tls.connect({ socket: sock, servername: host, rejectUnauthorized }, res); t.once('error', rej); attach(t); });
        ehlo = await cmd(`EHLO ${helo}`, [250]);
      }
      if (user) {
        if (/AUTH[ =][^\n]*PLAIN/i.test(ehlo.text)) await cmd('AUTH PLAIN ' + Buffer.from(`\0${user}\0${pass || ''}`, 'utf8').toString('base64'), [235], 'AUTH');
        else { await cmd('AUTH LOGIN', [334]); await cmd(Buffer.from(user, 'utf8').toString('base64'), [334], 'AUTH'); await cmd(Buffer.from(pass || '', 'utf8').toString('base64'), [235], 'AUTH'); }
      }
      await cmd(`MAIL FROM:<${clean(fromEmail)}>`, [250]);
      await cmd(`RCPT TO:<${clean(to)}>`, [250, 251]);
      await cmd('DATA', [354]);
      const data = message.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');
      sock.write(data + '\r\n.\r\n');
      const res = await cmd(null, [250], 'DATA');
      try { sock.write('QUIT\r\n'); } catch (x) { /* ignore */ }
      done = true; setTimeout(() => { try { sock.end(); } catch (x) { /* ignore */ } }, 50);
      resolve({ response: res.text });
    };
    try {
      if (security === 'tls') attach(tls.connect({ host, port, servername: host, rejectUnauthorized }));
      else attach(net.connect({ host, port }));
    } catch (e) { return fail(e); }
    run().catch(fail);
  });
}
module.exports = { sendMail, buildMessage };
