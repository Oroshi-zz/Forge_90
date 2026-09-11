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
TPL('BGB', 'Legs B — Hypertrophy', 'Legs B · Hypertrophy', 'legs', 2, 'Leg extensions first, then moderate-load pressing, curls, glutes, calves and core.', [
  ['quad_iso', 'H', 3, '12–15', 75, 0], ['quad_main', 'H', 3, '10–12', 120, 1], ['ham_curl', 'H', 3, '12–15', 75, 1], ['glute', 'H', 3, '12–15', 60, 1], ['calves', 'H', 3, '12–15', 60, 1], ['core', 'H', 3, '10–15', 60, 0]]);
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
TPL('IGB', 'Legs — Pump', 'Legs · Pump', 'legs', 3, 'Higher-rep leg day with short rests.', [
  ['quad_iso', 'H', 3, '12–15', 75, 1], ['quad_main', 'H', 3, '10–12', 120, 2], ['ham_curl', 'H', 3, '12–15', 75, 2], ['glute', 'H', 3, '12–15', 60, 2], ['calves', 'H', 3, '12–20', 45, 2], ['core', 'H', 3, '10–15', 60, 1]]);
// Volume (cycle 2+)
TPL('VP', 'Push — Volume', 'Push · Volume', 'push', 5, 'Higher reps and shorter rests for chest, delts and triceps.', [
  ['chest_press', 'H', 3, '10–12', 90, 1], ['chest_fly', 'H', 3, '12–15', 60, 2], ['delt_press', 'H', 3, '10–12', 90, 2], ['side_delt', 'H', 4, '15–20', 45, 2, 'Last set: drop set'], ['triceps_a', 'H', 3, '12–15', 45, 0], ['triceps_b', 'H', 3, '12–15', 45, 2]]);
TPL('VL', 'Pull — Volume', 'Pull · Volume', 'pull', 5, 'Higher reps and shorter rests for back, rear delts and biceps.', [
  ['back_vertical', 'H', 4, '10–12', 90, 1], ['back_row', 'H', 3, '12–15', 75, 2], ['back_iso', 'H', 3, '12–15', 60, 1], ['rear_delt', 'H', 3, '15–20', 45, 2], ['biceps_a', 'H', 3, '12–15', 45, 0], ['biceps_b', 'H', 3, '10–12', 45, 2]]);
TPL('VG', 'Legs — Volume', 'Legs · Volume', 'legs', 5, 'Quads pre-exhausted with extensions, then moderate-load pressing, curls, glutes and calves for reps.', [
  ['quad_iso', 'H', 3, '15–20', 60, 1, 'Pre-exhaust — controlled 3 s lowering'], ['quad_main', 'H', 3, '10–15', 120, 1], ['ham_curl', 'H', 4, '10–15', 75, 2], ['quad_uni', 'H', 3, '10–12 / leg', 75, 1], ['glute', 'H', 3, '12–15', 60, 1], ['calves', 'H', 4, '12–20', 45, 1], ['core', 'H', 3, '12–15', 45, 2]]);
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
