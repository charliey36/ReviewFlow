const PlaneIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M21.44 2.56 2.75 9.77c-.7.27-.69 1.28.02 1.53l6.9 2.44c.32.11.57.36.68.68l2.44 6.9c.25.71 1.26.72 1.53.02l7.21-18.69c.24-.63-.4-1.27-1.03-1.03z"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M21.4 2.6 9.7 14.3" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Horizontal lockup: icon + wordmark inline. Used anywhere space is
 * constrained to a single row on a light background (footers, light
 * headers).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <PlaneIcon className="h-5 w-5 text-brand-600" />
      <span className="text-lg font-bold tracking-tight text-[#1a1a1a]">
        Review<span className="text-brand-600">Flow</span>
      </span>
    </span>
  );
}

/**
 * Horizontal lockup for dark/brand-green backgrounds (the sidebar header).
 * Same mark as `Logo`, but with light text so it reads correctly against
 * the brand-700/800 sidebar fill instead of white.
 */
export function LogoOnDark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <PlaneIcon className="h-5 w-5 text-white" />
      <span className="text-lg font-bold tracking-tight text-white">
        Review<span className="text-brand-200">Flow</span>
      </span>
    </span>
  );
}

/**
 * Stacked lockup: plane icon, then tagline, then the wordmark below.
 * Used on the login/signup card and marketing surfaces where vertical
 * space is available and the brand should read as its own unit.
 *
 * `heading` renders the wordmark as an <h1> instead of a <span> — use this
 * on the one page where the logo doubles as the page's main heading (the
 * marketing homepage). Login/signup keep the default span since those
 * pages have their own h1 ("Welcome back", "Create your account").
 */
export function LogoStacked({
  className,
  heading = false,
}: {
  className?: string;
  heading?: boolean;
}) {
  const Wordmark = heading ? 'h1' : 'span';
  return (
    <span className={`inline-flex flex-col items-center ${className ?? ''}`}>
      <PlaneIcon className="h-6 w-6 text-brand-600" />
      <span className="mt-2 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-500">
        Reach <span className="text-slate-300">&middot;</span> Request{' '}
        <span className="text-slate-300">&middot;</span> Review
      </span>
      <Wordmark className="mt-1.5 text-2xl font-bold tracking-tight text-[#1a1a1a]">
        Review<span className="text-brand-600">Flow</span>
      </Wordmark>
    </span>
  );
}
