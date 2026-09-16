// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
/* ============================================================
   FORGE 90 — recipe library, part two
   Added in v1.2: a hundred more recipes across every meal type, plus dessert, which the planner
   never schedules for you. Macros are not written down anywhere here — the app computes them
   from the ingredient amounts, so a recipe can only be as accurate as the food database, and
   every ingredient below is in it.
   Anything the earlier recipes did not already need is added to the food database first.
   ============================================================ */
const NEW_FOODS = [
  ['mascarpone', 'Mascarpone', 'soft_cheese', 429, 4.8, 4.8, 44],
  ['ladyfingers', 'Ladyfinger biscuits', 'baking', 396, 9, 72, 7],
  ['matcha', 'Matcha powder', 'spices', 300, 30, 39, 5],
  ['coconut_flour', 'Coconut flour', 'baking', 400, 18, 60, 13],
  ['sf_choc_chips', 'Sugar-free chocolate chips', 'sweets', 400, 3, 90, 27],
  ['greek_yogurt_vanilla', 'Vanilla Greek yogurt, nonfat', 'yogurt', 85, 9, 10, 0.5],
  ['sf_jello', 'Sugar-free gelatin dessert, prepared', 'sweeteners', 8, 1.4, 0, 0],
  ['protein_ice_cream', 'Light protein ice cream', 'sweets', 120, 8, 20, 2],
  ['sf_caramel', 'Sugar-free caramel sauce', 'sweeteners', 130, 0, 32, 0],
  ['pumpkin_spice', 'Pumpkin pie spice', 'spices', 350, 6, 70, 9],
  ['gelatin', 'Unflavored gelatin', 'spices', 335, 85, 0, 0],
  ['mini_marshmallows', 'Mini marshmallows', 'sweets', 318, 1.8, 81, 0.2],
  ['protein_granola', 'Protein granola', 'cereal', 420, 25, 45, 14],
  ['miso_paste', 'White miso paste', 'condiments', 199, 12, 26, 6],
  ['red_curry_paste', 'Red curry paste', 'sauces', 100, 3, 15, 3],
  ['rice_vinegar', 'Rice vinegar', 'condiments', 18, 0, 0.5, 0, { ml: true }],
  ['orzo', 'Orzo, dry', 'pasta', 360, 12, 73, 1.5],
  ['polenta', 'Polenta / coarse cornmeal, dry', 'ancient', 362, 8, 79, 1.5]
];
NEW_FOODS.forEach(([id, n, sub, k, p, c, f, o = {}]) => {
  if (BASE_ING[id]) return;
  const g = { n, a: o.a || SUB_AISLE[sub] || CAT_AISLE[SUB_CAT[sub]] || 'Pantry', r: o.r || defaultRole(sub, k, p, c, f), k, p, c, f };
  if (o.u) { g.u = o.u; g.g = o.g; }
  if (o.ml) g.ml = true;
  BASE_ING[id] = g; BASE_SUB[id] = sub;
});

/* R(id, name, cat, emoji, yield, storage, time, tags, ing, steps) — the same shape as
   BASE_RECIPES, written as a call so a hundred of them stay readable. */
const R2 = [];
function R(id, name, cat, emoji, yld, storage, time, tags, ing, steps) {
  R2.push({ id, name, cat, emoji, yield: yld, storage, time, tags, ing, steps });
}

/* ---------------- BREAKFAST ---------------- */
R('r2_cottage_bowl', 'Savory Cottage Cheese Bowl', 'breakfast', '🥣', 1, 'fresh', 5, ['No-cook', 'High protein'],
  [['cottage', 200], ['cherry_tomato', 80], ['cucumber', 60], ['olive_oil', 5], ['sesame_seeds', 4]],
  ['Spoon the cottage cheese into a bowl.', 'Halve the tomatoes, dice the cucumber and pile them on.', 'Drizzle with olive oil, then season with salt and pepper.']);
R('r2_skyr_granola', 'Skyr, Berries & Protein Granola', 'breakfast', '🫐', 1, 'fresh', 4, ['No-cook', 'Under 5 minutes'],
  [['skyr', 200], ['berries', 100], ['protein_granola', 35], ['honey', 10]],
  ['Spoon the skyr into a bowl.', 'Top with berries and granola.', 'Finish with a thin drizzle of honey.']);
R('r2_egg_muffins', 'Egg & Turkey Breakfast Muffins', 'breakfast', '🧁', 6, 'fridge', 35, ['Meal prep', 'Freezes well'],
  [['egg', 6], ['egg_whites', 300], ['turkey_sausage', 200], ['spinach', 80], ['bell_pepper', 120], ['cheese_shred', 90], ['onion', 60]],
  ['Heat the oven to 350°F and grease a 12-cup muffin tin.', 'Brown the sausage with the diced pepper and onion, then stir in the spinach until it wilts.', 'Whisk the eggs and whites, season, and stir in the cooked mix and cheese.', 'Divide between the cups and bake 22 to 25 minutes, until set in the middle. They keep 4 days, or freeze and reheat 90 seconds.']);
R('r2_shakshuka', 'Shakshuka', 'breakfast', '🍅', 2, 'fridge', 25, ['One pan', 'Vegetarian'],
  [['egg', 4], ['crushed_tomatoes', 400], ['bell_pepper', 150], ['onion', 100], ['garlic', 10], ['olive_oil', 10], ['cumin', 3], ['paprika', 3], ['feta', 40], ['ww_pita', 1]],
  ['Soften the diced pepper and onion in the oil for 6 to 8 minutes, then add the garlic, cumin and paprika for a minute.', 'Pour in the tomatoes, season, and simmer 10 minutes until thick.', 'Make four wells, crack in the eggs, cover and cook 5 to 7 minutes until the whites set.', 'Crumble over the feta and serve with warm pita.']);
R('r2_pb_banana_toast', 'Peanut Butter & Banana Toast', 'breakfast', '🍌', 1, 'fresh', 5, ['Quick', 'Pre-workout'],
  [['ezekiel', 2], ['pb', 24], ['banana', 1], ['cinnamon', 1], ['chia', 6]],
  ['Toast the bread.', 'Spread with peanut butter, then layer the sliced banana on top.', 'Dust with cinnamon and scatter over the chia seeds.']);
R('r2_breakfast_quesadilla', 'Egg White Breakfast Quesadilla', 'breakfast', '🫓', 1, 'fresh', 12, ['Quick', 'High protein'],
  [['lowcarb_tortilla', 1], ['egg_whites', 200], ['egg', 1], ['cheese_shred', 30], ['black_beans', 60], ['salsa', 40], ['cooking_spray', 2]],
  ['Scramble the egg and whites in a sprayed pan until just set.', 'Lay the tortilla in the pan, scatter cheese over half, then the eggs and beans.', 'Fold, press, and cook 2 minutes a side until crisp.', 'Cut in half and serve with salsa.']);
R('r2_protein_french_toast', 'Protein French Toast', 'breakfast', '🍞', 1, 'fresh', 12, ['Weekend favorite'],
  [['ezekiel', 2], ['egg_whites', 150], ['whey', 20], ['fairlife', 60], ['cinnamon', 2], ['vanilla', 2], ['syrup_sf', 30], ['berries', 80]],
  ['Whisk the whites, whey, milk, cinnamon and vanilla into a smooth custard.', 'Soak each slice 20 seconds a side, letting the extra drip off.', 'Cook on a sprayed griddle over medium-low, 3 minutes a side.', 'Serve with berries and sugar-free syrup.']);
R('r2_smoked_salmon_bagel', 'Smoked Salmon Bagel Thin', 'breakfast', '🥯', 1, 'fresh', 5, ['No-cook', 'Omega-3'],
  [['bagel_thin', 1], ['smoked_salmon', 60], ['cream_cheese_light', 30], ['red_onion', 15], ['capers', 8], ['cucumber', 40]],
  ['Toast the bagel thin.', 'Spread both halves with cream cheese.', 'Layer on the salmon, thinly sliced onion, cucumber and capers.']);
R('r2_tofu_scramble', 'Turmeric Tofu Scramble', 'breakfast', '🍳', 2, 'fridge', 15, ['Vegan', 'One pan'],
  [['firm_tofu', 400], ['nutritional_yeast', 12], ['spinach', 80], ['bell_pepper', 120], ['onion', 60], ['olive_oil', 10], ['garlic_powder', 2], ['paprika', 2], ['salsa', 60]],
  ['Press the tofu for 10 minutes, then crumble it.', 'Soften the pepper and onion in the oil, then add the tofu, nutritional yeast, garlic powder and paprika.', 'Cook 6 to 8 minutes, stirring, until the edges brown.', 'Fold in the spinach until wilted and serve with salsa.']);
