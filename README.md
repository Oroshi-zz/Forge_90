<div align="center">

<img src="server/public/icon.png" width="96" alt="FORGE 90 logo">

# FORGE 90

![Version](https://img.shields.io/badge/version-v1.0-a3e635) ![Docker](https://img.shields.io/badge/docker-ghcr.io%2Foroshi--zz%2Fforge__90-2496ed) ![Node](https://img.shields.io/badge/node-18%2B-5fa04e)

**A self-hosted weight-lifting and meal-planning web app.**
A 90-day Push / Pull / Legs program that keeps going in 13-week cycles, meals scaled to your macros every day, a money-saving grocery planner, and weigh-in and PR tracking. Everyone in your household gets their own account, by invitation from an admin.

![Dashboard](docs/screenshots/dashboard.png)

</div>

---

## Contents

- [Highlights](#highlights)
- [Screenshots](#screenshots)
- [Features in detail](#features-in-detail)
  - [First-run questionnaire](#first-run-questionnaire) · [Training plan](#training-plan) · [Dashboard & set logging](#dashboard--set-logging) · [Calendar & day view](#calendar--day-view) · [Nutrition engine](#nutrition-engine) · [Meals & recipes](#meals--recipes) · [Foods & preferences](#foods--preferences) · [Grocery & money saver](#grocery--money-saver) · [Meal-plan sync](#meal-plan-sync) · [Progress](#progress) · [Accounts & security](#accounts--security) · [Admin console](#admin-console) · [Account settings](#account-settings) · [Look & feel](#look--feel)
- [Install on Unraid (Docker)](#install-on-unraid-docker)
- [Configuration](#configuration)
- [Email setup (Gmail)](#email-setup-gmail)
- [First sign-in](#first-sign-in)
- [HTTPS & reverse proxies](#https--reverse-proxies)
- [Updating, backups & recovery](#updating-backups--recovery)
- [Development](#development)
- [Security notes](#security-notes)
- [Credits](#credits)

---

## Highlights

| | |
|---|---|
| 🧭 **Guided setup** | A short questionnaire the first time someone signs in: name and nickname, weight, body fat (or an estimate from height, age and sex), goal weight, activity level, loss rate and money-saving meal planning. |
| 🏋️ **Training** | 90-day launch (Foundation → Build → Intensify → Test), then repeating 13-week cycles. Rolling Push / Pull / Legs split for any number of training days, with a mix of strength and hypertrophy work, RIR targets and progression hints. |
| 🔁 **Exercise rotation** | 60 exercises across 20 movement slots with 3+ variations each, rotating weekly. Switch exercises off (at least one stays on per muscle group) or add your own. |
| 🍽️ **Nutrition** | Katch–McArdle targets, a loss rate you choose, 0.5–1 g protein per lb, extra carbs on training days. Automatic maintenance when you hit your goal. |
| 🥗 **Meals** | 36 popular high-protein recipes with source links. Every portion is re-scaled daily to hit protein and calories, and multi-serving recipes become planned leftovers. |
| ⭐ **Favorites** | Starred recipes come up about twice as often in the meal plan. |
| 👥 **Meal-plan sync** | Two people share the meals they choose, plan them together from foods they both eat, and get one combined shopping list. Changes to shared meals are accepted or declined by the other person. |
| 🛒 **Groceries** | Weekly shopping list by aisle, a batch-cook schedule, and an ingredient-sharing planner that buys fewer packages. |
| 📝 **Set logging** | Log every set (weight × reps) right on the dashboard's **Today** card, with a live set counter, PR badges and next-time targets. The full day view works too. |
| 📈 **Progress** | Weight, body fat and lean mass charts, a 7-day trend, PR detection and estimated 1-rep max, and a trend coach that suggests calorie changes. |
| 👥 **Accounts** | **Invite-only.** An admin emails an invite that lasts 7 days and works once. After that: sign-in, password-reset emails with 30-minute links, lockouts, and signed-in device management. |
| 🛡️ **Admin console** | Invite people (resend or revoke), manage users and admin roles, security rules, email settings, an activity log and backups. |
| 🐳 **Self-hosted** | A single dependency-free Node server in a small Docker image, with an Unraid template and GitHub Actions image builds. |

---

## Screenshots

| | |
|---|---|
| **Dashboard** — today's session with set logging, macros, goal outlook, quick edits<br>![Dashboard](docs/screenshots/dashboard.png) | **Today · Log sets** — weight × reps per set, live counter, PR badges, next-time targets<br>![Log sets on the dashboard](docs/screenshots/dashboard-log.png) |
| **First-run questionnaire** — body fat measured or estimated<br>![Questionnaire: your body](docs/screenshots/onboarding-body.png) | **Questionnaire** — money-saving meal planning and your starting targets<br>![Questionnaire: meal planning](docs/screenshots/onboarding-meals.png) |
| **Calendar** — drag and drop workouts and meals<br>![Calendar](docs/screenshots/calendar.png) | **Day view** — full logging table, scaled recipes<br>![Day view](docs/screenshots/day.png) |
| **Quick edit** — change a day's session or meals from the dashboard<br>![Quick edit](docs/screenshots/quick-edit.png) | **Workout plan** — phases, sessions and rotation by week<br>![Workout plan](docs/screenshots/workout-plan.png) |
| **Exercise library** — form tips, on/off switches, your own exercises<br>![Exercise library](docs/screenshots/exercise-library.png) | **Diet plan** — targets, portion scaling, trend coach<br>![Diet plan](docs/screenshots/diet-plan.png) |
| **Meal library** — favorites, filters, sort by macros<br>![Meal library](docs/screenshots/meal-library.png) | **Foods & recipes**<br>![Recipes](docs/screenshots/recipes.png) |
| **Recipe details** — per-serving and batch amounts, links<br>![Recipe details](docs/screenshots/recipe-detail.png) | **Recipe editor** — food emoji picker, tags, links<br>![Recipe editor](docs/screenshots/recipe-editor.png) |
| **Food editor** — macros, package size, reset to defaults<br>![Food editor](docs/screenshots/food-editor.png) | **Food preferences** — group › subgroup › single food<br>![Food preferences](docs/screenshots/food-preferences.png) |
| **Grocery & money saver**<br>![Grocery](docs/screenshots/grocery.png) | **Progress** — weight, body fat, lean mass, PRs<br>![Progress](docs/screenshots/progress.png) |
| **Settings**<br>![Settings](docs/screenshots/settings.png) | **Light mode + collapsed menu** — version shown at the bottom<br>![Light mode](docs/screenshots/dashboard-light.png) |
| **Sign in** — accounts are invite-only<br>![Sign in](docs/screenshots/login.png) | **First sign-in** — the default admin sets their own password<br>![First sign-in](docs/screenshots/first-run.png) |
| **Invite email** — 7-day, single-use link<br>![Invite email](docs/screenshots/email-invite.png) | **Accept an invite** — choose a password, then the questionnaire<br>![Accept invite](docs/screenshots/invite-accept.png) |
| **Account settings**<br>![Account](docs/screenshots/account.png) | **Password-reset email** — 30-minute, single-use link<br>![Reset email](docs/screenshots/email-reset.png) |
| **Admin · Overview** — pending invites, locked accounts<br>![Admin overview](docs/screenshots/admin-overview.png) | **Admin · Users** — pending invites (resend / revoke), admin switch, lockouts<br>![Admin users](docs/screenshots/admin-users.png) |
| **Admin · Invite someone**<br>![Invite someone](docs/screenshots/admin-invite.png) | **Admin · Manage a user**<br>![Manage user](docs/screenshots/admin-manage-user.png) |
| **Admin · Security**<br>![Admin security](docs/screenshots/admin-security.png) | **Admin · App settings**<br>![Admin app settings](docs/screenshots/admin-app.png) |
| **Admin · Email**<br>![Admin email](docs/screenshots/admin-email.png) | **Admin · Activity log**<br>![Admin activity](docs/screenshots/admin-activity.png) |
| **Meal-plan sync · request** — accept or decline in Account<br>![Sync request](docs/screenshots/sync-request.png) | **Meal-plan sync · settings** — shared meals, approvals, unsync<br>![Sync settings](docs/screenshots/sync-account.png) |
| **Sync button** — on the dashboard, calendar, day, diet and grocery pages<br>![Sync button](docs/screenshots/sync-dashboard.png) | **Sync panel** — accept or decline your partner's meal changes<br>![Sync panel](docs/screenshots/sync-panel.png) |
| **Shopping for two** — combined list and batch cooking<br>![Shared grocery list](docs/screenshots/grocery-shared.png) | **Forgot password**<br>![Forgot password](docs/screenshots/forgot-sent.png) |

<p align="center">
  <img src="docs/screenshots/mobile-login.png" width="240" alt="Mobile sign-in">
  <img src="docs/screenshots/mobile-dashboard.png" width="240" alt="Mobile dashboard">
  <img src="docs/screenshots/mobile-calendar.png" width="240" alt="Mobile calendar">
</p>

---

## Features in detail

### First-run questionnaire

The first time someone signs in (a new invite, the default admin, or after **Reset everything**), a four-step questionnaire sets up their plan before the app opens:

| Step | Asks for |
|---|---|
| **About you** | First name, last name and a **nickname**, which is the display name shown in the app and to a sync partner. |
| **Your body** | Current weight and body fat %. Body fat is **optional**. Leave it blank and enter height, sex and age instead, and it's estimated with the **Deurenberg formula** (from BMI, age and sex). A warning explains the estimate is less accurate than a measured body-fat % and suggests measuring it when you can. |
| **Your goal** | Goal weight (must be below your current weight), **activity level** outside the gym (sedentary to very active), and **target loss rate** (0.25–2 lb/week). It shows the daily deficit, calories and goal date as you go, and warns when the rate is above ~1% of body weight a week. |
| **Meal planning** | Whether to turn on **money-saving meal planning**, with a plain explanation of what it does, plus a summary of starting calories, protein and goal date. |

- Names are saved to the account, and everything else goes into Settings, where it can be changed later.
- While body fat is still an estimate, the dashboard and diet plan show a reminder to add a measured body-fat % to a weigh-in. It goes away once one is logged.
- Accounts made before the questionnaire existed aren't asked again.

### Training plan

- **The 90-day launch (cycle 1):**

  | Weeks | Phase | Focus |
  |---|---|---|
  | 1–4 | Foundation | Upper-body priority. Legs get about 1 session in 5 while you adapt to the deficit. |
  | 5–8 | Build | Legs back to normal frequency; more volume. |
  | 9–12 | Intensify | Heavier strength work, lower RIR. |
  | 13 | Deload & Test | Deload sessions, then a Push, Pull and Legs PR test. |

- **Cycle 2 onward:** Build → Intensify → Volume → Deload & Test, repeating every 13 weeks. The calendar always has the current and next cycle planned.
- **Push / Pull / Legs:** sessions run in a rolling order that continues across weeks, so push and pull never share a day. Pick **any number of training days** in Settings and the plan re-schedules from today forward.
- **Strength + hypertrophy:** each session mixes **S** sets (heavy, 2–3 min rest) and **H** sets (moderate, 60–120 s rest). Targets are given in **RIR** (reps in reserve) and follow the phase and the week within it.
- **Progression hints:** double progression. "Stay at 110 lb and beat 8/7/6/6 reps", or add weight once every set reaches the top of the rep range.
- **Muscle heatmap:** weekly hard sets per muscle for every phase.
- **Exercise library:**
  - **60 exercises** in 11 muscle groups. Hover any exercise for step-by-step form, cues, the common mistake, and a front/back muscle map.
  - **Switch exercises off.** They leave the rotation from this plan week (next week if you already logged them this week), and past sessions keep what you did. Every muscle group must keep at least one exercise on. Rear delts count as their own group because they're trained on pull days. If every variation in a slot is off, the plan borrows a switched-on exercise for the same muscles.
  - **Add your own.** Use the **+** card in any group, then choose equipment, muscles, the rotation slot and form steps. Your exercises join the rotation from the week they were added, and an edit button sits on each one.

### Dashboard & set logging

- **Today card:** today's session (muscle map, sets and time) plus buttons to **Edit workout**, **Edit meals**, open the workout plan or recipes.
- **Log sets right there.** Every exercise in today's session is listed with its target (sets × reps, RIR, rest), with a weight × reps box for each set:
  - saves as you type, and syncs to your account
  - a live **x / y sets** counter, a ✓ on each finished exercise, and highlighted logged sets
  - PR badges (estimated 1-rep max) and the next-time target, "stay at 110 lb and beat 8/7/6/6 reps"
  - **Mark workout complete** when you're done. A reminder pops up when every set is in.
- Before Day 1 the card previews the first session, and logging opens on Day 1. The full day view shows the same logs.
- **Also on the dashboard:** body stats and trend, the goal outlook, a quick weigh-in, the next 7 days and recent PRs.

### Calendar & day view

- **Calendar:**
  - Month and week views.
  - **Drag and drop** workouts and meals between days or onto the trash. **Ctrl/Alt-drag** copies instead of moving.
  - Undo with **Ctrl+Z** or the toast button.
  - A **library** panel of sessions and recipes you can drop onto any day.
  - On narrow screens it switches to a **compact agenda**.
- **Day view:**
  - The session, with a set-logging table (lb × reps).
  - A PR badge and e1RM on each exercise, plus **Mark complete**.
  - The day's macros, and every meal with its **scaled** ingredient amounts.
  - Leftover and cook tags, and a swap menu.
- **Quick edit from the dashboard:** **Edit workout** / **Edit meals** buttons and a pencil on each meal open a popup where you can:
  - change the session
  - swap any meal, with favorites first
  - watch the day total update live
  - step through days with ‹ ›
  - undo

### Nutrition engine

- **Calories:** BMR from **Katch–McArdle** (370 + 21.6 × lean mass in kg), times your activity level, plus a bonus on lifting days.
- **Deficit:** set by your **target loss rate** (0.25–2 lb/week; the default is 1.25).
- **Protein:** **0.5–1 g per lb** of body weight (adjustable). Fat and carbs fill the rest, and training days get more carbs.
- **Your latest weigh-in drives everything.** Body fat is estimated from your last measured lean mass when you skip it.
- **Portion solver:**
  - Each recipe ingredient has a role: protein, carb, fat or fixed.
  - Every day, protein sources are scaled to hit your protein target, then carb and fat sources are scaled to hit calories.
  - Count-based items (eggs, tortillas, muffins) are rounded to whole units, then re-balanced.
- **Trend coach:** compares your 7-day weight trend with the target and offers a one-click calorie adjustment.
- **At your goal:** when you reach your goal weight or body fat, calories switch to maintenance automatically. You can change this in Settings.

### Meals & recipes

- **36 built-in recipes:** popular high-protein meal-prep staples such as burrito bowls, turkey chili, overnight oats, protein pancakes, poke bowls and sushi night. Each has **two links** to published versions (Budget Bytes, Skinnytaste, Downshiftology, Eating Bird Food…).
- **Leftovers:** multi-serving recipes are scheduled as consecutive leftovers. Fridge meals are eaten within 4 days; freezer meals (❄) can be spread out.
- **Favorites ⭐:** starred recipes appear about **twice as often**. Changing favorites re-plans from the next plan week and never moves meals you placed by hand.
- **Filter and sort:** filter by meal, ★ Favorites, and more. Sort by **calories, protein, carbs, fat, protein per 100 kcal or name**, ascending or descending.
- **Recipe editor:**
  - A dropdown of food-only emoji.
  - Chips for tags you've already used.
  - A links section.
  - Ingredients chosen from 650+ foods grouped by subcategory.
  - Servings, storage and prep time.
  - A "fixed portion" option and an "include in auto-plan" option.
- **Built-in recipes** can be edited, duplicated, reset or switched off. Clicking any recipe opens its details.

### Foods & preferences

- **657 foods** in **16 groups / 76 subgroups**: meats, seafood (sushi-grade vs cooked), dairy, plant proteins, grains, fruit, vegetables, sauces, drinks, prepared/takeout and more. Values are approximated from USDA FoodData Central and typical US labels.
- **Food editor:**
  - Edit macros, the basis (per 100 g, per 100 ml or per item), grocery aisle, portion role and **package size**.
  - Built-in foods have **Reset to defaults**, and show the default under any field you've changed.
- **Food preferences:** a vertical checkbox tree (group › subgroup › every food) with search, expand/collapse and partly-checked states. Unchecking anything hides recipes that use it and swaps it out of upcoming meals.
- **Seafood default:** cooked fish and shellfish are off out of the box; sushi and poke fish and canned tuna stay on.

### Grocery & money saver

- **Shopping list:** weekly, grouped by aisle and summed from your exact scaled portions, including leftovers. Items show ≈ package counts, you can tick them off, and you can copy or print the list.
- **Batch-cook schedule:** what to cook, when, and which days each batch covers.
- **Money saver:** when meals are planned, each slot looks at the next 3 recipes in its rotation and picks the one with the best shopping score:

  ```
  score = Σ ingredients  w × ( min(a, R) ÷ P − ⌈ max(0, a − R) ÷ P ⌉ ) ÷ servings
  ```

  - **a:** how much of the ingredient the recipe needs.
  - **R:** what's left in packages you're already buying that week.
  - **P:** the package size.
  - **w:** how fast the food spoils.

  No recipe waits more than two turns, so variety and favorites are unchanged. With the default plan that averages about **4 fewer items and 4 fewer fresh packages a week**. The Money saver card shows this week's savings and which ingredients are shared, and has an on/off switch.

### Meal-plan sync

Two people in the same household can sync their meal plans. Set it up in **Account → Meal-plan sync**:

1. **Request:** enter the other person's FORGE 90 email and tick the meals to share (breakfast, lunch, dinner and each snack; all are ticked by default). They're emailed and see the request on their dashboard.
2. **Accept:** they review it in Account and accept or decline. On accept, the shared meals from the next day on are **re-planned together**:
   - only recipes you can **both** eat, based on each person's food preferences
   - **both** people's ★ favorites
   - multi-serving recipes are cooked for two, so a 4-serving batch covers two days instead of four
3. **Stay in sync:**
   - When either person changes a shared meal (swap, drag and drop, quick edit, food-preference swaps), it **changes for them right away** and is **sent automatically** to the other person.
   - The other person **accepts** it, and their plan updates to match, or **declines** it, and they each keep their own meal that day.
   - You can **undo** a change you sent while it's still waiting.
4. **Shared shopping:** the grocery list, batch-cook schedule and cook notes include **both people's portions** of every shared meal ("COOK ×4 — 2 for you, 2 for Sam"), and checking an item off checks it off for both. Everyone's portions are still sized to their own calories and protein.
5. **Change what's shared:** either person can ask to add or remove meals from the shared list; the other approves it. Newly shared meals are planned together.
6. **Unsync** at any time from Account. Both people keep their current meals, and their plans are separate from then on.

The **Sync** button only appears while a sync is active. It's on the Dashboard (Today card), Calendar, Day view, Diet plan and Grocery pages, with a badge counting changes waiting on you. It opens the sync panel:

- **Waiting on you:** accept, decline, or accept/decline all
- **Waiting on your partner:** with undo
- **Recent:** sync activity

Shared meals show a small 👥 badge. Meals with a change waiting show 👥? (to review) or 👥… (sent).

### Progress

- **Charts:** body weight (daily points, 7-day average, plan line), body fat % and lean mass.
- **Strength:** a chart per exercise with estimated 1-rep max, and **PR** detection.
- **Quick weigh-in** on the dashboard and the Progress page.

### Accounts & security

- **Invite-only accounts:** nobody can create an account on their own. An admin enters an email address, plus an optional name and role, and FORGE 90 sends a branded invite:
  - the link lasts **7 days** and works once
  - **Resend** sends a fresh 7-day link and the old one stops working; **Revoke** cancels it
  - the invitee chooses a password on an **Accept invite** page, is signed straight in, and goes through the [first-run questionnaire](#first-run-questionnaire)
  - admin invites create administrators; everyone else joins as a member
- **Sign-in page:** a photo panel next to the form, "keep me signed in", and a password strength meter wherever a password is chosen.
- **Forgot password:** emails a **branded reset link** that expires after **30 minutes** and works once. Requesting a new link stops the old one working.
- **Lockout:** after 5 failed sign-ins (configurable) the account locks for 15 minutes, and the owner is **emailed a reset link automatically**.
- **Your data follows you:** each account's plan is saved on the server and syncs across devices. Coming back to a tab picks up changes made elsewhere.
- **Notices:** appear for **10 seconds**, pause while you hover, and have a close button.

### Admin console

| Tab | What you can do |
|---|---|
| **Overview** | Account, invite and session counts, sign-ins and failures in the last 24 h, reset emails sent and failed, **pending invites** (resend / revoke), locked accounts, quick switches. |
| **Users** | **Invite user** emails a 7-day invite (member or administrator). **Pending invites** shows who's invited, by whom, when it was sent and when it expires, with **Resend** and **Revoke**. Search and filter accounts. An **Admin switch** gives or removes admin privileges (the last admin is protected). **Manage** lets you disable or enable, unlock, email a reset link, set a temporary password, sign out every device, edit name or email, download their plan data, or delete the account. |
| **Security** | Minimum password length and complexity, failed attempts before lockout and how long it lasts, emailing a reset link on lockout, session length, "keep me signed in" length, and password-change emails. |
| **App settings** | App name, the app address used in invite and reset links, and default theme for new accounts. |
| **Email** | SMTP host, port and security, username, app password, and From name and address. Shows whether each value comes from the environment or was set here. **Send a test.** |
| **Activity log** | Sign-ins, failures, lockouts, resets, invites (sent, re-sent, revoked, accepted), profile and role changes, and settings changes, with time, account, who did it, and IP. Filter by event type or account. |
| **Data & backup** | Download a full JSON backup (accounts without passwords, every plan, settings), plus app version, data folder, size, Node version and uptime. |

### Account settings

- **Profile:** first name, last name, **nickname** (display name) and email. Changing your email needs your current password, and a notice goes to the old address.
- **Meal-plan sync:** send, accept or decline a sync request, choose shared meals, and unsync. See [Meal-plan sync](#meal-plan-sync).
- **Password:** change it with a strength meter; your other devices are signed out.
- **Emails:** choose whether to get an email when your password changes.
- **Signed-in devices:** browser and OS, IP, and last activity. Sign one out or all the others.
- **Recent activity:** your own security events.
- **Your data:** last saved time and size, export or import a backup, and **delete account** (confirmed with your password).

### Look & feel

- Glass UI over a different fitness photo per section, in dark, light or system theme. Turn the photos off in **Settings → Appearance → Background photos** for a plain background.
- **Collapsible side menu**, with a theme button when collapsed. The **version** (v1.0) shows at the bottom of the menu and on Settings.
- Works on phones: a top-bar menu and a compact calendar agenda.

---

## Install on Unraid (Docker)

FORGE 90 ships as a small Docker image: Node 22 on Alpine, no npm packages, and one data folder.

### 1. Get the image

The included **GitHub Actions** workflow (`.github/workflows/docker-publish.yml`) builds the image and publishes it to GitHub Container Registry on every push to `main`:

```
ghcr.io/oroshi-zz/forge_90:latest
```

1. Push this repository to GitHub, then open the **Actions** tab and wait for **Build & publish Docker image** to finish.
2. Let Unraid pull the image. Either:
   - make the package public: GitHub → your profile → **Packages** → `forge_90` → **Package settings** → **Change visibility → Public**; **or**
   - keep it private and sign in once from the Unraid terminal: `docker login ghcr.io -u Oroshi-zz` with a personal access token that has `read:packages`.

### 2. Add the container

**With the template (recommended):**

1. Copy `unraid/forge90.xml` to your flash drive at `/boot/config/plugins/dockerMan/templates-user/my-forge90.xml`. You can use the Unraid terminal:

   ```bash
   wget -O /boot/config/plugins/dockerMan/templates-user/my-forge90.xml \
     https://raw.githubusercontent.com/Oroshi-zz/Forge_90/main/unraid/forge90.xml
   ```

2. In **Docker → Add Container**, pick **forge90** from the *Template* list.
3. Fill in:
   - **APP_URL:** the address you'll open it at, e.g. `http://192.168.1.10:8090`
   - **SMTP_PASS:** your Gmail App Password (see [Email setup](#email-setup-gmail))
4. Leave **App data** at `/mnt/user/appdata/forge90`, then click **Apply**.

**By hand:** in *Add Container*, set:

| Field | Value |
|---|---|
| Repository | `ghcr.io/oroshi-zz/forge_90:latest` |
| Network | `bridge` |
| Port | container `8090` → host `8090` |
| Path | container `/app/data` → `/mnt/user/appdata/forge90` |
| Variables | `APP_URL`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` (see [Configuration](#configuration)) |
| WebUI | `http://[IP]:[PORT:8090]/` |

### 3. Open it

Open `http://<unraid-ip>:8090` and sign in with the [default administrator](#first-sign-in). The container has a health check at `/api/health`, and Unraid passes your server's time zone (`TZ`) to it automatically.

---

## Configuration

Set these as variables in the Unraid template (or with `-e` on `docker run`). **Admin → Email** can override the email values at runtime.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8090` | Port inside the container / on the host. |
| `APP_URL` | *(request host)* | Public address, used in invite and password-reset links. **Set this.** |
| `DATA_DIR` | `/app/data` | Where accounts, settings, plans and sync data are stored; map it to `/mnt/user/appdata/forge90`. |
| `ADMIN_EMAIL` | `admin@forge90.local` | Default administrator (first start only). |
| `ADMIN_PASSWORD` | `forge90-admin` | Its first-start password; must be changed at first sign-in. |
| `ADMIN_NAME` | `Administrator` | Its display name. |
| `SMTP_HOST` | `smtp.gmail.com` | Mail server. |
| `SMTP_PORT` | `465` | `465` with `tls`, `587` with `starttls`. |
| `SMTP_SECURITY` | `tls` | `tls`, `starttls` or `none`. |
| `SMTP_USER` | — | Sending account, e.g. `admin.oroshii@gmail.com`. |
| `SMTP_PASS` | — | Gmail **App Password** (spaces allowed). |
| `MAIL_FROM` | `SMTP_USER` | From address. |
| `MAIL_FROM_NAME` | `FORGE 90` | From name. |
| `TRUST_PROXY` | `false` | `true` behind a reverse proxy. |
| `COOKIE_SECURE` | `auto` | Secure cookies whenever HTTPS is used. |
| `TZ` | *(set by Unraid)* | Time zone for times shown in emails. |

---

## Email setup (Gmail)

Google no longer accepts an account's normal password over SMTP. Invites and password resets are both sent by email, so **set this up before inviting anyone**. To send from `admin.oroshii@gmail.com`:

1. Turn on **2-Step Verification** for that Google account.
2. Create an **App password** at <https://myaccount.google.com/apppasswords>. It's 16 letters, shown as four groups.
3. Put it in the `SMTP_PASS` variable of the Unraid template, or paste it into **Admin → Email → Password**.
4. In **Admin → Email**, click **Send** under *Send a test*.

If a send fails, the admin page shows why, including a hint when Gmail rejects the password.

---

## First sign-in

On first start the server creates a default administrator:

- **Email:** `admin@forge90.local`
- **Password:** `forge90-admin`

When you sign in you're asked to choose your own password. Change the email to a real address at the same time, so reset emails can reach you. Then the [first-run questionnaire](#first-run-questionnaire) sets up your plan. After that, set up email (see [Email setup](#email-setup-gmail) above, or **Admin → Email**) and invite people from **Admin → Users → Invite user**. Nobody can sign up on their own.

**Moving a plan from a backup:** go to **Account → Your data → Import backup** and choose the exported JSON file.

---

## HTTPS & reverse proxies

For access outside your home network, put FORGE 90 behind HTTPS with Nginx Proxy Manager, SWAG, Traefik or a Cloudflare Tunnel. Then:

- set `TRUST_PROXY=true` so the real client IP and HTTPS are detected, and
- set `APP_URL=https://forge.yourdomain.com` so email links use the public address.

Session cookies are marked `Secure` automatically over HTTPS.

---

## Updating, backups & recovery

- **Check the running version:** it's at the bottom of the side menu, or open `http://<server>:8090/api/health`.
- **Update:** in Unraid, **Docker → Check for updates → Apply update**. Your data folder is untouched.
- **Back up:** copy `/mnt/user/appdata/forge90` (the *Appdata Backup* plugin covers it), or use **Admin → Data & backup** for a JSON export without passwords.
- **Locked out of the only admin account?** Stop the container, run a one-off copy against the same data folder, then start it again:

  ```bash
  docker stop forge90
  docker run --rm -v /mnt/user/appdata/forge90:/app/data ghcr.io/oroshi-zz/forge_90:latest \
    node server.js --set-password you@example.com "A-New-Strong-Password"
  #   …or:  node server.js --make-admin you@example.com
  docker start forge90
  ```

  Stop the container first; otherwise the running server can overwrite the change.

---

## Development

```
Forge_90/
├── src/                    # the web app, plain JS + CSS, no framework
│   ├── exercises.js        # exercise library, rotation slots, session templates, phases
│   ├── nutrition.js        # base foods, 36 recipes, recipe links
│   ├── foods-db.js         # 650+ foods, food groups, package sizes, food emoji
│   ├── engine.js           # state, plan generation, portion solver, money saver, joint planning, PRs, trends
│   ├── ui-core.js          # helpers, icons, logo, charts, toasts, modals
│   ├── views-a.js … views-e.js   # dashboard, calendar, day, plan, diet, foods, grocery, progress, settings, accounts, admin
│   ├── views-f.js          # first-run questionnaire and meal-plan sync
│   ├── main.js
│   └── styles.css
├── VERSION                 # app version (1.0) → side menu, Settings, Admin, /api/health
├── build.js                # concatenates src/ into one HTML page → server/public/index.html
├── server/
│   ├── server.js           # HTTP server: auth, invites, sessions, admin API, meal sync, per-user storage (Node built-ins only)
│   ├── lib/smtp.js         # minimal SMTP client (TLS / STARTTLS / AUTH)
│   ├── lib/email.js        # branded email templates
│   └── public/             # built app + icons
├── docs/screenshots/       # README screenshots
├── unraid/forge90.xml      # Unraid container template
└── Dockerfile · .github/workflows/docker-publish.yml
```

The Docker build runs `node build.js` and copies the server into a small Node 22 Alpine image. There are no npm packages. Every push to `main` makes GitHub Actions build and publish `ghcr.io/oroshi-zz/forge_90:latest`.

**Releasing a new version:** change the number in `VERSION` and push. The new version shows in the side menu, on Settings, under Admin → Data & backup, and at `/api/health`. To also publish a versioned image, push a matching git tag (`git tag v1.0 && git push origin v1.0`); GitHub Actions then builds `ghcr.io/oroshi-zz/forge_90:v1.0` alongside `latest`.

---

## Security notes

- **Passwords:** hashed with **scrypt** and a per-user salt; never logged or returned.
- **Sessions:** random 256-bit tokens in `HttpOnly`, `SameSite=Lax` cookies, stored hashed.
- **Reset tokens:** 256-bit, stored hashed, single-use, and expire after **30 minutes**.
- **Invite tokens:** 256-bit, stored hashed, single-use, and expire after **7 days**. Resending replaces the link, and revoking stops it right away. There is no public sign-up endpoint.
- **Blocked requests:** requests from other sites are blocked (custom header plus Origin check). Strict security headers include a CSP and `Referrer-Policy: no-referrer`.
- **Brute force:** per-account lockout and per-IP rate limits. Forgot-password answers the same whether or not an account exists.
- **Meal sync:** only the two synced accounts see each other's shared meals and portions; no weights or other data are shared. A partner's own recipe is copied field by field and cleaned up (only `https://` links are kept) when you accept it. The sync ends automatically if either account is deleted.
- **Secrets stay out of git:** the Gmail app password lives only in the Unraid template (`SMTP_PASS`) or Admin → Email. The data folder holds account data, so back it up and keep it private.

---

## Credits

- **Section photos** are from [Unsplash](https://unsplash.com) (Unsplash License): Victor Freitas, Jorge Alberto Vega Barrera, Mina Rad, Shan A. Rajpoot, Rodrigo Rodrigues, Jason Briscoe, Vitaly Gariev, Jakob Owens and Alina Rubo. The **sign-in photo** is by Jonathan Borba.
- **Fonts:** Inter and Space Grotesk via Google Fonts.
- **Food values** are approximations based on USDA FoodData Central. Recipe links point to their original authors.

*FORGE 90 is a personal training and nutrition planner, not medical advice. Check with a professional before big changes to diet or training.*
