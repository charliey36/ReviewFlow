import Link from 'next/link';
import { requireBusiness } from '@/lib/business';
import { NavLinks } from '@/components/nav-links';
import { logout } from '@/app/(app)/actions';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await requireBusiness();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold text-slate-900">
              Review<span className="text-brand-600">Flow</span>
            </Link>
            <NavLinks />
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {business.name}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
