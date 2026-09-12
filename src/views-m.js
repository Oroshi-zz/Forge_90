// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
/* ================================================================
   FORGE 90 — workout mode (one exercise at a time), the rest timer
   and its end sounds (made with Web Audio, so nothing to download)
   ================================================================ */
Object.assign(IC, {
  play: '<path d="M7 4v16l13-8z"/>',
  pause: '<rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/>',
  reset: '<path d="M3 12a9 9 0 1 0 2.64-6.36L3 8.3"/><path d="M3 3v5.3h5.3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  vol: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  mute: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m22 9-6 6M16 9l6 6"/>'
});

/* ---------------- timer sounds ---------------- */
let AC = null, AC_OUT = null, sndBus = null;
const NOISE_BUF = new WeakMap();
function audioCtx() {
  if (!AC) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    try { AC = new C(); } catch (e) { return null; }
    const comp = AC.createDynamicsCompressor(); comp.threshold.value = -8; comp.ratio.value = 6;
    AC_OUT = AC.createGain(); AC_OUT.gain.value = restVol(); AC_OUT.connect(comp); comp.connect(AC.destination);
  }
  if (AC.state === 'suspended') AC.resume().catch(() => {});
  return AC;
}
const restVol = () => { const v = S && S.settings && S.settings.restVol; return v == null ? 0.8 : Math.max(0, Math.min(1, +v)); };
function noiseBuf(c) {
  let b = NOISE_BUF.get(c); if (b) return b;
  b = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = b.getChannelData(0); let x = 1;
  for (let i = 0; i < d.length; i++) { x = (x * 16807) % 2147483647; d[i] = x / 1073741823.5 - 1; }   // seeded, so every play sounds the same
  NOISE_BUF.set(c, b); return b;
}
// one enveloped oscillator: attack a, optional hold, exponential decay d; f2 glides the pitch
function tone(c, out, { type = 'sine', f, f2, glide, t, a = 0.005, hold = 0, d = 0.3, v = 0.5, det = 0 }) {
  const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + (glide || a + hold + d)); if (det) o.detune.value = det;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); if (hold) g.gain.setValueAtTime(v, t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + d);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + a + hold + d + 0.03); return o;
}
function lowpass(c, out, f, q = 0.7) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = f; fl.Q.value = q; fl.connect(out); return fl; }
// id, name, description, length (s), lead = seconds it starts before the timer reaches 0
const REST_SOUNDS = [
  { id: 'beeps', n: 'Classic beeps', d: 'Three short stopwatch beeps', dur: .75,
    play: (c, o, t) => { const l = lowpass(c, o, 3500); [0, .22, .44].forEach(s => tone(c, l, { type: 'square', f: 1046, t: t + s, a: .004, hold: .1, d: .03, v: .5 })); } },
  { id: 'watch', n: 'Digital watch', d: 'Two quick high double-chirps', dur: .65,
    play: (c, o, t) => { const l = lowpass(c, o, 6500); [0, .09, .4, .49].forEach(s => tone(c, l, { type: 'square', f: 3150, t: t + s, a: .002, hold: .045, d: .012, v: .45 })); } },
  { id: 'count', n: 'Countdown 3-2-1', d: 'Ticks for the last 3 seconds, then a long beep', dur: 3.9, lead: 3,
    play: (c, o, t) => { [0, 1, 2].forEach(s => tone(c, o, { f: 740, t: t + s, a: .004, hold: .08, d: .12, v: .5 }));
      tone(c, o, { f: 1480, t: t + 3, a: .006, hold: .55, d: .25, v: .45 }); tone(c, o, { type: 'triangle', f: 1480, t: t + 3, a: .006, hold: .55, d: .25, v: .18 }); } },
  { id: 'chime', n: 'Chime', d: 'Soft rising four-note chime', dur: 1.5,
    play: (c, o, t) => [1047, 1319, 1568, 2093].forEach((f, k) => { tone(c, o, { f, t: t + k * .13, a: .004, d: 1.3, v: .38 }); tone(c, o, { f: f * 2, t: t + k * .13, a: .004, d: .5, v: .1 }); }) },
  { id: 'marimba', n: 'Marimba', d: 'Bright wooden five-note tune', dur: 1.1,
    play: (c, o, t) => [[784, 0], [988, .12], [1175, .24], [988, .36], [1568, .52]].forEach(([f, s], k) => { tone(c, o, { f, t: t + s, a: .003, d: k === 4 ? .7 : .35, v: .45 }); tone(c, o, { f: f * 3.93, t: t + s, a: .002, d: .07, v: .14 }); }) },
  { id: 'none', n: 'Silent', d: 'No sound — vibrate only', dur: 0 }
];
const restSoundOf = id => REST_SOUNDS.find(x => x.id === id) || REST_SOUNDS[0];
const restSoundId = () => restSoundOf(S.settings.restSound).id;
function soundStop() { if (sndBus) { try { sndBus.disconnect(); } catch (e) { /* already gone */ } sndBus = null; } }
// play a sound `when` seconds from now; returns how long it lasts
function soundPlay(id, when = 0) {
  const x = restSoundOf(id), c = audioCtx(); if (!x.play || !c) return 0;
  soundStop(); const bus = c.createGain(); bus.connect(AC_OUT); sndBus = bus; AC_OUT.gain.value = restVol();
  x.play(c, bus, c.currentTime + .03 + Math.max(0, when));
  setTimeout(() => { if (sndBus === bus) soundStop(); else try { bus.disconnect(); } catch (e) { /* ignore */ } }, (Math.max(0, when) + x.dur + .7) * 1000);
  return x.dur;
}
const buzz = pat => { if (S.settings.restVib !== false && navigator.vibrate) try { navigator.vibrate(pat); } catch (e) { /* not supported */ } };
// browsers only allow sound after a tap: wake the audio engine on the first one
document.addEventListener('pointerdown', () => { if (!AC || AC.state === 'suspended') audioCtx(); }, true);

