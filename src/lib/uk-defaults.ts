/**
 * UK-first locale defaults for ReviewFlow.
 *
 * Centralises the three things that differ for a UK audience from the US
 * defaults the app was originally built with:
 *   - Dates render as DD/MM/YYYY (not MM/DD/YYYY)
 *   - Money renders in GBP (£) (not USD)
 *   - Times/scheduling are anchored to Europe/London
 *
 * Prefer importing these helpers over hand-rolling `toLocaleDateString`/
 * `Intl.NumberFormat` calls so the whole product stays consistent and a
 * future locale switch is a one-file change.
 */

/** IANA timezone for all UK-anchored date/time display and scheduling. */
export const UK_TIMEZONE = 'Europe/London';

/** BCP-47 locale used for UK date and currency formatting. */
export const UK_LOCALE = 'en-GB';

/** ISO 4217 currency code for the default (GBP). */
export const UK_CURRENCY = 'GBP';

/** The default currency symbol, handy for inline input adornments. */
export const UK_CURRENCY_SYMBOL = '£';

/**
 * Format a date as DD/MM/YYYY in Europe/London.
 *
 * @example formatUKDate(new Date('2026-01-09')) // "09/01/2026"
 */
export function formatUKDate(date: Date): string {
  return new Intl.DateTimeFormat(UK_LOCALE, {
    timeZone: UK_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Format a date and time (DD/MM/YYYY, HH:MM) in Europe/London, 24h clock.
 *
 * @example formatUKDateTime(new Date('2026-01-09T14:30:00Z')) // "09/01/2026, 14:30"
 */
export function formatUKDateTime(date: Date): string {
  return new Intl.DateTimeFormat(UK_LOCALE, {
    timeZone: UK_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

/**
 * Format a numeric amount as GBP currency.
 *
 * @example formatUKCurrency(45) // "£45.00"
 * @example formatUKCurrency(1299.5) // "£1,299.50"
 */
export function formatUKCurrency(amount: number): string {
  return new Intl.NumberFormat(UK_LOCALE, {
    style: 'currency',
    currency: UK_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** The IANA timezone the app treats as "local" for UK-first defaults. */
export function getUKTimezone(): string {
  return UK_TIMEZONE;
}
