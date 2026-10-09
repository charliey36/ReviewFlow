import Link from 'next/link';
import { LegalLinks } from '@/components/legal-links';
import type { ReactNode } from 'react';
import { Logo } from '@/components/logo';
import { Icon } from '@/components/ui/icons';
import { ProductPreview } from '@/components/marketing/product-preview';

const points = [
  'Automatic review requests with reminders that stop when a customer responds',
  'A private feedback option on every request, never gated by sentiment',
  'Rebooking reminders, loyalty points and referrals in one place',
];

/**
 * Split-screen layout for login and signup: the form on the left, a brand
 * panel with the product and its value on the right (hidden on small screens
 * so the form always comes first on mobile).
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="relative isolate flex flex-col overflow-hidden px-6 py-8 sm:px-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-1/3 -z-10 h-80 w-80 rounded-full bg-brand-400/20 blur-[100px]"
        />
        <Link href="/" aria-label="Pentriq home" className="w-fit rounded-md">
          <Logo />
        </Link>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm animate-fade-in-up">
            <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.025em] text-ink">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-ink-3">{subtitle}</p>

            <div className="mt-8">{children}</div>

            <p className="mt-8 text-center text-sm text-ink-3">{footer}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-ink-4">
          <p>&copy; {new Date().getFullYear()} Pentriq</p>
          <LegalLinks />
        </div>
      </div>

      <aside className="relative hidden overflow-hidden bg-brand-950 lg:block">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(70%_55%_at_80%_0%,rgba(76,168,110,0.32),transparent_70%),radial-gradient(45%_45%_at_0%_100%,rgba(30,142,62,0.28),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top_right,black_20%,transparent_70%)]"
        />

        <div className="relative flex h-full flex-col justify-between py-12 pl-12 xl:pl-16">
          <div className="max-w-md pr-12">
            <h2 className="text-balance text-3xl font-semibold leading-tight tracking-[-0.03em] text-white xl:text-[34px]">
              Reviews, rebookings and referrals &mdash; on autopilot.
            </h2>
            <ul className="mt-7 space-y-4">
              {points.map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-6 text-brand-100/80">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/25 text-brand-200 ring-1 ring-inset ring-brand-300/30">
                    <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Preview bleeds off the bottom-right edge on purpose. */}
          <div className="mt-12 w-[118%]">
            <ProductPreview className="rounded-r-none rounded-br-none border-r-0" />
          </div>
        </div>
      </aside>
    </main>
  );
}
