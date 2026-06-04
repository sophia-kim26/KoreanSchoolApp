Application for the Korean School of New Jersey. It includes a VP dashboard and a TA dashboard.

Production
- Deployed: https://njks-service-hours.vercel.app/ 

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
- When deploying to Vercel, set the same environment variables in the Vercel project settings.
- See `.env.example` files in `server/` and `client/` directories for reference templates.

## External Services Setup

This project requires configuration for the following third-party services:

### 1. Neon Database (PostgreSQL)
**Purpose**: Stores all application data (TAs, students, shifts, attendance, etc.)

**Setup**:
1. Create account at https://console.neon.tech
2. Create a new project
3. Copy the connection string from the Neon dashboard
4. Set `DATABASE_URL` in `server/.env` with this connection string

**Format**: `postgresql://user:password@ep-xxxxx.neon.tech/neondb`

### 2. Auth0 (Authentication)
**Purpose**: Manages user authentication and authorization (VP accounts, TA accounts)

**Setup**:
1. Create account at https://auth0.com
2. Create a new application:
   - Go to Applications > Create
   - Select "Single Page Web Applications" 
   - Name it "Korean School App"
3. Configure application settings:
   - **Allowed Callback URLs**: `http://localhost:5173,http://localhost:5173/callback,https://your-vercel-domain.vercel.app,https://your-vercel-domain.vercel.app/callback`
   - **Allowed Logout URLs**: `http://localhost:5173,https://your-vercel-domain.vercel.app`
   - **Allowed Web Origins**: `http://localhost:5173,http://localhost:3000,https://your-vercel-domain.vercel.app`
4. Create an API:
   - Go to APIs > Create
   - Name: "Korean School API"
   - Identifier: `https://api.example.com` (or any unique identifier)
5. Collect these values for `.env`:
   - `AUTH0_DOMAIN`: Domain from Settings tab (e.g., `dev-xxxxx.us.auth0.com`)
   - `AUTH0_CLIENT_ID`: Client ID from Applications
   - `AUTH0_AUDIENCE`: Identifier from the API you created
   - `AUTH0_CLIENT_SECRET`: Client Secret (for server-side flows)
   - `AUTH0_BASE_URL`: Your app's base URL

### 3. Gmail / Nodemailer (Email Service)
**Purpose**: Sends TA credential emails and other notifications

**Setup**:
1. Use a Gmail account (personal or service account)
2. Enable 2-Factor Authentication on the Gmail account
3. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or appropriate device type)
   - Copy the generated password
4. Set in `server/.env`:
   - `EMAIL_USER`: Your Gmail address
   - `EMAIL_PASS`: The app-specific password (not your regular password)

**Note**: Gmail allows max ~500 emails/hour; consider switching to SendGrid for production if higher volume is needed.

### 4. Vercel (Deployment)
**Purpose**: Hosts both frontend and backend APIs

**Setup**:
1. Connect your GitHub repo to Vercel: https://vercel.com
2. For each deployment (client and server):
   - Set the same environment variables from your local `.env` files
   - Go to Project Settings > Environment Variables
   - Add all required variables for both server and client
3. Deploy:
   - Server deploys automatically to `/api` routes
   - Client deploys to main domain

**Note**: Environment variables set in Vercel are separate from local `.env` files.

### Environment Variables Checklist
Before running locally or deploying, ensure you have:
- [ ] `DATABASE_URL` from Neon
- [ ] `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_CLIENT_ID` from Auth0
- [ ] `TA_JWT_SECRET` (generate a random string)
- [ ] `EMAIL_USER` and `EMAIL_PASS` from Gmail
- [ ] All client variables (`VITE_*` prefixed)

Running locally

```bash
# Start server (in one terminal)
cd server
npm run dev   # requires nodemon (or use `npm start`)

# Start client (in another terminal)
cd client
npm run dev
```