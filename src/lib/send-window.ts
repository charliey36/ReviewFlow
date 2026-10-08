/**
 * Customer emails go out between 09:00 and 12:00 UK time. Scheduled sends are
 * snapped to 09:00 (Europe/London) so the daily job (09:00 UTC, which is
 * 09:00-11:00 UK time all year) delivers them inside that window.
 */
const TZ = 'Europe/London';
export const SEND_WINDOW_START_HOUR = 9;
export const SEND_WINDOW_END_HOUR = 12;

const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

/** London wall-clock parts for an instant. */
function londonParts(ms: number) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((x) => [x.type, Number(x.value)]));
  return { y: p.year, m: p.month, d: p.day, hour: p.hour, minute: p.minute };
}

/** UTC instant for a London wall-clock time (handles BST/GMT). */
function londonToUtc(y: number, m: number, d: number, hour: number): Date {
  const guess = Date.UTC(y, m - 1, d, hour);
  const offsetAt = (ms: number) => {
    const p = londonParts(ms);
    return Date.UTC(p.y, p.m - 1, p.d, p.hour, p.minute) - ms;
  };
  return new Date(guess - offsetAt(guess - offsetAt(guess)));
}

/** If `at` is inside 09:00-12:00 UK time keep it, otherwise move to the next 09:00. */
export function snapToSendWindow(at: Date): Date {
  const p = londonParts(at.getTime());
  if (p.hour >= SEND_WINDOW_START_HOUR && p.hour < SEND_WINDOW_END_HOUR) return at;
  const day = p.hour < SEND_WINDOW_START_HOUR ? p : londonParts(at.getTime() + 24 * 3_600_000);
  return londonToUtc(day.y, day.m, day.d, SEND_WINDOW_START_HOUR);
}

/** When to email a review request for a service done on `serviceDate` (YYYY-MM-DD): 09:00 the next day, or the next window if that has passed. */
export function reviewSendTime(serviceDate: string, now = new Date()): Date {
  const [y, m, d] = serviceDate.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const target = londonToUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), SEND_WINDOW_START_HOUR);
  return target.getTime() >= now.getTime() ? target : snapToSendWindow(now);
}