/* ---------------- rest timer ---------------- */
const RT = { d: null, dur: 90, left: 90000, run: false, paused: false, endAt: 0, cued: false, flash: false };
let rtT = null;
function mmss(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
const restFor = row => (S.settings.restPlan !== false && row && +row.rest) || (+S.settings.restDef || 90);
const rtLeft = () => RT.run ? Math.max(0, RT.endAt - performance.now()) : RT.left;
const rtBusy = () => RT.run || RT.paused;
function rtIdle(row, keepSound) {
  clearInterval(rtT); Object.assign(RT, { dur: restFor(row || woRow()), run: false, paused: false, cued: false, flash: false }); RT.left = RT.dur * 1000;
  if (!keepSound) soundStop();
}
// an idle timer follows the exercise on screen; a running or paused one keeps going
function rtFollow() { if (!RT.run && !RT.paused && !RT.flash) rtIdle(null, true); }   // keepSound: a settings preview may be playing
function rtStart() {
  if (RT.left <= 0 || RT.flash) rtIdle();
  Object.assign(RT, { run: true, paused: false, flash: false, d: WO ? WO.d : RT.d }); RT.endAt = performance.now() + RT.left; audioCtx();
  clearInterval(rtT); rtT = setInterval(rtTick, 100); rtPaint(true);
}
function rtPause() { RT.left = rtLeft(); RT.run = false; RT.paused = true; clearInterval(rtT); if (RT.cued) { soundStop(); RT.cued = false; } rtPaint(true); }
function rtAdd(s) {
  if (RT.flash) { rtIdle(null, true); RT.dur = s; RT.left = s * 1000; rtStart(); return; }   // "give me 30 more" right after it ends
  RT.dur += s; if (RT.run) RT.endAt += s * 1000; else RT.left += s * 1000;
  if (RT.cued && rtLeft() > (restSoundOf(restSoundId()).lead || 0) * 1000 + 150) { soundStop(); RT.cued = false; }
  rtPaint(true);
}
function rtTick() {
  if (!RT.run) { clearInterval(rtT); return; }
  const left = RT.endAt - performance.now(), x = restSoundOf(restSoundId()), lead = x.lead || 0;
  if (!RT.cued && left <= lead * 1000 + 150) { RT.cued = true; if (x.play) soundPlay(x.id, Math.max(0, left / 1000 - lead)); }
  if (left > 0) { rtPaint(false); return; }
  clearInterval(rtT); Object.assign(RT, { run: false, paused: false, left: 0, flash: true }); buzz([220, 120, 220]);
  rtPaint(true); if (!(WO && WO.open)) toast('Rest over — back to your workout');     // in workout mode the timer bar itself turns green
  setTimeout(() => { if (RT.flash) { rtIdle(null, true); rtPaint(true); } }, 2600);
}
function rtHTML() {
  const st = RT.flash ? 'done' : RT.run ? 'run' : RT.paused ? 'paused' : 'idle', left = rtLeft();
  const lbl = { done: 'Rest over · go', run: 'Resting', paused: 'Paused', idle: 'Rest · ready' }[st];
  return `<div class="rt ${st}" id="rt" role="timer" aria-label="Rest timer ${mmss(left)}">
    <div class="rt-l"><small>${lbl}</small><b class="num" id="rt-v">${mmss(left)}</b></div>
    <div class="rt-b"><button type="button" data-act="rt-add" data-v="5" aria-label="Add 5 seconds">+5 s</button><button type="button" data-act="rt-add" data-v="30" aria-label="Add 30 seconds">+30 s</button>
      <button type="button" class="go" data-act="rt-go" aria-label="${RT.run ? 'Pause' : 'Start'} the rest timer">${icon(RT.run ? 'pause' : 'play')}</button><button type="button" data-act="rt-reset" aria-label="Reset the rest timer">${icon('reset')}</button></div>
    <i class="bar" id="rt-bar" style="width:${st === 'idle' || !RT.dur ? 0 : (1 - left / (RT.dur * 1000)) * 100}%"></i></div>`;
}
function rtPaint(full) {
  const el = $('#rt');
  if (el) { if (full) el.outerHTML = rtHTML(); else { const left = rtLeft(), v = $('#rt-v'), b = $('#rt-bar'); if (v) v.textContent = mmss(left); if (b) b.style.width = (1 - left / (RT.dur * 1000)) * 100 + '%'; } }
  rtPill();
}
// small pill above the tab bar while a rest runs and the workout screen is closed
function rtPill() {
  let p = $('#rt-pill'); const show = rtBusy() && !(WO && WO.open) && !!$('#view');
  if (!p) { if (!show) return; p = document.createElement('button'); p.type = 'button'; p.id = 'rt-pill'; p.className = 'rt-pill'; p.dataset.act = 'wo-resume'; document.body.appendChild(p); }
  p.hidden = !show; if (show) p.innerHTML = `${icon('clock')}<b class="num">${mmss(rtLeft())}</b><span>${RT.paused ? 'paused' : 'rest'} · back to workout</span>`;
}

/* ---------------- workout mode ---------------- */
let WO = null;            // { d, i, w: {exId: lb}, r: {exId: reps}, edit: set index | null, open, done }
let WO_LOCK = null;
const woEntry = () => WO && S.plan[WO.d];
const woRows = () => { const e = woEntry(); return e && e.w ? sessionRows(e.w) : []; };
const woRow = () => { const rows = WO ? woRows() : []; return rows[WO ? Math.min(WO.i, rows.length - 1) : 0] || null; };
const setsOf = (d, id) => ((S.logs[d] || {})[id] || []);
const doneSets = (d, id) => setsOf(d, id).filter(s => s && +s.r > 0).length;
function woOpen(date, i) {
  const d = date || todayISO(); const e = S.plan[d];
  if (!e || !e.w) { toast(d === todayISO() ? 'No session is planned today — add one from the day’s workout card.' : 'No session is planned that day.'); return; }
  closeModal(); if (!WO || WO.d !== d) WO = { d, i: 0, w: {}, r: {}, edit: null };
  const rows = woRows(); if (i != null) WO.i = i; else if (!WO.open) { const k = rows.findIndex(r => !exLogged(d, r)); WO.i = k < 0 ? rows.length - 1 : k; }
  const wasOpen = WO.open; WO.open = true; WO.done = false; rtFollow(); woRender(); document.body.classList.add('wo-on');
  if (!wasOpen) backPush('workout', woClose);
  try { if (navigator.wakeLock && !WO_LOCK) navigator.wakeLock.request('screen').then(l => { WO_LOCK = l; }).catch(() => {}); } catch (x) { /* not supported */ }
}
function woClose() {
  if (!WO || !WO.open) return; WO.open = false; backDrop('workout'); const r = $('#wo-root'); if (r) r.innerHTML = ''; document.body.classList.remove('wo-on');
  if (WO_LOCK) { WO_LOCK.release().catch(() => {}); WO_LOCK = null; }
  render(); rtPill();
}
// keep the overlay in step with the rest of the app (swaps, undo, sync)
function woRefresh() { if (WO && WO.open) { if (!woEntry() || !woEntry().w) { woClose(); return; } woRender(); } else rtPill(); }
function woPrefill(r) {
  const id = r.ex.id; if (WO.w[id] != null && WO.r[id] != null) return;
  const logs = setsOf(WO.d, id).filter(s => s && +s.r > 0);
  if (logs.length) { const s = logs[logs.length - 1]; WO.w[id] = s.w != null ? +s.w : ''; WO.r[id] = +s.r; return; }
  const [lo, hi] = repRange(r.reps); const last = lastPerformance(id, WO.d); const ex = EX[id];
  if (last && last.bestSet) {
    const w = +last.bestSet.w || 0, br = +last.bestSet.r || lo, allTop = last.sets.every(s => +s.r >= hi);
    const inc = /Dumbbell|DB/.test(ex.name) || ['Shoulders', 'Biceps', 'Triceps'].includes(ex.group) ? 5 : 10;
    if (isBW(id)) { WO.w[id] = w; WO.r[id] = Math.min(hi, (last.bestReps || lo) + 1); }
    else if (ex.assist) { WO.w[id] = allTop ? Math.max(0, w - 10) : w; WO.r[id] = allTop ? lo : Math.min(hi, br + 1); }
    else { WO.w[id] = allTop ? w + inc : w; WO.r[id] = allTop ? lo : Math.min(hi, br + 1); }
  } else { WO.w[id] = isBW(id) ? 0 : ''; WO.r[id] = lo; }
}
function woWeightLabel(id) { const ex = EX[id]; return ex && ex.assist ? 'Assistance · lb' : isBW(id) ? 'Added weight · lb' : 'Weight · lb'; }
function woRender() {
  const root = $('#wo-root'); if (!root || !WO || !WO.open) return;
  const rows = woRows(); if (!rows.length) { woClose(); return; }
  WO.i = Math.max(0, Math.min(WO.i, rows.length - 1));
  const e = woEntry(), t = TEMPLATES[e.w.t], d = WO.d;
  if (WO.done) {
    const c = loggedSets(d, rows); const prs = rows.filter(r => { const h = exerciseHistory(r.ex.id).find(x => x.d === d); return h && h.pr; }).length;
    root.innerHTML = `<div class="wom" role="dialog" aria-label="Workout done"><div class="wo-in">
      <div class="wo-h"><button type="button" class="btn icon ghost" data-act="wo-close" aria-label="Close">${icon('x')}</button><div class="t"><b>${esc(t.name)}</b><small>${esc(fmtDate(d, { weekday: 'long', month: 'short', day: 'numeric' }))}</small></div></div>
      <div class="wo-b"><div class="wo-done"><span class="pill acc">${icon('check')}Workout complete</span><b class="num">${c.done} sets</b><p class="muted">${prs ? `${prs} new PR${prs > 1 ? 's' : ''} · ` : ''}~${estMinutes(rows)} min · saved to Progress</p></div>
        <div class="wo-sum">${rows.map(r => { const s = setsOf(d, r.ex.id).filter(x => x && +x.r > 0); return `<div><b>${esc(r.ex.name)}</b><span class="num">${s.map(x => `${fmt(+x.w || 0, (+x.w || 0) % 1 ? 1 : 0)}×${x.r}`).join(', ') || 'skipped'}</span></div>`; }).join('')}</div>
        <button type="button" class="btn primary block" data-act="wo-close">Done</button></div></div></div>`;
    return;
  }
  const r = rows[WO.i], id = r.ex.id; woPrefill(r);
  const logs = setsOf(d, id), nDone = doneSets(d, id), full = exLogged(d, r) && WO.edit == null;
  const firstOpen = (() => { for (let k = 0; k < r.sets; k++) if (!(logs[k] && +logs[k].r > 0)) return k; return r.sets; })();
  const hist = exerciseHistory(id), today = hist.find(h => h.d === d);
  const segs = rows.map((x, k) => `<i class="${exLogged(d, x) ? 'done' : k === WO.i ? 'cur' : ''}"></i>`).join('');
  const sets = Array.from({ length: Math.max(r.sets, logs.length) }, (_, k) => { const s = logs[k]; const has = s && +s.r > 0;
    const isPR = has && today && today.pr && today.bestSet === s;
    return `<li class="${has ? 'done' : k === (WO.edit != null ? WO.edit : firstOpen) ? 'cur' : ''} ${WO.edit === k ? 'edit' : ''}">${has ? `<button type="button" class="wo-set" data-act="wo-edit" data-k="${k}" aria-label="Change set ${k + 1}">` : '<span class="wo-set">'}
      <span class="n">${has ? icon('check') : k + 1}</span>${has ? `<span class="num"><b>${fmt(+s.w || 0, (+s.w || 0) % 1 ? 1 : 0)} lb × ${s.r}</b></span>${isPR ? '<span class="pill acc">PR</span>' : ''}<span class="wo-ed">${icon('edit')}</span>` : `<span class="muted">${k === firstOpen ? 'Next set' : 'Set ' + (k + 1)}</span>`}${has ? '</button>' : '</span>'}</li>`; }).join('');
  const last = lastPerformance(id, d); const sug = suggestion(id, r.reps, d);
  const lastTxt = last ? `Last time <span class="num">${last.sets.map(s => `${fmt(+s.w || 0, (+s.w || 0) % 1 ? 1 : 0)}×${s.r}`).join(', ')}</span>${sug ? ` → <b>${esc(sug.text.replace(/^Last best: [^→]*→\s*/, ''))}</b>` : ''}` : `First time — pick a weight you can lift for ${esc(r.reps)} reps with ${esc(r.rir)} in reserve.`;
  const nextEx = rows[WO.i + 1]; const allDone = rows.every(x => exLogged(d, x));
  const k = WO.edit != null ? WO.edit : firstOpen;
  root.innerHTML = `<div class="wom" role="dialog" aria-label="Workout"><div class="wo-in">
    <div class="wo-h"><button type="button" class="btn icon ghost" data-act="wo-close" aria-label="Close the workout">${icon('x')}</button><div class="t"><b>${esc(t.name)}</b><small>Exercise ${WO.i + 1} of ${rows.length}${d !== todayISO() ? ' · ' + esc(fmtDate(d)) : ''}</small></div>
      <button type="button" class="btn icon ghost" data-act="rest-set" aria-label="Rest timer settings" title="Rest timer settings">${icon('clock')}</button>${swapBtnHTML(d, r).replace('class="swap-btn', 'class="btn icon ghost swap-btn')}</div>
    <div class="wo-segs" style="grid-template-columns:repeat(${rows.length},1fr)">${segs}</div>
    <div class="wo-b">
      <div><h2 class="wo-ex"><span data-tip-ex="${id}">${esc(r.ex.name)}</span></h2><div class="muted small">${esc([exGroupOf(r.ex), SLOTS[r.slot] && SLOTS[r.slot].label !== exGroupOf(r.ex) ? SLOTS[r.slot].label : ''].filter(Boolean).join(' · '))}${r.daySwap ? ' · swapped today' : ''}</div></div>
      <div class="wo-tgt">${typeBadge(r)}<b class="num">${r.sets} × ${esc(r.reps)}</b><span class="muted">RIR ${esc(r.rir)} · rest ${mmss(restFor(r) * 1000)}</span></div>
      ${r.note ? `<div class="small" style="color:var(--accent-text)">${esc(r.note)}</div>` : ''}
      <div class="wo-last">${lastTxt}</div>
      ${full ? `<div class="card wo-full"><b>All ${r.sets} sets logged</b><p class="muted small">${nextEx ? 'Next: ' + esc(nextEx.ex.name) : allDone ? 'That was the last exercise.' : 'Some exercises still have sets left.'}</p></div>`
      : `<div class="wo-steps">
        <div class="wo-stp"><label for="wo-w">${woWeightLabel(id)}</label><input id="wo-w" class="num" type="number" inputmode="decimal" step="any" min="0" value="${WO.w[id] === '' ? '' : esc(WO.w[id])}" placeholder="0" data-input="wo-w"><span class="pm"><button type="button" data-act="wo-step" data-k="w" data-v="-1" aria-label="Less weight">−</button><button type="button" data-act="wo-step" data-k="w" data-v="1" aria-label="More weight">+</button></span></div>
        <div class="wo-stp"><label for="wo-r">Reps</label><input id="wo-r" class="num" type="number" inputmode="numeric" min="0" max="100" value="${esc(WO.r[id])}" data-input="wo-r"><span class="pm"><button type="button" data-act="wo-step" data-k="r" data-v="-1" aria-label="One rep fewer">−</button><button type="button" data-act="wo-step" data-k="r" data-v="1" aria-label="One rep more">+</button></span></div></div>`}
      ${full ? (nextEx ? `<button type="button" class="btn primary block big" data-act="wo-go" data-i="${WO.i + 1}">Next exercise ${icon('right')}</button>` : `<button type="button" class="btn primary block big" data-act="wo-finish">${icon('check')}Finish workout</button>`)
        : `<button type="button" class="btn primary block big" data-act="wo-log">${icon('check')}${WO.edit != null ? `Update set ${k + 1}` : k < r.sets ? `Log set ${k + 1} of ${r.sets}` : `Log extra set ${k + 1}`}</button>${WO.edit != null ? `<div class="row" style="gap:8px"><button type="button" class="btn block" data-act="wo-edit-x">Cancel</button><button type="button" class="btn block danger" data-act="wo-unlog">${icon('trash')}Remove set ${k + 1}</button></div>` : ''}`}
      <ol class="wo-sets">${sets}</ol>
      ${allDone && !S.done[d] && !(full && !nextEx) ? `<button type="button" class="btn block" data-act="wo-finish">${icon('check')}Every set is logged — finish the workout</button>` : ''}
    </div>
    ${rtHTML()}
    <div class="wo-f"><button type="button" class="btn" data-act="wo-go" data-i="${WO.i - 1}" ${WO.i ? '' : 'disabled'}>${icon('left')}Back</button><button type="button" class="btn icon" data-act="wo-list" aria-label="All exercises" title="All exercises">${icon('list')}</button><button type="button" class="btn" data-act="wo-go" data-i="${WO.i + 1}" ${nextEx ? '' : 'disabled'}>${nDone ? 'Next' : 'Skip'}${icon('right')}</button></div>
  </div></div>`;
}
function woLog() {
  const r = woRow(); if (!r) return; const id = r.ex.id, d = WO.d;
  const w = WO.w[id] === '' || WO.w[id] == null ? 0 : +WO.w[id], reps = Math.round(+WO.r[id] || 0);
  if (!(reps > 0)) { toast('Enter how many reps you did'); return; }
  const before = exerciseHistory(id).filter(h => h.d !== d).reduce((a, h) => Math.max(a, h.best), 0);
  S.logs[d] = S.logs[d] || {}; const arr = S.logs[d][id] = S.logs[d][id] || [];
  let k = WO.edit; if (k == null) { k = 0; while (arr[k] && +arr[k].r > 0) k++; }
  arr[k] = { w, r: reps }; for (let j = 0; j < arr.length; j++) if (!arr[j]) arr[j] = {};
  WO.edit = null; saveState();
  const h = exerciseHistory(id).find(x => x.d === d); const pr = h && h.pr && h.best > before + 0.01 && h.bestSet === arr[k];
  const rows = woRows(); const lastEx = WO.i === rows.length - 1; const exDone = exLogged(d, r);
  if (lastEx && exDone) { if (rtBusy()) rtIdle(r); }                     // no rest after the very last set
  else if (S.settings.restAuto !== false) { rtIdle(r); rtStart(); }
  woRender();
  if (pr) toast(`New PR on ${r.ex.name}: ${isBW(id) ? h.best + ' reps' : 'e1RM ' + fmt(h.best)}`); else if (exDone && k === r.sets - 1) toast(`${r.ex.name} done`);
}
function woStep(k, dir) {
  const r = woRow(); if (!r) return; const id = r.ex.id;
  if (k === 'r') WO.r[id] = Math.max(0, (Math.round(+WO.r[id]) || 0) + dir);
  else { const cur = WO.w[id] === '' ? 0 : +WO.w[id] || 0; const step = cur < 20 && dir < 0 ? 2.5 : 5; WO.w[id] = Math.max(0, Math.round((cur + dir * step) * 2) / 2); }
  woRender();
}
function woList() {
  const rows = woRows();
  modal(`<div class="row"><h2 style="flex:1">Exercises</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div class="wo-list">${rows.map((r, k) => `<button type="button" class="wo-li ${k === WO.i ? 'on' : ''}" data-act="wo-go" data-i="${k}"><span class="t"><b>${esc(r.ex.name)}</b><small class="num">${r.sets} × ${esc(r.reps)} · ${doneSets(WO.d, r.ex.id)}/${r.sets} sets</small></span>${exLogged(WO.d, r) ? `<span class="ok">${icon('check')}</span>` : ''}</button>`).join('')}</div>`, 'sm');
}

/* ---------------- rest timer settings (Settings page and the clock in workout mode) ---------------- */
function restSettingsHTML(inModal) {
  const st = S.settings, def = +st.restDef || 90, snd = restSoundId();
  const tog = (k, title, sub) => `<div class="set-tog"><span><b class="small">${title}</b><span class="tiny muted">${sub}</span></span>${sw(st[k] !== false, 'rest-tog', k)}</div>`;
  const body = `<div class="rs-def"><span class="tiny muted rs-lbl">Default rest</span><div class="big-num"><button type="button" data-act="rest-def" data-v="-15" aria-label="15 seconds less">−</button><b class="num">${mmss(def * 1000)}</b><button type="button" data-act="rest-def" data-v="15" aria-label="15 seconds more">+</button></div>
      <div class="row wrap rs-chips">${[60, 90, 120, 180].map(v => `<button type="button" class="btn sm ${def === v ? 'primary' : ''}" data-act="rest-def-set" data-v="${v}">${mmss(v * 1000)}</button>`).join('')}</div></div>
    ${tog('restPlan', 'Use each exercise’s suggested rest', st.restPlan !== false ? `On: heavy compound sets rest 2–3 min, isolation 60–90 s. Exercises without a suggestion use ${mmss(def * 1000)}.` : `Off: every exercise rests ${mmss(def * 1000)}.`)}
    ${tog('restAuto', 'Start after each logged set', st.restAuto !== false ? 'On: logging a set starts the timer.' : 'Off: start it yourself with ▶.')}
    ${tog('restVib', 'Vibrate when rest is over', 'Works on Android phones. iPhone browsers don’t allow it.')}
    <div class="tiny muted rs-lbl" style="margin-top:14px">Sound · tap one to hear it</div>
    <div class="rs-snds">${REST_SOUNDS.map(x => { const on = snd === x.id, pl = REST_PLAYING === x.id;
      return `<button type="button" class="rs-snd ${on ? 'on' : ''}" data-act="rest-snd" data-v="${x.id}" aria-pressed="${on}"><span class="ic">${pl ? '<span class="eqz" aria-hidden="true"><i></i><i></i><i></i></span>' : icon(x.id === 'none' ? 'mute' : 'bell')}</span><span class="t"><b>${esc(x.n)}</b><small>${esc(x.d)}</small></span>${on ? `<span class="ok">${icon('check')}</span>` : ''}</button>`; }).join('')}</div>
    <div class="rs-vol">${icon('vol')}<input type="range" min="0" max="1" step="0.05" value="${restVol()}" data-input="rest-vol" aria-label="Timer volume"></div>
    <div class="tiny muted">The sound plays when a rest ends, even with the workout screen closed. Phones pause web pages that aren’t on screen, so keep FORGE 90 open (workout mode keeps the screen on). On iPhone the silent switch mutes it.</div>`;
  if (inModal) return `<div class="rest-m" id="rest-card"><div class="row"><h2 style="flex:1">Rest timer</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Close">${icon('x')}</button></div>${body}</div>`;
  return `<div class="card" id="rest-card"><div class="card-h"><h2>${icon('clock')}Rest timer</h2><span class="pill">${mmss(def * 1000)} · ${esc(restSoundOf(snd).n)}</span></div>${body}</div>`;
}
let REST_PLAYING = null, restPlayT = null;
function restCardRefresh() {
  const el = $('#rest-card'); if (!el) return; const inModal = el.classList.contains('rest-m');
  const box = inModal ? $('#modal .modal') : null, top = box ? box.scrollTop : 0;
  el.outerHTML = restSettingsHTML(inModal); if (box) box.scrollTop = top;
}
function restChanged() { saveState(); restCardRefresh(); if (WO) rtFollow(); if (WO && WO.open) woRender(); }

Object.assign(ACT, {
  'wo-open': el => woOpen(el.dataset.d || todayISO()),
  'wo-resume': () => woOpen(RT.d || (WO && WO.d) || todayISO(), WO && WO.d === RT.d ? WO.i : null),
  'wo-close': () => woClose(),
  'wo-go': el => { const i = +el.dataset.i; if (!WO || isNaN(i) || i < 0 || i >= woRows().length) return; WO.i = i; WO.edit = null; closeModal(); rtFollow(); woRender(); const b = $('.wo-b'); if (b) b.scrollTop = 0; },
  'wo-list': () => woList(),
  'wo-log': () => woLog(),
  'wo-step': el => woStep(el.dataset.k, +el.dataset.v),
  'wo-edit': el => { const r = woRow(); if (!r) return; const s = setsOf(WO.d, r.ex.id)[+el.dataset.k]; if (!s) return; WO.edit = +el.dataset.k; WO.w[r.ex.id] = s.w != null ? +s.w : ''; WO.r[r.ex.id] = +s.r; woRender(); },
  'wo-edit-x': () => { if (WO) { WO.edit = null; woRender(); } },
  'wo-unlog': () => { const r = woRow(); if (!r || WO.edit == null) return; const arr = setsOf(WO.d, r.ex.id); if (arr[WO.edit]) arr[WO.edit] = {}; while (arr.length && !(arr[arr.length - 1] && +arr[arr.length - 1].r > 0)) arr.pop(); WO.edit = null; saveState(); woRender(); toast('Set removed'); },
  'wo-finish': () => { if (!WO) return; S.done[WO.d] = true; saveState(); WO.done = true; rtIdle(); woRender(); },
  'rt-go': () => { if (RT.run) rtPause(); else rtStart(); },
  'rt-reset': () => { rtIdle(); rtPaint(true); },
  'rt-add': el => rtAdd(+el.dataset.v),
  'rest-set': () => modal(restSettingsHTML(true), 'sm rest-modal'),
  'rest-def': el => { S.settings.restDef = Math.max(15, Math.min(600, (+S.settings.restDef || 90) + +el.dataset.v)); restChanged(); },
  'rest-def-set': el => { S.settings.restDef = +el.dataset.v; restChanged(); },
  'rest-tog': el => { const k = el.dataset.k; S.settings[k] = S.settings[k] === false; restChanged(); if (k === 'restVib' && S.settings.restVib) buzz(120); },
  'rest-snd': el => { const id = el.dataset.v; S.settings.restSound = id; const d = id === 'none' ? 0 : soundPlay(id); if (id === 'none') buzz([220, 120, 220]);
    REST_PLAYING = d ? id : null; clearTimeout(restPlayT); if (d) restPlayT = setTimeout(() => { REST_PLAYING = null; restCardRefresh(); }, d * 1000); restChanged(); }
});
document.addEventListener('input', e => { const t = e.target; if (!t || !t.dataset) return;
  if (t.dataset.input === 'rest-vol') { S.settings.restVol = +t.value; if (AC_OUT) AC_OUT.gain.value = restVol(); }
  if (WO && WO.open && (t.dataset.input === 'wo-w' || t.dataset.input === 'wo-r')) { const r = woRow(); if (r) { if (t.dataset.input === 'wo-w') WO.w[r.ex.id] = t.value === '' ? '' : +t.value; else WO.r[r.ex.id] = t.value === '' ? '' : +t.value; } }
});
document.addEventListener('change', e => { const t = e.target; if (t && t.dataset && t.dataset.input === 'rest-vol') { saveState(); if (restSoundId() !== 'none') soundPlay(restSoundId()); } });
// the screen lock is dropped when the page is hidden; take it back when workout mode is showing again
document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') { WO_LOCK = null; return; } if (WO && WO.open && !WO_LOCK && navigator.wakeLock) navigator.wakeLock.request('screen').then(l => { WO_LOCK = l; }).catch(() => {}); if (RT.run) rtTick(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && WO && WO.open && !$('#modal') && !$('#gym-full')) woClose(); }, true);   // capture: runs before Escape closes a popup