R('r2_oat_pancakes_blueberry', 'Blueberry Oat Pancakes', 'breakfast', '🥞', 2, 'fridge', 18, ['Meal prep', 'Freezes well'],
  [['oats', 100], ['egg_whites', 200], ['cottage_ff', 150], ['whey', 30], ['blueberries', 120], ['baking_mix', 20], ['vanilla', 3]],
  ['Blend the oats, whites, cottage cheese, whey, baking mix and vanilla until smooth; rest 3 minutes.', 'Fold in the blueberries by hand.', 'Cook quarter-cup pancakes on a sprayed griddle over medium-low, flipping when bubbles hold.', 'They reheat well from the freezer — stack with parchment between.']);
R('r2_chia_pudding', 'Vanilla Chia Protein Pudding', 'breakfast', '🍮', 2, 'fridge', 5, ['No-cook', 'Make the night before'],
  [['chia', 50], ['fairlife', 400], ['whey', 40], ['vanilla', 3], ['berries', 120], ['almonds', 20]],
  ['Whisk the milk, whey and vanilla until no lumps remain.', 'Stir in the chia, wait 5 minutes, then stir again to break up clumps.', 'Refrigerate at least 4 hours or overnight.', 'Top with berries and chopped almonds.']);
R('r2_steak_eggs', 'Steak & Eggs', 'breakfast', '🥩', 1, 'fresh', 15, ['High protein', 'Low carb'],
  [['sirloin', 150], ['egg', 3], ['asparagus', 100], ['olive_oil', 8], ['black_pepper', 1]],
  ['Season the steak and sear 3 to 4 minutes a side for medium-rare; rest it 5 minutes.', 'Cook the asparagus in the same pan with a little oil.', 'Fry the eggs to your liking.', 'Slice the steak against the grain and plate it all together.']);
R('r2_apple_cinnamon_oats', 'Apple Cinnamon Protein Oats', 'breakfast', '🍎', 1, 'fresh', 10, ['Warm', 'Fall'],
  [['oats', 60], ['apple', 1], ['whey', 30], ['fairlife', 200], ['cinnamon', 3], ['walnuts', 15], ['maple_syrup', 10]],
  ['Simmer the oats in the milk with the diced apple and cinnamon for 5 to 6 minutes.', 'Take it off the heat, wait a minute, then stir in the whey so it does not seize.', 'Top with walnuts and a little maple syrup.']);
R('r2_breakfast_hash', 'Sweet Potato & Turkey Hash', 'breakfast', '🍠', 2, 'fridge', 25, ['One pan', 'Meal prep'],
  [['sweet_potato', 400], ['turkey_937', 300], ['bell_pepper', 120], ['onion', 80], ['olive_oil', 12], ['paprika', 3], ['egg', 2], ['hot_sauce', 10]],
  ['Dice the sweet potato small and cook it in the oil, covered, for 10 minutes.', 'Add the turkey, pepper, onion and paprika; cook until the turkey is browned through.', 'Make two wells and crack in the eggs; cover until set.', 'Finish with hot sauce.']);
R('r2_matcha_smoothie', 'Matcha Protein Smoothie', 'breakfast', '🍵', 1, 'fresh', 4, ['Blender', 'Under 5 minutes'],
  [['whey', 35], ['matcha', 3], ['banana', 1], ['spinach', 40], ['almond_milk', 300], ['almond_butter', 16]],
  ['Put the liquid in the blender first, then everything else.', 'Blend 45 seconds until completely smooth.', 'Add ice and blend again if you want it thicker.']);
R('r2_yogurt_parfait', 'Layered Berry Protein Parfait', 'breakfast', '🍓', 1, 'fresh', 5, ['No-cook', 'Kid friendly'],
  [['greek_yogurt', 200], ['whey', 15], ['strawberries', 100], ['blueberries', 60], ['granola', 30], ['honey', 8]],
  ['Stir the whey through the yogurt until smooth.', 'Layer yogurt, berries and granola twice in a glass.', 'Drizzle honey over the top.']);
R('r2_cottage_pancakes', 'Cottage Cheese Pancakes', 'breakfast', '🥞', 1, 'fresh', 15, ['High protein'],
  [['cottage_ff', 150], ['egg', 2], ['oats', 40], ['vanilla', 2], ['syrup_sf', 30], ['raspberries', 80]],
  ['Blend the cottage cheese, eggs, oats and vanilla until smooth.', 'Rest the batter 5 minutes so the oats take up the liquid.', 'Cook small pancakes on a sprayed pan over medium-low, 2 to 3 minutes a side.', 'Serve with raspberries and sugar-free syrup.']);
R('r2_avocado_egg_toast', 'Avocado & Soft Egg Toast', 'breakfast', '🥑', 1, 'fresh', 10, ['Quick', 'Vegetarian'],
  [['sourdough', 2], ['avocado', 80], ['egg', 2], ['lemon_juice', 5], ['chili_powder', 1], ['fresh_herbs', 5]],
  ['Toast the bread.', 'Mash the avocado with lemon juice, salt and pepper, then spread it thick.', 'Soft-boil the eggs for 6 and a half minutes, peel and halve them onto the toast.', 'Finish with chili flakes and herbs.']);
R('r2_protein_waffles', 'Protein Waffles', 'breakfast', '🧇', 2, 'freezer', 20, ['Meal prep', 'Freezes well'],
  [['kodiak', 120], ['egg_whites', 200], ['fairlife', 150], ['whey', 30], ['greek_yogurt', 100], ['berries', 100]],
  ['Whisk the mix, whites, milk and whey into a thick batter and rest it 3 minutes.', 'Cook in a hot waffle iron until the steam stops, about 4 minutes.', 'Top with Greek yogurt and berries.', 'Freeze the extras and reheat straight from frozen in a toaster.']);
R('r2_huevos_rancheros', 'Huevos Rancheros', 'breakfast', '🌶️', 1, 'fresh', 15, ['Spicy', 'One pan'],
  [['corn_tortilla', 2], ['egg', 2], ['black_beans', 120], ['salsa_verde', 60], ['cheese_shred', 25], ['avocado', 50], ['fresh_herbs', 5]],
  ['Warm the tortillas in a dry pan until they blister.', 'Heat the beans with a spoonful of the salsa.', 'Fry the eggs, keeping the yolks soft.', 'Build tortilla, beans, egg, salsa, cheese and avocado, then finish with coriander.']);

/* ---------------- LUNCH ---------------- */
R('r2_chicken_caesar_bowl', 'Chicken Caesar Crunch Bowl', 'lunch', '🥗', 1, 'fridge', 12, ['Meal prep', 'High protein'],
  [['chicken_breast_cooked', 170], ['romaine', 150], ['parmesan', 20], ['caesar', 30], ['wg_crackers', 20], ['cherry_tomato', 80]],
  ['Chop the romaine and toss it with the dressing.', 'Slice the chicken and lay it over the top.', 'Finish with parmesan, tomatoes and crushed crackers for crunch.']);
R('r2_tuna_crunch_wrap', 'Tuna Crunch Wrap', 'lunch', '🌯', 1, 'fresh', 8, ['Quick', 'Pantry staples'],
  [['tuna_pouch', 140], ['light_mayo', 20], ['greek_yogurt', 40], ['celery', 50], ['red_onion', 20], ['pickles', 30], ['lowcarb_tortilla', 1], ['spinach', 30]],
  ['Mix the tuna with the mayo, yogurt, diced celery, onion and pickles.', 'Season with black pepper.', 'Spread over the tortilla, add spinach, and roll it tight.']);
R('r2_turkey_club_wrap', 'Turkey Club Wrap', 'lunch', '🥪', 1, 'fresh', 7, ['Quick', 'No-cook'],
  [['deli_turkey', 120], ['turkey_bacon', 30], ['lavash', 90], ['swiss', 25], ['romaine', 40], ['tomato', 60], ['light_mayo', 15], ['dijon', 8]],
  ['Spread the lavash with mayo and mustard.', 'Layer on the turkey, bacon, cheese, lettuce and tomato.', 'Roll tightly and cut on the diagonal.']);
R('r2_chipotle_bowl', 'Burrito Bowl', 'lunch', '🍚', 2, 'fridge', 25, ['Meal prep', 'Batch friendly'],
  [['chicken_breast', 400], ['brown_rice', 150], ['black_beans', 200], ['corn', 120], ['salsa', 100], ['cheese_shred', 50], ['romaine', 100], ['taco_seasoning', 12]],
  ['Toss the diced chicken with the seasoning and cook it through, about 8 minutes.', 'Cook the rice.', 'Build bowls with rice, beans, chicken, corn, lettuce, salsa and cheese.', 'They keep 4 days; add the lettuce fresh each day.']);
