// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
/* ============================================================
   FORGE 90 — Exercise library, rotation slots, session templates
   ============================================================ */

// Muscle regions used by the muscle-map SVG
const REGION_LABEL = {
  chest: 'Chest', frontDelt: 'Front delts', sideDelt: 'Side delts', rearDelt: 'Rear delts',
  traps: 'Traps', lats: 'Lats', upperBack: 'Upper back', lowerBack: 'Lower back',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms', abs: 'Abs', obliques: 'Obliques',
  quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', adductors: 'Adductors', calves: 'Calves'
};

// E(id, name, group, equipment, primary[], secondary[], compound?, steps[], cues[], mistake)
const EX = {};
function E(id, name, group, equip, primary, secondary, compound, steps, cues, mistake) {
  EX[id] = { id, name, group, equip, primary, secondary, compound, steps, cues, mistake };
}

/* ---------------- CHEST ---------------- */
E('machine_chest_press', 'Machine Chest Press', 'Chest', 'Plate/selectorized machine', ['chest'], ['frontDelt', 'triceps'], true,
  ['Set the seat so the handles line up with your mid-chest.',
   'Plant your feet and pull your shoulder blades back and down into the pad.',
   'Press the handles forward until your arms are almost straight — no hard lockout.',
   'Return slowly (2–3 s) until you feel a deep stretch across the chest.'],
  ['Chest tall, shoulders pinned to the pad', 'Drive through the heel of your palm'],
  'Letting the shoulders roll forward at the top — the chest loses tension.');
E('incline_db_press', 'Incline Dumbbell Press', 'Chest', 'Dumbbells + adjustable bench', ['chest'], ['frontDelt', 'triceps'], true,
  ['Set the bench to about 30°. Kick the dumbbells up off your thighs as you lie back.',
   'Pin your shoulder blades, feet flat, dumbbells over your upper chest.',
   'Lower under control until the dumbbells reach chest level, elbows ~45–60° from your torso.',
   'Press up and slightly in, stopping just short of lockout.'],
  ['Wrists stacked over elbows', 'Keep a slight arch and a proud chest'],
  'A bench steeper than 45° turns it into a shoulder press.');
E('db_bench_press', 'Flat Dumbbell Bench Press', 'Chest', 'Dumbbells + flat bench', ['chest'], ['frontDelt', 'triceps'], true,
  ['Lie back with the dumbbells on your thighs, then kick them up to lockout over your chest.',
   'Squeeze your shoulder blades together and down; feet planted.',
   'Lower the dumbbells to the sides of your chest until you feel a full stretch.',
   'Press back up in a slight arc so the bells finish over your lower chest.'],
  ['Elbows ~45° — not flared to 90°', 'Control the bottom; no bouncing'],
  'Cutting the range short. The stretch at the bottom is what builds the chest.');
E('cable_fly', 'Cable Fly (Mid)', 'Chest', 'Dual cable station', ['chest'], ['frontDelt'], false,
  ['Set both pulleys at about shoulder height and step forward into a staggered stance.',
   'Lock a slight bend in your elbows and keep it fixed the whole set.',
   'Bring your hands together in a wide arc in front of your chest — like hugging a big tree.',
   'Squeeze for a second, then open slowly until you feel a stretch with elbows just behind your torso.'],
  ['Move at the shoulder, not the elbow', 'Think "biceps to pecs" when squeezing'],
  'Bending and straightening the elbows turns the fly into a sloppy press.');
E('pec_deck', 'Pec Deck Fly', 'Chest', 'Pec deck machine', ['chest'], ['frontDelt'], false,
  ['Adjust the seat so your arms are parallel to the floor when you grab the handles.',
   'Sit tall, back against the pad, shoulders down away from your ears.',
   'Sweep the handles together in an arc and squeeze your chest hard for 1 s.',
   'Return slowly to a comfortable stretch without letting the stack touch down.'],
  ['Lead with the elbows / forearms', 'Keep the chest up throughout'],
  'Shrugging the shoulders up — the traps and front delts take over.');
E('low_high_cable_fly', 'Low-to-High Cable Fly', 'Chest', 'Dual cable station', ['chest'], ['frontDelt'], false,
  ['Set both pulleys at the lowest position; staggered stance, palms facing forward.',
   'With a soft elbow bend, sweep your hands up and together to about chin height.',
   'Squeeze the upper chest for a second at the top.',
   'Lower slowly back down and out until you feel the stretch.'],
  ['Scoop upward — like lifting a large tray', 'Keep the ribs down, no leaning back'],
  'Using too much weight and turning it into a front raise.');

/* ---------------- BACK ---------------- */
E('lat_pulldown', 'Wide-Grip Lat Pulldown', 'Back', 'Cable pulldown station', ['lats'], ['biceps', 'upperBack', 'rearDelt'], true,
  ['Grip the bar just outside shoulder width and lock your thighs under the pad.',
   'Lean back slightly (10–15°) with your chest up.',
   'Drive your elbows down toward your hips until the bar reaches your upper chest.',
   'Pause, then let the bar rise slowly until your arms are straight and your lats are stretched.'],
  ['"Elbows to your back pockets"', 'Hands are hooks — pull with the back, not the grip'],
  'Leaning way back and yanking — it becomes a row with momentum.');
E('neutral_pulldown', 'Close Neutral-Grip Pulldown', 'Back', 'Cable pulldown + V-handle', ['lats'], ['biceps', 'upperBack'], true,
  ['Attach a V-handle, sit with thighs locked under the pad.',
   'Start with arms fully extended and shoulders pulled up by the weight (full stretch).',
   'Pull the handle to your lower chest, keeping elbows tucked close to your sides.',
   'Squeeze your lats, then return slowly to a full stretch.'],
  ['Chest up to meet the handle', 'Elbows travel down and back'],
  'Stopping the negative halfway — you skip the most productive part of the rep.');
E('assisted_pullup', 'Assisted Pull-Up', 'Back', 'Assisted pull-up machine', ['lats'], ['biceps', 'upperBack', 'forearms'], true,
  ['Choose an assistance weight that lets you hit the target reps (more weight = more help).',
   'Kneel on the pad and grip slightly wider than shoulder width.',
   'Pull your chest toward the bar by driving your elbows down.',
   'Lower all the way to a full dead hang every rep.'],
  ['Depress the shoulders first, then pull', 'Slow 2–3 s lowering'],
  'Half reps. Reduce the assistance only when you own the full range.');
E('cs_machine_row', 'Chest-Supported Machine Row', 'Back', 'Chest-supported row machine', ['upperBack', 'lats'], ['rearDelt', 'biceps'], true,
  ['Set the chest pad so you can just reach the handles with arms fully extended.',
   'Keep your chest glued to the pad.',
   'Row the handles toward your lower ribs, driving the elbows back.',
   'Squeeze your shoulder blades for 1 s, then let the handles travel forward until your blades spread.'],
  ['Lead with the elbows', 'Let the shoulder blades move — reach and squeeze'],
  'Lifting your chest off the pad to heave the weight.');
E('seated_cable_row', 'Seated Cable Row', 'Back', 'Cable row + V-handle', ['upperBack', 'lats'], ['rearDelt', 'biceps', 'lowerBack'], true,
  ['Sit with knees slightly bent, feet on the platform, holding a V-handle.',
   'Sit tall with a neutral spine.',
   'Row the handle to your belly button, elbows close to your sides.',
   'Squeeze, then reach forward letting the shoulder blades spread — without rounding the lower back.'],
  ['Torso stays nearly still', 'Pull the elbows past the ribs'],
  'Rocking the torso back and forth to move the weight.');
E('one_arm_db_row', 'One-Arm Dumbbell Row', 'Back', 'Dumbbell + flat bench', ['lats', 'upperBack'], ['rearDelt', 'biceps'], true,
  ['Place one hand and the same-side knee on a bench; back flat and parallel to the floor.',
   'Let the dumbbell hang straight below your shoulder.',
   'Pull the dumbbell in an arc toward your hip, keeping the elbow close.',
   'Lower slowly to a full stretch at the bottom.'],
  ['Pull to the hip, not the armpit (more lats)', 'Keep the hips square'],
  'Twisting the torso to heave heavy weight up.');
E('straight_arm_pulldown', 'Straight-Arm Cable Pulldown', 'Back', 'Cable + rope or straight bar', ['lats'], ['triceps', 'rearDelt'], false,
  ['Attach a rope or bar to a high pulley and step back a couple of feet.',
   'Hinge slightly at the hips; arms almost straight, reaching up toward the pulley.',
   'Sweep the handle down in an arc to your thighs using your lats.',
   'Pause, then return slowly until your arms are overhead and your lats stretch.'],
  ['Arms are just levers — keep the elbow angle fixed', 'Push the bar down and back to your hips'],
  'Bending the elbows — it becomes a triceps pushdown.');
E('db_pullover', 'Dumbbell Pullover', 'Back', 'Dumbbell + flat bench', ['lats'], ['chest', 'triceps'], false,
  ['Lie on a flat bench holding one dumbbell over your chest with both hands (cupping the top plate).',
   'Keep a slight bend in the elbows.',
   'Lower the dumbbell back behind your head in an arc until you feel a big lat stretch.',
   'Pull it back over your chest by driving the elbows toward your hips.'],
  ['Ribs down — don’t let the lower back arch', 'Slow, controlled stretch'],
  'Bending the elbows a lot so it turns into a triceps extension.');
E('kneeling_pulldown', 'Half-Kneeling 1-Arm Cable Pulldown', 'Back', 'Cable + D-handle', ['lats'], ['biceps', 'obliques'], false,
  ['Set a D-handle at the top of the cable and kneel on one knee facing it.',
   'Reach up so your arm is fully extended and the lat is stretched.',
   'Drive the elbow down to your side, slightly behind the torso.',
   'Return slowly, letting the shoulder rise at the top for a full stretch.'],
  ['"Elbow to hip pocket"', 'Keep your torso still — don’t crunch'],
  'Rotating the torso to cheat the handle down.');

/* ---------------- SHOULDERS ---------------- */
E('seated_db_press', 'Seated Dumbbell Shoulder Press', 'Shoulders', 'Dumbbells + upright bench', ['frontDelt', 'sideDelt'], ['triceps', 'traps'], true,
  ['Set the bench upright (80–90°) and bring the dumbbells to shoulder height, palms forward.',
   'Keep elbows slightly in front of your body, not flared straight out.',
   'Press up until your arms are nearly straight and the bells are close together.',
   'Lower to about chin/ear level under control.'],
  ['Brace your abs — ribs down', 'Press up and slightly back'],
  'Excessive arching of the lower back to push heavier weight.');
E('machine_shoulder_press', 'Machine Shoulder Press', 'Shoulders', 'Shoulder press machine', ['frontDelt', 'sideDelt'], ['triceps'], true,
  ['Adjust the seat so the handles start at about shoulder/ear height.',
   'Sit tall, back against the pad, feet planted.',
   'Press up until your arms are almost straight.',
   'Lower slowly until your hands are just below chin level.'],
  ['Keep the head neutral', 'Smooth tempo, no bouncing'],
  'Setting the seat too low and grinding the shoulders at the bottom.');
E('arnold_press', 'Arnold Press', 'Shoulders', 'Dumbbells + upright bench', ['frontDelt', 'sideDelt'], ['triceps'], true,
  ['Sit tall holding dumbbells at chin height, palms facing you.',
   'As you press up, rotate your palms to face forward.',
   'Finish with arms nearly straight overhead.',
   'Reverse the rotation on the way down back to palms-in.'],
  ['One smooth motion — rotate while pressing', 'Go lighter than a regular press'],
  'Rushing the rotation and losing control of the dumbbells.');
E('db_lateral_raise', 'Dumbbell Lateral Raise', 'Shoulders', 'Dumbbells', ['sideDelt'], ['traps'], false,
  ['Stand tall with a slight forward lean, dumbbells at your sides, soft elbows.',
   'Raise your arms out to the sides, leading with the elbows.',
   'Stop around shoulder height and pause briefly.',
   'Lower slowly over 2–3 s.'],
  ['"Push the dumbbells out to the walls"', 'Shoulders down, neck long'],
  'Swinging the weight up and shrugging with the traps.');
E('cable_lateral_raise', 'Cable Lateral Raise', 'Shoulders', 'Single cable + D-handle', ['sideDelt'], ['traps'], false,
  ['Set the pulley at the lowest position and stand side-on to it.',
   'Grab the handle with the far hand, cable running in front of (or behind) your body.',
   'Raise your arm out to the side to shoulder height.',
   'Lower slowly — the cable keeps tension even at the bottom.'],
  ['Slight lean away from the machine', 'Lead with the elbow'],
  'Turning it into a front raise by pulling across the body.');
E('machine_lateral_raise', 'Machine Lateral Raise', 'Shoulders', 'Lateral raise machine', ['sideDelt'], [], false,
  ['Adjust the seat so your shoulder joint lines up with the machine’s pivot.',
   'Place your forearms/elbows against the pads.',
   'Raise the pads out to the sides until your arms are about parallel to the floor.',
   'Pause, then lower slowly.'],
  ['Push with the elbows, not the hands', 'Stay tall, don’t shrug'],
  'Seat set too low or high so the movement feels like a shrug.');
E('reverse_pec_deck', 'Reverse Pec Deck', 'Shoulders', 'Pec deck (reverse)', ['rearDelt'], ['upperBack'], false,
  ['Sit facing the pad with the handles at shoulder height.',
   'Arms nearly straight, slight bend at the elbows.',
   'Sweep your arms back and out until they line up with your torso.',
   'Pause, then return slowly.'],
  ['Think "arms out wide", not "row"', 'Keep the chest on the pad'],
  'Squeezing the shoulder blades hard — that shifts work to the mid-back.');
E('face_pull', 'Cable Face Pull', 'Shoulders', 'Cable + rope', ['rearDelt'], ['upperBack', 'traps'], false,
  ['Set a rope at upper-chest to eye height and step back.',
   'Pull the rope toward your face while spreading the ends apart.',
   'Keep elbows high and finish with your hands beside your ears (double-biceps pose).',
   'Return slowly with control.'],
  ['Elbows stay at shoulder height', 'Pull apart, not just back'],
  'Using too much weight and leaning back to row it.');
