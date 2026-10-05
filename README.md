# ReviewFlow

ReviewFlow is a collaborative software project currently in development, designed to help service-based businesses automate customer reviews, retention and rebooking workflows.

Built with:

- Next.js 14
- TypeScript
- Supabase
- PostgreSQL
- Tailwind CSS
- Vercel

Key functionality includes:

- Automated review requests
- Customer rebooking reminders
- Loyalty programmes
- Referral tracking
- Customer segmentation
- Retention campaigns
- Analytics and reporting

Status: Active development.





# Detailed Technical Documentation

A platform for service businesses to automate review requests, rebooking
reminders, and customer retention (loyalty, referrals, win-back campaigns),
built on top of a channel-agnostic messaging engine and a small journey
scheduler.

**This started as a minimal prototype and has grown into a fuller platform,
but is still not a hardened production application.** Several integration
points (SMS/WhatsApp delivery, AI-drafted copy, real-time booking) are
implemented as clean, swappable interfaces with a working fallback rather
than live third-party integrations, since this environment has no real
Twilio/LLM credentials to build and test against — see "Integration points
that need real credentials" below for exactly what to wire up.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [Supabase](https://supabase.com/) (Postgres + Auth, Row Level Security)
- [Tailwind CSS](https://tailwindcss.com/)
- [Resend](https://resend.com/) for sending email

## Features

### Review collection
- Email/password auth (Supabase Auth), with team support: a business can
  have more than one user via the `business_members` table (no UI to invite
  teammates yet, but the schema and RLS model support it).
- Settings: business name, Google review URL, send delay.
- Customers: add name + email + phone, or **bulk CSV import** (name/email
  columns, dedup against existing customers, per-row error reporting).
- **Multi-touch review request sequence**: every new customer is enrolled
  in a 3-step journey (initial request, day-3 reminder, day-7 final
  reminder) that stops automatically as soon as the customer clicks or
  submits feedback — not just a single one-shot email.
- **Compliant private feedback channel**: every review request shows a
  public review link *and* an unconditional private feedback option,
  never gated by predicted sentiment — see
  [`src/lib/compliance.ts`](./src/lib/compliance.ts) for the enforced
  invariant and why (FTC 16 CFR Part 465 / Google review-gating policy).
  Feedback submitted privately shows up in the **Feedback inbox** page for
  the business to acknowledge/resolve.
- **Channel-agnostic messaging**: email is fully wired via Resend; SMS/
  WhatsApp are structurally complete (template rendering, retry, consent)
  but send through a logging stub until real provider credentials are
  configured — see "Integration points" below.
- Automatic retry with exponential backoff (5 min → 30 min → 2h → 6h, up to
  5 attempts) on any failed send, instead of failing permanently on the
  first error.
- Unsubscribe link in every email (CAN-SPAM compliance); stops all future
  sends to that customer and cancels anything already scheduled.

### Rebooking
- **Service catalog** (Settings → Services): name, typical rebooking
  interval in days, default price.
- **Customer detail page**: lifetime value, next-expected-visit date,
  due/lapsed badges, tag editor, loyalty points balance, visit log with a
  "log a visit" form (service + price + notes).
- **Automated rebooking reminders**: a daily job scans every customer's
  visit history against their service's rebooking interval and enrolls
  due customers into a rebooking-reminder journey, and lapsed customers
  (2x the interval with no return visit) into a win-back journey.
- **Rebooking request page** (`/book/[customerId]`): captures a customer's
  preferred time as a note for the business to confirm manually. This is
  *not* a real-time booking engine with live availability — building one
  requires either a native slot-scheduling system or an integration with
  whatever calendar tool the business already uses, which the spec this
  was built from explicitly calls out as a decision to validate with real
  customers first rather than assume.

### Retention
- **Segments** (`/segments`): dynamic customer segments (e.g. "60+ days
  since last visit AND lifetime value over $200"), evaluated live from
  visit/spend/tag data rather than a static list that goes stale.
- **Loyalty program** (Settings → Loyalty): points per visit/review/
  referral, configurable redemption threshold and reward description.
  Points are an append-only ledger (never a mutable balance field), shown
  on each customer's detail page.
- **Referrals** (`/referrals`): generate a code for an existing customer,
  redeem it against a new customer; both get rewarded with loyalty points
  (if the program is active) once redeemed.
- **Win-back and birthday campaigns**: the same daily lifecycle scan that
  drives rebooking reminders also enrolls lapsed customers into a win-back
  journey and birthday-matched customers into a birthday journey.

### Analytics
- **Dashboard**: customers added, emails sent, link clicks, and the actual
  click-through rate (not just raw counts), plus pending/failed visibility.
- **Analytics page** (`/analytics`): 30-day rebooking rate, revenue
  attributed to rebooking-reminder clicks (last-touch, 7-day window), and
  a customer health-tier distribution (thriving/steady/at-risk/lapsed)
  computed from a simple, explainable recency/frequency/monetary blend —
  see [`src/lib/health.ts`](./src/lib/health.ts).
- Admin view: if you log in with an email listed in `ADMIN_EMAIL`, your
  dashboard also shows a table of every registered business.

### AI (hooks, not live calls)
- [`src/lib/ai.ts`](./src/lib/ai.ts) has a `draftMessageCopy()` function
  that would call an LLM if `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set,
  and otherwise falls back to a deterministic template-based draft. No
  real LLM call is implemented (no credentials to test against) — the
  integration point is ready for a one-function addition once a provider
  is chosen.

## Integration points that need real credentials

These are built as clean, swappable interfaces with a working, honest
fallback — not left out, but not fake either:

| Feature | File | Current behavior | To go live |
| --- | --- | --- | --- |
| SMS / WhatsApp sending | [`src/lib/messaging.ts`](./src/lib/messaging.ts) | Logs the message server-side instead of delivering it (`LoggingStubSmsProvider`) | Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, then implement the real Twilio REST call in `createSmsProvider()` — everything else (templates, retry, consent, resolveChannel) already works against the interface |
| AI-drafted message copy | [`src/lib/ai.ts`](./src/lib/ai.ts) | Falls back to a template-based draft | Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`, then implement the completion call in `draftMessageCopy()` |
| One-click rebooking with live availability | [`src/app/book/[customerId]`](./src/app/book/[customerId]) | Captures a preferred-time request as a note for manual follow-up | Either build a native slot-availability engine or integrate with the business's existing calendar/scheduling tool — see the comment in `actions.ts` |

## 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com/).
2. In the SQL editor, run the full contents of
   [`supabase/schema.sql`](./supabase/schema.sql). This creates every table
   (businesses, business_members, customers, customer_tags, services,
   visits, messages, interaction_events, private_feedback, journeys,
   journey_enrollments, segments, loyalty_programs, loyalty_ledger_entries,
   referrals, import_jobs, plus the original review_requests/click_events)
   along with Row Level Security policies, and backfills `business_members`
   + default journeys for any businesses that already exist.
   - `schema.sql` is idempotent (`create table if not exists`, `drop
     policy if exists` + `create policy`) — safe to run again on a
     database that already has some of these tables. **Caveat:** this
     idempotency only applies to whole tables. If a table already exists,
     `create table if not exists` does not add any new columns to it, even
     ones listed in the statement — this caused a production incident
     where `customers.phone` (among other columns) was never created
     because `customers` pre-dated this schema version. Columns added to
     an already-existing table must ship as a separate `alter table ...
     add column if not exists` migration (see 0003 below), not just be
     added to this file's `create table` statement.
   - If you're upgrading from a database older than this version, run, in
     order: [`supabase/migrations/0001_retry_and_consent.sql`](./supabase/migrations/0001_retry_and_consent.sql),
     then `schema.sql` in full (see
     [`supabase/migrations/0002_platform.sql`](./supabase/migrations/0002_platform.sql)
     for why there's no separate incremental SQL file for this step), then
     [`supabase/migrations/0003_fix_missing_columns.sql`](./supabase/migrations/0003_fix_missing_columns.sql)
     (adds columns that step 2 silently skips on tables that pre-date this
     schema version — safe/required even if you believe you already ran
     the full schema), then
     [`supabase/migrations/0004_business_logo_storage.sql`](./supabase/migrations/0004_business_logo_storage.sql)
     (creates the public `business-logos` Storage bucket and its RLS
     policies, used by the profile picture uploader in Settings).
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
| `NEXT_PUBLIC_APP_URL` | Public URL of this app, used to build tracking/unsubscribe/feedback/booking links (e.g. `http://localhost:3000` locally) |
| `CRON_SECRET` | Random secret required to call any `/api/*` scheduled-job endpoint |
| `ADMIN_EMAIL` | If your logged-in email matches this, your dashboard also shows every registered business. Comma-separate multiple emails for more than one admin. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Optional — enables real SMS/WhatsApp sending once implemented in `lib/messaging.ts` (see Integration points above). Without these, SMS/WhatsApp sends are logged, not delivered. |
| `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` | Optional — enables real AI-drafted message copy once implemented in `lib/ai.ts`. Without these, drafting falls back to templates. |

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
placeholders used for build-time variables. Rebuild after changing
dependencies or `NEXT_PUBLIC_*` vars with `docker compose up --build`.

If you hit a TLS/certificate error inside the container (`unable to get
local issuer certificate`) but everything works fine outside Docker, your
network likely runs a corporate TLS-inspecting proxy (e.g. Zscaler) whose
root CA is trusted on your host machine but unknown to a fresh container.
See the comments in [`Dockerfile`](./Dockerfile).

## 5. Seed demo data (optional)

```bash
npm run seed
```

Creates a demo business, its `business_members` row, and five sample
customers (mix of pending/sent review requests, one already clicked).

Demo login: `demo@reviewflow.app` / `demo-password-123` by default —
override with `SEED_DEMO_EMAIL` / `SEED_DEMO_PASSWORD` env vars.

## 6. Scheduled jobs

Nothing sends automatically on a timer inside the Next.js app — external
schedulers must hit these endpoints on an interval. All are protected by
`CRON_SECRET` (as `?secret=...` or `Authorization: Bearer ...`):

| Endpoint | What it does | Suggested interval |
| --- | --- | --- |
| `GET /api/send-review-requests` | Legacy single-send review request flow (the original `review_requests` table) | Every 5 min |
| `GET /api/send-messages` | Processes the generalized `messages` table — review sequence follow-ups, rebooking reminders, win-back, birthday, referral, loyalty messages | Every 5 min |
| `GET /api/scan-customer-lifecycle` | Daily scan: enrolls due customers into rebooking reminders, lapsed customers into win-back, birthday matches into birthday campaigns | Daily |

Locally:

```bash
curl "http://localhost:3000/api/send-messages?secret=YOUR_CRON_SECRET"
```

In production, use [Vercel Cron](./vercel.json) (update the `secret` query
param to match your real `CRON_SECRET` before deploying) or any external
scheduler (e.g. [cron-job.org](https://cron-job.org/), a GitHub Actions
scheduled workflow) hitting the same URLs.

## 7. Click tracking, feedback, and unsubscribe

- `/api/track/[reviewRequestId]` and `/api/track-message/[messageId]` both
  record a click and redirect to the business's Google review URL — the
  former for the legacy flow, the latter for the generalized `messages`
  flow.
- `/feedback/[messageId]` is the public private-feedback landing page
  linked from every review request.
- `/api/unsubscribe/[customerId]` stops all future emails to a customer.

## 8. Admin view

If you log in with the email set as `ADMIN_EMAIL`, your dashboard also
shows a table of every business that has signed up. Comma-separate
multiple addresses to grant more than one account admin access.

## Deploying to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import the project into Vercel.
3. Add all variables from `.env.example` in Project Settings → Environment
   Variables.
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL.
5. Deploy. Update the `secret` in `vercel.json` so Vercel Cron can
   authenticate against all three scheduled-job endpoints.

## Project structure

```
src/
  app/
    (app)/                     Authenticated shell: layout, nav, logout
      dashboard/                Funnel + conversion rate, pending/failed counts
      customers/                List, add, CSV import, [customerId] detail page
      segments/                 Dynamic segment builder
      referrals/                Generate + redeem referral codes
      feedback-inbox/           Private feedback inbox (acknowledge/resolve)
      analytics/                Rebooking rate, revenue attribution, health tiers
      settings/                 Business settings, services catalog, loyalty program
    api/
      send-review-requests/     Legacy single-send scheduled job
      send-messages/            Generalized multi-purpose/multi-channel scheduled job
      scan-customer-lifecycle/  Daily rebooking/win-back/birthday enrollment scan
      track/[id]/               Legacy click tracking + redirect
      track-message/[id]/       Generalized click tracking + redirect + journey exit
      unsubscribe/[customerId]/ Public unsubscribe endpoint
    book/[customerId]/          Public rebooking request landing page
    feedback/[messageId]/       Public private feedback landing page
    auth/callback/, login/, signup/
  components/                   Shared UI (auth form, nav links, logo)
  lib/
    supabase/                   Browser / server / admin Supabase clients
    business.ts                 Loads (or lazily creates) the logged-in user's business + membership
    messaging.ts                Channel-agnostic send abstraction (email real, SMS/WhatsApp stubbed)
    templates.ts                Message copy per purpose/channel, compliance-enforced for review purposes
    compliance.ts               Enforces the "always offer both public + private" invariant
    journeys.ts                 Minimal journey engine (enroll/advance/exit)
    visits.ts                   Rebooking status + lifetime value calculations
    segments.ts                 Live segment rule evaluator
    health.ts                   Rebooking rate, revenue attribution, health scoring
    customers.ts                CSV parsing + bulk import
    ai.ts                       AI drafting hook (template fallback, provider-pluggable)
    database.types.ts           Hand-written types matching supabase/schema.sql
supabase/
  schema.sql                    Full table set + RLS policies (idempotent)
  migrations/                   Incremental SQL for upgrading existing databases
scripts/seed.mjs                Demo data seed script
Dockerfile, docker-compose.yml, docker/certs/  Optional Docker setup
```

## Known limitations (by design)

- SMS/WhatsApp sending is structurally complete but logs instead of
  delivering until real Twilio credentials are configured (see
  "Integration points" above).
- AI message drafting falls back to templates until a real LLM provider
  key is configured.
- Rebooking is "request + manual confirm," not real-time booking with live
  availability — see the note in `src/app/book/[customerId]/actions.ts`.
- Segmentation evaluates all customers in-memory per request — fine at SMB
  scale, would need a SQL-level query or materialized rollup at larger
  scale (see `src/lib/segments.ts`).
- Revenue attribution uses a simple last-touch, 7-day click-to-visit
  window — a reasonable estimate, not perfect ground truth.
- Customer health scoring is a simple, explainable recency/frequency/
  monetary heuristic, not a trained predictive model — deliberately, so
  the business owner can see *why* a customer is scored the way they are.
- No automated test suite yet.
- CSV import caps at 2,000 rows / 2MB per file.
- The scheduled job endpoints each process at most 50 due rows per run.
