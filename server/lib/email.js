// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
'use strict';
/* Branded, email-client-safe HTML templates (table layout, inline styles, CID logo) + plain-text versions. */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const C = { bg: '#eef1f4', card: '#ffffff', ink: '#111827', text: '#374151', muted: '#6b7280', line: '#e5e7eb', dark: '#0f140c', lime: '#a3e635', limeInk: '#1a2e05' };

function layout({ preheader, title, bodyHtml, footerNote, appUrl, appName = 'FORGE 90' }) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="background:${C.bg};">
<tr><td align="center" style="padding:32px 14px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td bgcolor="${C.dark}" style="background:${C.dark};border-radius:16px 16px 0 0;padding:22px 28px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding-right:12px;"><img src="cid:logo@forge90" width="44" height="44" alt="" style="display:block;border:0;border-radius:11px;"></td>
        <td style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;letter-spacing:1px;color:#f7f9fc;">FORGE <span style="color:${C.lime};">90</span></td>
      </tr></table></td></tr>
    <tr><td bgcolor="${C.card}" style="background:${C.card};padding:34px 28px 28px;border-left:1px solid ${C.line};border-right:1px solid ${C.line};font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:${C.text};font-size:15px;line-height:1.6;">
      ${bodyHtml}
    </td></tr>
    <tr><td bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.line};border-top:0;border-radius:0 0 16px 16px;padding:0 28px 26px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
      <div style="border-top:1px solid ${C.line};padding-top:16px;font-size:12px;line-height:1.55;color:${C.muted};">${footerNote || ''}</div></td></tr>
    <tr><td align="center" style="padding:18px 10px 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:${C.muted};">
      Sent by ${esc(appName)}${appUrl ? ` · <a href="${esc(appUrl)}" style="color:${C.muted};">${esc(appUrl.replace(/^https?:\/\//, ''))}</a>` : ''}<br>This is an automated message — replies aren’t monitored.</td></tr>
  </table>
</td></tr></table></body></html>`;
}
const h1 = t => `<h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:${C.ink};font-weight:800;">${t}</h1>`;
const p = t => `<p style="margin:0 0 14px;">${t}</p>`;
const button = (href, label) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 18px;"><tr><td bgcolor="${C.lime}" style="background:${C.lime};border-radius:12px;">
  <a href="${esc(href)}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;font-weight:800;color:${C.limeInk};text-decoration:none;border-radius:12px;">${esc(label)}</a></td></tr></table>`;
const callout = (html, color = '#f7fee7', border = '#d9f99d') => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 16px;"><tr><td bgcolor="${color}" style="background:${color};border:1px solid ${border};border-radius:12px;padding:12px 14px;font-size:14px;line-height:1.5;color:${C.text};">${html}</td></tr></table>`;
function device(ua) { ua = String(ua || ''); const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '';
  const o = /Windows/.test(ua) ? 'Windows' : /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : ''; return b ? b + (o ? ' on ' + o : '') : ''; }
const fmtTime = d => d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