E('cs_rear_delt_raise', 'Chest-Supported Rear Delt Raise', 'Shoulders', 'Dumbbells + incline bench', ['rearDelt'], ['upperBack'], false,
  ['Set a bench to 30–45° and lie face-down on it, dumbbells hanging below.',
   'With a slight bend in your elbows, raise the dumbbells out to the sides.',
   'Lead with the pinkies/knuckles and stop when arms are in line with your body.',
   'Lower slowly.'],
  ['Light weight, strict form', 'Keep the chest on the bench'],
  'Going heavy and pinching the shoulder blades instead of moving the arms.');

/* ---------------- BICEPS ---------------- */
E('ez_curl', 'EZ-Bar Curl', 'Biceps', 'EZ curl bar', ['biceps'], ['forearms'], false,
  ['Stand tall and grip the EZ-bar on the angled sections, shoulder-width.',
   'Pin your elbows at your sides.',
   'Curl the bar up by bending only at the elbows; squeeze at the top.',
   'Lower over 2–3 s to full extension.'],
  ['Elbows stay put', 'No hip swing'],
  'Swinging the hips and letting the elbows drift forward.');
E('incline_db_curl', 'Incline Dumbbell Curl', 'Biceps', 'Dumbbells + incline bench', ['biceps'], ['forearms'], false,
  ['Set a bench to 45–60° and sit back with arms hanging straight down behind your torso.',
   'Palms face forward.',
   'Curl up keeping the upper arm still.',
   'Lower slowly into a big stretch at the bottom.'],
  ['Keep the shoulders back against the bench', 'Full stretch every rep'],
  'Bringing the elbows forward to shorten the range.');
E('bayesian_curl', 'Bayesian Cable Curl', 'Biceps', 'Single cable + D-handle', ['biceps'], ['forearms'], false,
  ['Set the pulley low, face away from the machine and hold the handle.',
   'Step forward so your arm is pulled back behind your body.',
   'Curl forward while keeping the elbow behind your torso.',
   'Lower slowly back into the stretch.'],
  ['Elbow stays slightly behind you', 'Staggered stance for stability'],
  'Letting the elbow swing forward, which removes the stretch.');
E('hammer_curl', 'Dumbbell Hammer Curl', 'Biceps', 'Dumbbells', ['biceps', 'forearms'], [], false,
  ['Stand tall with dumbbells at your sides, palms facing each other.',
   'Keep elbows pinned at your sides.',
   'Curl up keeping the neutral (thumbs-up) grip.',
   'Lower under control.'],
  ['Thumbs up the whole time', 'Squeeze hard at the top'],
  'Swinging the body to move more weight.');
E('preacher_curl', 'Preacher Curl', 'Biceps', 'Preacher bench (EZ-bar or machine)', ['biceps'], ['forearms'], false,
  ['Adjust the seat so the pad sits snugly under your armpits.',
   'Hold the bar with arms extended down the pad.',
   'Curl up until your forearms are near vertical.',
   'Lower slowly all the way — don’t bounce at the bottom.'],
  ['Triceps stay glued to the pad', 'Slow eccentric'],
  'Dropping the weight fast at the bottom — stresses the elbow.');
E('spider_curl', 'Spider Curl', 'Biceps', 'Dumbbells/EZ-bar + incline bench', ['biceps'], [], false,
  ['Set a bench to ~45° and lie chest-down on it.',
   'Let your arms hang straight toward the floor.',
   'Curl up and squeeze hard at the top.',
   'Lower under control to full extension.'],
  ['Upper arms stay vertical', 'Peak squeeze at the top'],
  'Shrugging or lifting the chest to cheat.');

/* ---------------- TRICEPS ---------------- */
E('overhead_cable_ext', 'Overhead Cable Triceps Extension', 'Triceps', 'Cable + rope', ['triceps'], [], false,
  ['Attach a rope at a low-to-mid pulley and face away from the machine.',
   'Staggered stance; hands behind your head, elbows pointing forward/up.',
   'Extend your arms overhead until straight.',
   'Return slowly into a deep stretch behind your head.'],
  ['Elbows stay narrow and still', 'Stretch the long head at the bottom'],
  'Flaring the elbows and moving the upper arm.');
E('db_overhead_ext', 'Seated DB Overhead Extension', 'Triceps', 'Dumbbell + upright bench', ['triceps'], [], false,
  ['Sit upright holding one dumbbell overhead with both hands cupping the top plate.',
   'Lower the dumbbell behind your head by bending only at the elbows.',
   'Go to a deep stretch.',
   'Extend back to the top.'],
  ['Elbows point up, close to your head', 'Brace — no arching'],
  'Elbows flaring out wide.');
E('ez_skullcrusher', 'EZ-Bar Skull Crusher', 'Triceps', 'EZ-bar + flat bench', ['triceps'], [], false,
  ['Lie on a flat bench with the EZ-bar over your chest, narrow grip.',
   'Tilt the upper arms slightly back toward your head.',
   'Lower the bar toward your forehead/just behind your head by bending the elbows.',
   'Extend back to the start.'],
  ['Only the elbows move', 'Control the bottom'],
  'Elbows flaring and the movement becoming a press.');
E('rope_pushdown', 'Rope Triceps Pushdown', 'Triceps', 'Cable + rope', ['triceps'], [], false,
  ['Attach a rope to a high pulley and stand close with elbows pinned to your sides.',
   'Push the rope down until your arms are straight.',
   'Spread the rope ends apart at the bottom and squeeze.',
   'Let the rope rise until your elbows are about 90°.'],
  ['Elbows glued to your ribs', 'Slight forward lean'],
  'Letting the elbows drift forward and using the shoulders.');
E('vbar_pushdown', 'V-Bar Pushdown', 'Triceps', 'Cable + V-bar', ['triceps'], [], false,
  ['Attach a V-bar to a high pulley; grip with thumbs on top.',
   'Pin your elbows at your sides.',
   'Press down until your arms are fully straight and squeeze.',
   'Return slowly to just above 90°.'],
  ['Heavier variation — keep strict form', 'Lock out every rep'],
  'Leaning your bodyweight over the bar.');
E('cable_kickback', 'Cable Triceps Kickback', 'Triceps', 'Single cable (low/mid)', ['triceps'], [], false,
  ['Set the pulley low; hinge forward holding the handle (or cable end) in one hand.',
   'Upper arm parallel to your torso, elbow bent 90°.',
   'Extend the arm straight back until locked out; squeeze.',
   'Return slowly without letting the upper arm drop.'],
  ['Upper arm stays still', 'Full lockout'],
  'Swinging the whole arm.');

/* ---------------- QUADS ---------------- */
E('leg_press', 'Leg Press', 'Quads', 'Leg press machine', ['quads'], ['glutes', 'adductors'], true,
  ['Sit with your back and hips flat on the pad; feet shoulder-width, mid-platform.',
   'Release the safeties and lower the sled until your knees reach ~90° or deeper.',
   'Only go as deep as you can while your lower back stays on the pad.',
   'Press through your whole foot back up — don’t lock your knees.'],
  ['Knees track over toes', 'Slow lowering, controlled drive'],
  'Letting the hips curl off the pad at the bottom.');
E('hack_squat', 'Hack Squat (Machine)', 'Quads', 'Hack squat machine', ['quads'], ['glutes'], true,
  ['Shoulders under the pads, back flat; feet shoulder-width, mid-to-low on the platform.',
   'Unlock the safeties.',
   'Squat down under control as deep as you comfortably can.',
   'Drive up through the mid-foot without locking the knees.'],
  ['Knees travel forward — that’s the point', 'Keep the back on the pad'],
  'Bouncing out of the bottom.');
E('smith_squat', 'Smith Machine Squat', 'Quads', 'Smith machine', ['quads'], ['glutes', 'adductors'], true,
  ['Set the bar at upper-chest height and step under it so it rests on your upper traps.',
   'Place your feet slightly in front of the bar, shoulder-width.',
   'Unrack and squat down to at least parallel with a tall chest.',
   'Drive up through the mid-foot.'],
  ['Brace your core before each rep', 'Use the safeties'],
  'Feet too far forward so it becomes a hip-only movement.');
E('leg_extension', 'Leg Extension', 'Quads', 'Leg extension machine', ['quads'], [], false,
  ['Adjust the back pad so your knees line up with the machine’s pivot point.',
   'Set the ankle pad on your lower shins.',
   'Extend your legs until straight and squeeze the quads for 1 s.',
   'Lower slowly under control.'],
  ['Hold the handles, hips down', 'Lean back slightly for more stretch'],
  'Kicking the weight up with momentum.');
E('single_leg_extension', 'Single-Leg Extension (Paused)', 'Quads', 'Leg extension machine', ['quads'], [], false,
  ['Set up exactly like a normal leg extension.',
   'Work one leg at a time.',
   'Extend fully and pause for a full second at the top.',
   'Lower slowly for 3 s.'],
  ['Match reps on both legs', 'Start with the weaker leg'],
  'Rushing the pause.');
E('heels_elevated_goblet_squat', 'Heels-Elevated Goblet Squat', 'Quads', 'Dumbbell + plate/wedge', ['quads'], ['glutes', 'abs'], true,
  ['Stand with your heels on a small plate or wedge, holding a dumbbell at your chest.',
   'Squat straight down, letting your knees travel forward over your toes.',
   'Keep your torso upright and go as deep as you can.',
   'Drive back up through the whole foot.'],
  ['Elbows inside the knees at the bottom', 'Slow 3 s lowering'],
  'Heels lifting off the plate.');
E('bulgarian_split_squat', 'Bulgarian Split Squat', 'Quads', 'Dumbbells + bench', ['quads', 'glutes'], ['adductors'], true,
  ['Place your rear foot on a bench; front foot about 2 ft forward.',
   'Hold dumbbells at your sides.',
   'Lower until the rear knee nearly touches the floor; front knee tracks over toes.',
   'Drive through the front foot to stand.'],
  ['Upright torso = more quads; lean = more glutes', 'Do all reps on the weaker leg first'],
  'Front foot too close to the bench, forcing the heel up.');
E('db_reverse_lunge', 'Dumbbell Reverse Lunge', 'Quads', 'Dumbbells', ['quads', 'glutes'], ['adductors'], true,
  ['Stand tall holding dumbbells at your sides.',
   'Step one foot back and lower until both knees are about 90°.',
   'Push through the front foot to return to standing.',
   'Alternate legs or complete one side first.'],
  ['Most of the weight stays on the front leg', 'Controlled step back'],
  'Short steps that jam the front knee.');
E('db_step_up', 'Dumbbell Step-Up', 'Quads', 'Dumbbells + box/bench', ['quads', 'glutes'], [], true,
  ['Stand facing a knee-height box holding dumbbells.',
   'Place one foot fully on the box.',
   'Drive through that heel to stand up on the box — minimal push from the back leg.',
   'Lower slowly back down.'],
  ['The top leg does the work', 'Stand fully tall at the top'],
  'Bouncing off the back foot.');

/* ---------------- HAMSTRINGS ---------------- */
E('seated_leg_curl', 'Seated Leg Curl', 'Hamstrings', 'Seated leg curl machine', ['hamstrings'], ['calves'], false,
  ['Adjust so your knees line up with the pivot; lock the thigh pad down tight.',
   'Set the ankle pad just above your heels.',
   'Lean your torso slightly forward for a deeper stretch.',
   'Curl down/back as far as possible, pause, and return slowly.'],
  ['Squeeze at the fully curled position', '3 s lowering'],
  'Loose thigh pad, which lets the hips lift.');
E('lying_leg_curl', 'Lying Leg Curl', 'Hamstrings', 'Lying leg curl machine', ['hamstrings'], ['calves'], false,
  ['Lie face down with your knees just off the edge of the pad.',
   'Set the ankle pad just above your heels; hold the handles.',
   'Curl your heels toward your glutes while keeping your hips pressed down.',
   'Lower slowly to full extension.'],
  ['Hips stay glued to the pad', 'Point toes toward shins'],
  'Hips popping up to finish the rep.');
E('ball_leg_curl', 'Stability Ball Leg Curl', 'Hamstrings', 'Stability ball', ['hamstrings'], ['glutes'], false,
  ['Lie on your back with your heels on a stability ball.',
   'Lift your hips into a bridge.',
   'Curl the ball toward your glutes while keeping your hips high.',
   'Roll it back out slowly.'],
  ['Hips high the entire set', 'Arms out flat for balance'],
  'Letting the hips sag as the ball rolls out.');
E('db_rdl', 'Dumbbell Romanian Deadlift', 'Hamstrings', 'Dumbbells', ['hamstrings', 'glutes'], ['lowerBack', 'forearms'], true,
  ['Stand tall with dumbbells in front of your thighs, soft knees.',
   'Push your hips back while the dumbbells slide down close to your legs.',
   'Keep your back flat; lower until you feel a strong hamstring stretch (about mid-shin).',
   'Drive your hips forward to stand tall.'],
  ['Hips back, not down', 'Dumbbells stay close to the legs'],
  'Rounding the lower back or turning it into a squat.');
E('back_extension_45', '45° Back Extension (Ham/Glute bias)', 'Hamstrings', '45° hyperextension bench', ['hamstrings', 'glutes'], ['lowerBack'], false,
  ['Set the pad just below your hip crease; feet flat on the platform.',
   'Cross your arms (or hug a plate) and keep your spine neutral.',
   'Hinge at the hips, lowering your torso until you feel the hamstring stretch.',
   'Squeeze the glutes to rise until your body is in a straight line.'],
  ['Move at the hips, not the spine', 'Don’t hyperextend at the top'],
  'Pad set too high so the lower back does all the work.');
E('cable_pull_through', 'Cable Pull-Through', 'Hamstrings', 'Cable + rope (low)', ['glutes', 'hamstrings'], ['lowerBack'], false,
  ['Attach a rope to a low pulley, face away and grab it between your legs.',
   'Walk forward to create tension; feet a bit wider than hips.',
   'Hinge your hips back letting the rope pull through your legs.',
   'Snap the hips forward and squeeze the glutes to stand tall.'],
  ['Hinge, don’t squat', 'Arms are just hooks'],
  'Pulling with the arms or leaning back at the top.');

/* ---------------- GLUTES ---------------- */
E('hip_thrust', 'Hip Thrust (Barbell or Machine)', 'Glutes', 'Barbell + bench or hip thrust machine', ['glutes'], ['hamstrings', 'quads'], true,
  ['Rest your upper back on a bench (edge just below the shoulder blades); pad the bar over your hips.',
   'Feet flat, about shoulder-width, shins vertical at the top.',
   'Drive through your heels to lift your hips until your torso is parallel to the floor.',
   'Tuck your chin, squeeze your glutes for 1 s, then lower.'],
  ['Ribs down, slight posterior pelvic tilt at the top', 'Look forward, not up'],
  'Arching the lower back instead of extending the hips.');
