# Pentriq rebrand report

Product renamed from **Pentriq** to **Pentriq**. Single source of truth: [`src/lib/brand.ts`](./src/lib/brand.ts)
(`APP_NAME`, wordmark parts, tagline/description, storage keys, `senderDisplayName()`).
A regression test (`src/lib/__tests__/brand.test.ts`) fails if the old name reappears in `src/`, `public/` or `scripts/`.

## Where the name now comes from `brand.ts`
Root layout metadata (title template, description, OpenGraph, Twitter card), billing plan name, logo wordmarks
(`Logo`, `LogoOnDark`, dashboard preview), review request/reminder email header + footer, welcome / campaign /
trial-ending notification emails, "`{business}` via Pentriq" sender names (review queue, scheduled sends, manual sends,
legacy sender), email configuration test emails, browser storage keys.

Long-form prose (landing page, Terms, Privacy, how-it-works, integration docs, settings help text, documentation)
is written as plain "Pentriq" text on purpose so it stays easy to edit.

## Remaining occurrences (intentional)
| Location | Why it stays |
| --- | --- |
| `supabase/migrations/0001`, `0005`, `0009` (SQL comments) | Historical migrations must not be modified. Comments only; no functional effect. |
| `src/lib/brand.ts` `LEGACY_STORAGE_KEYS` | Read as a fallback so users keep their saved theme / sidebar / "setup dismissed" preference. Safe to delete after a release or two. |
| `.env.local` `ADMIN_EMAIL=…admin@pentriq.local` | Local, git-ignored environment file holding a live admin login. Changing it could lock the admin out. Update it yourself if that account is renamed. |
| `.vercel/project.json` (`projectName: "pentriq"`) | Local, git-ignored link to the existing Vercel project. Rename the project in Vercel, then run `vercel link`. |
| `server.log` (tracked) | Generated log containing the local directory path `review-flow-rebuild`. Not source; consider untracking it. |
| Directory name `review-flow-rebuild`, CSS prefix `rf-*`, `rf-` animation names | Internal identifiers with no user-visible effect. Rename separately if desired. |

## Database / data
- No table, column or migration changed. No customer records touched.
- Seed script default demo login is now `demo@pentriq.app`. **Existing databases still contain the old `demo@pentriq.app` user** (untouched). Demo-mode detection is based on "demo" in the address, so both behave as demo accounts. Delete the old user manually or run the seed with `SEED_DEMO_EMAIL=demo@pentriq.app` to keep using it.
- Integration "test import" sample email is now `test@pentriq.local`.

## Manual actions required
1. **Logo/brand assets (see below)** – the mark is still the old paper-plane.
2. **Supabase Auth emails** (confirm signup, password reset, magic link, invite): these templates live in the Supabase dashboard (*Authentication → Emails*), not in this repo. Replace "Pentriq" there and the sender name under SMTP settings.
3. **Resend**: set `EMAIL_FROM` on a verified Pentriq domain; update the sending domain / display name.
4. **Stripe**: new checkouts use the product name "Pentriq" (`PLAN.name`). Rename the existing Stripe product and any hosted-portal branding.
5. **Vercel / hosting**: rename the project, update domain and `NEXT_PUBLIC_APP_URL`, and the cron job URLs that call the `/api/*` endpoints.
6. **Third-party consoles**: Zapier/Make zaps, Google OAuth consent screen (if used) and any saved webhook names that mention Pentriq.
7. **Docker/compose** image tags or registry names (none referenced the old name in this repo).
8. Rotate nothing – no secrets were affected.

## Files needing new Pentriq logo assets
| File | Current state |
| --- | --- |
| `public/logo-mark.svg` | Old paper-plane mark, green `#188038`. Needs Pentriq mark. |
| `public/logo-horizontal.svg` | Text updated to "Pentriq" (placeholder two-tone "Pentr|iq"); old paper-plane mark. |
| `public/logo-stacked.svg` | Same as above; also has the old tagline "REACH · REQUEST · REVIEW". |
| `src/app/icon.svg` | **Favicon** – old paper-plane. |
| `src/components/logo.tsx` (`PlaneIcon`, `LogoMark`) | In-app logo mark (header, sidebar, auth, legal pages). |
| `src/app/email-assets/logo-mark.png/route.tsx` | Generates the PNG logo mark used in email headers/footers. Swap the SVG path/gradient (or serve a static PNG). |
| `src/lib/email.ts` | Notification-email wordmark uses the old green `#188038`. |
| *(missing)* | No OpenGraph/Twitter share image, apple-touch-icon or PWA manifest icons exist yet – add `src/app/opengraph-image.png`, `apple-icon.png`, etc. |

Placeholders: wordmark is rendered "Pentr" + accent "iq" (`APP_NAME_LEAD` / `APP_NAME_ACCENT`). Change in `brand.ts` if the final logo is single-tone.
