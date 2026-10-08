import Link from 'next/link';

/** Privacy / Terms / Cookies links, used in every footer. */
export function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <nav aria-label="Legal" className={`flex items-center gap-4 text-[13px] text-ink-3 ${className}`}>
      <Link href="/privacy" className="hover:text-ink">Privacy</Link>
      <Link href="/terms" className="hover:text-ink">Terms</Link>
      <Link href="/cookies" className="hover:text-ink">Cookies</Link>
    </nav>
  );
}
