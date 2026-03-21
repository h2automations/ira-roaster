# IRA Sportswear - Team Roster Management System

## Vision
Build a reliable roster management platform that replaces the manual Excel workflow with a faster, trackable, role-based system for:
- IRA admins (configure products, share secure access, export data)
- Team managers/coordinators (update roster details with controlled access)

Primary business goal:
- Reduce manual coordination overhead and repeated Excel follow-ups.
- Keep roster updates auditable, secure, and easy to share.

## Target Product Outcomes
- Team access is PIN-based and secure (team-scoped session cookie).
- Admin access is OTP-based and secure (admin-scoped session cookie).
- Product fields shown to team users are controlled by admin configuration.
- Save/export flows prevent accidental data loss (dirty-state confirmation).
- Share flow is clear and low-friction (copyable message with team + PIN + link).
- Export outputs include roster + summary in Excel format.

## What Has Been Implemented

### Core Team Flows
- `/roster` entry point for create/update.
- `/roster/create` creates team roster, stores hashed PIN, starts team session.
- `/roster/update` verifies team PIN and routes to editor.
- `/roster/edit` protected editor for team users.

### Admin Flows
- `/admin/login` OTP login flow.
- `/admin/teams` team list/search and navigation.
- `/admin/teams/[teamId]/products` product enable/disable per team.
- `/admin/teams/[teamId]/edit` admin update path.

### Security and Sessions
- Team session cookie: `ira_roster_session` (JWT with `teamId`).
- Admin session cookie: `ira_admin_session` (JWT with admin/email).
- Middleware protection for team/admin routes.

### Roster UX + Data Safety
- Unsaved changes tracking in roster editor.
- Export confirmation modal with:
  - Save & Export
  - Export Without Saving
  - Cancel
- Double-submit prevention for save/export actions.

### Branding / UI Direction
- System title set to **Team Roster Management System**.
- Blue-dominant UI with red usage kept minimal (logo/highlight intent).
- IRA logo integrated in layout/header.

### Database and Schema
- Prisma + PostgreSQL setup.
- Schema supports team/player/admin OTP/rate-limit related entities.
- Migration workflow operational (`prisma migrate deploy`).

### Deployment Foundation (AWS)
- EC2 + RDS architecture established.
- Private RDS connectivity via security groups validated.
- Next.js production build verified.
- PM2 process setup and Nginx reverse proxy guidance applied.

## Recent Critical Fixes Completed

### 1) Admin OTP moved to WhatsApp delivery
- Admin OTP request route now resolves manager by email and uses configured WhatsApp number.
- OTP verification remains email-identity based for admin authorization.
- Meta WhatsApp template path wired for OTP send.
- Admin login UI now indicates OTP sent to WhatsApp destination.

Files updated:
- `app/api/admin/request-otp/route.ts`
- `app/api/admin/verify-otp/route.ts`
- `app/admin/login/page.tsx`
- `lib/whatsapp.ts`
- `.env.example`

### 2) Local/Prod behavior clarified
- In development mode, OTP may be surfaced as `devOtp` for testing.
- In production mode, WhatsApp OTP delivery is expected.

## Current Environment Configuration (Expected)

### App
- `NODE_ENV=production` (for real OTP delivery behavior)
- `DATABASE_URL=postgresql://.../ira_roster?schema=public&sslmode=require`
- `APP_BASE_URL=https://roaster.irasportswear.com` (or EC2 IP for temporary)
- `JWT_SECRET=<strong_secret>`

### WhatsApp (Meta)
- `WHATSAPP_PROVIDER=meta`
- `WHATSAPP_API_VERSION=v21.0`
- `WHATSAPP_PHONE_NUMBER_ID=894579883740461`
- `WHATSAPP_TEMPLATE_NAME=roaster_validation_otp`
- `WHATSAPP_ACCESS_TOKEN=<active_token>`

## Known Operational Notes
- If app runs in `dev`, OTP may appear as `Dev OTP` (for test convenience).
- If running on plain HTTP (IP only), cookie/security behavior can differ from HTTPS production.
- Git ownership/safe-directory issues on EC2 were identified; ownership reset or re-clone resolves this.

## What Success Looks Like (Definition of Done)
1. Admin logs in by email and receives OTP on WhatsApp reliably.
2. Admin sees only relevant team records and can configure products per team.
3. Team manager updates roster with only admin-enabled product fields visible.
4. Export flow correctly handles unsaved changes with confirmation choices.
5. Share message flow is clear and copyable for team coordination.
6. App is stable on EC2 + RDS behind Nginx/PM2 and accessible via domain/subdomain.

## Immediate Next Actions
1. Commit and push current local code updates.
2. Fresh clone/pull on EC2 and redeploy (`npm ci`, Prisma, build, PM2 restart).
3. Validate WhatsApp OTP in production mode (`npm run start`, not `npm run dev`).
4. Point DNS to EC2 and enable HTTPS once IP testing passes.
5. Perform final UAT checklist:
   - team create/update/edit/export
   - admin login/config/share/export
   - error handling (429, invalid OTP/PIN, save/export failures)

## Long-Term Vision (Post-Launch Enhancements)
- Better audit trail (who changed what and when).
- Richer roster templates and product rules per sport category.
- Improved admin insights dashboard (team completion status).
- Automated reminders for pending roster updates.