E('cable_glute_kickback', 'Cable Glute Kickback', 'Glutes', 'Cable + ankle strap', ['glutes'], ['hamstrings'], false,
  ['Attach an ankle strap at the low pulley; hold the frame and hinge slightly forward.',
   'Kick the working leg back and slightly out.',
   'Squeeze the glute at full hip extension.',
   'Return slowly without letting the weight stack touch.'],
  ['Move at the hip — no lower-back arch', 'Small, controlled range'],
  'Swinging the leg with momentum.');
E('hip_abduction', 'Seated Hip Abduction', 'Glutes', 'Hip abduction machine', ['glutes'], [], false,
  ['Sit in the machine with the pads on the outside of your knees.',
   'Lean your torso forward slightly (targets more glute).',
   'Push your knees out as far as possible and pause.',
   'Return slowly.'],
  ['Pause at the widest point', 'Controlled return'],
  'Bouncing the pads together.');

/* ---------------- CALVES ---------------- */
E('standing_calf_raise', 'Standing Calf Raise', 'Calves', 'Standing calf machine or step', ['calves'], [], false,
  ['Place the balls of your feet on the platform edge, shoulders under the pads.',
   'Lower your heels as far as possible and pause 1–2 s in the stretch.',
   'Rise up onto your toes as high as you can.',
   'Squeeze for a second at the top.'],
  ['Pause at the bottom — no bouncing', 'Knees straight but not locked'],
  'Bouncing through half reps.');
E('seated_calf_raise', 'Seated Calf Raise', 'Calves', 'Seated calf machine', ['calves'], [], false,
  ['Sit with the balls of your feet on the platform and the pad snug on your lower thighs.',
   'Release the lever; lower your heels into a deep stretch.',
   'Press up onto your toes as high as possible.',
   'Pause, then lower slowly.'],
  ['Knees stay bent at 90° (targets the soleus)', 'Full range'],
  'Using the arms to push the pad.');
E('leg_press_calf_raise', 'Leg Press Calf Raise', 'Calves', 'Leg press machine', ['calves'], [], false,
  ['Sit in the leg press with the balls of your feet on the bottom edge of the platform.',
   'Keep the knees straight but not locked (keep the safeties engaged if possible).',
   'Push the platform away using only your ankles.',
   'Let the platform come back into a deep calf stretch.'],
  ['Slow and deep', 'Pause at both ends'],
  'Bending the knees to push with the quads.');

/* ---------------- CORE ---------------- */
E('cable_crunch', 'Kneeling Cable Crunch', 'Core', 'Cable + rope', ['abs'], ['obliques'], false,
  ['Kneel facing a high pulley and hold the rope beside your head.',
   'Keep your hips still.',
   'Crunch your ribs toward your pelvis, rounding the spine, and exhale.',
   'Return slowly to the stretch.'],
  ['Curl the spine — don’t just hinge at the hips', 'Exhale hard at the bottom'],
  'Sitting back on the heels and pulling with the arms.');
E('hanging_knee_raise', 'Hanging Knee Raise', 'Core', 'Pull-up bar or captain’s chair', ['abs'], ['obliques', 'forearms'], false,
  ['Hang from a bar (or use a captain’s chair).',
   'Curl your knees toward your chest while tilting your pelvis up.',
   'Pause at the top.',
   'Lower slowly without swinging.'],
  ['Tilt the pelvis — that’s what hits the abs', 'No kipping'],
  'Swinging the legs up with hip flexors only.');
E('ab_wheel', 'Kneeling Ab Wheel Rollout', 'Core', 'Ab wheel + mat', ['abs'], ['obliques', 'lats'], false,
  ['Kneel on a mat holding the ab wheel under your shoulders.',
   'Brace hard and keep your ribs down.',
   'Roll forward as far as you can without your lower back arching.',
   'Pull back to the start using your abs.'],
  ['Hips slightly bent, glutes squeezed', 'Increase range gradually'],
  'Letting the lower back sag.');

/* ============================================================
   ROTATION SLOTS — each has 3 cycling variations
   ============================================================ */
const SLOTS = {
  chest_press:   { label: 'Chest press',       group: 'Chest',      vars: ['machine_chest_press', 'incline_db_press', 'db_bench_press'] },
  chest_fly:     { label: 'Chest fly',         group: 'Chest',      vars: ['cable_fly', 'pec_deck', 'low_high_cable_fly'] },
  back_vertical: { label: 'Vertical pull',     group: 'Back',       vars: ['lat_pulldown', 'neutral_pulldown', 'assisted_pullup'] },
  back_row:      { label: 'Row',               group: 'Back',       vars: ['cs_machine_row', 'seated_cable_row', 'one_arm_db_row'] },
  back_iso:      { label: 'Lat isolation',     group: 'Back',       vars: ['straight_arm_pulldown', 'db_pullover', 'kneeling_pulldown'] },
  delt_press:    { label: 'Overhead press',    group: 'Shoulders',  vars: ['seated_db_press', 'machine_shoulder_press', 'arnold_press'] },
  side_delt:     { label: 'Side delts',        group: 'Shoulders',  vars: ['db_lateral_raise', 'cable_lateral_raise', 'machine_lateral_raise'] },
  rear_delt:     { label: 'Rear delts',        group: 'Shoulders',  vars: ['reverse_pec_deck', 'face_pull', 'cs_rear_delt_raise'] },
  biceps_a:      { label: 'Biceps (stretch)',  group: 'Biceps',     vars: ['ez_curl', 'incline_db_curl', 'bayesian_curl'] },
  biceps_b:      { label: 'Biceps (short)',    group: 'Biceps',     vars: ['hammer_curl', 'preacher_curl', 'spider_curl'] },
  triceps_a:     { label: 'Triceps (overhead)',group: 'Triceps',    vars: ['overhead_cable_ext', 'db_overhead_ext', 'ez_skullcrusher'] },
  triceps_b:     { label: 'Triceps (pushdown)',group: 'Triceps',    vars: ['rope_pushdown', 'vbar_pushdown', 'cable_kickback'] },
  quad_main:     { label: 'Quad press/squat',  group: 'Quads',      vars: ['leg_press', 'hack_squat', 'smith_squat'] },
  quad_iso:      { label: 'Quad isolation',    group: 'Quads',      vars: ['leg_extension', 'single_leg_extension', 'heels_elevated_goblet_squat'] },
  quad_uni:      { label: 'Single-leg',        group: 'Quads',      vars: ['bulgarian_split_squat', 'db_reverse_lunge', 'db_step_up'] },
  ham_curl:      { label: 'Leg curl',          group: 'Hamstrings', vars: ['seated_leg_curl', 'lying_leg_curl', 'ball_leg_curl'] },
  ham_hinge:     { label: 'Hip hinge',         group: 'Hamstrings', vars: ['db_rdl', 'back_extension_45', 'cable_pull_through'] },
  glute:         { label: 'Glutes',            group: 'Glutes',     vars: ['hip_thrust', 'cable_glute_kickback', 'hip_abduction'] },
  calves:        { label: 'Calves',            group: 'Calves',     vars: ['standing_calf_raise', 'seated_calf_raise', 'leg_press_calf_raise'] },
  core:          { label: 'Core',              group: 'Core',       vars: ['cable_crunch', 'hanging_knee_raise', 'ab_wheel'] }
};

/* ============================================================
   EXTRA EXERCISES — research-backed alternatives, switched off by default.
   Switch any of them on in the Exercise library and it joins the rotation for its slot.
   RX(slot, why, …same arguments as E)
   ============================================================ */
const EXTRA_EX = [];
function RX(slot, why, id, name, group, equip, primary, secondary, compound, steps, cues, mistake, opts) {
  E(id, name, group, equip, primary, secondary, compound, steps, cues, mistake);
  Object.assign(EX[id], { extra: true, slot, why }, opts || {}); EXTRA_EX.push(id);
}
/* ---- chest ---- */
RX('chest_press', 'A 30–45° incline shifts more of the work to the upper chest, and the fixed bar path lets you push close to failure without a spotter.',
  'smith_incline_press', 'Smith Machine Incline Press', 'Chest', 'Smith machine + adjustable bench', ['chest'], ['frontDelt', 'triceps'], true,
  ['Set the bench to 30–45° so the bar lines up with your upper chest.', 'Grip slightly wider than shoulders, pin your shoulder blades back and down.',
   'Unrack and lower the bar under control to your upper chest.', 'Press up until your arms are almost straight.'],
  ['Elbows about 45–60° from your torso', 'Touch the same spot every rep'], 'Setting the bench so the bar lands on your neck or lower chest.');
RX('chest_press', 'Machines guide the path so you can take sets close to failure safely, which is what drives growth; the incline biases the upper chest.',
  'machine_incline_press', 'Machine Incline Chest Press', 'Chest', 'Incline press machine', ['chest'], ['frontDelt', 'triceps'], true,
  ['Set the seat so the handles start level with your upper chest.', 'Sit tall with your shoulder blades against the pad.',
   'Press up and forward until your arms are nearly straight.', 'Lower slowly until you feel a stretch across the chest.'],
  ['Chest up, shoulders down', 'Control the last few inches of the descent'], 'Shrugging the shoulders up toward your ears as you press.');
RX('chest_press', 'Push-ups built as much chest and triceps as bench pressing at matched effort (Kikuchi & Nakazato, 2017); raising the hands lets the chest stretch past the floor.',
  'deficit_pushup', 'Deficit Push-Up', 'Chest', 'Push-up handles or plates', ['chest'], ['frontDelt', 'triceps', 'abs'], true,
  ['Place handles or plates shoulder-width apart and set up in a plank.', 'Brace your abs and glutes so your body is one straight line.',
   'Lower until your chest dips below your hands.', 'Push back up to straight arms. Add a weight vest or plate on your back once sets pass 20 reps.'],
  ['Elbows about 45° from your torso', 'Ribs down, no sagging hips'], 'Cutting the range short — the deep part is the point of the deficit.', { bw: true });
RX('chest_press', 'Leaning forward on dips loads the lower chest through one of the deepest stretches of any chest exercise.',
  'chest_dip', 'Chest-Leaning Dip', 'Chest', 'Dip bars (or assisted dip machine)', ['chest'], ['triceps', 'frontDelt'], true,
  ['Grip the bars and support yourself on straight arms.', 'Lean your torso forward about 30° and let your elbows flare slightly.',
   'Lower until your shoulders are just below your elbows, or until you feel a strong chest stretch.', 'Press back up without fully locking out.'],
  ['Stay leaned forward the whole set', 'Shoulders down, away from your ears'], 'Dropping too deep with the shoulders rolling forward — stop where the stretch is strong but comfortable.', { bw: true });
RX('chest_fly', 'Flies load the chest hardest when it is stretched, and training at long muscle lengths tends to build more muscle.',
  'incline_db_fly', 'Incline Dumbbell Fly', 'Chest', 'Dumbbells + adjustable bench', ['chest'], ['frontDelt'], false,
  ['Set the bench to about 30° and lie back with the dumbbells over your chest, palms facing.', 'Keep a soft bend in your elbows.',
   'Open your arms in a wide arc until you feel a deep chest stretch.', 'Hug the dumbbells back together over your upper chest.'],
  ['Move at the shoulder, not the elbow', 'Slow on the way down'], 'Bending the elbows more and more until it turns into a press.');
RX('chest_fly', 'Cables keep tension on the chest through the whole arc; one arm at a time lets the hand cross the midline for a stronger squeeze.',
  'single_arm_cable_fly', 'Single-Arm Cable Fly', 'Chest', 'Single cable + D-handle', ['chest'], ['frontDelt'], false,
  ['Set a cable at shoulder height and stand side-on with the handle in your far hand.', 'Step forward so the arm is stretched back with a soft elbow.',
   'Sweep the handle across your body until your hand passes the middle of your chest.', 'Return slowly to the stretch.'],
  ['Brace with the free hand on your hip', 'Keep the chest facing forward'], 'Rotating the torso to move the weight.');
/* ---- back ---- */
RX('back_row', 'Chest support takes the lower back out of the lift so the lats and upper back can be trained close to failure.',
  'cs_tbar_row', 'Chest-Supported T-Bar Row', 'Back', 'Chest-supported T-bar row machine', ['lats', 'upperBack'], ['rearDelt', 'biceps'], true,
  ['Set the pad so your chest is supported and your arms hang straight to the handles.', 'Grip the handles and brace your chest into the pad.',
   'Row the handles toward your lower ribs, driving the elbows back.', 'Lower until your shoulder blades spread apart.'],
  ['Chest stays on the pad', 'Pull with the elbows'], 'Lifting the chest off the pad to heave the weight up.');
RX('back_row', 'Lying face-down on a bench removes momentum and lower-back strain, so every rep is strict upper-back and lat work.',
  'seal_row', 'Dumbbell Seal Row', 'Back', 'Dumbbells + flat bench on blocks (or incline bench)', ['lats', 'upperBack'], ['rearDelt', 'biceps'], true,
  ['Lie face-down on a raised bench with a dumbbell in each hand hanging straight down.', 'Brace your chest against the bench.',
   'Row both dumbbells toward your hips.', 'Lower all the way until your arms are straight and your shoulder blades spread.'],
  ['Elbows travel back, not out', 'Full stretch at the bottom'], 'Raising the head and chest off the bench.');
RX('back_row', 'The staggered landmine stance lets you row heavy through a long range with a big lat stretch at the bottom.',
  'meadows_row', 'Meadows Row', 'Back', 'Landmine + barbell', ['lats', 'upperBack'], ['rearDelt', 'biceps', 'forearms'], true,
  ['Stand side-on to the end of a landmine bar in a split stance, front forearm resting on your knee.', 'Grip the end of the bar overhand with the far hand.',
   'Row the bar up toward your hip, elbow driving back.', 'Lower until you feel a full stretch through the lat.'],
  ['Hips stay square', 'Pull toward the back pocket'], 'Twisting the torso open at the top of each rep.');
