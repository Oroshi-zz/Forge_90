<div align="center">

<img src="server/public/icon.png" width="96" alt="FORGE 90 logo">

# FORGE 90

A self-hosted training and meal-planning app. It builds a 90-day Push/Pull/Legs program that continues in 13-week cycles, plans meals portioned to each person's macros, and tracks weight, body fat and lifts. Accounts are invite-only, so it works well for a household on one server.

![Dashboard](docs/screenshots/dashboard.png)

</div>

## Features

### First sign-in

New users go through a short questionnaire before the app opens: name and nickname, current weight, body fat, goal weight, activity level, target loss rate, and whether to use money-saving meal planning. Body fat is optional. If it's left blank, the app estimates it from height, age and sex using the Deurenberg formula and reminds the user to replace it with a measured value later. Everything can be changed afterwards in Settings.

![First-run questionnaire](docs/screenshots/onboarding-body.png)

### Training

- The first 90 days run through four phases: Foundation (upper-body focus while adjusting to the deficit), Build, Intensify, and a deload and PR-test week. After that the plan repeats in 13-week cycles, and the calendar always has the current and next cycle scheduled.
- Sessions rotate Push, Pull, Legs across however many training days you pick. Push and pull never land on the same day.
- Each session mixes heavy strength sets with hypertrophy work. Targets are given in reps in reserve and change with the phase.
- Progression uses double progression: the app tells you to add weight once every set hits the top of the rep range.
- The exercise library has 60 exercises across 11 muscle groups, each with form steps and cues. Exercises rotate weekly within their movement slot. You can switch exercises off (every muscle group keeps at least one) or add your own.

![Workout plan](docs/screenshots/workout-plan.png)

### Logging and the calendar

Sets are logged on the dashboard's Today card or in the day view. Weight and reps save as you type, and each exercise shows its target, PR badges and a suggestion for next time. The calendar has month and week views with drag and drop for workouts and meals, plus undo. The dashboard also has quick editors for the day's workout and meals.

![Calendar](docs/screenshots/calendar.png)

### Nutrition

Calorie targets use Katch–McArdle BMR, an activity multiplier, extra calories on lifting days, and a deficit set by the chosen loss rate. Protein is set between 0.5 and 1 g per pound of body weight, and carbs and fat make up the rest. Every day, recipe portions are scaled so the day's meals hit protein and calories, with count-based items like eggs and tortillas rounded to whole units. A trend coach compares the 7-day weight trend to the target and can adjust calories. Once the goal is reached, calories switch to maintenance.

![Diet plan](docs/screenshots/diet-plan.png)

### Recipes and foods

The app ships with 36 high-protein meal-prep recipes, each linked to its original source, and a database of about 650 foods. Multi-serving recipes are scheduled as leftovers. Recipes can be favorited so they come up more often, filtered and sorted by macros, edited, duplicated or switched off, and you can write your own. Food preferences work as a checklist by group, subgroup and individual food. Unchecking a food removes recipes that use it and swaps it out of upcoming meals.

![Meal library](docs/screenshots/meal-library.png)

### Groceries

The weekly shopping list is grouped by aisle and adds up the exact scaled portions on the calendar, including leftovers. It comes with a batch-cook schedule. With money-saving planning turned on, the planner orders each week's meals so recipes share fresh ingredients. That means fewer packages and less waste, without changing variety or favorites.

![Grocery list](docs/screenshots/grocery.png)

### Meal-plan sync

Two users can sync their meal plans from Account settings. One sends a request and picks which meals to share, and the other accepts. The shared meals are then re-planned together using only recipes both people can eat, and both people's favorites. Portions stay sized to each person's own targets, while the shopping list and batch-cook schedule cover both.

When either person changes a shared meal, it changes on their plan right away and is sent to the other person to accept or decline. A declined change means you each keep your own meal that day. A Sync button with a count of pending changes appears on the relevant pages while a sync is active. Either person can change which meals are shared (the other has to approve) or unsync at any time.

![Sync panel](docs/screenshots/sync-panel.png)

### Progress

Charts for body weight (with a 7-day average and the plan line), body fat and lean mass, and a strength chart per exercise with estimated one-rep max and PR detection.

![Progress](docs/screenshots/progress.png)

### Accounts

There is no public sign-up. An administrator invites people by email, and the invite link works once and expires after 7 days. Users can reset a forgotten password by email (the link lasts 30 minutes). Accounts lock after repeated failed sign-ins, and the owner is emailed a reset link. Each user can manage their profile, password and signed-in devices, export or import their data, and delete their account.

### Admin console

