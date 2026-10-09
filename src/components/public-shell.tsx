import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icons';
import { Logo } from '@/components/logo';

/**
 * Shared frame for the customer-facing public pages (private feedback and
 * rebooking request). These are what the business's own customers see, so
 * they carry the business identity first and a quiet "powered by" mark.
 */
export function PublicShell({
  businessName,
  logoUrl,
  title,
  subtitle,
  note,
  children,
}: {
  businessName?: string;
  logoUrl?: string | null;
  title: string;
  subtitle: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_5%,transparent_65%)]"
      />

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="mb-6 flex items-center justify-center gap-3">
          {businessName ? (
            <>
              <Avatar name={businessName} src={logoUrl} size="lg" />
              <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{businessName}</span>
            </>
          ) : (
            <Logo />
          )}
        </div>

        <main className="card p-6 shadow-pop sm:p-8">
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-ink">{title}</h1>
          <p className="mt-1.5 text-sm leading-6 text-ink-3">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </main>

        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-ink-4">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="lock" className="h-3 w-3" />
            {note}
          </span>
          <span aria-hidden="true">&middot;</span>
          <span>Powered by Pentriq</span>
        </p>
      </div>
    </div>
  );
}

/** Confirmation state shown after a public form is submitted successfully. */
export function PublicSuccess({ title, message }: { title: string; message: string }) {
  return (
    <div className="animate-fade-in py-4 text-center" role="status">
      <span className="mx-auto flex h-12 w-12 animate-pop-in items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-600/15 dark:bg-brand-500/10 dark:text-brand-400">
        <Icon name="check" className="h-6 w-6" strokeWidth={2.2} />
      </span>
      <p className="mt-4 text-base font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-xs text-sm leading-6 text-ink-3">{message}</p>
    </div>
  );
}