RX('back_vertical', 'The pull-up is a classic vertical pull with high lat involvement; add load once you can do 12 or more clean reps.',
  'pullup', 'Pull-Up', 'Back', 'Pull-up bar', ['lats'], ['biceps', 'upperBack', 'forearms'], true,
  ['Hang from the bar with hands slightly wider than your shoulders.', 'Pull your shoulder blades down, then pull your chest toward the bar.',
   'Pull until your chin clears the bar.', 'Lower all the way to a dead hang under control.'],
  ['Lead with the chest', 'No kipping'], 'Half reps that stop well short of a full hang.', { bw: true });
RX('back_vertical', 'Separate handles let each side pull through its own full range, which helps even out a weaker side.',
  'iso_lat_pulldown', 'Iso-Lateral Machine Pulldown', 'Back', 'Plate-loaded pulldown machine', ['lats'], ['biceps', 'upperBack'], true,
  ['Set the thigh pad snug and reach up to the handles.', 'Start with your arms fully stretched overhead.',
   'Pull the handles down and slightly back toward your upper ribs.', 'Return slowly to a full stretch.'],
  ['Elbows down to your sides', 'Chest up'], 'Leaning far back and turning it into a row.');
RX('back_iso', 'A pullover machine trains the lats through a big overhead stretch without the biceps ending the set first.',
  'machine_pullover', 'Machine Pullover', 'Back', 'Pullover machine', ['lats'], ['chest', 'triceps'], false,
  ['Set the seat so your shoulders line up with the machine’s pivot.', 'Place your elbows or hands on the pads with your arms overhead.',
   'Drive the pads down in an arc until they reach your torso.', 'Let them rise back overhead until the lats are fully stretched.'],
  ['Move from the shoulder', 'Squeeze the lats at the bottom'], 'Starting from a short range and never reaching the stretch.');
/* ---- shoulders ---- */
RX('side_delt', 'Leaning away puts the side delt under load at the bottom of the raise, where a standard raise has almost none.',
  'lean_away_lateral', 'Lean-Away Dumbbell Lateral Raise', 'Shoulders', 'Dumbbell + upright post', ['sideDelt'], ['traps'], false,
  ['Hold a post with one hand and lean away until your body is at about 15–20°.', 'Hold a dumbbell in the free hand in front of your thigh.',
   'Raise the dumbbell out to the side until it is level with your shoulder.', 'Lower slowly all the way down.'],
  ['Lead with the elbow', 'Pinky slightly up'], 'Swinging the torso back toward the post to lift the weight.');
RX('side_delt', 'Raising in the scapular plane, about 30° in front of the body, is comfortable for the shoulder and the cables keep tension on the whole way.',
  'cable_y_raise', 'Cable Y-Raise', 'Shoulders', 'Dual cable station (low)', ['sideDelt'], ['frontDelt', 'traps'], false,
  ['Set both cables low and cross them, holding the opposite handle in each hand.', 'Stand in the middle with a slight hinge.',
   'Raise your arms up and out into a Y shape until they are just above shoulder height.', 'Lower slowly until your hands cross again.'],
  ['Thumbs up, arms slightly forward', 'Shoulders down'], 'Shrugging the traps to finish the rep.');
RX('side_delt', 'Lying side-on on an incline bench loads the side delt most when it is stretched, a position standing raises skip.',
  'lying_incline_lateral', 'Lying Incline Lateral Raise', 'Shoulders', 'Dumbbell + incline bench', ['sideDelt'], [], false,
  ['Set the bench to about 30–45° and lie on your side against it.', 'Hold a light dumbbell in the top hand, arm hanging across your body.',
   'Raise the dumbbell in an arc until your arm points about straight up.', 'Lower slowly across the body.'],
  ['Slight elbow bend', 'Go light — it is harder than it looks'], 'Rolling the torso forward off the bench.');
RX('delt_press', 'The fixed bar path makes it safe to push shoulder presses close to failure, and the seated setup keeps the lower back out of it.',
  'smith_shoulder_press', 'Seated Smith Machine Shoulder Press', 'Shoulders', 'Smith machine + upright bench', ['frontDelt'], ['sideDelt', 'triceps'], true,
  ['Put an upright bench in the Smith machine so the bar passes just in front of your face.', 'Grip just outside shoulder width.',
   'Lower the bar to about chin level.', 'Press until your arms are nearly straight.'],
  ['Forearms vertical at the bottom', 'Back against the pad'], 'Arching the lower back off the pad to finish reps.');
RX('delt_press', 'The arcing path of a landmine press is kind to shoulders that dislike strict overhead pressing.',
  'landmine_press', 'Half-Kneeling Landmine Press', 'Shoulders', 'Landmine + barbell', ['frontDelt'], ['chest', 'triceps', 'abs'], true,
  ['Kneel on one knee facing the end of a landmine bar; hold the end at your shoulder on the same side as the down knee.', 'Brace your abs and glutes.',
   'Press the bar up and forward until your arm is straight.', 'Lower under control back to the shoulder.'],
  ['Ribs down', 'Reach through at the top'], 'Leaning back to turn it into an incline press.');
/* ---- rear delts ---- */
RX('rear_delt', 'Crossed cables keep the rear delts loaded at the stretched, arms-crossed position.',
  'cable_rear_delt_fly', 'Cable Rear Delt Fly (Crossover)', 'Shoulders', 'Dual cable station', ['rearDelt'], ['upperBack'], false,
  ['Set both cables at shoulder height and hold the left cable in your right hand and the right in your left.', 'Step back so your arms are crossed in front of you.',
   'Pull your arms apart and back until they are in line with your body.', 'Return slowly until your arms cross again.'],
  ['Arms nearly straight', 'Think “out”, not “back”'], 'Squeezing the shoulder blades together so the traps take over.');
RX('rear_delt', 'Rowing with the elbows flared to 90° shifts the work from the lats to the rear delts and upper back.',
  'rear_delt_row', 'Wide-Grip Rear Delt Row', 'Shoulders', 'Chest-supported row machine or cable', ['rearDelt'], ['upperBack', 'traps'], true,
  ['Take a wide overhand grip on a chest-supported row.', 'Lift your elbows out to the sides so your upper arms are level with your shoulders.',
   'Row the handles toward your upper chest, keeping the elbows high.', 'Return until your arms are straight.'],
  ['Elbows stay level with the shoulders', 'Light weight, full squeeze'], 'Dropping the elbows so it becomes a normal row.');
RX('rear_delt', 'Needs only dumbbells; hinging to about parallel makes the rear delts, not the traps, do the lifting.',
  'bent_db_rear_fly', 'Bent-Over Dumbbell Rear Delt Fly', 'Shoulders', 'Dumbbells', ['rearDelt'], ['upperBack'], false,
  ['Hinge forward until your torso is nearly parallel to the floor, dumbbells hanging below your chest.', 'Keep a soft bend in the elbows.',
   'Raise the dumbbells out to the sides until your arms are level with your back.', 'Lower slowly.'],
  ['Pinkies lead', 'Neck neutral'], 'Standing up as the set gets hard.');
RX('rear_delt', 'One arm at a time lets you reach across the body for a longer stretch on each rear delt.',
  'single_arm_rear_delt_cable', 'Single-Arm Cable Rear Delt Raise', 'Shoulders', 'Single cable + D-handle', ['rearDelt'], ['upperBack'], false,
  ['Set a cable at shoulder height and hold the handle with the far hand so your arm crosses your chest.', 'Stand side-on with a soft elbow.',
   'Sweep the arm out and back until it is in line with your shoulders.', 'Return across the body under control.'],
  ['Keep the torso still', 'Lead with the back of the hand'], 'Rotating the whole body to move the weight.');
RX('rear_delt', 'Light, high-rep work for the rear delts and upper back that is easy to recover from and good for shoulder health.',
  'band_pull_apart', 'Band Pull-Apart', 'Shoulders', 'Resistance band', ['rearDelt'], ['upperBack', 'traps'], false,
  ['Hold a band at shoulder height with straight arms, hands shoulder-width apart.', 'Stand tall with your ribs down.',
   'Pull the band apart until it touches your chest.', 'Return slowly to the start.'],
  ['Straight arms', 'Slow return'], 'Arching the lower back to finish the rep.', { bw: true });
/* ---- biceps ---- */
RX('biceps_a', 'The cable keeps tension on the biceps at the bottom of the curl, where dumbbells go slack.',
  'cable_bar_curl', 'Cable Bar Curl', 'Biceps', 'Cable + straight or EZ bar (low)', ['biceps'], ['forearms'], false,
  ['Set the cable low and grip the bar shoulder-width, palms up.', 'Stand a step back so the cable pulls slightly forward.',
   'Curl the bar up without moving your elbows forward.', 'Lower until your arms are fully straight.'],
  ['Elbows pinned at your sides', 'Full stretch at the bottom'], 'Leaning back to swing the weight up.');
RX('biceps_b', 'With the arms raised, the biceps works hardest near full contraction — a useful contrast to stretch-focused curls.',
  'high_cable_curl', 'High Cable Curl (Double Arm)', 'Biceps', 'Dual cable station (high)', ['biceps'], [], false,
  ['Set both cables at shoulder height and stand in the middle holding a handle in each hand, arms out to the sides.', 'Keep your upper arms level with the floor.',
   'Curl the handles toward your ears.', 'Straighten your arms slowly.'],
  ['Upper arms stay still', 'Squeeze at the top'], 'Letting the elbows drop as you curl.');
RX('biceps_b', 'On the preacher pad the curl is hardest at the bottom, where the biceps is stretched; training at long muscle lengths is linked to more growth.',
  'machine_preacher_curl', 'Machine Preacher Curl', 'Biceps', 'Preacher curl machine', ['biceps'], ['forearms'], false,
  ['Set the seat so your armpits sit on the top of the pad.', 'Grip the handles with your arms nearly straight.',
   'Curl up until your forearms are almost vertical.', 'Lower slowly all the way to straight arms.'],
  ['Triceps stay on the pad', 'Control the bottom'], 'Stopping short of straight arms at the bottom.');
RX('biceps_b', 'Bracing the upper arm on your thigh removes momentum, so the biceps does all the work.',
  'concentration_curl', 'Seated Concentration Curl', 'Biceps', 'Dumbbell + bench', ['biceps'], [], false,
  ['Sit on a bench, lean forward and brace the back of your upper arm against your inner thigh.', 'Let the dumbbell hang with your arm straight.',
   'Curl the dumbbell toward your shoulder.', 'Lower slowly to a straight arm.'],
  ['Wrist straight', 'Lift with the biceps, not the shoulder'], 'Using the thigh to bounce the arm up.');
RX('biceps_b', 'An overhand grip shifts work to the brachialis and brachioradialis, which add thickness to the upper arm and forearm.',
  'reverse_ez_curl', 'Reverse-Grip EZ-Bar Curl', 'Biceps', 'EZ curl bar', ['biceps', 'forearms'], [], false,
  ['Hold an EZ bar with an overhand grip, hands shoulder-width.', 'Stand tall with elbows at your sides.',
   'Curl the bar up until your forearms are vertical.', 'Lower under control.'],
  ['Knuckles up', 'Wrists straight'], 'Letting the wrists bend back as the bar rises.');
/* ---- triceps ---- */
RX('triceps_a', 'Overhead extensions built noticeably more triceps than pushdowns in a 12-week study (Maeo et al., 2023) because the long head is stretched.',
  'katana_ext', 'Cross-Body Cable Extension (Katana)', 'Triceps', 'Single cable + D-handle (low)', ['triceps'], [], false,
  ['Set a cable low and hold the handle in one hand so it runs up behind your opposite shoulder.', 'Start with the elbow bent and the hand near the opposite shoulder blade.',
   'Extend the arm up and across until it is straight.', 'Lower slowly back behind the shoulder.'],
  ['Elbow points up and slightly out', 'Full stretch behind the head'], 'Letting the elbow drift down so the shoulder does the work.');
RX('triceps_a', 'Lying on an incline puts the long head of the triceps in a deeper stretch than a flat skull crusher.',
  'incline_skullcrusher', 'Incline EZ-Bar Skull Crusher', 'Triceps', 'EZ bar + incline bench', ['triceps'], [], false,
  ['Set a bench to about 30° and lie back holding an EZ bar over your head with straight arms.', 'Let your arms tilt slightly back toward your head.',
   'Bend your elbows and lower the bar behind your head.', 'Extend back up to straight arms.'],
  ['Elbows narrow', 'Upper arms stay still'], 'Flaring the elbows wide as the weight gets heavy.');
RX('triceps_b', 'A heavy compound press for the triceps; the Smith track makes it safe to push hard without a spotter.',
  'smith_close_grip_bench', 'Smith Machine Close-Grip Bench Press', 'Triceps', 'Smith machine + flat bench', ['triceps'], ['chest', 'frontDelt'], true,
  ['Lie under the bar with hands about shoulder-width apart.', 'Tuck your elbows close to your sides.',
   'Lower the bar to your lower chest.', 'Press up to straight arms.'],
  ['Elbows tucked', 'Wrists over elbows'], 'A grip so narrow that the wrists bend and hurt.');
RX('triceps_b', 'A dip machine loads all three triceps heads heavily with the shoulders supported and stable.',
  'machine_dip', 'Seated Dip Machine', 'Triceps', 'Seated dip machine', ['triceps'], ['chest', 'frontDelt'], true,
  ['Set the seat so the handles sit just below your shoulders.', 'Sit tall and grip the handles.',
   'Press the handles down until your arms are straight.', 'Let them rise slowly until your elbows are bent past 90°.'],
  ['Shoulders down', 'Elbows back, not out'], 'Letting the shoulders roll forward at the top of the range.');
RX('triceps_b', 'One arm at a time evens out a weaker side and lets you finish the pushdown behind the hip.',
  'single_arm_pushdown', 'Single-Arm Cable Pushdown', 'Triceps', 'Single cable + D-handle (high)', ['triceps'], [], false,
  ['Set a cable high and hold the handle with one hand, palm down or neutral.', 'Pin the elbow at your side.',
   'Push the handle down until your arm is straight and slightly behind your hip.', 'Return until the elbow is bent about 90°.'],
  ['Elbow stays pinned', 'Stand tall'], 'Leaning over the handle to use body weight.');
/* ---- quads ---- */
RX('quad_main', 'Keeps the torso upright and lets the knees travel well forward, loading the quads through a deep range.',
  'pendulum_squat', 'Pendulum Squat', 'Quads', 'Pendulum squat machine', ['quads'], ['glutes', 'adductors'], true,
  ['Set your shoulders under the pads and feet mid-platform, shoulder-width.', 'Release the safety and brace.',
   'Squat down as deep as you can while your heels stay down.', 'Drive back up without locking the knees hard.'],
  ['Knees track over the toes', 'Control the bottom'], 'Cutting depth short once the weight gets heavy.');