R('r2_mediterranean_bowl', 'Mediterranean Chicken Bowl', 'lunch', '🫒', 2, 'fridge', 25, ['Meal prep', 'Mediterranean'],
  [['chicken_breast', 400], ['quinoa', 140], ['cucumber', 150], ['cherry_tomato', 150], ['kalamata', 40], ['feta', 60], ['tzatziki', 80], ['olive_oil', 12], ['red_onion', 40]],
  ['Cook the quinoa and let it cool.', 'Season and grill the chicken, then slice it.', 'Chop the cucumber, tomatoes and onion and toss with the olive oil.', 'Build the bowls and finish with olives, feta and tzatziki.']);
R('r2_egg_salad_sandwich', 'High-Protein Egg Salad Sandwich', 'lunch', '🥚', 1, 'fridge', 12, ['Make ahead', 'Budget'],
  [['egg_boiled', 3], ['cottage_ff', 80], ['light_mayo', 15], ['dijon', 8], ['green_onion', 15], ['ezekiel', 2], ['spinach', 25]],
  ['Blend the cottage cheese with the mayo and mustard until smooth.', 'Chop the eggs and fold them through with the green onion.', 'Season well and pile onto the toasted bread with spinach.']);
R('r2_poke_bowl', 'Ahi Poke Bowl', 'lunch', '🍣', 1, 'fresh', 15, ['Raw fish', 'Fresh'],
  [['ahi_poke', 150], ['sushi_rice', 150], ['edamame', 60], ['cucumber', 60], ['avocado', 50], ['soy_sauce', 15], ['sesame_oil', 5], ['seaweed_salad', 40], ['green_onion', 15]],
  ['Cook the sushi rice and let it cool to room temperature.', 'Toss the ahi with the soy sauce and sesame oil.', 'Build the bowl with rice, then the fish, edamame, cucumber, avocado and seaweed salad.', 'Finish with green onion.']);
R('r2_spicy_tuna_rice_bowl', 'Spicy Tuna Rice Bowl', 'lunch', '🌶️', 1, 'fresh', 12, ['Quick', 'Raw fish'],
  [['ahi', 140], ['sushi_rice', 140], ['sriracha', 12], ['light_mayo', 15], ['cucumber', 60], ['nori', 3], ['sesame_seeds', 5], ['soy_sauce', 10]],
  ['Dice the tuna and fold it with the sriracha and mayo.', 'Spoon it over warm rice.', 'Add cucumber, torn nori and sesame seeds, with soy sauce on the side.']);
R('r2_chicken_soup', 'Lemon Chicken & Orzo Soup', 'lunch', '🍲', 4, 'fridge', 35, ['Batch friendly', 'Freezes well'],
  [['chicken_breast', 500], ['orzo', 150], ['chicken_broth', 1400], ['carrots', 150], ['celery', 120], ['onion', 100], ['lemon_juice', 40], ['olive_oil', 15], ['fresh_herbs', 10]],
  ['Soften the diced carrot, celery and onion in the oil for 8 minutes.', 'Add the broth and the whole chicken breasts and simmer 15 minutes.', 'Lift the chicken out, shred it, and cook the orzo in the broth for 8 minutes.', 'Return the chicken, add the lemon juice and herbs, and season.']);
R('r2_cobb_salad', 'Cobb Salad', 'lunch', '🥓', 1, 'fresh', 15, ['High protein', 'Low carb'],
  [['chicken_breast_cooked', 150], ['egg_boiled', 2], ['turkey_bacon', 30], ['romaine', 120], ['cherry_tomato', 80], ['avocado', 60], ['blue_cheese', 25], ['balsamic_vinaigrette', 25]],
  ['Lay the chopped romaine in a wide bowl.', 'Arrange the sliced chicken, eggs, crisped bacon, tomatoes and avocado in rows.', 'Crumble over the blue cheese and dress just before eating.']);
R('r2_chickpea_salad_pita', 'Smashed Chickpea Salad Pita', 'lunch', '🫓', 2, 'fridge', 12, ['Vegetarian', 'No-cook'],
  [['chickpeas', 300], ['greek_yogurt', 100], ['light_mayo', 20], ['celery', 60], ['red_onion', 30], ['dijon', 10], ['ww_pita', 2], ['spinach', 50], ['lemon_juice', 10]],
  ['Smash the chickpeas roughly with a fork, leaving some whole.', 'Fold in the yogurt, mayo, mustard, lemon juice, celery and onion.', 'Season well and stuff into the pitas with spinach.']);
R('r2_beef_lettuce_wraps', 'Korean Beef Lettuce Wraps', 'lunch', '🥬', 2, 'fridge', 20, ['Low carb', 'Spicy'],
  [['beef_937', 400], ['butter_lettuce', 120], ['gochujang', 30], ['soy_sauce', 20], ['garlic', 10], ['ginger', 8], ['green_onion', 30], ['sesame_oil', 8], ['rice', 100], ['kimchi', 60]],
  ['Brown the beef hard, then drain the fat.', 'Add the garlic, ginger, gochujang, soy sauce and sesame oil and cook 2 minutes more.', 'Cook the rice.', 'Spoon beef and rice into lettuce cups and top with green onion and kimchi.']);
R('r2_protein_pasta_salad', 'Protein Pasta Salad', 'lunch', '🥗', 3, 'fridge', 20, ['Meal prep', 'Cold'],
  [['protein_pasta', 200], ['chicken_breast_cooked', 350], ['cherry_tomato', 200], ['cucumber', 150], ['red_onion', 50], ['feta', 70], ['italian_dressing', 60], ['olives', 50]],
  ['Cook the pasta, then rinse it cold so it stops cooking.', 'Chop everything to roughly the same size.', 'Toss it all with the dressing and season.', 'Better on day two; keeps 4 days.']);
R('r2_shrimp_avocado_salad', 'Shrimp & Avocado Salad', 'lunch', '🍤', 1, 'fresh', 12, ['Low carb', 'Quick'],
  [['cooked_shrimp', 170], ['avocado', 70], ['spring_mix', 100], ['cherry_tomato', 80], ['red_onion', 25], ['lemon_juice', 15], ['olive_oil', 10], ['fresh_herbs', 5]],
  ['Whisk the lemon juice and oil with salt and pepper.', 'Toss the greens, tomatoes and onion in most of it.', 'Top with the shrimp and diced avocado and spoon over the rest.']);
R('r2_bbq_chicken_flatbread', 'BBQ Chicken Flatbread', 'lunch', '🍕', 1, 'fresh', 18, ['Quick', 'Crowd pleaser'],
  [['lavash', 90], ['chicken_breast_cooked', 140], ['bbq_sauce', 40], ['mozzarella_ps', 50], ['red_onion', 30], ['bell_pepper', 50], ['fresh_herbs', 5]],
  ['Heat the oven to 425°F.', 'Spread the barbecue sauce over the lavash, then add chicken, onion, pepper and cheese.', 'Bake 8 to 10 minutes until the edges crisp and the cheese bubbles.', 'Scatter over herbs and cut into strips.']);
R('r2_turkey_chili_bowl', 'Quick Turkey Chili Bowl', 'lunch', '🌶️', 4, 'freezer', 35, ['Batch friendly', 'Freezes well'],
  [['turkey_937', 600], ['kidney_beans', 400], ['crushed_tomatoes', 800], ['onion', 150], ['bell_pepper', 200], ['chili_powder', 15], ['cumin', 8], ['garlic', 12], ['greek_yogurt', 120]],
  ['Brown the turkey with the onion and pepper.', 'Stir in the garlic and spices for a minute, then add the tomatoes and beans.', 'Simmer 20 minutes, uncovered, until it thickens.', 'Serve with a spoon of Greek yogurt in place of sour cream.']);
R('r2_banh_mi_bowl', 'Pork Banh Mi Bowl', 'lunch', '🥖', 2, 'fridge', 25, ['Fresh', 'Batch friendly'],
  [['pork_tenderloin', 400], ['rice', 160], ['carrots', 120], ['cucumber', 120], ['rice_vinegar', 40], ['sriracha', 15], ['light_mayo', 25], ['fish_sauce', 10], ['fresh_herbs', 10]],
  ['Shred the carrot and soak it in the rice vinegar with a pinch of salt.', 'Slice the pork thin, season, and sear it hot for 2 minutes a side.', 'Cook the rice.', 'Build bowls with rice, pork, pickled carrot, cucumber and herbs, then drizzle with sriracha mayo.']);
R('r2_caprese_chicken', 'Caprese Chicken Plate', 'lunch', '🍅', 1, 'fresh', 15, ['Low carb', 'Fresh'],
  [['chicken_breast', 200], ['fresh_mozz', 60], ['tomato', 120], ['balsamic', 15], ['olive_oil', 8], ['fresh_herbs', 8], ['arugula', 50]],
  ['Season and grill the chicken 5 to 6 minutes a side, then rest it.', 'Slice the tomato and mozzarella.', 'Layer them with the sliced chicken over the arugula.', 'Dress with oil, balsamic and torn basil.']);
