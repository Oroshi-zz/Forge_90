let TOUR = null;

const TOUR_DESK = [
  { k: 'hero', hash: '#/', sel: ['[data-panel="hero"]', '.hero'], title: 'Your 90 days',
    body: 'The dashboard is where you check your 13-week cycle progress and goals, along with some quick actions to access gym cards, log workouts, weight checkins, edit workouts and meals.' },
  { k: 'calendar', hash: '#/calendar', sel: ['.cal', '.ag-day'], title: 'Your personal planner',
    body: "FORGE 90 automatically generates all of your workouts and meals in advance based on your preferences. Don't like the generated plan? No problem. Use drag & drop to fully customize your workouts and meals, or drag in new items from the library on the right. You can change your training days or your goals in Settings and the calendar rebuilds itself from today forward while past days are left alone." },
  { k: 'day', hash: () => '#/day/' + tourDay(), sel: ['.day-head'], title: 'One day at a time',
    body: 'Open a day to log your sets, swap a meal you don’t fancy, or add something you ate that wasn’t in the plan. The day’s calories and protein update as you go.' },
  { k: 'wo', hash: () => '#/day/' + tourDay(), sel: ['[data-act="wo-open"]', '.day-head'], title: 'Workout mode',
    body: 'This walks you through the session one exercise at a time, with the rest timer running between sets and your last weights already filled in.' },
  { k: 'library', hash: '#/workouts', sel: ['[data-coll="lib"] .card-h', '[data-coll="lib"]'], title: 'Choose your exercises',
    body: 'Each session is built from movement slots that rotate through a few variations. Switch exercises off here and they leave your rotation, so the plan matches the equipment you actually have. A swap in the table above sticks for the whole program.' },
  { k: 'grocery', hash: '#/grocery', sel: ['[data-tour="grocery"]', '.gro-aisle', '.gro-list'], title: 'The shopping sorts itself',
    body: 'This list is built from the week’s meals, grouped by aisle. Tell the Pantry what you already have at home and it comes off the list instead of being bought twice.' },
  { k: 'foods', hash: '#/foods', sel: ['[data-act="imp-open"]', '[data-tour="foods"]'], title: 'Recipes are shared',
    body: 'Everyone on your FORGE 90 server sees the same recipe book, and you can edit or delete the ones you create. Import brings recipes in from a web link or from Mealie.' },
  { k: 'settings', hash: '#/settings', sel: ['[data-tour="training"]', '[data-tour="goal"]'], title: 'Training days and goals',
    body: 'Select how many days you train and whether you are cutting, maintaining or building. Change either one and the calendar rebuilds from today forward, leaving everything you have already done alone.' },
];

const TOUR_PHONE = [
  { k: 'today', hash: '#/', sel: ['[data-tour="tab-today"]'], title: 'Today',
    body: 'The Today page provides you with quick ways to access gym cards, log workouts, weight checkins, edit workouts and meals.' },
  { k: 'plan', hash: '#/calendar', sel: ['[data-tour="tab-plan"]'], title: 'Plan',
    body: "FORGE 90 automatically generates all of your workouts and meals in advance based on your preferences. Don't like the generated plan? No problem. Use drag & drop to fully customize your workouts and meals, or select a day for easier editing. You can change your training days or your goals in Settings and the calendar rebuilds itself from today forward while past days are left alone." },
  { k: 'library', hash: '#/workouts', sel: ['[data-coll="lib"] .card-h', '[data-coll="lib"]', '[data-tour="tab-plan"]'], title: 'Choose your exercises',
    body: 'Under Plan → Training you get the whole program, plus the exercise library. Switch exercises off here and they leave your rotation, so the plan matches the equipment you actually have.' },
  { k: 'kitchen', hash: '#/grocery', sel: ['[data-tour="tab-kitchen"]'], title: 'Kitchen',
    body: 'Your shopping list, built from the week’s meals, plus the recipe book everyone here shares. Tell the Pantry what you already have and it comes off the list.' },
  { k: 'you', hash: '#/you', sel: ['[data-tour="tab-you"]'], title: 'You',
    body: 'Weigh-ins, progress and settings. Log your weight a few times a week and the plan adjusts your calories.' },
  { k: 'settings', hash: '#/settings/training', sel: ['[data-tour="training"]'], title: 'Training days and goals',
    body: 'Select how many days you train and whether you are cutting, maintaining or building. Change either one and the calendar rebuilds from today forward, leaving everything you have already done alone.' },
];

/* A new user runs the tour before their plan starts, so today is not in the plan yet and the day
   view would show "That day isn't in the plan". Both day steps use the next day carrying a
   session instead, falling back to the most recent one for someone already part-way through. */