RX('quad_main', 'Loads the legs without loading the spine, so the quads can be trained hard with little lower-back fatigue.',
  'belt_squat', 'Belt Squat', 'Quads', 'Belt squat machine (or loading pin + belt)', ['quads'], ['glutes', 'adductors'], true,
  ['Attach the belt around your hips and stand on the platform, feet shoulder-width.', 'Hold the handles lightly for balance.',
   'Squat straight down until your thighs are at least parallel.', 'Stand back up by driving through the whole foot.'],
  ['Chest tall', 'Knees out over the toes'], 'Leaning forward and turning it into a hinge.');
RX('quad_iso', 'Trains the quads — including the rectus femoris — in a stretched position with the hips extended.',
  'sissy_squat', 'Assisted Sissy Squat', 'Quads', 'Sissy squat bench or a post to hold', ['quads'], [], false,
  ['Hold a post or use a sissy squat bench with your heels secured.', 'Keep your hips and torso in a straight line.',
   'Lean back as your knees travel forward and down.', 'Come back up by straightening the knees, hips staying extended.'],
  ['Hips stay forward', 'Go only as deep as you can control'], 'Bending at the hips, which turns it into a regular squat.', { bw: true });
RX('quad_iso', 'Loads the quads at long lengths using only body weight; build the range gradually.',
  'reverse_nordic', 'Reverse Nordic', 'Quads', 'Mat (anchor under a bench optional)', ['quads'], [], false,
  ['Kneel on a pad with your body upright, feet tucked under something if you like.', 'Keep a straight line from knees to shoulders.',
   'Lean back slowly as far as you can control.', 'Pull yourself back up with the quads.'],
  ['Squeeze the glutes', 'Small range first'], 'Arching the lower back to fake the range.', { bw: true });
RX('quad_uni', 'Raising the front foot increases hip and knee range; deeper squatting built more glute and adductor muscle than half squats (Kubo et al., 2019).',
  'ffe_split_squat', 'Front-Foot-Elevated Split Squat', 'Quads', 'Dumbbells + low step or plate', ['quads', 'glutes'], ['adductors'], true,
  ['Stand in a long split stance with your front foot on a 2–4 in step.', 'Hold dumbbells at your sides.',
   'Lower until your back knee nearly touches the floor.', 'Drive up through the front foot.'],
  ['Front knee travels forward', 'Torso upright'], 'A stance so short that the front heel lifts.');
RX('quad_uni', 'A long stride works the quads and glutes one leg at a time, fixing side-to-side differences.',
  'db_walking_lunge', 'Dumbbell Walking Lunge', 'Quads', 'Dumbbells + open floor', ['quads', 'glutes'], ['adductors', 'hamstrings'], true,
  ['Hold dumbbells at your sides and stand tall.', 'Take a long step forward.',
   'Lower until your back knee nearly touches the floor.', 'Push through the front foot and step straight into the next rep.'],
  ['Long steps', 'Upright torso'], 'Short, choppy steps that turn it into a knee-only movement.');
/* ---- hamstrings ---- */
RX('ham_curl', 'One of the best-supported exercises for hamstring strength and for cutting the risk of hamstring strains.',
  'nordic_curl', 'Nordic Hamstring Curl', 'Hamstrings', 'Anchor for the heels (partner, pad or machine)', ['hamstrings'], ['glutes', 'calves'], false,
  ['Kneel with your heels anchored and your body upright.', 'Keep a straight line from knees to shoulders.',
   'Lower forward as slowly as you can, resisting with the hamstrings.', 'Catch yourself with your hands and push back up to the start.'],
  ['Hips stay extended', 'Fight the descent'], 'Bending at the hips to shorten the lever.', { bw: true });
RX('ham_curl', 'Seated leg curls grew the hamstrings more than lying curls because the hip is bent and the muscle stretched (Maeo et al., 2021).',
  'single_leg_seated_curl', 'Single-Leg Seated Leg Curl', 'Hamstrings', 'Seated leg curl machine', ['hamstrings'], ['calves'], false,
  ['Set the machine as for a normal seated curl, then work one leg at a time.', 'Lean your torso slightly forward to increase the stretch.',
   'Curl the pad down and back as far as you can.', 'Return slowly to a straight knee.'],
  ['Lean forward a little', 'Full stretch every rep'], 'Lifting the hips off the seat.');
RX('ham_hinge', 'Loads the hamstrings at long lengths through the hip and is easy to progress in small steps.',
  'barbell_rdl', 'Barbell Romanian Deadlift', 'Hamstrings', 'Barbell', ['hamstrings', 'glutes'], ['lowerBack', 'forearms'], true,
  ['Stand holding a barbell at your hips, feet hip-width.', 'Soften your knees and push your hips back.',
   'Slide the bar down your thighs until you feel a strong hamstring stretch.', 'Drive your hips forward to stand up.'],
  ['Bar stays against your legs', 'Flat back'], 'Rounding the lower back to reach the floor.');
RX('ham_hinge', 'A deep hip hinge on a fixed bar path, giving a big hamstring stretch with less balance demand.',
  'smith_good_morning', 'Smith Machine Good Morning', 'Hamstrings', 'Smith machine', ['hamstrings', 'glutes'], ['lowerBack'], true,
  ['Set the bar on your upper back as for a squat.', 'Soften your knees.',
   'Push your hips back and lower your chest toward parallel.', 'Drive the hips forward to stand up.'],
  ['Brace hard', 'Hips back, not down'], 'Squatting down instead of hinging.');
RX('ham_hinge', 'A one-leg hinge trains the hamstrings and glutes with lighter loads and builds balance.',
  'single_leg_rdl', 'Single-Leg Dumbbell RDL', 'Hamstrings', 'Dumbbell(s)', ['hamstrings', 'glutes'], ['lowerBack', 'adductors'], true,
  ['Stand on one leg holding a dumbbell in the opposite hand.', 'Soften the standing knee.',
   'Hinge forward as the free leg reaches back, until you feel a hamstring stretch.', 'Return to standing.'],
  ['Hips level', 'Reach back with the heel'], 'Opening the hips toward the ceiling.');
/* ---- glutes ---- */
RX('glute', 'Shifts most of the load onto one leg while staying stable; hip thrusts built as much glute muscle as squats (Plotkin et al., 2023).',
  'b_stance_hip_thrust', 'B-Stance Hip Thrust', 'Glutes', 'Barbell or dumbbell + bench', ['glutes'], ['hamstrings'], true,
  ['Set up as for a hip thrust, then move one foot forward so only its heel touches the floor.', 'Most of the weight goes through the back (working) leg.',
   'Drive your hips up until your body is level from knees to shoulders.', 'Lower under control.'],
  ['Chin tucked', 'Pause at the top'], 'Pushing through the front foot and turning it into a two-leg thrust.');
RX('glute', 'Hip abduction targets the upper glutes (medius and minimus), which squats and thrusts train less.',
  'cable_hip_abduction', 'Standing Cable Hip Abduction', 'Glutes', 'Cable + ankle strap', ['glutes'], [], false,
  ['Attach an ankle strap and stand side-on to a low cable, strap on the far leg.', 'Hold the machine for balance.',
   'Sweep the leg out to the side as far as you can without leaning.', 'Return slowly past the standing leg.'],
  ['Toes forward', 'Torso upright'], 'Leaning the torso the other way to lift the leg higher.');
RX('glute', 'Isolates hip extension so the glutes work without the quads or lower back limiting the set.',
  'machine_glute_kickback', 'Machine Glute Kickback', 'Glutes', 'Glute kickback machine', ['glutes'], ['hamstrings'], false,
  ['Set up on the machine with your chest on the pad and one foot on the platform.', 'Brace your abs.',
   'Push the platform back and up until your hip is fully extended.', 'Return slowly until the hip is bent.'],
  ['Squeeze the glute at the top', 'No lower-back arch'], 'Arching the lower back to push the platform further.');
RX('glute', 'Standing on a plate increases hip flexion; deeper ranges built more glute muscle than shallow ones (Kubo et al., 2019).',
  'deficit_reverse_lunge', 'Deficit Reverse Lunge', 'Glutes', 'Dumbbells + low step or plate', ['glutes', 'quads'], ['adductors', 'hamstrings'], true,
  ['Stand on a 2–4 in step holding dumbbells.', 'Step one foot back off the step.',
   'Lower until your back knee nearly touches the floor, leaning slightly forward.', 'Drive through the front heel to return.'],
  ['Slight forward lean', 'Push through the heel'], 'Staying bolt upright so the quads do all the work.');
RX('glute', 'Rounding the upper back and turning the feet out shifts a back extension onto the glutes.',
  'glute_back_extension', '45° Back Extension (Glute Bias)', 'Glutes', '45° hyperextension bench', ['glutes'], ['hamstrings', 'lowerBack'], false,
  ['Set the pad just below your hip crease; turn your feet out slightly.', 'Round your upper back and tuck your chin.',
   'Lower your torso down.', 'Raise up by squeezing the glutes until your body is straight — no further.'],
  ['Push the hips into the pad', 'Stop at straight'], 'Over-extending the lower back at the top.');
/* ---- calves ---- */
RX('calves', 'Calves grew more when trained in the stretched part of the range (Kassiano et al., 2023), so pause at the bottom.',
  'smith_calf_raise', 'Smith Machine Calf Raise', 'Calves', 'Smith machine + step or plate', ['calves'], [], false,
  ['Stand with the balls of your feet on a step under the bar, bar on your upper back.', 'Keep your knees straight but not locked.',
   'Lower your heels as far as you can and pause for a second.', 'Rise onto your toes as high as you can.'],
  ['Pause in the stretch', 'Full height at the top'], 'Bouncing out of the bottom.');
RX('calves', 'One leg at a time on a step gives a full stretch with almost no equipment.',
  'single_leg_calf_raise', 'Single-Leg Dumbbell Calf Raise', 'Calves', 'Dumbbell + step', ['calves'], [], false,
  ['Stand on one foot on a step holding a dumbbell on the same side; hold something with the other hand.', 'Let the heel drop below the step.',
   'Pause in the stretch, then rise as high as you can.', 'Lower slowly.'],
  ['Slow down, pause, drive up', 'Straight knee'], 'Rushing reps with a half range.');
RX('calves', 'With the hips bent, the calf is loaded through a long stretch, which favours growth.',
  'donkey_calf_raise', 'Donkey Calf Raise', 'Calves', 'Donkey calf machine (or Smith + bench)', ['calves'], [], false,
  ['Set up bent forward at the hips with the pad on your lower back, balls of your feet on the platform.', 'Keep your knees nearly straight.',
   'Lower your heels into a deep stretch and pause.', 'Rise onto your toes as high as you can.'],
  ['Hips stay bent', 'Pause at the bottom'], 'Bending the knees to bounce the weight.');
RX('calves', 'A heavy, stable standing calf raise on a machine most gyms already have.',
  'hack_calf_raise', 'Hack Squat Calf Raise', 'Calves', 'Hack squat machine', ['calves'], [], false,
  ['Face into the hack squat with the balls of your feet on the bottom edge of the platform.', 'Keep your knees slightly bent and locked in place.',
   'Lower your heels as far as they go and pause.', 'Push up onto your toes.'],
  ['Knees still', 'Full stretch'], 'Letting the knees bend and straighten to move the weight.');
RX('calves', 'Bent knees shift the work to the soleus, the larger of the two calf muscles.',
  'seated_db_calf_raise', 'Seated Dumbbell Calf Raise', 'Calves', 'Dumbbells + bench + step', ['calves'], [], false,
  ['Sit with the balls of your feet on a step and dumbbells resting on your knees.', 'Let your heels drop as low as they go.',
   'Pause, then rise onto your toes as high as you can.', 'Lower slowly.'],
  ['Slow and full range', 'Pause at the bottom'], 'Using a range of a couple of inches.');
/* ---- core ---- */
RX('core', 'Anti-rotation work trains the obliques and deep core to resist twisting without any spinal flexion.',
  'pallof_press', 'Pallof Press', 'Core', 'Cable + D-handle (chest height)', ['obliques', 'abs'], [], false,
  ['Stand side-on to a cable at chest height, holding the handle at your chest with both hands.', 'Step away until the cable pulls.',
   'Press the handle straight out in front of you and hold for 2 seconds.', 'Bring it back to your chest.'],
  ['Hips and shoulders square', 'Breathe out as you press'], 'Letting the cable rotate your torso.');
RX('core', 'A low-load anti-extension drill that teaches bracing and is easy on the lower back.',
  'dead_bug', 'Dead Bug', 'Core', 'Mat', ['abs'], ['obliques'], false,
  ['Lie on your back with arms straight up and hips and knees at 90°.', 'Press your lower back into the floor.',
   'Slowly lower one arm and the opposite leg toward the floor.', 'Return and switch sides.'],
  ['Lower back stays down', 'Slow and controlled'], 'Letting the lower back arch off the floor.', { bw: true });
RX('core', 'A harder step up from knee raises; straight legs load the abs and hip flexors more.',
  'hanging_leg_raise', 'Hanging Leg Raise', 'Core', 'Pull-up bar or captain’s chair', ['abs'], ['obliques'], false,
  ['Hang from a bar or support yourself in a captain’s chair.', 'Brace and keep your legs straight.',
   'Raise your legs until they are at least parallel to the floor, curling the pelvis up.', 'Lower slowly without swinging.'],
  ['Curl the pelvis', 'No swinging'], 'Swinging the legs up with momentum.', { bw: true });
RX('core', 'Loaded spinal flexion through a long range that can be progressed with a plate like any other lift.',
  'weighted_decline_situp', 'Weighted Decline Sit-Up', 'Core', 'Decline bench + plate', ['abs'], ['obliques'], false,
  ['Hook your feet on a decline bench and hold a plate on your chest.', 'Lower back until your torso is just short of the bench.',
   'Curl up, rounding your spine, until you are upright.', 'Lower slowly.'],
  ['Curl, don’t hinge', 'Control the way down'], 'Yanking up with the hip flexors and a flat back.', { bw: true });
RX('core', 'Trains rotation through the obliques with a load you can adjust in small steps.',
  'cable_woodchop', 'Cable Woodchop', 'Core', 'Cable + D-handle or rope', ['obliques'], ['abs'], false,
  ['Set a cable high and stand side-on, holding the handle with both hands.', 'Feet wide, knees soft.',
   'Pull the handle down and across your body to the opposite hip, rotating through the torso.', 'Return under control.'],
  ['Rotate from the ribs', 'Arms stay long'], 'Pulling with the arms instead of rotating.');