R('r2_loaded_sweet_potato', 'Loaded Sweet Potato', 'lunch', '🍠', 1, 'fridge', 45, ['Vegetarian option', 'Hands off'],
  [['sweet_potato', 300], ['black_beans', 120], ['greek_yogurt', 60], ['cheese_shred', 30], ['salsa', 50], ['green_onion', 15], ['chili_powder', 2]],
  ['Bake the sweet potato at 400°F for 45 minutes, until it gives to a squeeze.', 'Warm the beans with the chili powder.', 'Split the potato and load it with beans, yogurt, cheese and salsa.', 'Finish with green onion.']);
R('r2_deli_chopped_salad', 'Italian Chopped Salad', 'lunch', '🥗', 2, 'fridge', 15, ['No-cook', 'Meal prep'],
  [['deli_turkey', 150], ['deli_ham', 100], ['provolone', 60], ['romaine', 200], ['chickpeas', 150], ['cherry_tomato', 150], ['red_onion', 40], ['italian_dressing', 50], ['pickled_jalapenos', 30]],
  ['Chop the meats, cheese and vegetables to roughly the same size.', 'Toss everything with the chickpeas.', 'Dress and season just before eating, or keep the dressing separate for meal prep.']);

/* ---------------- DINNER ---------------- */
R('r2_sheet_pan_chicken_veg', 'Sheet-Pan Chicken & Vegetables', 'dinner', '🍗', 4, 'fridge', 40, ['One pan', 'Meal prep'],
  [['chicken_thigh', 800], ['broccoli', 400], ['red_potato', 500], ['bell_pepper', 250], ['olive_oil', 30], ['garlic_powder', 6], ['paprika', 6], ['italian_seasoning', 6]],
  ['Heat the oven to 425°F.', 'Toss the halved potatoes with a third of the oil and roast them 15 minutes alone.', 'Add the seasoned chicken and the rest of the vegetables and oil.', 'Roast 22 to 25 minutes more, until the chicken reaches 175°F.']);
R('r2_beef_broccoli', 'Beef & Broccoli', 'dinner', '🥦', 3, 'fridge', 25, ['Takeout at home', 'Quick'],
  [['flank_steak', 500], ['broccoli', 450], ['rice', 210], ['soy_sauce', 50], ['cornstarch', 15], ['ginger', 10], ['garlic', 12], ['sesame_oil', 10], ['beef_broth', 150], ['hoisin', 25]],
  ['Slice the beef thin against the grain and toss it with half the cornstarch.', 'Sear it hot in batches, 90 seconds a batch, then set it aside.', 'Steam the broccoli in the same pan with a splash of broth.', 'Add the remaining broth, soy, hoisin, garlic, ginger and the rest of the cornstarch; return the beef and toss until glossy. Serve over rice.']);
R('r2_chicken_parm', 'Lighter Chicken Parmesan', 'dinner', '🍝', 2, 'fridge', 35, ['Comfort food'],
  [['chicken_breast', 400], ['panko', 60], ['parmesan', 30], ['egg_whites', 80], ['marinara', 250], ['mozzarella_ps', 80], ['ww_pasta', 140], ['italian_seasoning', 5]],
  ['Heat the oven to 425°F and set a rack over a tray.', 'Pound the chicken to an even thickness, dip in egg whites, then press into the panko, parmesan and seasoning.', 'Bake 18 minutes, top with marinara and mozzarella, and bake 6 more.', 'Serve on the cooked pasta.']);
R('r2_turkey_meatballs_marinara', 'Turkey Meatballs & Marinara', 'dinner', '🍝', 4, 'freezer', 40, ['Batch friendly', 'Freezes well'],
  [['turkey_937', 700], ['panko', 80], ['egg', 2], ['parmesan', 50], ['marinara', 600], ['garlic', 12], ['italian_seasoning', 8], ['protein_pasta', 240], ['fresh_herbs', 10]],
  ['Mix the turkey, panko, eggs, parmesan, garlic and seasoning; do not overwork it.', 'Roll 20 meatballs and bake at 400°F for 18 minutes.', 'Simmer them in the marinara for 10 minutes.', 'Serve on the pasta. The meatballs freeze well in sauce.']);
R('r2_salmon_teriyaki', 'Teriyaki Salmon & Rice', 'dinner', '🐟', 2, 'fridge', 25, ['Omega-3', 'Quick'],
  [['salmon_fillet', 340], ['rice', 140], ['teriyaki', 60], ['broccoli', 250], ['sesame_seeds', 8], ['green_onion', 20], ['sesame_oil', 8]],
  ['Heat the oven to 400°F and line a tray.', 'Brush the salmon with half the teriyaki and bake 12 to 14 minutes.', 'Steam the broccoli and toss it with the sesame oil.', 'Serve over rice with the rest of the teriyaki, sesame seeds and green onion.']);
R('r2_pork_stirfry', 'Pork & Snap Pea Stir-Fry', 'dinner', '🥘', 3, 'fridge', 25, ['Quick', 'One pan'],
  [['pork_tenderloin', 500], ['snap_peas', 300], ['bell_pepper', 200], ['rice', 180], ['soy_sauce', 40], ['hoisin', 30], ['garlic', 12], ['ginger', 10], ['avocado_oil', 15]],
  ['Slice the pork thin and sear it hot in two batches; set aside.', 'Stir-fry the peppers and snap peas for 3 minutes, keeping them crisp.', 'Add the garlic and ginger for 30 seconds, then the soy and hoisin.', 'Return the pork, toss, and serve over rice.']);
R('r2_chicken_fajitas', 'Chicken Fajitas', 'dinner', '🌮', 3, 'fridge', 30, ['Crowd pleaser', 'One pan'],
  [['chicken_breast', 600], ['bell_pepper', 350], ['onion', 200], ['corn_tortilla', 6], ['taco_seasoning', 18], ['olive_oil', 20], ['greek_yogurt', 90], ['salsa', 100], ['lemon_juice', 20]],
  ['Slice the chicken and peppers into strips and toss with the seasoning and oil.', 'Cook the chicken hard in a very hot pan, 6 minutes, then set aside.', 'Char the peppers and onion in the same pan for 5 minutes.', 'Return the chicken, squeeze over lemon, and serve in warm tortillas with yogurt and salsa.']);
R('r2_stuffed_peppers', 'Turkey Stuffed Peppers', 'dinner', '🫑', 4, 'freezer', 50, ['Meal prep', 'Freezes well'],
  [['turkey_937', 600], ['bell_pepper', 700], ['rice', 150], ['crushed_tomatoes', 400], ['onion', 120], ['cheese_shred', 100], ['garlic', 12], ['italian_seasoning', 8]],
  ['Heat the oven to 375°F. Halve the peppers and sit them in a dish.', 'Brown the turkey with the onion and garlic, then stir in the rice, tomatoes and seasoning.', 'Fill the peppers, cover with foil and bake 30 minutes.', 'Uncover, add the cheese, and bake 12 minutes more.']);
R('r2_shrimp_scampi', 'Shrimp Scampi with Protein Pasta', 'dinner', '🍤', 2, 'fridge', 20, ['Quick', 'High protein'],
  [['shrimp', 400], ['protein_pasta', 160], ['garlic', 15], ['butter', 20], ['olive_oil', 10], ['lemon_juice', 30], ['fresh_herbs', 10], ['chicken_broth', 120]],
  ['Cook the pasta and keep a cup of the water.', 'Soften the garlic in the oil and butter without browning it.', 'Add the shrimp and cook 90 seconds a side, then the broth and lemon.', 'Toss with the pasta and a splash of pasta water until it clings; finish with parsley.']);
R('r2_bison_burgers', 'Bison Burgers with Sweet Potato Fries', 'dinner', '🍔', 2, 'fresh', 35, ['Weekend favorite'],
  [['bison_ground', 340], ['burger_bun', 2], ['sweet_potato_fries', 300], ['cheddar', 40], ['tomato', 80], ['butter_lettuce', 40], ['red_onion', 30], ['dijon', 10], ['ketchup', 20]],
  ['Bake the fries at 425°F for 22 minutes, turning once.', 'Form two patties, dimple the centres, and season the outside only.', 'Sear 3 to 4 minutes a side, adding cheese at the end.', 'Build the burgers and serve with the fries.']);
R('r2_chicken_curry', 'Red Curry Chicken', 'dinner', '🍛', 4, 'fridge', 35, ['Batch friendly', 'Spicy'],
  [['chicken_thigh', 700], ['red_curry_paste', 60], ['coconut_milk_light', 400], ['bell_pepper', 250], ['broccoli', 250], ['rice', 220], ['fish_sauce', 20], ['ginger', 10], ['fresh_herbs', 10]],
  ['Fry the curry paste in a dry pan for a minute until it smells strong.', 'Add the coconut milk and bring it to a simmer.', 'Add the diced chicken and cook 12 minutes, then the vegetables for 5 more.', 'Season with fish sauce and serve over rice with herbs.']);
