# Campus Bites

A small full-stack campus food-ordering application for the PI project. React frontend, Express API, SQLite for immediate local development, and PostgreSQL support for a dedicated database VM. Prices use Tunisian dinars (DT); all calculations and database prices use integer hundredths.

## Run locally

Install Node.js 24 or later, then run from this folder:

```powershell
npm install
npm run dev
```

Open http://localhost:3000. The terminal prints a randomly generated temporary admin password. Click **Admin** to sign in. This password changes on restart unless configured. To set your own password, copy `.env.example` to `.env` and replace `ADMIN_PASSWORD`. Never commit `.env`.

SQLite data persists in `data/campus.db`. The initial menu is seeded automatically without overwriting edits. The app binds to localhost by default; set `HOST=0.0.0.0` only when access from other machines is needed.

## Features

- Browse and search the menu; filter categories.
- Add items to a cart, adjust quantities, enter contact details and notes.
- Submit an order and receive a reference, item summary and total. Pay at pickup.
- Administrator password login, eight-hour HttpOnly cookie sessions and logout.
- View incoming orders, refresh, and update their status.
- Add menu items, change prices, and mark items unavailable.
- Server-side validation and total calculation; login attempt limits.

The intentionally small scope excludes payments, customer accounts and delivery. Cart state lives in browser memory and resets on reload. Admin sessions live in server memory and reset on restart. Menu management uses availability toggles instead of permanent deletion. Order status is managed at the counter; there is no customer tracking page.

## Project structure

| Path                | Purpose                                             |
| ------------------- | --------------------------------------------------- |
| `src/main.jsx`      | Customer and admin React interfaces                 |
| `src/style.css`     | Responsive styling                                  |
| `server/app.js`     | API, validation and admin sessions                  |
| `server/db.js`      | SQLite/PostgreSQL adapter, schema and seed menu     |
| `server/index.js`   | Development and production startup                  |
| `tests/app.test.js` | Tests using a real API server and isolated database |
| `deploy/`           | Example Nginx and systemd configuration             |
| `.gitlab-ci.yml`    | Quality checks, database tests and production build |

## Checks

```powershell
npm test
npm run lint
npm run format:check
npm run build
```

Tests cover persistence, server-authoritative totals, bad quantities, unavailable items, invalid customer data, protected admin actions, status updates, menu changes, logout and cross-origin requests. Local tests use a fresh in-memory SQLite database. GitLab additionally tests against a PostgreSQL service. To run PostgreSQL tests locally, set `TEST_DATABASE_URL` to a dedicated disposable test database. Never use the production database for tests. These are API/integration tests; no automated browser test suite is included.

## Four-VM deployment

1. **Application VM:** Node.js 24, this application, Nginx.
2. **Database VM:** PostgreSQL and the application database.
3. **Control VM:** GitLab Runner, Ansible and internal DNS.
4. **Monitoring VM:** Zabbix and centralized logs. Monitor `GET /api/health` to check app/database availability.

On the database VM, create an application role and database. Restrict PostgreSQL access to the application VM using firewall and `pg_hba.conf` rules. On the application VM, set `.env`:

```dotenv
ADMIN_PASSWORD=replace-with-a-long-random-password
DATABASE_URL=postgresql://campus:YOUR_PASSWORD@DATABASE_VM_IP:5432/campus
PORT=3000
```

URL-encode special characters in database credentials. The schema and initial menu are created on first startup. SQLite records are not automatically copied into PostgreSQL.

Install the application in `/opt/campus-bites`, create an unprivileged `campus` service user, give it read access to the app and `.env`, then run `npm ci` and `npm run build`. Install the example systemd unit and Nginx config, adjusting paths, Node binary and server name to match your machines. Start the service with `NODE_ENV=production` (already set in the example unit). Add HTTPS and set `COOKIE_SECURE=true` when serving over HTTPS. Do not set it for plain HTTP development.

The GitLab pipeline checks, tests and builds the app. **Automatic deployment is intentionally not configured yet:** it requires your VM addresses, runner arrangement and deployment credentials. The deployment examples are templates, not proof of an already deployed VM environment.

## Manual demonstration

1. Add two Campus Classic burgers; verify a total of 25.00 DT.
2. Reduce the quantity, fill in a name/phone and place the order.
3. Note the confirmation reference; sign into Admin.
4. Refresh orders and change the matching order to Preparing, then Ready.
5. In Menu, mark an item unavailable; return to Our menu and verify Add is disabled.
6. Sign out and verify admin data is inaccessible without signing in again.

The interface uses CSS and emoji illustrations, with optional Google Fonts and system-font fallbacks. No external image service or paid API is required.