- **Users:** invite people, resend or revoke invites, grant or remove admin rights, unlock accounts, send reset links, set temporary passwords, and delete accounts.
- **Security:** password rules, lockout, session length and Require HTTPS.
- **App settings:** the app name (used in emails and the browser tab) and the app address used in email links.
- **Email:** SMTP settings, with a test send.
- **Server & proxy:** checks how the current connection reaches the app (HTTPS, the client IP it sees, secure cookies) and points out any proxy settings that need changing.
- **Activity log** and **Data & backup:** a filterable log of sign-ins and admin actions, and a full JSON export.

![Admin users](docs/screenshots/admin-users.png)

## Installation

The image is published to GitHub Container Registry:

```
ghcr.io/oroshi-zz/forge_90:latest
```

The container listens on port `8090`. Mount `/app/data` to persistent storage. An Unraid template is included at `unraid/forge90.xml`.

### Configuration

| Variable | Default | Description |
|---|---|---|
| `APP_URL` | request host | Public address, used in invite and reset links and as the Require HTTPS redirect target. |
| `PORT` | `8090` | Listening port inside the container. |
| `DATA_DIR` | `/app/data` | Data location. |
| `ADMIN_EMAIL` | `admin@forge90.local` | Default administrator, created on first start. |
| `ADMIN_PASSWORD` | `forge90-admin` | Default administrator password. It must be changed at first sign-in. |
| `SMTP_HOST` | `smtp.gmail.com` | Mail server. |
| `SMTP_PORT` | `465` | Mail server port. |
| `SMTP_SECURITY` | `tls` | `tls`, `starttls` or `none`. |
| `SMTP_USER` | | Mail account username. |
| `SMTP_PASS` | | Mail account password. |
| `MAIL_FROM` | `SMTP_USER` | From address. |
| `MAIL_FROM_NAME` | `FORGE 90` | From name. |
| `TRUST_PROXY` | off | Addresses of your reverse proxy (IPs or CIDR ranges, comma-separated), or `true` to trust any. Forwarded headers are ignored from anywhere else. |
| `REQUIRE_HTTPS` | auto | When `APP_URL` is https, plain-HTTP requests on any other host are redirected to it and HSTS is sent. Set to `false` to disable. |
| `COOKIE_SECURE` | `auto` | Marks the session cookie Secure when the request is HTTPS. |
| `TZ` | `UTC` | Time zone used in emails. |

The email settings can also be changed from Admin → Email. Invites and password resets are sent by email, so set up email before inviting anyone.

### First sign-in

Sign in with `admin@forge90.local` / `forge90-admin` (or your `ADMIN_EMAIL` / `ADMIN_PASSWORD`). You'll be asked to set a new password and a real email address, and then you'll go through the questionnaire. After that, invite users from Admin → Users.

## Backups and recovery

Everything lives in the data folder:

- `db.json`: accounts, sessions, invites, settings and the activity log
- `state/`: each user's plan
- `sync/`: shared-meal data for synced users

To back up, copy the folder while the container is stopped. Admin → Data & backup also downloads a JSON export of all accounts and plans, but without password hashes, so it's a record rather than a full restore. Individual users can export and import their own plan from Account settings.

If you're locked out of the only admin account, stop the container and run a one-off copy of the image against the same data folder:

```bash
docker run --rm -v /path/to/data:/app/data ghcr.io/oroshi-zz/forge_90:latest \
  node server.js --set-password you@example.com "new-password"

# or promote an existing account
docker run --rm -v /path/to/data:/app/data ghcr.io/oroshi-zz/forge_90:latest \
  node server.js --make-admin you@example.com
```

## Security

- Passwords are hashed with scrypt. Session, invite and reset tokens are random 256-bit values stored only as hashes.
- Cross-site requests are blocked, and responses carry a strict Content Security Policy.
- Sign-in, reset and invite endpoints are rate-limited per IP, and accounts lock after repeated failures. The forgot-password form gives the same response whether or not the account exists.
- Behind a proxy, the client IP comes from the entry your proxy added to `X-Forwarded-For`, so a client can't dodge rate limits by sending its own header.
- Synced users only see each other's shared meals and portions.

## Credits

Background photos are from Unsplash: Victor Freitas, Jorge Alberto Vega Barrera, Mina Rad, Shan A. Rajpoot, Rodrigo Rodrigues, Jason Briscoe, Vitaly Gariev, Jakob Owens, Alina Rubo, and Jonathan Borba for the sign-in page. Food values are approximations based on USDA FoodData Central. Recipe links go to their original authors.

FORGE 90 is a planning tool, not medical advice.
