import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div
        aria-hidden="true"
        className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />
      <div className="relative flex flex-col items-center">
        <Link href="/" aria-label="Pentriq home">
          <Logo />
        </Link>
        <p className="mt-14 text-sm font-semibold text-brand-700 dark:text-brand-400">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.025em] text-ink sm:text-4xl">Page not found</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-ink-3">
          Sorry, we couldn&apos;t find the page you were looking for. It may have been moved, or the link
          may be incorrect.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            Go to dashboard
          </Link>
          <Link href="/" className="btn btn-secondary btn-lg">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