function tourDay() {
  const t = todayISO();
  if (typeof ensureHorizon === 'function') ensureHorizon();
  const days = Object.keys(S.plan || {}).filter(inPlan).sort();
  const sessions = days.filter(d => S.plan[d] && S.plan[d].w);
  return sessions.find(d => d >= t) || sessions[sessions.length - 1] || days.find(d => d >= t) || days[days.length - 1] || t;
}
const tourSteps = () => (isPhone() ? TOUR_PHONE : TOUR_DESK);
function tourTarget(st) {
  for (const s of st.sel || []) { const el = $(s); if (el) { const r = el.getBoundingClientRect(); if (r.width > 4 && r.height > 4) return el; } }
  return null;
}
function tourStart(manual) {
  if (!S || TOUR) return;
  TOUR = { i: 0, manual: !!manual, steps: tourSteps() };
  document.body.classList.add('tour-on');
  addEventListener('resize', tourPaint); addEventListener('scroll', tourPaint, true);
  tourGo();
}
function tourEnd(finished) {
  if (!TOUR) return;
  const wasManual = TOUR.manual; TOUR = null;
  const el = $('#tour'); if (el) el.remove();
  document.body.classList.remove('tour-on');
  removeEventListener('resize', tourPaint); removeEventListener('scroll', tourPaint, true);
  if (!S.tourDone) { S.tourDone = 1; saveState(); }
  if (finished && !wasManual) toast('That’s the tour — you can run it again from Settings');
}
async function tourGo() {
  if (!TOUR) return;
  const st = TOUR.steps[TOUR.i]; if (!st) return tourEnd(true);
  const h = typeof st.hash === 'function' ? st.hash() : st.hash;
  if (h && location.hash !== h) { location.hash = h; await new Promise(r => setTimeout(r, 220)); if (!TOUR) return; }
  const el = tourTarget(st);
  if (el) { const r = el.getBoundingClientRect(); if (r.top < 80 || r.bottom > innerHeight - 80) { el.scrollIntoView({ block: 'center', behavior: 'auto' }); await new Promise(r2 => setTimeout(r2, 120)); if (!TOUR) return; } }
  tourPaint();
}
function tourPaint() {
  if (!TOUR) return;
  const st = TOUR.steps[TOUR.i]; if (!st) return;
  const n = TOUR.steps.length, last = TOUR.i === n - 1;
  let root = $('#tour');
  if (!root) { root = document.createElement('div'); root.id = 'tour'; root.className = 'tour'; document.body.appendChild(root); }
  const el = tourTarget(st);
  if (root.dataset.k !== st.k) {
    root.dataset.k = st.k;
    root.innerHTML = `<div class="tour-block"></div><div class="tour-ring" hidden></div>
      <div class="tour-card"><div class="tour-n">Step ${TOUR.i + 1} of ${n}</div>
        <h3>${esc(st.title)}</h3><p>${esc(st.body)}</p>
        <div class="tour-acts"><button type="button" class="linkish tiny" data-act="tour-skip">Skip tutorial</button>
          <span class="row" style="gap:6px">${TOUR.i ? '<button type="button" class="btn sm ghost" data-act="tour-back">Back</button>' : ''}
            <button type="button" class="btn sm primary" data-act="tour-next">${last ? 'Done' : 'Next'}</button></span></div></div>`;
  }
  const ring = root.querySelector('.tour-ring'), card = root.querySelector('.tour-card');
  if (!el) { ring.hidden = true; card.classList.add('center'); card.style.left = card.style.top = ''; return; }
  card.classList.remove('center');
  const r = el.getBoundingClientRect(), pad = 6;
  ring.hidden = false;
  ring.style.left = (r.left - pad) + 'px'; ring.style.top = (r.top - pad) + 'px';
  ring.style.width = (r.width + pad * 2) + 'px'; ring.style.height = (r.height + pad * 2) + 'px';
  const cw = card.offsetWidth, ch = card.offsetHeight, gap = 14;
  let top = r.bottom + gap;
  if (top + ch > innerHeight - 12) top = r.top - ch - gap;
  if (top < 12) top = Math.max(12, Math.min(innerHeight - ch - 12, r.top));
  let left = r.left + r.width / 2 - cw / 2;
  left = Math.max(12, Math.min(innerWidth - cw - 12, left));
  card.style.left = left + 'px'; card.style.top = top + 'px';
}
function tourStep(d) {
  if (!TOUR) return;
  const next = TOUR.i + d;
  if (next < 0) return;
  if (next >= TOUR.steps.length) return tourEnd(true);
  TOUR.i = next; const root = $('#tour'); if (root) root.dataset.k = '';
  tourGo();
}
Object.assign(ACT, {
  'tour-next': () => tourStep(1),
  'tour-back': () => tourStep(-1),
  'tour-skip': () => tourEnd(false),
  'tour-run': () => { closeModal(); tourStart(true); },
});