R('r2_meatloaf', 'Turkey Meatloaf & Mash', 'dinner', '🍖', 4, 'fridge', 60, ['Comfort food', 'Meal prep'],
  [['turkey_937', 800], ['oats', 80], ['egg', 2], ['onion', 120], ['ketchup', 60], ['worcestershire', 15], ['garlic_powder', 5], ['mashed_potatoes', 500], ['green_beans', 300]],
  ['Heat the oven to 375°F.', 'Mix the turkey, oats, eggs, grated onion, worcestershire and half the ketchup.', 'Shape it into a loaf on a lined tray, glaze with the rest of the ketchup, and bake 45 to 50 minutes to 165°F.', 'Rest 10 minutes, then slice and serve with mash and green beans.']);
R('r2_cod_piccata', 'Cod Piccata', 'dinner', '🍋', 2, 'fresh', 22, ['Quick', 'Low calorie'],
  [['cod', 340], ['flour_ap', 25], ['butter', 20], ['lemon_juice', 40], ['capers', 20], ['chicken_broth', 150], ['asparagus', 250], ['olive_oil', 10]],
  ['Pat the cod dry, season it, and dust lightly with flour.', 'Sear 3 minutes a side in the oil, then lift it out.', 'Add the broth, lemon and capers to the pan and reduce by half, then whisk in the butter.', 'Roast or pan-cook the asparagus and spoon the sauce over everything.']);
R('r2_chicken_shawarma', 'Chicken Shawarma Bowls', 'dinner', '🥙', 4, 'fridge', 40, ['Meal prep', 'Mediterranean'],
  [['chicken_thigh', 800], ['greek_yogurt', 150], ['garlic', 15], ['cumin', 8], ['paprika', 8], ['lemon_juice', 40], ['rice', 220], ['cucumber', 200], ['cherry_tomato', 200], ['tzatziki', 120], ['olive_oil', 25]],
  ['Marinate the chicken in the yogurt, garlic, spices, lemon and oil for at least 30 minutes.', 'Roast at 425°F for 22 to 25 minutes, then rest and slice.', 'Cook the rice.', 'Build bowls with rice, chicken, chopped salad and tzatziki.']);
R('r2_veggie_lentil_curry', 'Lentil & Chickpea Curry', 'dinner', '🍛', 4, 'freezer', 40, ['Vegan', 'Freezes well'],
  [['red_lentils', 250], ['chickpeas', 400], ['crushed_tomatoes', 400], ['coconut_milk_light', 300], ['onion', 150], ['spinach', 150], ['curry_sauce', 100], ['garlic', 15], ['ginger', 12], ['rice', 220]],
  ['Soften the onion, then add the garlic, ginger and curry base for a minute.', 'Add the lentils, tomatoes and 500 ml water and simmer 20 minutes.', 'Stir in the chickpeas and coconut milk and cook 8 more.', 'Wilt in the spinach and serve over rice.']);
R('r2_steak_chimichurri', 'Steak with Chimichurri', 'dinner', '🥩', 2, 'fresh', 25, ['High protein', 'Low carb'],
  [['sirloin', 400], ['chimichurri', 60], ['brussels', 300], ['yukon_potato', 300], ['olive_oil', 20], ['garlic_powder', 4]],
  ['Halve the sprouts and cube the potatoes; roast at 425°F for 25 minutes with the oil.', 'Season the steak heavily and sear 3 to 4 minutes a side.', 'Rest it 8 minutes before slicing against the grain.', 'Spoon the chimichurri over the steak.']);
R('r2_pizza_night', 'High-Protein Pizza', 'dinner', '🍕', 2, 'fresh', 25, ['Crowd pleaser', 'Weekend favorite'],
  [['greek_yogurt', 200], ['flour_ap', 200], ['pizza_sauce', 120], ['mozzarella_ps', 120], ['chicken_breast_cooked', 200], ['bell_pepper', 100], ['red_onion', 60], ['italian_seasoning', 5]],
  ['Mix the yogurt and flour into a dough, knead 5 minutes, and rest it 10.', 'Heat the oven as hot as it goes with a tray inside.', 'Stretch the dough, add sauce, cheese and toppings.', 'Bake 10 to 12 minutes until the base is crisp and blistered.']);
R('r2_sausage_gnocchi', 'Chicken Sausage & Gnocchi Skillet', 'dinner', '🥘', 3, 'fridge', 25, ['One pan', 'Quick'],
  [['chicken_sausage', 400], ['gnocchi', 400], ['spinach', 150], ['crushed_tomatoes', 300], ['garlic', 12], ['parmesan', 40], ['olive_oil', 15], ['italian_seasoning', 5]],
  ['Brown the sliced sausage in the oil, then set it aside.', 'Crisp the gnocchi in the same pan for 5 minutes without stirring much.', 'Add the tomatoes, garlic and seasoning and simmer 5 minutes.', 'Return the sausage, wilt in the spinach, and finish with parmesan.']);
R('r2_tofu_peanut_noodles', 'Peanut Tofu Noodles', 'dinner', '🥜', 3, 'fridge', 25, ['Vegan', 'Meal prep'],
  [['baked_tofu', 400], ['soba', 180], ['peanut_sauce', 120], ['carrots', 150], ['red_cabbage', 150], ['green_onion', 30], ['sesame_oil', 10], ['lemon_juice', 20]],
  ['Cook the soba, then rinse it cold.', 'Crisp the cubed tofu in a hot pan with the sesame oil.', 'Shred the carrot and cabbage.', 'Toss everything with the peanut sauce and a squeeze of lemon.']);
R('r2_chicken_broccoli_alfredo', 'Lighter Chicken Alfredo', 'dinner', '🍝', 3, 'fridge', 28, ['Comfort food', 'High protein'],
  [['chicken_breast', 500], ['protein_pasta', 200], ['broccoli', 300], ['cottage_ff', 300], ['parmesan', 50], ['garlic', 12], ['fairlife', 150], ['olive_oil', 12]],
  ['Blend the cottage cheese with the milk and garlic until completely smooth.', 'Cook the pasta, adding the broccoli for the last 3 minutes.', 'Sear the sliced chicken in the oil until cooked through.', 'Warm the sauce gently without boiling it, then toss everything together with the parmesan.']);
R('r2_carnitas_tacos', 'Slow Pork Carnitas Tacos', 'dinner', '🌮', 6, 'freezer', 200, ['Hands off', 'Freezes well'],
  [['pork_shoulder', 1200], ['corn_tortilla', 12], ['onion', 200], ['garlic', 20], ['cumin', 10], ['chili_powder', 12], ['orange', 1], ['salsa_verde', 200], ['fresh_herbs', 20]],
  ['Season the pork all over and put it in a slow cooker with the onion, garlic, spices and the juice of the orange.', 'Cook on low for 8 hours, or 3 hours at 300°F covered in the oven.', 'Shred it, then crisp it under the broiler for 6 minutes on a tray.', 'Serve in warm tortillas with salsa verde and coriander.']);
R('r2_miso_salmon', 'Miso-Glazed Salmon', 'dinner', '🍥', 2, 'fresh', 25, ['Omega-3', 'Quick'],
  [['salmon_fillet', 340], ['miso_paste', 40], ['maple_syrup', 20], ['soy_sauce', 15], ['rice', 140], ['bok_choy', 250], ['sesame_oil', 8], ['ginger', 8]],
  ['Whisk the miso, maple syrup, soy and grated ginger into a glaze.', 'Brush it over the salmon and bake at 400°F for 12 to 14 minutes.', 'Stir-fry the bok choy in the sesame oil for 3 minutes.', 'Serve over rice with the pan juices.']);
R('r2_chicken_pot_pie_skillet', 'Skillet Chicken Pot Pie', 'dinner', '🥧', 4, 'fridge', 45, ['Comfort food', 'One pan'],
  [['chicken_breast', 600], ['mixed_veg', 400], ['chicken_broth', 400], ['fairlife', 250], ['flour_ap', 40], ['butter', 30], ['onion', 120], ['kodiak', 150], ['garlic_powder', 4]],
  ['Cook the diced chicken and onion in the butter, then stir in the flour for a minute.', 'Add the broth and milk slowly, stirring, until it thickens.', 'Stir in the vegetables and season well.', 'Spoon the pancake mix batter over the top and bake at 400°F for 22 minutes until golden.']);
