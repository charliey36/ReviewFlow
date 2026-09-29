# ReviewFlow

A minimal prototype for automatically sending customer review request emails
after a configurable delay, with click tracking and a simple dashboard.

**This is a demo/prototype, not a production-ready application.** Error
handling, rate limiting, retries, and security hardening are intentionally
minimal.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [Supabase](https://supabase.com/) (Postgres + Auth)
- [Tailwind CSS](https://tailwindcss.com/)
- [Resend](https://resend.com/) for sending email

## Features

- Email/password auth (Supabase Auth)
- Settings: business name, Google review URL, send delay (default 2 hours)
- Customers: add name + email, auto-schedules a review request
- Scheduled job endpoint that sends due review request emails
- Click tracking endpoint that records a click, then redirects to your
  Google review URL
- Dashboard: customers added, emails sent, review link clicks
- Admin view: if you log in with an email listed in `ADMIN_EMAIL`, your
  dashboard also shows a table of every registered business — no separate
  login, just a check against your normal account (supports multiple admin
  emails, comma-separated)

## 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com/).
2. In the SQL editor, run the contents of [`supabase/schema.sql`](./supabase/schema.sql).
   This creates the `businesses`, `customers`, `review_requests`, and
   `click_events` tables along with Row Level Security policies.
3. From Project Settings → API, copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

## 2. Create a Resend account (for sending email)

1. Sign up at [resend.com](https://resend.com/) and create an API key.
2. For a quick demo you can send from `onboarding@resend.dev` (Resend's
   shared sandbox sender) without verifying a domain. For anything beyond a
   demo, verify your own sending domain in Resend and set `EMAIL_FROM`
   accordingly.

## 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — **server-only**, never expose to the browser |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | Verified sender address (or `onboarding@resend.dev` for a demo) |
| `NEXT_PUBLIC_APP_URL` | Public URL of this app, used to build the tracking link in emails (e.g. `http://localhost:3000` locally) |
| `CRON_SECRET` | Random secret required to call `/api/send-review-requests`, so it can't be triggered by anyone else |
| `ADMIN_EMAIL` | If your logged-in email matches this, your dashboard also shows every registered business (see [step 8](#8-admin-view)). Comma-separate multiple emails for more than one admin. |

## 4. Install and run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`, sign up, and you'll land on the dashboard.

### Or run it with Docker

```bash
ln -sf .env.local .env   # one-time: lets docker compose read your env vars
docker compose up
```

Visit `http://localhost:3000`. The symlink is needed because Docker Compose
only reads a plain `.env` file (not `.env.local`) to fill in `${...}`
placeholders used for build-time variables — the symlink means you still
only maintain one file. Rebuild after changing dependencies or `NEXT_PUBLIC_*`
vars with `docker compose up --build`.

If you hit a TLS/certificate error inside the container (`unable to get
local issuer certificate`) but everything works fine outside Docker, your
network likely runs a corporate TLS-inspecting proxy (e.g. Zscaler) whose
root CA is trusted on your host machine but unknown to a fresh container.
See the comments in [`Dockerfile`](./Dockerfile) — export your proxy's root
CA and add it the same way `docker/certs/zscaler-root-ca.pem` is added here,
or remove those lines entirely if you're not on such a network.

## 5. Seed demo data (optional)

Populates a demo business and five sample customers (mix of pending/sent
review requests, one already clicked) so the app looks used immediately:

```bash
npm run seed
```

This logs a demo login (`demo@reviewflow.app` / `demo-password-123` by
default — override with `SEED_DEMO_EMAIL` / `SEED_DEMO_PASSWORD` env vars).

## 6. Sending review request emails

Because customers may be added at any time, a **scheduled job** is
responsible for actually sending emails once they're due — nothing sends
automatically on a timer inside the Next.js app itself.

Trigger it by calling:

```
GET /api/send-review-requests?secret=YOUR_CRON_SECRET
```

Locally, you can trigger a run manually:

```bash
curl "http://localhost:3000/api/send-review-requests?secret=YOUR_CRON_SECRET"
```

In production, use a scheduler to call this on an interval (every 5 minutes
is plenty for a demo). Two options:

- **Vercel Cron** — [`vercel.json`](./vercel.json) already defines a cron
  job that hits this endpoint every 5 minutes. Edit the `secret` query
  param in `vercel.json` to match your real `CRON_SECRET` before deploying
  (or, since committing secrets to `vercel.json` isn't great practice,
  instead set the route to read the secret from a request header and
  configure that header in your scheduler of choice).
- **Any external cron** (e.g. [cron-job.org](https://cron-job.org/), GitHub
  Actions scheduled workflow) — just hit the same URL on an interval.

## 7. Click tracking

Emails link to `/api/track/[reviewRequestId]`, which records a `click_events`
row and redirects the visitor to the business's Google review URL from
Settings.

## 8. Admin view

If you log in with the email set as `ADMIN_EMAIL` (via the normal `/login`
page — this is not a separate password), your dashboard also shows a table
of every business that has signed up (owner email, customer count, delay
setting, signup date). It's just a check against your own account, not a
separate login, not shown in the nav for anyone else. Comma-separate
multiple addresses in `ADMIN_EMAIL` to grant more than one account admin
access.

## Deploying to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import the project into Vercel.
3. Add all variables from `.env.example` in Project Settings → Environment
   Variables (use your real values, not the placeholders).
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL.
5. Deploy. Update the `secret` in `vercel.json` (see step 6 above) so the
   Vercel Cron job can authenticate.

## Project structure

```
src/
  app/
    (app)/                 Authenticated shell: layout, nav, logout action
      dashboard/           Stats: customers, emails sent, clicks (+ admin-only businesses table)
      customers/           Add + list customers
      settings/            Business name, review URL, delay
    api/
      send-review-requests/ Scheduled job: sends due review request emails
      track/[id]/          Click tracking + redirect to Google review URL
    auth/callback/          Exchanges Supabase email confirmation code for a session
    login/, signup/        Auth pages
  components/              Shared UI (auth form, nav links)
  lib/
    supabase/              Browser / server / admin Supabase clients
    business.ts            Loads (or lazily creates) the logged-in user's business
    email.ts               Email template + Resend send helper
    database.types.ts      Hand-written types matching supabase/schema.sql
supabase/schema.sql        Tables + RLS policies
scripts/seed.mjs           Demo data seed script
Dockerfile, docker-compose.yml, docker/certs/  Optional Docker setup
```

## Known limitations (by design, for a prototype)

- No CSV upload, no SMS, no Google API integration, no analytics charts.
- One business per Supabase Auth user (no multi-business support, no team
  roles).
- The scheduled job processes at most 50 due requests per run and does not
  retry failed sends automatically — failed rows are marked `status: failed`
  and stay that way.
- No email deliverability tooling (bounce/complaint handling, unsubscribe
  links).
