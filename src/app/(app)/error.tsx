'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Icon } from '@/components/ui/icons';

/**
 * Error boundary for every page inside the app shell. Several pages throw
 * when a query fails; this turns that into a recoverable, on-brand state
 * instead of the framework's default error screen. The raw error message is
 * deliberately not shown (it can contain internals) - only the digest.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card mx-auto mt-6 max-w-lg px-8 py-12 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-600/10 dark:bg-red-500/10 dark:text-red-400">
        <Icon name="warning" className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <h1 className="mt-5 text-lg font-semibold tracking-tight text-ink">Something went wrong</h1>
      <p className="mt-2 text-sm leading-6 text-ink-3">
        We couldn&apos;t load this page. This is usually temporary &mdash; try again, and if it keeps
        happening, let us know.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={reset} className="btn btn-primary">
          <Icon name="refresh" className="h-4 w-4" />
          Try again
        </button>
        <Link href="/dashboard" className="btn btn-secondary">
          Go to dashboard
        </Link>
      </div>
      {error.digest && <p className="mt-6 font-mono text-xs text-ink-4">Reference: {error.digest}</p>}
    </div>
  );
}