R('r2_stuffed_chicken', 'Spinach & Feta Stuffed Chicken', 'dinner', '🍗', 2, 'fridge', 35, ['High protein', 'Low carb'],
  [['chicken_breast', 400], ['spinach', 150], ['feta', 80], ['cream_cheese_light', 60], ['garlic', 10], ['olive_oil', 15], ['red_potato', 350], ['paprika', 4]],
  ['Wilt the spinach with the garlic, squeeze it dry, and mix with the feta and cream cheese.', 'Cut a pocket in each breast and stuff it, closing with a toothpick.', 'Sear 3 minutes a side, then finish in a 400°F oven for 15 minutes.', 'Roast the potatoes alongside.']);
R('r2_veg_burrito_bake', 'Black Bean Burrito Bake', 'dinner', '🫔', 4, 'fridge', 45, ['Vegetarian', 'Meal prep'],
  [['black_beans', 500], ['brown_rice', 200], ['enchilada_sauce', 400], ['cheese_shred', 150], ['corn', 200], ['bell_pepper', 200], ['flour_tortilla', 4], ['onion', 120], ['taco_seasoning', 12]],
  ['Cook the rice and mix it with the beans, corn, peppers, onion, seasoning and half the sauce.', 'Layer tortillas and filling in a dish, finishing with the rest of the sauce.', 'Top with cheese and bake at 375°F for 30 minutes.', 'Rest 10 minutes before cutting so it holds together.']);

/* ---------------- SNACK ---------------- */
R('r2_cottage_pineapple', 'Cottage Cheese & Pineapple', 'snack', '🍍', 1, 'fresh', 2, ['No-cook', 'Under 5 minutes'],
  [['cottage_ff', 170], ['pineapple', 100], ['chia', 6]],
  ['Spoon the cottage cheese into a bowl.', 'Top with pineapple and chia seeds.']);
R('r2_tuna_crackers', 'Tuna & Crackers', 'snack', '🥫', 1, 'fresh', 4, ['Pantry staples', 'High protein'],
  [['tuna_pouch', 110], ['wg_crackers', 30], ['light_mayo', 12], ['dijon', 6], ['pickles', 30]],
  ['Mix the tuna with the mayo and mustard.', 'Spoon onto the crackers with a slice of pickle on each.']);
R('r2_turkey_rollups', 'Turkey & Cheese Roll-Ups', 'snack', '🌯', 1, 'fridge', 4, ['No-cook', 'Low carb'],
  [['deli_turkey', 120], ['string_cheese', 2], ['dijon', 8], ['cucumber', 60]],
  ['Lay the turkey slices flat and spread a little mustard on each.', 'Put a cheese stick and a cucumber spear on each and roll them up.']);
R('r2_protein_shake_choc', 'Chocolate Peanut Shake', 'snack', '🥤', 1, 'fresh', 3, ['Blender', 'Post-workout'],
  [['whey', 35], ['pb2', 16], ['banana', 1], ['fairlife', 300], ['cocoa', 5], ['zero_sweetener', 3]],
  ['Blend everything with ice for 30 seconds.', 'Add more milk if it is thicker than you want.']);
R('r2_edamame_snack', 'Sea-Salt Edamame', 'snack', '🫛', 1, 'fresh', 6, ['Vegan', 'Under 10 minutes'],
  [['edamame', 200], ['salt', 2], ['sesame_oil', 4]],
  ['Steam or microwave the edamame for 4 to 5 minutes.', 'Toss with a little sesame oil and flaky salt.', 'Eat the beans and discard the pods.']);
R('r2_apple_pb', 'Apple & Peanut Butter', 'snack', '🍏', 1, 'fresh', 3, ['No-cook', 'Portable'],
  [['apple', 1], ['pb', 24], ['cinnamon', 1]],
  ['Core and slice the apple.', 'Serve with the peanut butter for dipping and a dusting of cinnamon.']);
R('r2_greek_yogurt_dip', 'Greek Yogurt Ranch & Veg', 'snack', '🥕', 2, 'fridge', 8, ['Vegetarian', 'Make ahead'],
  [['greek_yogurt', 250], ['ranch', 20], ['carrots', 200], ['celery', 120], ['bell_pepper', 150], ['garlic_powder', 3], ['fresh_herbs', 6]],
  ['Stir the ranch, garlic powder and herbs through the yogurt.', 'Cut the vegetables into sticks.', 'Keeps 4 days; the dip gets better after a few hours.']);
R('r2_protein_trail_mix', 'Protein Trail Mix', 'snack', '🥜', 4, 'fridge', 5, ['Portable', 'Make ahead'],
  [['almonds', 100], ['pumpkin_seeds', 60], ['dried_cranberries', 60], ['dark_chocolate', 60], ['peanuts', 60]],
  ['Mix everything in a jar.', 'Portion into small bags so a handful stays a handful.']);
R('r2_cottage_toast', 'Whipped Cottage Cheese Toast', 'snack', '🍞', 1, 'fresh', 6, ['Quick', 'High protein'],
  [['cottage_ff', 150], ['sourdough', 1], ['cherry_tomato', 60], ['olive_oil', 6], ['fresh_herbs', 4], ['black_pepper', 1]],
  ['Blend the cottage cheese until it is smooth and thick.', 'Toast the bread and spread it on.', 'Top with halved tomatoes, oil, herbs and plenty of pepper.']);
R('r2_hummus_plate', 'Hummus & Veg Plate', 'snack', '🫓', 1, 'fresh', 5, ['Vegetarian', 'No-cook'],
  [['hummus', 100], ['ww_pita', 1], ['cucumber', 80], ['carrots', 80], ['cherry_tomato', 80], ['olives', 30]],
  ['Spoon the hummus into a bowl and make a well in the middle.', 'Cut the pita into triangles and the vegetables into sticks.', 'Arrange everything on a plate.']);
R('r2_hard_boiled_snack', 'Eggs & Everything Seasoning', 'snack', '🥚', 1, 'fridge', 12, ['Make ahead', 'Low carb'],
  [['egg_boiled', 3], ['sesame_seeds', 5], ['salt', 1], ['hot_sauce', 10]],
  ['Boil the eggs 9 minutes, then cool them in ice water.', 'Peel, halve and season with sesame, salt and hot sauce.', 'Boil a batch on Sunday and they keep a week.']);
R('r2_protein_popcorn', 'Parmesan Popcorn', 'snack', '🍿', 2, 'fresh', 6, ['Low calorie', 'Movie night'],
  [['popcorn', 60], ['parmesan', 30], ['nutritional_yeast', 10], ['olive_oil', 10], ['garlic_powder', 3]],
  ['Pop the corn.', 'Toss it hot with the oil so the toppings stick.', 'Shower over the parmesan, nutritional yeast and garlic powder.']);
R('r2_smoked_salmon_cucumber', 'Smoked Salmon Cucumber Bites', 'snack', '🥒', 1, 'fresh', 8, ['No-cook', 'Low carb'],
  [['smoked_salmon', 80], ['cucumber', 150], ['cream_cheese_light', 40], ['capers', 10], ['fresh_herbs', 5]],
  ['Cut the cucumber into thick coins.', 'Pipe or spoon a little cream cheese onto each.', 'Top with a fold of salmon, a caper and some dill.']);
R('r2_jerky_cheese', 'Jerky & Cheese Box', 'snack', '🧀', 1, 'fresh', 3, ['Portable', 'No-cook'],
  [['jerky', 50], ['babybel_light', 2], ['grapes', 100], ['almonds', 20]],
  ['Put everything in a container.', 'That is the recipe.']);
R('r2_protein_iced_coffee', 'Protein Iced Coffee', 'snack', '☕', 1, 'fresh', 3, ['Under 5 minutes', 'Pre-workout'],
  [['cold_brew', 300], ['whey', 30], ['fairlife', 150], ['zero_sweetener', 3], ['cinnamon', 1]],
  ['Shake the whey with the milk first, so it does not clump in the cold coffee.', 'Pour it over ice and top with the cold brew.', 'Dust with cinnamon.']);

/* ---------------- DESSERT ----------------
   Never planned for you: add one to a day yourself and the rest of that day resizes around it. */
R('r2_protein_brownies', 'Fudgy Protein Brownies', 'dessert', '🍫', 9, 'fridge', 35, ['High protein', 'Batch friendly'],
  [['black_beans', 400], ['cocoa', 50], ['whey', 90], ['egg', 3], ['maple_syrup', 80], ['pb', 60], ['vanilla', 5], ['sf_choc_chips', 60], ['baking_mix', 30]],
  ['Heat the oven to 350°F and line an 8-inch tin.', 'Blend the rinsed beans, eggs, syrup, peanut butter and vanilla until completely smooth.', 'Pulse in the cocoa, whey and baking mix, then fold in the chips by hand.', 'Bake 22 to 25 minutes; the middle should still look slightly underdone. Cool fully before cutting.']);