RX('core', 'An ab machine is easy to load progressively, so the abs can be trained in rep ranges like any other muscle.',
  'machine_crunch', 'Machine Crunch', 'Core', 'Ab crunch machine', ['abs'], ['obliques'], false,
  ['Set the seat so the pads sit on your chest or shoulders.', 'Hold the handles and brace.',
   'Crunch forward, curling your ribs toward your hips.', 'Return slowly until the abs are stretched.'],
  ['Round the spine', 'Exhale as you crunch'], 'Pulling with the arms to move the stack.');
// switched-on extras join the rotation for their slot

/* ---- filling the gaps: traps, erectors, adductors, forearms and obliques had no direct work,
        the three barbell staples were missing, and two slots had nothing a home gym could do ---- */

RX('back_row', 'The traps had no direct loading anywhere in the library — face pulls and Y-raises only reach them as helpers. A heavy shrug is the simplest fix, and the upper traps respond well to it.',
  'db_shrug', 'Dumbbell Shrug', 'Back', 'Dumbbells', ['traps'], ['upperBack', 'forearms'], false,
  ['Stand tall with a dumbbell in each hand, arms straight at your sides.',
   'Shrug straight up, as if trying to touch your shoulders to your ears. No rolling.',
   'Hold the top for a full second.',
   'Lower under control until you feel the weight pull the shoulders down.'],
  ['Straight up and down, never in a circle', 'Pause hard at the top'],
  'Bending the elbows, which turns it into a short upright row.');

RX('back_row', 'A bar lets you load the traps far heavier than dumbbells allow, and the straps-optional grip makes it a forearm builder too.',
  'barbell_shrug', 'Barbell Shrug', 'Back', 'Barbell (or Smith machine)', ['traps'], ['upperBack', 'forearms'], false,
  ['Hold the bar at arm’s length in front of your thighs, hands just outside your hips.',
   'Brace your core and shrug the bar straight up.',
   'Squeeze at the top for a second, then lower slowly.'],
  ['Chin tucked, neck neutral', 'Let the bar travel up your thighs, close to the body'],
  'Leaning back to heave the weight up.');

RX('ham_hinge', 'The 45° extensions in the library are set up for the hamstrings and glutes, so the spinal erectors were never a primary target. Rounding and re-extending under light load trains them directly.',
  'back_ext_erector', '45° Back Extension (Erector Bias)', 'Hamstrings', '45° hyperextension bench', ['lowerBack'], ['glutes', 'hamstrings'], false,
  ['Set the pad just below your hip bones so your hips can move freely.',
   'Start with your torso hanging down and your back gently rounded.',
   'Roll up one vertebra at a time until your body is straight. Do not arch past straight.',
   'Lower slowly and let the back round again at the bottom.'],
  ['Light weight, slow tempo', 'Chin tucked the whole way'],
  'Yanking up into a big arch at the top, which loads the joints instead of the muscle.');

RX('glute', 'Both hip machines already in the library are abduction. Adduction was the one hip action with nothing training it, and the adductors are a large part of inner-thigh size.',
  'machine_hip_adduction', 'Seated Hip Adduction', 'Glutes', 'Hip adduction machine', ['adductors'], ['glutes'], false,
  ['Sit with the pads on the inside of your knees and your feet flat on the rests.',
   'Let the pads open until you feel a stretch through your inner thighs.',
   'Squeeze your knees together, pause for a second at the finish.',
   'Open back up slowly rather than letting the stack pull you apart.'],
  ['Sit tall, back against the pad', 'Control the stretch, that is where the growth is'],
  'Slamming the knees together and letting them fly open on the way back.');

RX('quad_uni', 'A loaded lateral squat trains the adductors through a long range and doubles as hip mobility work, which the plan had nothing else covering.',
  'cossack_squat', 'Cossack Squat', 'Quads', 'Bodyweight or a light dumbbell/kettlebell', ['adductors'], ['quads', 'glutes'], true,
  ['Stand wide, toes turned slightly out. Hold a weight at your chest for balance if you have one.',
   'Shift your weight onto one leg and sit down into that hip, keeping the other leg straight.',
   'Let the straight leg’s toes point up as you descend.',
   'Push back up to the middle and repeat on the other side.'],
  ['Heel of the working leg stays down', 'Chest up, do not fold forward'],
  'Rushing down and bouncing out of the bottom.');

RX('biceps_b', 'Grip is what fails first on rows and RDLs for most people, and the forearms had almost no direct work in the library.',
  'wrist_curl', 'Seated Wrist Curl & Extension', 'Biceps', 'Dumbbells or EZ bar + bench', ['forearms'], [], false,
  ['Sit and rest your forearms on your thighs, palms up, wrists just past your knees.',
   'Let the weight roll down to your fingertips, then curl it back up as far as it goes.',
   'Do the set, then flip to palms down and do the same number of reps lifting the back of the hand.'],
  ['Forearms stay flat on the thighs', 'Full range, including the finger roll'],
  'Using the elbows to help, which takes the forearms out of it.');

RX('core', 'A one-sided carry is the cleanest oblique exercise there is: they work to stop you bending sideways. It trains grip and traps at the same time.',
  'suitcase_carry', 'Suitcase Carry', 'Core', 'One heavy dumbbell or kettlebell', ['obliques'], ['forearms', 'traps', 'abs'], true,
  ['Pick up one heavy weight in one hand, nothing in the other.',
   'Stand tall, shoulders level, and walk in a straight line for 30 to 40 seconds.',
   'Swap hands and repeat for the same distance.'],
  ['Do not lean away from the weight', 'Shoulders square, ribs down'],
  'Letting the loaded side sag, which turns off the muscles you are there to train.');

RX('chest_press', 'The bench press was missing from a library that already includes barbell RDLs. It is the lift most people want to test and compare, and the one with the most useful strength carryover.',
  'barbell_bench', 'Barbell Bench Press', 'Chest', 'Barbell + flat bench + rack', ['chest'], ['frontDelt', 'triceps'], true,
  ['Lie back with your eyes under the bar. Pull your shoulder blades back and down and keep them there.',
   'Grip a little wider than shoulder width. Unrack and bring the bar over your lower chest.',
   'Lower under control until the bar touches your chest, elbows about 45° from your torso.',
   'Press back up and slightly toward your face.'],
  ['Feet planted, upper back tight', 'Use a spotter or safety pins near failure'],
  'Bouncing the bar off the chest and flaring the elbows straight out to the sides.');

RX('quad_main', 'Every option in this slot needed a machine, so a home gym could not fill it at all. The back squat also gives the plan a barbell lift worth testing in PR week.',
  'barbell_back_squat', 'Barbell Back Squat', 'Quads', 'Barbell + squat rack', ['quads'], ['glutes', 'hamstrings', 'lowerBack'], true,
  ['Set the bar on your upper back, not your neck. Step out with feet about shoulder width, toes slightly out.',
   'Take a big breath and brace your core hard.',
   'Sit down and back, knees tracking over your toes, until your hip crease passes your knee.',
   'Drive up through the whole foot, keeping your chest where it started.'],
  ['Set the safety pins at depth before you start', 'Same bar path down and up'],
  'Letting the hips shoot up first, which turns it into a good morning.');

RX('quad_main', 'A front-loaded squat keeps the torso upright and puts more of the work on the quads, and it needs nothing but dumbbells.',
  'db_front_squat', 'Dumbbell Front Squat', 'Quads', 'Dumbbells', ['quads'], ['glutes', 'abs'], true,
  ['Hold a dumbbell on each shoulder, elbows pointing forward.',
   'Feet about shoulder width, toes slightly out.',
   'Sit straight down, keeping your torso as upright as you can, until your thighs pass parallel.',
   'Drive back up without letting the elbows drop.'],
  ['Elbows high the whole set', 'Heels flat, weight through the mid-foot'],
  'Letting the chest fall forward, which shifts the work to the hips.');

RX('ham_hinge', 'The plan had no deadlift at all. A trap bar keeps the load closer to the body and is far easier on the lower back than a straight bar, which suits a general program.',
  'trap_bar_deadlift', 'Trap-Bar Deadlift', 'Hamstrings', 'Trap bar (or barbell)', ['hamstrings'], ['glutes', 'quads', 'lowerBack', 'traps', 'forearms'], true,
  ['Stand in the middle of the bar, feet about hip width.',
   'Push your hips back and take the handles with straight arms, chest up and back flat.',
   'Take the slack out of the bar, then push the floor away and stand up tall.',
   'Lower by pushing your hips back first, letting the bar travel close to your legs.'],
  ['Back stays flat from start to finish', 'Reset your brace between reps'],
  'Jerking the bar off the floor with a rounded back.');

RX('delt_press', 'A standing press is the fourth barbell lift worth testing, and it loads the core and upper back in a way the seated machine versions do not.',
  'standing_ohp', 'Standing Barbell Overhead Press', 'Shoulders', 'Barbell + rack', ['frontDelt'], ['sideDelt', 'triceps', 'abs', 'upperBack'], true,
  ['Take the bar at collarbone height, hands just outside your shoulders, elbows slightly in front of the bar.',
   'Squeeze your glutes and brace hard so your ribs stay down.',
   'Press the bar straight up, moving your head back out of the way, then back under at the top.',
   'Finish with the bar over the middle of your feet, arms locked. Lower under control.'],
  ['No leg drive, this is a strict press', 'Glutes and abs tight, no leaning back'],
  'Arching the lower back to get the bar up, which turns it into a standing incline press.');

RX('triceps_b', 'Every other option in this slot needed a cable or a machine, so a home gym could not train this pattern at all.',
  'bench_dip', 'Bench Dip', 'Triceps', 'Bench (add a plate on the lap to load it)', ['triceps'], ['frontDelt', 'chest'], true,
  ['Sit on the edge of a bench, hands next to your hips, and slide your weight forward off the edge.',
   'Put your heels on the floor, legs straight, or on a second bench to make it harder.',
   'Lower until your upper arms are about parallel with the floor.',
   'Press back up to just short of lockout.'],
  ['Keep your back close to the bench', 'Elbows point straight back, not out'],
  'Dropping so deep that the shoulders roll forward under load.');

RX('back_iso', 'The lat isolation slot had only four options, the fewest in the plan, so it repeated every four weeks. An incline pullover also gives the lats a longer stretch than the flat version.',
  'incline_db_pullover', 'Incline Dumbbell Pullover', 'Back', 'Dumbbell + incline bench', ['lats'], ['chest', 'triceps'], false,
  ['Set the bench to about 45° and lie back against it holding one dumbbell over your chest with both hands.',
   'Keep a slight bend in the elbows and reach the weight back over your head.',
   'Go until you feel a strong stretch down the sides of your back.',
   'Pull it back over your chest using your lats, not your arms.'],
  ['Ribs down, do not let the back arch', 'Think about pulling with the armpits'],
  'Bending and straightening the elbows, which makes it a triceps exercise.');

RX('biceps_a', 'The biceps A slot also had only four options. A straight bar puts the wrists in more supination than an EZ bar, which the biceps are partly responsible for.',
  'barbell_curl', 'Straight-Bar Barbell Curl', 'Biceps', 'Barbell', ['biceps'], ['forearms'], false,
  ['Hold the bar at shoulder width, palms fully up, arms hanging straight.',
   'Curl up without letting your elbows drift forward.',
   'Squeeze at the top, then lower over about three seconds until the arms are straight.'],
  ['Elbows pinned at your sides', 'Full stretch at the bottom every rep'],
  'Swinging the hips to start the rep.');
EXTRA_EX.forEach(id => { const s = SLOTS[EX[id].slot]; if (s && !s.vars.includes(id)) s.vars.push(id); });


/* ============================================================
   SESSION TEMPLATES
   row: [slot, type(S=strength,H=hypertrophy,T=test), sets, reps, restSec, variationOffset, note]
   ============================================================ */
