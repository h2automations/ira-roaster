## IRA Sportswear – Team Roster Management System

Production-ready Next.js App Router application for creating and managing team rosters for IRA Sportswear. Anyone with the link can create a roster; existing rosters are protected by Team Name + PIN and can be exported to Excel.

### Tech stack

- **Frontend**: Next.js (App Router) + TypeScript
- **Styling**: TailwindCSS
- **Database**: PostgreSQL with Prisma ORM
- **Auth/session**: HttpOnly cookie + JWT (teamId only)
- **Rate limiting**: Upstash Redis (preferred) with DB fallback
- **Email**: Resend or SendGrid
- **WhatsApp**: Twilio WhatsApp adapter
- **Excel export**: exceljs (`.xlsx`)

### Core features

- **Create new roster**: Anyone with the `/roster` link can create a roster.
- **Access model**: One team = one roster, accessed via **Team Name + PIN**.
- **PIN delivery**: PIN is emailed (mandatory) and optionally sent via WhatsApp.
- **Roster editor**: Inline editable table for Player Name, Jersey Number, and Apparel Size (US sizing).
- **Update existing roster**: Select team from searchable list, verify PIN with rate limiting, then edit.
- **Excel export**: One-click `.xlsx` export with Roster + Summary sheets.

---

## Local setup

### 1. Install dependencies

```bash
pnpm install
# or
npm install
```

### 2. Configure environment

Copy the example environment file and fill in values:

```bash
cp .env.example .env
```

Configure at minimum:

- `DATABASE_URL`
- `JWT_SECRET`
- `EMAIL_PROVIDER` and its API key (`RESEND_API_KEY` or `SENDGRID_API_KEY`)
- `EMAIL_FROM`

WhatsApp and Upstash Redis are optional but recommended for production.

### 3. PostgreSQL setup

Create a PostgreSQL database (local or managed, e.g. Neon, Supabase, RDS) and set `DATABASE_URL` accordingly:

```text
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

Generate Prisma client:

```bash
npx prisma generate
```

You can inspect the database with:

```bash
npx prisma studio
```

### 4. Run the app locally

```bash
npm run dev
```

Open `http://localhost:3000/roster` to access the Team Roster Management System.

---

## Application routes

- `/roster` – Entry point showing modal: **Create New Roster** or **Update Existing Roster**.
- `/roster/create` – Team creation form + PIN creation.
- `/roster/update` – Team selector + PIN verification.
- `/roster/edit` – Protected roster editor (requires valid JWT session cookie).

### API routes

- `POST /api/roster/create` – Create team + roster, hash PIN, send PIN via email and optional WhatsApp, start session.
- `GET /api/teams` – List all teams (id + name) alphabetically.
- `POST /api/auth/verify-pin` – Verify PIN against hashed PIN with per-team+IP rate limiting. On success, issues JWT HttpOnly cookie.
- `POST /api/roster/save` – Save roster name and full player list for the current session team.
- `GET /api/roster/export` – Export current team roster to `.xlsx` with Roster + Summary sheets.

---

## Auth and sessions

- **Session**: JWT token stored in an HttpOnly cookie `ira_roster_session`.
- **Payload**: `{ teamId }` only.
- **Expiry**: 30 minutes.
- **Cookie flags**: `HttpOnly`, `Secure` (in production), `SameSite=Lax`.
- **Middleware**: `middleware.ts` protects `/roster/edit` and redirects unauthenticated users to `/roster/update`.

---

## Rate limiting

- **Primary**: Upstash Redis via `@upstash/ratelimit` (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
- **Fallback**: `PinAttempt` table in PostgreSQL stores per-team+IP counters and lockouts.
- **Policy**: Max **5 failed PIN attempts per team + IP** within 15 minutes; team is locked for 15 minutes after limit.

Configuration:

- To enable Upstash, set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- If not configured, DB-based fallback is used automatically.

---

## Email

Provider is selected via `EMAIL_PROVIDER`:

- `resend` (default): uses `RESEND_API_KEY`.
- `sendgrid`: uses `SENDGRID_API_KEY`.

Required env:

- `EMAIL_FROM` – e.g. `IRA Sportswear <no-reply@roster.irasportswear.com>`.

On first roster creation:

- Subject: **“Your Team Roster PIN”**
- Body includes team name, PIN, roster link, and a security note.

---

## WhatsApp

Abstraction is implemented via `lib/whatsapp.ts`:

- Function: `sendWhatsapp(to, message)`.
- Default provider: **Twilio WhatsApp** (`WHATSAPP_PROVIDER=twilio`).

Required env for Twilio:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM` (e.g. `whatsapp:+123456789`)

If not fully configured, messages are logged/warned and the main flow continues without failing.

---

## Excel export

Excel export uses **exceljs**:

- **Sheet 1 – Roster**:
  - Team Name
  - Roster Name
  - Player Name
  - Jersey Number
  - Size (US)
- **Sheet 2 – Summary**:
  - Team Name
  - Manager Name
  - Manager Email
  - Created Date

Downloading is triggered by the **“Export Excel”** button in the roster editor, which calls `GET /api/roster/export`.

---

## Styling and branding

- TailwindCSS with a simple IRA color palette:
  - `ira.navy`: primary deep navy
  - `ira.red`: accent red
  - `ira.gray`: soft background gray
- Clean, modern layout with card-based UI (`ira-card`) and primary/secondary buttons.

---

## Vercel deployment

1. **Push the project** to a Git repository (GitHub/GitLab/Bitbucket).
2. **Create a new Vercel project**:
   - Import the repository.
   - Framework preset: **Next.js**.
3. **Environment variables**:
   - Add all variables from `.env.example` in the Vercel project Settings → Environment Variables.
   - For production, ensure `APP_BASE_URL` matches the final subdomain URL.
4. **Build & deploy**:
   - Vercel will run `npm install` and `npm run build` by default.
   - After first deploy, run Prisma migrations against your production database (e.g. via a one-off `vercel exec` or separate CI/CD step using `npx prisma migrate deploy`).

### Subdomain DNS mapping

To host at `roster.irasportswear.com`:

1. In Vercel project settings, go to **Domains** and add `roster.irasportswear.com`.
2. In your DNS provider (where `irasportswear.com` is managed), create a **CNAME** record:
   - **Name**: `roster`
   - **Type**: `CNAME`
   - **Value**: Vercel-provided target (e.g. `cname.vercel-dns.com` or your project-specific CNAME).
3. Wait for DNS propagation. Vercel will confirm once the domain is active.

The app will then be accessible at `https://roster.irasportswear.com/roster`.