function resetEmail({ name, link, minutes, expiresAt, reason, attempts, ip, ua, appUrl, appName }) {
  const hello = name ? `Hi ${esc(name.split(' ')[0])},` : 'Hi,';
  const locked = reason === 'lockout';
  const why = locked
    ? callout(`<b style="color:${C.ink};">Your account was locked</b> after ${attempts || 'several'} unsuccessful sign-in attempts. Resetting your password unlocks it right away.`, '#fff7ed', '#fed7aa')
    : '';
  const bodyHtml = `${h1(locked ? 'Your account is locked' : 'Reset your password')}
    ${p(hello)}${why}
    ${p(locked ? 'To get back in, choose a new password using the button below.' : 'We received a request to reset the password for your FORGE 90 account. Choose a new one using the button below.')}
    ${button(link, 'Reset my password')}
    ${callout(`⏱ <b style="color:${C.ink};">This link expires in ${minutes} minutes</b> (${esc(fmtTime(expiresAt))}) and can only be used once.`)}
    <p style="margin:0 0 6px;font-size:13px;color:${C.muted};">Button not working? Copy and paste this link into your browser:</p>
    <p style="margin:0 0 18px;font-size:13px;word-break:break-all;"><a href="${esc(link)}" style="color:#4d7c0f;">${esc(link)}</a></p>
    ${p(`If you didn’t ask for this, you can ignore this email — your password won’t change. ${locked ? 'If you didn’t try to sign in, someone may have your email address; your account stays locked until the lock expires or the password is reset.' : ''}`)}`;
  const footerNote = `Requested ${esc(fmtTime(new Date()))}${device(ua) ? ` · ${esc(device(ua))}` : ''}${ip ? ` · IP ${esc(ip)}` : ''}`;
  const html = layout({ preheader: `Use this link within ${minutes} minutes to choose a new password.`, title: 'Reset your FORGE 90 password', bodyHtml, footerNote, appUrl, appName });
  const text = `${hello.replace(/&#39;/g, "'")}\n\n${locked ? `Your FORGE 90 account was locked after ${attempts || 'several'} unsuccessful sign-in attempts. Resetting your password unlocks it.\n\n` : 'We received a request to reset the password for your FORGE 90 account.\n\n'}Choose a new password here:\n${link}\n\nThis link expires in ${minutes} minutes (${fmtTime(expiresAt)}) and can only be used once.\n\nIf you didn't ask for this, you can ignore this email — your password won't change.\n\nRequested ${fmtTime(new Date())}${ip ? ` from IP ${ip}` : ''}.\n— FORGE 90`;
  return { subject: locked ? 'Your FORGE 90 account is locked — reset your password' : 'Reset your FORGE 90 password', html, text };
}
function passwordChangedEmail({ name, when, ip, appUrl, appName, via }) {
  const hello = name ? `Hi ${esc(name.split(' ')[0])},` : 'Hi,';
  const bodyHtml = `${h1('Your password was changed')}${p(hello)}${p(`The password for your FORGE 90 account was just changed${via === 'reset' ? ' using a reset link' : via === 'admin' ? ' by an administrator' : ''}. You’ve been signed out on your other devices.`)}
    ${callout(`<b style="color:${C.ink};">Wasn’t you?</b> Use “Forgot password” on the sign-in page right away and contact your FORGE 90 administrator.`, '#fef2f2', '#fecaca')}
    ${appUrl ? button(appUrl, 'Open FORGE 90') : ''}`;
  const html = layout({ preheader: 'Your FORGE 90 password was just changed.', title: 'Password changed', bodyHtml, footerNote: `${esc(fmtTime(when))}${ip ? ` · IP ${esc(ip)}` : ''}`, appUrl, appName });
  const text = `${hello}\n\nThe password for your FORGE 90 account was just changed. If this wasn't you, use "Forgot password" on the sign-in page right away and contact your administrator.\n\n${fmtTime(when)}${ip ? ` · IP ${ip}` : ''}\n— FORGE 90`;
  return { subject: 'Your FORGE 90 password was changed', html, text };
}
function simpleEmail({ title, heading, lines, buttonUrl, buttonLabel, appUrl, appName, preheader }) {
  const bodyHtml = `${h1(esc(heading || title))}${lines.map(l => p(esc(l))).join('')}${buttonUrl ? button(buttonUrl, buttonLabel || 'Open FORGE 90') : ''}`;
  return { subject: title, html: layout({ preheader: preheader || lines[0] || title, title, bodyHtml, footerNote: esc(fmtTime(new Date())), appUrl, appName }), text: `${heading || title}\n\n${lines.join('\n\n')}${buttonUrl ? `\n\n${buttonUrl}` : ''}\n— FORGE 90` };
}
function inviteEmail({ name, email, inviter, role, link, days, expiresAt, appUrl, appName }) {
  const first = name ? name.split(' ')[0] : ''; const hello = first ? `Hi ${esc(first)},` : 'Hi,';
  const who = inviter ? esc(inviter) : 'An administrator'; const admin = role === 'admin';
  const bodyHtml = `${h1(`You’re invited to ${esc(appName || 'FORGE 90')}`)}
    ${p(hello)}
    ${p(`${who} invited you to join ${esc(appName || 'FORGE 90')}${admin ? ' as an <b style="color:' + C.ink + ';">administrator</b>' : ''}. It keeps your training plan, meals, grocery list and progress in one place.`)}
    ${p('Accept the invite to choose your password and finish setting up your account.')}
    ${button(link, 'Accept invite')}
    ${callout(`⏱ <b style="color:${C.ink};">This invite expires in ${days} days</b> (${esc(fmtTime(expiresAt))}) and can only be used once. You’ll sign in with <b style="color:${C.ink};">${esc(email)}</b>.`)}
    <p style="margin:0 0 6px;font-size:13px;color:${C.muted};">Button not working? Copy and paste this link into your browser:</p>
    <p style="margin:0 0 18px;font-size:13px;word-break:break-all;"><a href="${esc(link)}" style="color:#4d7c0f;">${esc(link)}</a></p>
    ${p('Didn’t expect this? You can ignore this email — no account is created unless you accept.')}`;
  const footerNote = `Invited by ${who} · ${esc(fmtTime(new Date()))}`;
  const html = layout({ preheader: `${inviter || 'An administrator'} invited you to ${appName || 'FORGE 90'}. The invite expires in ${days} days.`, title: `You’re invited to ${appName || 'FORGE 90'}`, bodyHtml, footerNote, appUrl, appName });
  const text = `${first ? `Hi ${first},` : 'Hi,'}\n\n${inviter || 'An administrator'} invited you to join ${appName || 'FORGE 90'}${admin ? ' as an administrator' : ''}.\n\nAccept the invite and choose your password here:\n${link}\n\nThis invite expires in ${days} days (${fmtTime(expiresAt)}) and can only be used once. You'll sign in with ${email}.\n\nDidn't expect this? You can ignore this email — no account is created unless you accept.\n— ${appName || 'FORGE 90'}`;
  return { subject: `${inviter || 'An administrator'} invited you to ${appName || 'FORGE 90'}`, html, text };
}
module.exports = { resetEmail, passwordChangedEmail, simpleEmail, inviteEmail };
