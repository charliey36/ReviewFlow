import Link from 'next/link';
import { requireBusiness } from '@/lib/business';
import { logout } from '@/app/(app)/actions';
import { SidebarProvider } from '@/components/sidebar-context';
import { SidebarDrawer } from '@/components/sidebar-drawer';
import { SidebarToggleButton } from '@/components/sidebar-toggle-button';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { AppContentShell } from '@/components/app-content-shell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await requireBusiness();

  const initials = (business.name?.trim()?.[0] || '?').toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-surface-bg">
        {/* Single unified sidebar — see sidebar-drawer.tsx for why this
            replaced the previous static-aside + separate-drawer setup. */}
        <SidebarDrawer />

        <AppContentShell>
          <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/85 backdrop-blur-sm transition-colors duration-200 dark:border-slate-700/70 dark:bg-surface/95">
            <div className="flex items-center justify-between px-4 py-3.5 sm:px-6">
              <div className="flex items-center gap-2">
                <SidebarToggleButton />
                <Link href="/dashboard" className="lg:hidden">
                  <span className="text-lg font-bold tracking-tight text-[#1a1a1a] dark:text-white">
                    Review<span className="text-brand-600 dark:text-brand-400">Flow</span>
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2.5 sm:flex">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/40 dark:text-brand-300 dark:ring-brand-800">
                    {business.brand_logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={business.brand_logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span aria-hidden="true">{initials}</span>
                    )}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{business.name}</span>
                </div>
                <ThemeToggleButton />
                <form action={logout}>
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700 dark:hover:text-white"
                  >
                    Log out
                  </button>
                </form>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        </AppContentShell>
      </div>
    </SidebarProvider>
  );
}
