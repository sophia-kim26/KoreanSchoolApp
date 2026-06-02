
Production
- Deployed: https://korean-school-app-2.vercel.app/

Quick install
1. Install dependencies

```bash
# from repo root
cd server && npm install
cd ../client && npm install
```

2. Environment variables

- Server (`/server/.env`) — required keys:
  - `DATABASE_URL` — Neon/Postgres connection string
  - `AUTH0_DOMAIN` — Auth0 domain (e.g. dev-xxxxx.us.auth0.com)
  - `AUTH0_AUDIENCE` — Auth0 API identifier (must match client `VITE_AUTH0_AUDIENCE`)
  - `TA_JWT_SECRET` — secret for TA HS256 tokens (used for TA client tokens)
  - `EMAIL_USER` — email sender (Gmail address) used by nodemailer
  - `EMAIL_PASS` — email app password or SMTP password
  - (optional) `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_BASE_URL` if using server-side Auth0 flows

- Client (`/client/.env`) — required keys for local dev:
  - `VITE_API_URL` — base API URL (e.g. `http://localhost:3000`)
  - `VITE_AUTH0_DOMAIN` — same Auth0 domain as above
  - `VITE_AUTH0_CLIENT_ID` — Auth0 application client id
  - `VITE_AUTH0_AUDIENCE` — API identifier (same as `AUTH0_AUDIENCE`)

Notes:
- When deploying to Vercel, set the same environment variables in the Vercel project settings (do not commit `.env` to source control).

Database
- This project uses Postgres (Neon) via `@neondatabase/serverless`. Create a Postgres database and set `DATABASE_URL` to its connection string.
- Minimal SQL (example) to create the core tables used by the app. Adjust types and constraints to your needs:

```sql
CREATE TABLE ta_list (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  ta_code TEXT,             -- hashed or plain PIN (migration available)
  is_active BOOLEAN DEFAULT true,
  session_day TEXT,         -- 'Friday', 'Saturday', 'Both'
  classroom TEXT
);

CREATE TABLE shifts (
  id SERIAL PRIMARY KEY,
  ta_id INTEGER REFERENCES ta_list(id),
  clock_in TIMESTAMP WITH TIME ZONE,
  clock_out TIMESTAMP WITH TIME ZONE,
  elapsed_time INTEGER,
  attendance TEXT,
  notes TEXT,
  was_manual BOOLEAN DEFAULT false
);

CREATE TABLE calendar_dates (
  date DATE PRIMARY KEY
);
```

- There is a helper migration script to hash existing 6-digit PINs: `server/services/migrate.js` (run with `node server/services/migrate.js` after `DATABASE_URL` is set).

Auth0 setup
- Create an Auth0 Application (SPA) and an Auth0 API (identifier used as `AUTH0_AUDIENCE`).
- In the Auth0 Application settings set Allowed Callback URLs to include your local dev URL (`http://localhost:5173`) and the deployed URL (`https://korean-school-app-2.vercel.app`). Also add the logout URLs.
- Set the client id and domain in the client's `.env` (`VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_AUDIENCE`).
- On the server, set `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` so the `protect` middleware can validate VP/admin tokens.

Email (nodemailer)
- The server uses Gmail via `nodemailer`. Provide `EMAIL_USER` and `EMAIL_PASS` in the server `.env`. For Gmail, create an App Password or configure SMTP credentials.

Running locally

```bash
# Start server (in one terminal)
cd server
npm run dev   # requires nodemon (or use `npm start`)

# Start client (in another terminal)
cd client
npm run dev
```

- The client uses Vite (default port 5173) and expects `VITE_API_URL` to point to the running server.

Useful endpoints
- `GET /api/friday/get-calendar-dates` — returns `{ dates: ['YYYY-MM-DD', ...] }`.
- `POST /api/friday/save-calendar-dates` — accepts `{ dates: ['YYYY-MM-DD', ...] }` to replace the saved dates.

Developer notes
- The "Set Days" calendar in the VP dashboard builds the month grid client-side, formats selected days as `YYYY-MM-DD`, and saves them to the `calendar_dates` table. The saved dates are the canonical source of "real days" used for attendance.
- Weekday computation is done with JavaScript: parse `YYYY-MM-DD` into `new Date(year, month-1, day)` and call `.getDay()` (0 = Sun … 6 = Sat).

Deployment (Vercel)
- This project is deployed at: https://korean-school-app-2.vercel.app/
- When deploying, set environment variables in the Vercel dashboard to match your local `.env` values (especially `DATABASE_URL`, Auth0 keys, and email credentials).

If you want, I can add a checklist for required Auth0 settings and a sample `.env.example` file. 