const TEMPLATES = {
  P1A: { name: 'Upper A — Strength', short: 'Upper A · Strength', kind: 'upper', phase: 1, icon: 'upper',
    focus: 'Chest & back with a strength bias, plus arms and side delts.',
    rows: [
      ['chest_press', 'S', 4, '5–7', 150, 0],
      ['back_row', 'S', 4, '6–8', 150, 0],
      ['back_vertical', 'H', 3, '8–10', 120, 0],
      ['chest_fly', 'H', 3, '10–15', 90, 0],
      ['side_delt', 'H', 3, '12–15', 60, 0],
      ['triceps_b', 'H', 3, '10–12', 60, 0],
      ['biceps_a', 'H', 3, '10–12', 60, 0]] },
  P1B: { name: 'Delts & Arms + Legs Intro', short: 'Delts/Arms + Legs', kind: 'mixed', phase: 1, icon: 'mixed',
    focus: 'Overhead strength, rear delts and arms. Legs trained lightly (1×/week) this month.',
    rows: [
      ['delt_press', 'S', 4, '6–8', 150, 0],
      ['quad_main', 'H', 3, '10–12', 120, 0],
      ['ham_curl', 'H', 3, '10–12', 90, 0],
      ['rear_delt', 'H', 3, '12–15', 60, 0],
      ['biceps_b', 'H', 3, '8–12', 60, 0],
      ['triceps_a', 'H', 3, '8–12', 60, 0],
      ['calves', 'H', 3, '12–15', 60, 0]] },
  P1C: { name: 'Upper B — Hypertrophy', short: 'Upper B · Hypertrophy', kind: 'upper', phase: 1, icon: 'upper',
    focus: 'Higher-rep chest, back and delt work using a different variation from Monday.',
    rows: [
      ['back_vertical', 'H', 3, '8–12', 120, 1],
      ['chest_press', 'H', 3, '8–12', 120, 1],
      ['back_row', 'H', 3, '10–12', 90, 1],
      ['chest_fly', 'H', 3, '12–15', 75, 1],
      ['side_delt', 'H', 3, '15–20', 60, 1],
      ['back_iso', 'H', 3, '12–15', 60, 0],
      ['core', 'H', 3, '10–15', 60, 0]] },

  P2A: { name: 'Upper — Strength', short: 'Upper · Strength', kind: 'upper', phase: 2, icon: 'upper',
    focus: 'Heavy chest press and vertical pull, then hypertrophy work for back, delts and arms.',
    rows: [
      ['chest_press', 'S', 4, '5–7', 150, 0],
      ['back_vertical', 'S', 4, '6–8', 150, 0],
      ['back_row', 'H', 3, '8–12', 90, 0],
      ['delt_press', 'H', 3, '8–10', 90, 0],
      ['side_delt', 'H', 3, '12–15', 60, 0],
      ['biceps_a', 'H', 3, '8–12', 60, 0],
      ['triceps_a', 'H', 3, '8–12', 60, 0]] },
  P2B: { name: 'Lower — Strength', short: 'Lower · Strength', kind: 'lower', phase: 2, icon: 'lower',
    focus: 'Legs return to normal frequency: heavy quad and hinge work, single-leg, glutes, calves.',
    rows: [
      ['quad_main', 'S', 4, '6–8', 180, 0],
      ['ham_hinge', 'S', 3, '6–8', 150, 0],
      ['quad_uni', 'H', 3, '8–10 / leg', 90, 0],
      ['ham_curl', 'H', 3, '10–12', 75, 0],
      ['glute', 'H', 3, '10–15', 75, 0],
      ['calves', 'H', 4, '10–15', 60, 0],
      ['core', 'H', 3, '10–15', 60, 0]] },
  P2C: { name: 'Full Body — Hypertrophy', short: 'Full Body · Pump', kind: 'full', phase: 2, icon: 'full',
    focus: 'Second leg day of the week plus upper-body volume. Arms finish as a superset.',
    rows: [
      ['quad_iso', 'H', 3, '12–15', 75, 0],
      ['chest_press', 'H', 3, '8–12', 120, 1],
      ['back_row', 'H', 3, '10–12', 90, 1],
      ['ham_curl', 'H', 3, '12–15', 75, 1],
      ['chest_fly', 'H', 3, '12–15', 60, 0],
      ['rear_delt', 'H', 3, '15–20', 60, 0],
      ['biceps_b', 'H', 3, '10–15', 45, 0, 'Superset A — alternate with triceps'],
      ['triceps_b', 'H', 3, '10–15', 45, 0, 'Superset A — alternate with biceps']] },

  P3A: { name: 'Upper — Heavy', short: 'Upper · Heavy', kind: 'upper', phase: 3, icon: 'upper',
    focus: 'Lower reps on the main presses/rows; intensity techniques on the final isolation sets.',
    rows: [
      ['chest_press', 'S', 5, '4–6', 180, 0],
      ['back_row', 'S', 4, '5–7', 150, 0],
      ['back_vertical', 'H', 3, '8–10', 120, 0],
      ['chest_fly', 'H', 3, '12–15', 75, 0, 'Last set: drop set (−25%, go to 1 RIR)'],
      ['side_delt', 'H', 4, '12–15', 60, 0, 'Last set: myo-reps (rest 5 breaths, 3–5 more reps ×3)'],
      ['triceps_b', 'H', 3, '10–12', 60, 0],
      ['biceps_a', 'H', 3, '10–12', 60, 0]] },
  P3B: { name: 'Lower — Heavy', short: 'Lower · Heavy', kind: 'lower', phase: 3, icon: 'lower',
    focus: 'Heaviest leg work of the program; keep 1–2 reps in reserve on the big movements.',
    rows: [
      ['quad_main', 'S', 4, '5–7', 180, 0],
      ['ham_hinge', 'S', 4, '6–8', 150, 0],
      ['quad_uni', 'H', 3, '8–10 / leg', 90, 0],
      ['ham_curl', 'H', 3, '8–12', 75, 0, 'Last set: drop set'],
      ['glute', 'H', 3, '10–12', 75, 0],
      ['calves', 'H', 4, '8–12', 60, 0]] },
  P3C: { name: 'Full Body — Pump', short: 'Full Body · Pump', kind: 'full', phase: 3, icon: 'full',
    focus: 'Moderate loads, short rests, lots of quality volume. Different variations from earlier in the week.',
    rows: [
      ['delt_press', 'H', 3, '8–12', 90, 1],
      ['quad_iso', 'H', 3, '12–15', 75, 1],
      ['chest_press', 'H', 3, '10–12', 90, 2],
      ['back_vertical', 'H', 3, '10–12', 90, 2],
      ['rear_delt', 'H', 3, '15–20', 60, 1],
      ['biceps_b', 'H', 3, '10–12', 45, 1, 'Superset A — alternate with triceps'],
      ['triceps_a', 'H', 3, '10–12', 45, 1, 'Superset A — alternate with biceps'],
      ['core', 'H', 3, '10–15', 60, 1]] },

  DL: { name: 'Deload — Full Body', short: 'Deload', kind: 'deload', phase: 4, icon: 'deload',
    focus: 'Half the sets at ~60% of your recent working weights. Recover before PR testing.',
    rows: [
      ['chest_press', 'H', 2, '8–10', 90, 0, '~60% of normal load'],
      ['back_row', 'H', 2, '8–10', 90, 0, '~60% of normal load'],
      ['quad_main', 'H', 2, '10', 90, 0, '~60% of normal load'],
      ['ham_curl', 'H', 2, '10–12', 60, 0],
      ['side_delt', 'H', 2, '12–15', 60, 0],
      ['biceps_a', 'H', 2, '12', 45, 0],
      ['triceps_b', 'H', 2, '12', 45, 0]] },
  T1: { name: 'PR Test — Upper', short: 'PR Test · Upper', kind: 'test', phase: 4, icon: 'test',
    focus: 'Warm up in 3–4 ramping sets, then one all-out-but-clean top set. Compare to Week 1.',
    rows: [
      ['chest_press', 'T', 1, '3–5 RM', 240, 0, 'Ramp: 50% ×8, 70% ×5, 85% ×2, then top set'],
      ['back_row', 'T', 1, '3–5 RM', 240, 0],
      ['back_vertical', 'T', 1, '5–8 RM', 180, 0],
      ['delt_press', 'T', 1, '5–8 RM', 180, 0],
      ['biceps_a', 'T', 1, '8 RM', 120, 0],
      ['triceps_b', 'T', 1, '8 RM', 120, 0]] },
  T2: { name: 'PR Test — Lower', short: 'PR Test · Lower', kind: 'test', phase: 4, icon: 'test',
    focus: 'Top sets on the main leg movements. Stop the set when form breaks — that’s your RM.',
    rows: [
      ['quad_main', 'T', 1, '3–5 RM', 240, 0, 'Ramp: 50% ×8, 70% ×5, 85% ×2, then top set'],
      ['ham_hinge', 'T', 1, '5–8 RM', 180, 0],
      ['ham_curl', 'T', 1, '8 RM', 120, 0],
      ['glute', 'T', 1, '8 RM', 120, 0],
      ['calves', 'T', 1, '10 RM', 90, 0],
      ['core', 'H', 2, '10–15', 60, 0]] }
};

/* ---------- continuation templates (Volume phase, Cycle 2+) ---------- */
Object.assign(TEMPLATES, {
  P5A: { name: 'Upper — Volume', short: 'Upper · Volume', kind: 'upper', phase: 5, icon: 'upper',
    focus: 'Higher reps and shorter rests for chest, back and delts. Arms finish as a superset.',
    rows: [
      ['chest_press', 'H', 3, '10–12', 90, 1],
      ['back_vertical', 'H', 4, '10–12', 90, 1],
      ['chest_fly', 'H', 3, '12–15', 60, 2],
      ['back_row', 'H', 3, '12–15', 75, 2],
      ['side_delt', 'H', 4, '15–20', 45, 2, 'Last set: drop set'],
      ['rear_delt', 'H', 3, '15–20', 45, 2],
      ['triceps_a', 'H', 3, '12–15', 45, 0, 'Superset A — alternate with biceps'],
      ['biceps_a', 'H', 3, '12–15', 45, 0, 'Superset A — alternate with triceps']] },
  P5B: { name: 'Lower — Volume', short: 'Lower · Volume', kind: 'lower', phase: 5, icon: 'lower',
    focus: 'Quads pre-exhausted with extensions, then moderate-load pressing, curls, glutes and calves for reps.',
    rows: [
      ['quad_iso', 'H', 3, '15–20', 60, 1, 'Pre-exhaust — controlled 3 s lowering'],
      ['quad_main', 'H', 3, '10–15', 120, 1],
      ['ham_curl', 'H', 4, '10–15', 75, 2],
      ['quad_uni', 'H', 3, '10–12 / leg', 75, 1],
      ['glute', 'H', 3, '12–15', 60, 1],
      ['calves', 'H', 4, '12–20', 45, 1],
      ['core', 'H', 3, '12–15', 45, 2]] },
  P5C: { name: 'Delts & Arms + Full Body', short: 'Delts/Arms · Volume', kind: 'mixed', phase: 5, icon: 'mixed',
    focus: 'A specialization day for shoulders and arms, with a hinge and a press to keep the whole body trained.',
    rows: [
      ['delt_press', 'H', 3, '10–12', 90, 2],
      ['ham_hinge', 'H', 3, '10–12', 90, 1],
      ['chest_press', 'H', 3, '10–12', 90, 0],
      ['back_iso', 'H', 3, '12–15', 60, 1],
      ['side_delt', 'H', 3, '15–20', 45, 0],
      ['biceps_b', 'H', 3, '10–12', 45, 2, 'Superset B — alternate with triceps'],
      ['triceps_b', 'H', 3, '10–12', 45, 2, 'Superset B — alternate with biceps']] }
});

/* ---------- legacy (mixed upper/full-body) templates stay defined so old logged days still render ---------- */
Object.keys(TEMPLATES).forEach(k => { TEMPLATES[k].legacy = true; });

/* ============================================================
   PUSH / PULL / LEGS templates — push and pull never share a session
   Push = chest, shoulders (front/side), triceps · Pull = back, rear delts, biceps · Legs = quads, hams, glutes, calves, core
   ============================================================ */
const NOTE_DS = 'Last set: drop set (−25%, go to 1 RIR)', NOTE_MYO = 'Last set: myo-reps (rest 5 breaths, 3–5 more reps ×3)', NOTE_60 = '~60% of normal load', NOTE_RAMP = 'Ramp: 50% ×8, 70% ×5, 85% ×2, then top set';
function TPL(key, name, short, kind, phase, focus, rows) { TEMPLATES[key] = { name, short, kind, phase, icon: { push: 'upper', pull: 'pull', legs: 'lower', deload: 'deload', test: 'test' }[kind], focus, rows }; }
// Foundation — legs lower priority (1 legs session per 5)
TPL('FPA', 'Push A — Strength', 'Push A · Strength', 'push', 1, 'Chest and shoulder pressing for strength, then fly, lateral raises and triceps.', [
  ['chest_press', 'S', 4, '5–7', 150, 0], ['delt_press', 'S', 3, '6–8', 150, 0], ['chest_fly', 'H', 3, '10–15', 90, 0], ['side_delt', 'H', 3, '12–15', 60, 0], ['triceps_b', 'H', 3, '10–12', 60, 0], ['triceps_a', 'H', 2, '10–12', 60, 1]]);
TPL('FLA', 'Pull A — Strength', 'Pull A · Strength', 'pull', 1, 'Heavy rows, then vertical pulls, lat isolation, rear delts and biceps.', [
  ['back_row', 'S', 4, '6–8', 150, 0], ['back_vertical', 'H', 3, '8–10', 120, 0], ['back_iso', 'H', 3, '12–15', 75, 0], ['rear_delt', 'H', 3, '12–15', 60, 0], ['biceps_a', 'H', 3, '10–12', 60, 0], ['biceps_b', 'H', 2, '10–12', 60, 1]]);
TPL('FGA', 'Legs — Intro', 'Legs · Intro', 'legs', 1, 'Moderate leg volume while recovery adapts to the deficit. Legs come up to full frequency in month 2.', [
  ['quad_main', 'H', 3, '10–12', 120, 0], ['ham_curl', 'H', 3, '10–12', 90, 0], ['quad_iso', 'H', 2, '12–15', 75, 0], ['calves', 'H', 3, '12–15', 60, 0], ['core', 'H', 3, '10–15', 60, 0]]);
TPL('FPB', 'Push B — Hypertrophy', 'Push B · Hypertrophy', 'push', 1, 'Higher-rep chest and delt work using different variations from Push A.', [
  ['chest_press', 'H', 3, '8–12', 120, 1], ['chest_fly', 'H', 3, '12–15', 75, 1], ['delt_press', 'H', 3, '10–12', 90, 1], ['side_delt', 'H', 4, '15–20', 60, 1], ['triceps_a', 'H', 3, '12–15', 60, 0], ['triceps_b', 'H', 2, '12–15', 60, 1]]);
TPL('FLB', 'Pull B — Hypertrophy', 'Pull B · Hypertrophy', 'pull', 1, 'Higher-rep back, rear delt and biceps work using different variations from Pull A.', [
  ['back_vertical', 'H', 3, '8–12', 120, 1], ['back_row', 'H', 3, '10–12', 90, 1], ['back_iso', 'H', 3, '12–15', 60, 1], ['rear_delt', 'H', 3, '15–20', 60, 1], ['biceps_b', 'H', 3, '10–12', 60, 0], ['biceps_a', 'H', 2, '12–15', 60, 1]]);
// Build
TPL('BPA', 'Push A — Strength', 'Push A · Strength', 'push', 2, 'Heavy chest and overhead pressing, then fly, lateral raises and triceps.', [
  ['chest_press', 'S', 4, '5–7', 150, 0], ['delt_press', 'S', 3, '6–8', 150, 0], ['chest_fly', 'H', 3, '10–15', 90, 0], ['side_delt', 'H', 3, '12–15', 60, 0], ['triceps_a', 'H', 3, '8–12', 75, 0], ['triceps_b', 'H', 2, '10–12', 60, 0]]);
TPL('BLA', 'Pull A — Strength', 'Pull A · Strength', 'pull', 2, 'Heavy vertical pull and row, then lat isolation, rear delts and biceps.', [
  ['back_vertical', 'S', 4, '6–8', 150, 0], ['back_row', 'S', 3, '6–8', 150, 0], ['back_iso', 'H', 3, '12–15', 75, 0], ['rear_delt', 'H', 3, '12–15', 60, 0], ['biceps_a', 'H', 3, '8–12', 75, 0], ['biceps_b', 'H', 2, '10–12', 60, 0]]);