R('r2_choc_protein_mousse', 'Chocolate Protein Mousse', 'dessert', '🍮', 2, 'fridge', 10, ['No-bake', 'High protein'],
  [['greek_yogurt', 300], ['casein', 50], ['cocoa', 15], ['zero_sweetener', 15], ['fairlife', 60], ['dark_chocolate', 20]],
  ['Whisk the casein, cocoa and sweetener into the milk until smooth.', 'Fold that through the yogurt in three additions so it stays light.', 'Chill 30 minutes.', 'Grate the dark chocolate over the top.']);
R('r2_pb_protein_cups', 'Peanut Butter Protein Cups', 'dessert', '🥜', 12, 'freezer', 20, ['No-bake', 'Freezer'],
  [['pb', 180], ['pb2', 60], ['whey', 60], ['honey', 60], ['dark_chocolate', 150], ['coconut_oil', 20], ['salt', 2]],
  ['Mix the peanut butter, powdered peanut butter, whey and honey into a stiff paste.', 'Melt the chocolate with the coconut oil and spoon half into 12 mini cases; freeze 10 minutes.', 'Add a disc of the filling to each, then cover with the rest of the chocolate.', 'Freeze 20 minutes. Keep them frozen and eat straight from there.']);
R('r2_protein_cheesecake', 'No-Bake Protein Cheesecake', 'dessert', '🍰', 8, 'fridge', 25, ['No-bake', 'High protein'],
  [['cream_cheese_light', 340], ['greek_yogurt', 300], ['whey', 90], ['graham', 120], ['butter', 50], ['zero_sweetener', 40], ['gelatin', 14], ['vanilla', 6], ['strawberries', 200]],
  ['Blitz the graham crackers with the melted butter and press into a springform tin; chill.', 'Bloom the gelatin in 60 ml cold water, then warm it until clear.', 'Beat the cream cheese, yogurt, whey, sweetener and vanilla smooth, then beat in the gelatin.', 'Pour over the base and chill at least 4 hours. Top with sliced strawberries.']);
R('r2_banana_protein_bread', 'Banana Protein Bread', 'dessert', '🍌', 10, 'freezer', 60, ['Batch friendly', 'Freezes well'],
  [['banana', 4], ['oat_flour', 180], ['whey', 90], ['egg', 3], ['greek_yogurt', 150], ['maple_syrup', 60], ['cinnamon', 5], ['baking_mix', 20], ['walnuts', 60]],
  ['Heat the oven to 350°F and line a loaf tin.', 'Mash the bananas and beat in the eggs, yogurt and syrup.', 'Fold in the oat flour, whey, cinnamon and baking mix until just combined, then the walnuts.', 'Bake 45 to 50 minutes, until a skewer comes out clean. Cool in the tin.']);
R('r2_greek_frozen_yogurt_bark', 'Berry Frozen Yogurt Bark', 'dessert', '🍓', 8, 'freezer', 10, ['No-bake', 'Freezer'],
  [['greek_yogurt', 500], ['whey', 40], ['honey', 40], ['strawberries', 150], ['blueberries', 100], ['dark_chocolate', 40]],
  ['Stir the whey and honey through the yogurt.', 'Spread it 1 cm thick on a lined tray.', 'Scatter over the sliced berries and grated chocolate.', 'Freeze 4 hours, then break into shards. Keep frozen.']);
R('r2_protein_rice_treats', 'Protein Rice Crispy Treats', 'dessert', '🍬', 10, 'fridge', 15, ['No-bake', 'Kid friendly'],
  [['puffed_rice', 120], ['mini_marshmallows', 150], ['whey', 100], ['pb', 80], ['butter', 30], ['sf_choc_chips', 40]],
  ['Melt the butter and marshmallows over low heat, then stir in the peanut butter.', 'Take it off the heat and stir in the whey quickly, before it stiffens.', 'Fold in the puffed rice and press into a lined tin.', 'Scatter the chips on top and chill 30 minutes before cutting.']);
R('r2_cottage_cheesecake_jar', 'Cottage Cheese Cheesecake Jars', 'dessert', '🫙', 2, 'fridge', 10, ['No-bake', 'High protein'],
  [['cottage_ff', 300], ['whey', 30], ['graham', 40], ['zero_sweetener', 15], ['vanilla', 4], ['berries', 120], ['lemon_juice', 10]],
  ['Blend the cottage cheese with the whey, sweetener, vanilla and lemon until completely smooth — keep going past the point it looks done.', 'Crush the graham crackers.', 'Layer crumb, cream and berries in two jars.', 'Chill 30 minutes so the crumb softens slightly.']);
R('r2_protein_tiramisu', 'Protein Tiramisu Cups', 'dessert', '☕', 4, 'fridge', 20, ['No-bake', 'Make ahead'],
  [['mascarpone', 120], ['greek_yogurt', 300], ['whey', 60], ['ladyfingers', 80], ['coffee', 200], ['cocoa', 10], ['zero_sweetener', 20]],
  ['Beat the mascarpone, yogurt, whey and sweetener until thick and smooth.', 'Dip the ladyfingers in the cooled coffee for one second each — any longer and they collapse.', 'Layer biscuit and cream twice in four glasses.', 'Chill at least 4 hours, then dust with cocoa just before serving.']);
R('r2_protein_cookie_dough', 'Edible Protein Cookie Dough', 'dessert', '🍪', 4, 'fridge', 10, ['No-bake', 'Under 10 minutes'],
  [['chickpeas', 240], ['pb', 80], ['whey', 60], ['maple_syrup', 50], ['oat_flour', 40], ['vanilla', 5], ['sf_choc_chips', 60], ['salt', 2]],
  ['Blend the rinsed chickpeas with the peanut butter, syrup and vanilla until there is no grain left.', 'Pulse in the whey, oat flour and salt.', 'Fold in the chips by hand.', 'Chill 30 minutes. It keeps 5 days.']);
R('r2_apple_crisp', 'Protein Apple Crisp', 'dessert', '🍎', 6, 'fridge', 45, ['Warm', 'Fall'],
  [['apple', 6], ['oats', 120], ['whey', 45], ['almond_flour', 60], ['butter', 60], ['cinnamon', 8], ['maple_syrup', 50], ['lemon_juice', 15]],
  ['Heat the oven to 375°F. Slice the apples and toss them with the lemon, half the cinnamon and half the syrup.', 'Rub the oats, whey, almond flour, butter, the rest of the cinnamon and syrup into a rough crumble.', 'Scatter it over the apples in a baking dish.', 'Bake 35 minutes until the top is golden and the fruit bubbles at the edges.']);
R('r2_choc_chia_pudding', 'Chocolate Chia Pudding', 'dessert', '🍫', 2, 'fridge', 5, ['No-bake', 'Vegan option'],
  [['chia', 50], ['almond_milk', 400], ['cocoa', 20], ['plant_protein', 40], ['maple_syrup', 30], ['vanilla', 4], ['raspberries', 80]],
  ['Whisk the milk, cocoa, protein, syrup and vanilla until there are no lumps.', 'Stir in the chia, wait 5 minutes, then stir hard again.', 'Chill at least 4 hours.', 'Top with raspberries.']);
R('r2_protein_fudge', 'Freezer Protein Fudge', 'dessert', '🍫', 12, 'freezer', 10, ['No-bake', 'Freezer'],
  [['almond_butter', 200], ['cocoa', 30], ['whey', 60], ['coconut_oil', 40], ['maple_syrup', 60], ['salt', 2]],
  ['Warm the almond butter and coconut oil until pourable.', 'Whisk in the cocoa, whey, syrup and salt until glossy.', 'Pour into a lined loaf tin, 1 cm deep.', 'Freeze 1 hour and cut into 12. It softens fast, so keep it frozen.']);
R('r2_pumpkin_protein_pie', 'Crustless Pumpkin Protein Pie', 'dessert', '🎃', 8, 'fridge', 55, ['Fall', 'Batch friendly'],
  [['pumpkin_puree', 450], ['egg', 3], ['fairlife', 250], ['whey', 60], ['maple_syrup', 70], ['pumpkin_spice', 10], ['vanilla', 5]],
  ['Heat the oven to 350°F and grease a pie dish.', 'Blend everything until smooth.', 'Pour it in and bake 45 to 50 minutes, until the centre barely wobbles.', 'Cool completely, then chill. It sets as it cools.']);
R('r2_protein_donuts', 'Baked Protein Donuts', 'dessert', '🍩', 6, 'fridge', 25, ['Baked', 'Batch friendly'],
  [['kodiak', 150], ['whey', 60], ['egg', 2], ['greek_yogurt', 150], ['fairlife', 80], ['zero_sweetener', 30], ['sf_choc_chips', 50], ['vanilla', 4]],
  ['Heat the oven to 350°F and grease a donut tin.', 'Whisk everything except the chips into a thick batter.', 'Pipe it into the tin, filling each two thirds.', 'Bake 12 to 14 minutes, then dip the cooled tops in melted chips.']);
