/**
 * Helpers for turning raw Supabase/PostgREST errors into (a) a safe,
 * friendly message for the UI and (b) a detailed record for server logs.
 */

export type DbErrorLike = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

/**
 * True when the error means "this column doesn't exist (yet)":
 *  - PGRST204: PostgREST's schema cache has no such column (migration not
 *    applied, or applied but the cache hasn't reloaded)
 *  - 42703: Postgres undefined_column
 */
export function isMissingColumnError(error: DbErrorLike | null | undefined): boolean {
  if (!error) return false;
  if (error.code === 'PGRST204' || error.code === '42703') return true;
  const message = error.message ?? '';
  return /could not find the '[^']+' column/i.test(message) || /column .* does not exist/i.test(message);
}

/** Extracts the offending column name from a missing-column error, if present. */
export function missingColumnName(error: DbErrorLike | null | undefined): string | null {
  const message = error?.message ?? '';
  const match =
    message.match(/could not find the '([^']+)' column/i) ??
    message.match(/column "?(?:\w+\.)?(\w+)"? (?:of relation \S+ )?does not exist/i);
  return match?.[1] ?? null;
}

/** Row-level-security / permission failures. */
export function isPermissionError(error: DbErrorLike | null | undefined): boolean {
  return error?.code === '42501' || /row-level security|permission denied/i.test(error?.message ?? '');
}

/** User-facing message for a failed settings write. Never includes SQL/internal detail. */
export function friendlySaveError(error: DbErrorLike): string {
  if (isMissingColumnError(error)) {
    return 'Your settings could not be saved because the database needs an update. Please contact support or your administrator — this is not something you did wrong.';
  }
  if (isPermissionError(error)) {
    return "You don't have permission to change these settings.";
  }
  return 'Something went wrong while saving your settings. Please try again in a moment.';
}
