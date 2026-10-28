# Swetha Structures HRMS

Employee management system for Swetha Structures (PEB / steel construction), built and maintained by Shadow Market AI.
Live at **https://hrms.swethastructures.com**. Staff use it mostly on phones, often on site with weak signal.

## Stack

- **Frontend:** a vanilla-JS PWA with no framework and no build step. The files are served as-is.
  - `app.js` (~17.7k lines) holds almost all UI logic. It uses global functions such as `switchTab()` and `showOverlay()`, plus the globals `API_BASE` and `JWT_TOKEN`.
  - `index.html` holds every screen (`#screen-<tab>`) and overlay (`#overlay-<name>`) as static markup.
  - `peb-module.js` is the PEB roofing / store / purchase module. `PEB_ROOFING_SYSTEM_DESIGN.md` explains its design.
  - `styles.css` is a single stylesheet.
  - `sw.js` is the service worker. Same-origin static files and GET API calls are network-first. CDN assets are cache-first. Failed POST/PUT calls (attendance punches especially) are queued and replayed later.
- **Backend:** Node 20 + Express in `server/`. Entry point is `server/server.js`.
  - `server/routes/*.js` holds one router per module, mounted at `/api/<module>`. Modules include auth, employees, attendance, geofence, leaves, salary, expenses, advances, peb/store, peb/purchase, chatbot, admin and others.
  - `server/middleware/auth.js` provides `verifyToken`, `requireRole(...)`, `requireRoleOrDept(roles, depts)` and `requireFeatureAccess(...)`.
  - `server/config/db.js` sets up the mysql2 pool and runs the startup migrations and seeding.
  - The chatbot uses `@anthropic-ai/sdk` (env `ANTHROPIC_API_KEY`, `AI_MODEL`).
  - Excel exports use `exceljs`/`xlsx`, PDFs (vouchers) use `pdfkit`, and realtime uses `socket.io`.
- **Database:** MySQL 8 with database `hrms`.
  - The base schema is in `database/schema.sql`.
  - One-off repair scripts in `database/` (`fix-*.js`, `add-acc001.js`, …) were run once against prod. Don't re-run them casually.

## Roles

There are five roles: `MD`, `HR`, `Manager`, `Employee` and `Accounts`. Department (`dept`) also gates some features, such as the Admin dept reading purchase indents.

The `role` columns on `users` and `employees` are **ENUMs**. A role missing from the ENUM gets silently stripped; this caused the SS031 expense-tab bug. When adding a role or status, update `schema.sql` **and** add an `ALTER … MODIFY COLUMN` migration.

Approval flows move through statuses. For example, leaves go `pending → hr_accepted → approved/rejected`, and advances/expenses go through `Accounts_Accepted`/`HR_Accepted`.

## Schema changes / migrations

There is no migration tool. Migrations are idempotent SQL that runs on **every server start**, in two places:

- the `runMigrations` list in `server/config/db.js`
- the `runMigrations()` block in `server/server.js`

Add new columns or ENUM changes there as idempotent statements, for example `ALTER TABLE … ADD COLUMN …` with errors swallowed. Mirror the change in `database/schema.sql` so fresh installs match.

`db.js` also seeds and syncs the employee list (dept and role) on startup. Edits to seeded employees belong in that seed data, or they will be overwritten on the next restart.

## Running locally

```bash
cd server && npm install
# server/.env: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME=hrms, JWT_SECRET, CORS_ORIGINS=http://localhost:3000
node server.js            # or: npm run dev  (node --watch)
```

The server also serves the frontend (static files from the repo root, or from `STATIC_DIR`) at http://localhost:3000. The health check is `GET /api/health`.

Docker uses `docker-compose.yml` for prod (port 3002) or `docker-compose.testing.yml` for testing (port 3001). Both need `MYSQL_ROOT_PASSWORD` and `JWT_SECRET` set in `.env`.

## Tests

Playwright e2e tests live in `tests/e2e/hrms.spec.js`. From the repo root:

```bash
npm install && npx playwright install chromium
npx playwright test
```

Playwright starts the server itself on port 3333 with `PLAYWRIGHT=1`, which relaxes the rate limits. It needs a reachable MySQL with seeded data. The test logins are `MD001/admin123`, `HR001/hr123` and `SS001/emp123`. Tests run serially because they mutate shared state.

## Branches & deploy

- **`develop`** is the default branch, and **Coolify auto-deploys it to production**. Anything merged here goes live, so verify before merging.
- `testing` is a separate environment whose compose file defaults CORS to `hrms.shadowmarket.ai`. It is updated by merging `develop` into it, and is often far behind.
- Work happens on `fix/<topic>` or `feature/<topic>` branches, with a PR into `develop` that gets squash-merged. Commit messages use the `fix:` / `feat:` prefix, with a body explaining the user-visible cause and the fix.

## Gotchas

- **Field use is mobile and offline-heavy.** Attendance check-in depends on geolocation plus geofence (`checkGeofence` runs on both the client and `routes/geofence.js` / `attendance.js`, and the two must agree). It also depends on the service worker's offline queue. Never let a punch fail silently: surface errors to the user.
- **Service worker cache:** `CACHE_NAME` in `sw.js` (currently `hrms-v2xx`). Bump it when changing `sw.js` or the precache list, so clients pick up the new worker.
- The CSP in `server.js` (helmet) whitelists specific CDNs. A new external script, font or API domain must be added there, or it will be blocked.
- `app.js` is huge, so search it with grep or Grep rather than reading it whole. Many features have both a client and a server half. Change both.
- Uploads go to `server/uploads`, which is a Docker volume. Don't commit it.