R('r2_yogurt_bark_pb', 'Peanut Butter Cup Yogurt Bark', 'dessert', '🍫', 8, 'freezer', 10, ['No-bake', 'Freezer'],
  [['greek_yogurt', 500], ['pb', 80], ['cocoa', 15], ['honey', 40], ['dark_chocolate', 50], ['peanuts', 40]],
  ['Stir the honey and cocoa through the yogurt.', 'Spread it on a lined tray and swirl the warmed peanut butter through it.', 'Scatter over chopped chocolate and peanuts.', 'Freeze 4 hours and break into pieces.']);
R('r2_protein_panna_cotta', 'Vanilla Protein Panna Cotta', 'dessert', '🍨', 4, 'fridge', 15, ['Make ahead', 'Low carb'],
  [['fairlife', 500], ['heavy_cream', 80], ['whey', 60], ['gelatin', 12], ['zero_sweetener', 30], ['vanilla', 6], ['berries', 150]],
  ['Bloom the gelatin in 60 ml cold water for 5 minutes.', 'Warm the milk, cream, sweetener and vanilla without boiling, then whisk in the gelatin until dissolved.', 'Take it off the heat, cool 5 minutes, then whisk in the whey.', 'Pour into four glasses and chill 4 hours. Serve with berries.']);
R('r2_protein_gummies', 'Fruit Protein Gummies', 'dessert', '🍬', 6, 'fridge', 15, ['Low calorie', 'Kid friendly'],
  [['sf_jello', 400], ['gelatin', 30], ['whey', 30], ['berries', 100]],
  ['Blend the berries with 200 ml water and warm it gently.', 'Whisk in the gelatin and jelly powder until fully dissolved, then the whey off the heat.', 'Pour into silicone moulds.', 'Chill 2 hours. They keep a week.']);
R('r2_protein_ice_cream_bowl', 'Blended Protein Ice Cream', 'dessert', '🍦', 1, 'fresh', 5, ['Blender', 'Under 5 minutes'],
  [['banana', 2], ['whey', 30], ['fairlife', 80], ['pb2', 12], ['zero_sweetener', 5]],
  ['Freeze the sliced bananas solid, at least 3 hours.', 'Blend them with everything else, scraping down often, until it turns creamy.', 'Eat it straight away — it sets hard in the freezer.']);
R('r2_mug_cake', 'Chocolate Protein Mug Cake', 'dessert', '☕', 1, 'fresh', 5, ['Under 5 minutes', 'Single serve'],
  [['whey', 30], ['oat_flour', 25], ['cocoa', 8], ['egg', 1], ['fairlife', 60], ['baking_mix', 8], ['sf_choc_chips', 15]],
  ['Whisk everything in a mug until smooth.', 'Microwave 60 seconds, then in 10-second bursts until it just sets.', 'Stop early rather than late — overcooked protein cake goes rubbery.']);
R('r2_berry_crumble_cups', 'Berry Protein Crumble Cups', 'dessert', '🫐', 4, 'fridge', 30, ['Baked', 'Make ahead'],
  [['blueberries', 300], ['raspberries', 150], ['oats', 80], ['whey', 40], ['almond_flour', 40], ['butter', 40], ['maple_syrup', 30], ['cinnamon', 4]],
  ['Heat the oven to 375°F.', 'Divide the berries between four ramekins.', 'Rub the oats, whey, almond flour, butter, syrup and cinnamon into a crumble and pile it on.', 'Bake 22 minutes until bubbling at the edges.']);
R('r2_choc_covered_strawberries', 'Chocolate Protein Strawberries', 'dessert', '🍓', 4, 'fridge', 15, ['No-bake', 'Date night'],
  [['strawberries', 400], ['dark_chocolate', 100], ['whey', 20], ['coconut_oil', 10], ['pistachios', 30]],
  ['Melt the chocolate with the coconut oil, then stir in the whey until smooth.', 'Dry the strawberries completely — any water makes the chocolate seize.', 'Dip each one and set it on parchment.', 'Sprinkle with chopped pistachios and chill 15 minutes.']);
R('r2_protein_flan', 'Coffee Protein Flan', 'dessert', '🍮', 4, 'fridge', 50, ['Make ahead', 'Low carb'],
  [['fairlife', 500], ['egg', 4], ['whey', 40], ['sf_caramel', 60], ['coffee', 100], ['vanilla', 4], ['zero_sweetener', 25]],
  ['Heat the oven to 325°F and put a kettle on for a water bath.', 'Spoon the caramel into four ramekins.', 'Whisk the milk, coffee, eggs, whey, vanilla and sweetener, then strain it over the caramel.', 'Bake in the water bath 35 to 40 minutes until just set, then chill 4 hours and turn out.']);
R('r2_protein_sorbet', 'Mango Protein Sorbet', 'dessert', '🥭', 2, 'freezer', 8, ['Blender', 'Dairy free'],
  [['mango', 300], ['plant_protein', 40], ['coconut_milk_light', 100], ['lemon_juice', 15], ['zero_sweetener', 10]],
  ['Use frozen mango straight from the bag.', 'Blend it with everything else, pushing it down often, until smooth.', 'Serve immediately, or freeze 30 minutes for a firmer scoop.']);
R('r2_protein_oat_cookies', 'Chewy Protein Oat Cookies', 'dessert', '🍪', 12, 'fridge', 25, ['Batch friendly', 'Freezes well'],
  [['oats', 180], ['whey', 90], ['pb', 100], ['banana', 2], ['egg', 1], ['maple_syrup', 60], ['sf_choc_chips', 70], ['cinnamon', 4]],
  ['Heat the oven to 350°F and line a tray.', 'Mash the bananas with the peanut butter, egg and syrup.', 'Stir in the oats, whey and cinnamon, then the chips.', 'Scoop 12 cookies, flatten them slightly, and bake 11 to 13 minutes. They firm up as they cool.']);
BASE_RECIPES.push(...R2);

/* The planner draws from a hand-ordered sequence per slot rather than the whole library, so
   these have to be added to it or they would sit in the library and never be scheduled. The
   original entries stay at the front; these widen the rotation behind them. Cooked-fish recipes
   are deliberately left out of the default rotation and stay available in the library, and
   desserts are not here at all — the planner never schedules those. */
const R2_SEQ = {
  breakfast: ['r2_egg_muffins', 'r2_protein_french_toast', 'r2_oat_pancakes_blueberry', 'r2_shakshuka', 'r2_chia_pudding',
              'r2_breakfast_hash', 'r2_protein_waffles', 'r2_skyr_granola', 'r2_breakfast_quesadilla', 'r2_apple_cinnamon_oats',
              'r2_tofu_scramble', 'r2_cottage_pancakes', 'r2_yogurt_parfait', 'r2_pb_banana_toast'],
  lunch: ['r2_chipotle_bowl', 'r2_chicken_caesar_bowl', 'r2_mediterranean_bowl', 'r2_turkey_chili_bowl', 'r2_poke_bowl',
          'r2_chicken_soup', 'r2_protein_pasta_salad', 'r2_cobb_salad', 'r2_banh_mi_bowl', 'r2_shrimp_avocado_salad',
          'r2_deli_chopped_salad', 'r2_loaded_sweet_potato', 'r2_egg_salad_sandwich', 'r2_turkey_club_wrap',
          'r2_chickpea_salad_pita', 'r2_beef_lettuce_wraps', 'r2_caprese_chicken', 'r2_bbq_chicken_flatbread'],
  dinner: ['r2_sheet_pan_chicken_veg', 'r2_beef_broccoli', 'r2_turkey_meatballs_marinara', 'r2_chicken_fajitas', 'r2_stuffed_peppers',
           'r2_chicken_curry', 'r2_chicken_parm', 'r2_pork_stirfry', 'r2_meatloaf', 'r2_chicken_shawarma',
           'r2_shrimp_scampi', 'r2_veggie_lentil_curry', 'r2_steak_chimichurri', 'r2_sausage_gnocchi', 'r2_tofu_peanut_noodles',
           'r2_chicken_broccoli_alfredo', 'r2_carnitas_tacos', 'r2_stuffed_chicken', 'r2_bison_burgers', 'r2_pizza_night',
           'r2_chicken_pot_pie_skillet', 'r2_veg_burrito_bake'],
  snack1_rest: ['r2_cottage_pineapple', 'r2_greek_yogurt_dip', 'r2_protein_shake_choc', 'r2_hummus_plate', 'r2_cottage_toast'],
  snack2_rest: ['r2_hard_boiled_snack', 'r2_apple_pb', 'r2_turkey_rollups', 'r2_edamame_snack', 'r2_jerky_cheese', 'r2_protein_popcorn']
};
