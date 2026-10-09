/**
 * Single source of truth for the product's name and brand strings.
 *
 * Import from here instead of typing the product name in code, so a future
 * rename is a one-file change. (Long-form prose in marketing/legal pages and
 * documentation is written out in plain text on purpose, so it stays easy for
 * non-developers to edit.)
 *
 * No server-only imports: safe to use from client components, server code,
 * emails and tests.
 */

export const APP_NAME = 'Pentriq';

/**
 * The two-tone wordmark used by the logo lockups and email header
 * ("Pentr" in the ink colour + "iq" in the brand accent). Placeholder styling
 * until final Pentriq brand assets are supplied — see BRANDING_REPORT.md.
 */
export const APP_NAME_LEAD = 'Pentr';
export const APP_NAME_ACCENT = 'iq';

export const APP_TAGLINE = 'Reviews, rebookings and referrals on autopilot';
export const APP_TITLE = `${APP_NAME} — ${APP_TAGLINE}`;
export const APP_DESCRIPTION =
  'Automate review requests, rebooking reminders and customer retention for service businesses. Compliant by design, with a private feedback channel on every request.';

/** Prefix for browser storage keys and similar machine identifiers (lowercase, no spaces). */
export const APP_SLUG = 'pentriq';

/** Browser localStorage keys. */
export const STORAGE_KEYS = {
  theme: `${APP_SLUG}-theme`,
  sidebarOpen: `${APP_SLUG}-sidebar-open`,
  setupDismissed: `${APP_SLUG}-setup-dismissed`,
} as const;

/**
 * Keys used before the rename. Read as a fallback so users keep their theme /
 * sidebar / "setup dismissed" preference instead of being reset.
 */
export const LEGACY_STORAGE_KEYS = {
  theme: 'reviewflow-theme',
  sidebarOpen: 'reviewflow-sidebar-open',
  setupDismissed: 'reviewflow-setup-dismissed',
} as const;

/** "{business} via Pentriq" — the display name on outgoing customer emails. */
export function senderDisplayName(businessName: string): string {
  return `${businessName} via ${APP_NAME}`;
}
