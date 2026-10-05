import Link from 'next/link';
import { requireBusiness } from '@/lib/business';
import { SidebarNav } from '@/components/sidebar-nav';
import { LogoOnDark } from '@/components/logo';
import { logout } from '@/app/(app)/actions';
import { SidebarProvider } from '@/components/sidebar-context';
import { SidebarDrawer } from '@/components/sidebar-drawer';
import { SidebarToggleButton } from '@/components/sidebar-toggle-button';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await requireBusiness();

  const initials = (business.name?.trim()?.[0] || '?').toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen lg:flex">
        {/* Static sidebar for large screens */}
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col bg-brand-800 lg:flex">
          <div className="flex h-[65px] flex-shrink-0 items-center border-b border-white/10 px-5">
            <Link href="/dashboard">
              <LogoOnDark />
            </Link>
          </div>
          <SidebarNav />
          <div className="px-3 py-4 text-xs text-brand-200/60">
            &copy; {new Date().getFullYear()} ReviewFlow
          </div>
        </aside>

        {/* Off-canvas drawer, available at any viewport width */}
        <SidebarDrawer />

        <div className="flex min-h-screen flex-1 flex-col lg:ml-60">
          <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/85 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-3.5 sm:px-6">
              <div className="flex items-center gap-2">
                <SidebarToggleButton />
                <Link href="/dashboard" className="lg:hidden">
                  <span className="text-lg font-bold tracking-tight text-[#1a1a1a]">
                    Review<span className="text-brand-600">Flow</span>
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2.5 sm:flex">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
                    {business.brand_logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={business.brand_logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span aria-hidden="true">{initials}</span>
                    )}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{business.name}</span>
                </div>
                <form action={logout}>
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Log out
                  </button>
                </form>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