TPL('BGA', 'Legs A — Strength', 'Legs A · Strength', 'legs', 2, 'Heavy quad and hinge work, single-leg, curls, glutes and calves.', [
  ['quad_main', 'S', 4, '6–8', 180, 0], ['ham_hinge', 'S', 3, '6–8', 150, 0], ['quad_uni', 'H', 3, '8–10 / leg', 90, 0], ['ham_curl', 'H', 3, '10–12', 75, 0], ['glute', 'H', 3, '10–15', 75, 0], ['calves', 'H', 4, '10–15', 60, 0]]);
TPL('BPB', 'Push B — Hypertrophy', 'Push B · Hypertrophy', 'push', 2, 'Moderate loads and more reps for chest, delts and triceps.', [
  ['chest_press', 'H', 3, '8–12', 120, 1], ['delt_press', 'H', 3, '10–12', 90, 1], ['chest_fly', 'H', 3, '12–15', 60, 1], ['side_delt', 'H', 4, '12–20', 60, 1], ['triceps_b', 'H', 3, '10–15', 60, 1], ['triceps_a', 'H', 2, '12–15', 60, 1]]);
TPL('BLB', 'Pull B — Hypertrophy', 'Pull B · Hypertrophy', 'pull', 2, 'Moderate loads and more reps for back, rear delts and biceps.', [
  ['back_row', 'H', 3, '8–12', 90, 1], ['back_vertical', 'H', 3, '10–12', 90, 1], ['back_iso', 'H', 3, '12–15', 60, 1], ['rear_delt', 'H', 3, '15–20', 60, 1], ['biceps_b', 'H', 3, '10–15', 60, 1], ['biceps_a', 'H', 2, '12–15', 60, 1]]);
TPL('BGB', 'Legs B — Hypertrophy', 'Legs B · Hypertrophy', 'legs', 2, 'Leg extensions first, then moderate-load pressing, a hinge, curls, glutes, calves and core.', [
  ['quad_iso', 'H', 3, '12–15', 75, 0], ['quad_main', 'H', 3, '10–12', 120, 1], ['ham_hinge', 'H', 3, '8–12', 120, 1], ['ham_curl', 'H', 3, '12–15', 75, 1], ['glute', 'H', 3, '12–15', 60, 1], ['calves', 'H', 3, '12–15', 60, 1], ['core', 'H', 3, '10–15', 60, 0]]);
// Intensify
TPL('IPA', 'Push — Heavy', 'Push · Heavy', 'push', 3, 'Lowest reps of the program on the presses; intensity techniques on the isolation finishers.', [
  ['chest_press', 'S', 5, '4–6', 180, 0], ['delt_press', 'S', 4, '5–7', 150, 0], ['chest_fly', 'H', 3, '12–15', 75, 0, NOTE_DS], ['side_delt', 'H', 4, '12–15', 60, 0, NOTE_MYO], ['triceps_b', 'H', 3, '10–12', 60, 0]]);
TPL('ILA', 'Pull — Heavy', 'Pull · Heavy', 'pull', 3, 'Heavy rows and pulldowns; intensity techniques on lats and rear delts.', [
  ['back_row', 'S', 5, '4–6', 180, 0], ['back_vertical', 'S', 4, '5–7', 150, 0], ['back_iso', 'H', 3, '12–15', 60, 0, NOTE_DS], ['rear_delt', 'H', 3, '15–20', 60, 0, NOTE_MYO], ['biceps_a', 'H', 3, '10–12', 60, 0]]);
TPL('IGA', 'Legs — Heavy', 'Legs · Heavy', 'legs', 3, 'Heaviest leg work of the cycle; keep 1–2 reps in reserve on the big movements.', [
  ['quad_main', 'S', 4, '5–7', 180, 0], ['ham_hinge', 'S', 4, '6–8', 150, 0], ['quad_uni', 'H', 3, '8–10 / leg', 90, 0], ['ham_curl', 'H', 3, '8–12', 75, 0, 'Last set: drop set'], ['glute', 'H', 3, '10–12', 75, 0], ['calves', 'H', 4, '8–12', 60, 0]]);
TPL('IPB', 'Push — Pump', 'Push · Pump', 'push', 3, 'Moderate loads, short rests and plenty of quality volume for chest, delts and triceps.', [
  ['delt_press', 'H', 3, '8–12', 90, 1], ['chest_press', 'H', 3, '10–12', 90, 2], ['chest_fly', 'H', 3, '12–15', 60, 2], ['side_delt', 'H', 3, '15–20', 45, 1], ['triceps_a', 'H', 3, '10–12', 45, 1], ['triceps_b', 'H', 2, '12–15', 45, 2]]);
TPL('ILB', 'Pull — Pump', 'Pull · Pump', 'pull', 3, 'Moderate loads, short rests and plenty of quality volume for back, rear delts and biceps.', [
  ['back_vertical', 'H', 3, '10–12', 90, 2], ['back_row', 'H', 3, '10–12', 90, 2], ['back_iso', 'H', 3, '12–15', 60, 2], ['rear_delt', 'H', 3, '15–20', 45, 1], ['biceps_b', 'H', 3, '10–12', 45, 1], ['biceps_a', 'H', 2, '12–15', 45, 2]]);
TPL('IGB', 'Legs — Pump', 'Legs · Pump', 'legs', 3, 'Higher-rep leg day with short rests, hinging as well as curling for the hamstrings.', [
  ['quad_iso', 'H', 3, '12–15', 75, 1], ['quad_main', 'H', 3, '10–12', 120, 2], ['ham_hinge', 'H', 3, '10–12', 90, 2], ['ham_curl', 'H', 3, '12–15', 75, 2], ['glute', 'H', 3, '12–15', 60, 2], ['calves', 'H', 3, '12–20', 45, 2], ['core', 'H', 3, '10–15', 60, 1]]);
// Volume (cycle 2+)
TPL('VP', 'Push — Volume', 'Push · Volume', 'push', 5, 'Higher reps and shorter rests for chest, delts and triceps.', [
  ['chest_press', 'H', 3, '10–12', 90, 1], ['chest_fly', 'H', 3, '12–15', 60, 2], ['delt_press', 'H', 3, '10–12', 90, 2], ['side_delt', 'H', 4, '15–20', 45, 2, 'Last set: drop set'], ['triceps_a', 'H', 3, '12–15', 45, 0], ['triceps_b', 'H', 3, '12–15', 45, 2]]);
TPL('VL', 'Pull — Volume', 'Pull · Volume', 'pull', 5, 'Higher reps and shorter rests for back, rear delts and biceps.', [
  ['back_vertical', 'H', 4, '10–12', 90, 1], ['back_row', 'H', 3, '12–15', 75, 2], ['back_iso', 'H', 3, '12–15', 60, 1], ['rear_delt', 'H', 3, '15–20', 45, 2], ['biceps_a', 'H', 3, '12–15', 45, 0], ['biceps_b', 'H', 3, '10–12', 45, 2]]);
TPL('VG', 'Legs — Volume', 'Legs · Volume', 'legs', 5, 'Quads pre-exhausted with extensions, then moderate-load pressing, curls, glutes and calves for reps.', [
  ['quad_iso', 'H', 3, '15–20', 60, 1, 'Pre-exhaust — controlled 3 s lowering'], ['quad_main', 'H', 3, '10–15', 120, 1], ['ham_hinge', 'H', 3, '10–12', 90, 1], ['ham_curl', 'H', 3, '10–15', 75, 2], ['quad_uni', 'H', 3, '10–12 / leg', 75, 1], ['glute', 'H', 3, '12–15', 60, 1], ['calves', 'H', 4, '12–20', 45, 1], ['core', 'H', 3, '12–15', 45, 2]]);
// Deload & test week
TPL('DLPUSH', 'Deload — Push', 'Deload · Push', 'deload', 4, 'Half the sets at ~60% of your recent working weights.', [
  ['chest_press', 'H', 2, '8–10', 90, 0, NOTE_60], ['delt_press', 'H', 2, '8–10', 90, 0, NOTE_60], ['side_delt', 'H', 2, '12–15', 60, 0], ['triceps_b', 'H', 2, '12', 45, 0]]);
TPL('DLPULL', 'Deload — Pull', 'Deload · Pull', 'deload', 4, 'Half the sets at ~60% of your recent working weights.', [
  ['back_row', 'H', 2, '8–10', 90, 0, NOTE_60], ['back_vertical', 'H', 2, '8–10', 90, 0, NOTE_60], ['rear_delt', 'H', 2, '12–15', 60, 0], ['biceps_a', 'H', 2, '12', 45, 0]]);
TPL('DLLEGS', 'Deload — Legs', 'Deload · Legs', 'deload', 4, 'Half the sets at ~60% of your recent working weights.', [
  ['quad_main', 'H', 2, '10', 90, 0, NOTE_60], ['ham_curl', 'H', 2, '10–12', 60, 0], ['calves', 'H', 2, '12–15', 60, 0], ['core', 'H', 2, '10–15', 60, 0]]);
TPL('TPUSH', 'PR Test — Push', 'PR Test · Push', 'test', 4, 'Warm up in 3–4 ramping sets, then one all-out-but-clean top set on each lift.', [
  ['chest_press', 'T', 1, '3–5 RM', 240, 0, NOTE_RAMP], ['delt_press', 'T', 1, '5–8 RM', 180, 0], ['triceps_b', 'T', 1, '8 RM', 120, 0], ['side_delt', 'H', 2, '12–15', 60, 0]]);
TPL('TPULL', 'PR Test — Pull', 'PR Test · Pull', 'test', 4, 'Warm up in 3–4 ramping sets, then one all-out-but-clean top set on each lift.', [
  ['back_row', 'T', 1, '3–5 RM', 240, 0, NOTE_RAMP], ['back_vertical', 'T', 1, '5–8 RM', 180, 0], ['biceps_a', 'T', 1, '8 RM', 120, 0], ['rear_delt', 'H', 2, '15–20', 60, 0]]);
TPL('TLEGS', 'PR Test — Legs', 'PR Test · Legs', 'test', 4, 'Top sets on the main leg movements. Stop the set when form breaks — that’s your RM.', [
  ['quad_main', 'T', 1, '3–5 RM', 240, 0, NOTE_RAMP], ['ham_hinge', 'T', 1, '5–8 RM', 180, 0], ['ham_curl', 'T', 1, '8 RM', 120, 0], ['glute', 'T', 1, '8 RM', 120, 0], ['calves', 'T', 1, '10 RM', 90, 0], ['core', 'H', 2, '10–15', 60, 0]]);

// seq = the rolling order sessions are assigned in (continues across weeks, restarts each phase)
const PHASE_DEFS = {
  foundation: { key: 'foundation', n: 1, name: 'Foundation', seq: ['FPA', 'FLA', 'FGA', 'FPB', 'FLB'], cls: 'p1', dot: 'push',
    summary: 'Upper-body priority. Push and pull sessions alternate; legs get 1 session in every 5 while your recovery adapts to the calorie deficit.',
    legs: 'Legs 1 of every 5 sessions' },
  build: { key: 'build', n: 2, name: 'Build', seq: ['BPA', 'BLA', 'BGA', 'BPB', 'BLB', 'BGB'], cls: 'p2', dot: 'pull',
    summary: 'Legs back to normal frequency. A rolling Push → Pull → Legs split with a strength (A) and a hypertrophy (B) version of each.',
    legs: 'Legs 1 of every 3 sessions' },
  intensify: { key: 'intensify', n: 3, name: 'Intensify', seq: ['IPA', 'ILA', 'IGA', 'IPB', 'ILB', 'IGB'], cls: 'p3', dot: 'legs',
    summary: 'Heavier strength slots (4–6 reps), plus drop sets and myo-reps on isolation work to keep hypertrophy stimulus high as the deficit accumulates.',
    legs: 'Legs 1 of every 3 sessions · heavy' },
  volume: { key: 'volume', n: 5, name: 'Volume', seq: ['VP', 'VL', 'VG'], cls: 'p5', dot: 'mixed',
    summary: 'Higher reps (10–20), shorter rests and extra delt & arm work. Joint-friendly hypertrophy that follows the heavy Intensify block.',
    legs: 'Legs 1 of every 3 sessions · pump' },
  test: { key: 'test', n: 4, name: 'Deload & Test', seq: ['TPUSH', 'TPULL', 'TLEGS'], cls: 'p4', dot: 'test',
    summary: 'Deload sessions first (if you train 4+ days), then PR tests: one push, one pull and one legs test so you can compare against earlier cycles.',
    legs: 'Test week' }
};
Object.values(PHASE_DEFS).forEach(p => { p.templates = p.key === 'test' ? ['DLPUSH', 'DLPULL', 'DLLEGS', 'TPUSH', 'TPULL', 'TLEGS'] : p.seq.slice(); });
// Test week: (N−3) deloads first, then up to 3 PR tests
function testWeekSeq(n) { const dl = ['DLPUSH', 'DLPULL', 'DLLEGS'], t = ['TPUSH', 'TPULL', 'TLEGS']; const seq = dl.slice(0, Math.max(0, Math.min(3, n - 3))).concat(t.slice(0, Math.min(3, Math.max(1, n)))); return seq; }
// Cycle 1 = the 90-day launch. Every later cycle is 13 weeks: Build → Intensify → Volume → Deload & Test.
const CYCLE1 = [Object.assign({}, PHASE_DEFS.foundation, { weeks: [1, 4] }), Object.assign({}, PHASE_DEFS.build, { weeks: [5, 8] }), Object.assign({}, PHASE_DEFS.intensify, { weeks: [9, 12] }), Object.assign({}, PHASE_DEFS.test, { weeks: [13, 13] })];
const CYCLEN = [Object.assign({}, PHASE_DEFS.build, { weeks: [1, 4] }), Object.assign({}, PHASE_DEFS.intensify, { weeks: [5, 8] }), Object.assign({}, PHASE_DEFS.volume, { weeks: [9, 12] }), Object.assign({}, PHASE_DEFS.test, { weeks: [13, 13] })];
const PHASES = CYCLE1;
const ALL_PHASES = ['foundation', 'build', 'intensify', 'volume', 'test'].map(k => PHASE_DEFS[k]);
const PUSH_GROUPS = ['Chest', 'Shoulders', 'Triceps'], PULL_GROUPS = ['Back', 'Biceps'];

// Target reps-in-reserve by week within a phase
const RIR = { H: ['3', '2', '1–2', '0–1'], S: ['3', '2', '2', '1'] };
EX.assisted_pullup.assist = true;
