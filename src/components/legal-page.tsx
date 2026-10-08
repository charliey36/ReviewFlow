import Link from 'next/link';
import { Logo } from '@/components/logo';
import { LegalLinks } from '@/components/legal-links';

export const CONTACT_EMAIL = 'charlieyoults123@gmail.com'; // TODO: replace with your real address

/** Static legal page frame. Content is placeholder text: have it reviewed before launch. */
export function LegalPage({
  title,
  sections,
}: {
  title: string;
  sections: { heading: string; body: string[] }[];
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-3xl px-4 py-6">
        <Link href="/" aria-label="ReviewFlow home"><Logo /></Link>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-4">Last updated: October 2026</p>
        {sections.map((s) => (
          <section key={s.heading} className="mt-8">
            <h2 className="text-lg font-semibold text-ink">{s.heading}</h2>
            {s.body.map((p) => (
              <p key={p} className="mt-2 text-[15px] leading-7 text-ink-2">{p}</p>
            ))}
          </section>
        ))}
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6">
          <p className="text-[13px] text-ink-3">&copy; {new Date().getFullYear()} ReviewFlow</p>
          <LegalLinks />
        </div>
      </footer>
    </div>
  );
}
