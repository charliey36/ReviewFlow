import { requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/(app)/actions';
import { SidebarProvider } from '@/components/sidebar-context';
import { SidebarDrawer } from '@/components/sidebar-drawer';
import { SidebarToggleButton } from '@/components/sidebar-toggle-button';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { AppContentShell } from '@/components/app-content-shell';
import { HeaderBrand } from '@/components/header-brand';
import { HeaderTitle } from '@/components/header-title';
import { HeaderSearchButton } from '@/components/search-triggers';
import { CommandPaletteProvider } from '@/components/command-palette';
import { ToastProvider } from '@/components/toast';
import { Icon } from '@/components/ui/icons';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await requireBusiness();
  const supabase = createClient();

  // Unread private feedback, surfaced as a badge on the sidebar item. A failed
  // count must never break the shell, so errors just fall back to zero.
  const { count: newFeedbackCount } = await supabase
    .from('private_feedback')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .eq('status', 'new');

  return (
    <SidebarProvider>
      <ToastProvider>
        <CommandPaletteProvider>
          <div className="min-h-screen">
            <SidebarDrawer
              businessName={business.name ?? ''}
              businessLogoUrl={business.brand_logo_url}
              feedbackCount={newFeedbackCount ?? 0}
            />

            <AppContentShell>
              <header className="glass sticky top-0 z-20 flex h-16 flex-shrink-0 items-center gap-2 border-b border-line/80 px-4 sm:px-6 lg:px-8">
                <SidebarToggleButton />
                <HeaderBrand />
                <HeaderTitle />

                <div className="ml-auto flex items-center gap-1">
                  <HeaderSearchButton />
                  <ThemeToggleButton />
                  <span aria-hidden="true" className="mx-1.5 hidden h-5 w-px bg-line-strong sm:block" />
                  <form action={logout}>
                    <button type="submit" className="btn btn-ghost btn-sm" aria-label="Log out">
                      <Icon name="logout" className="h-4 w-4" />
                      <span className="hidden sm:inline">Log out</span>
                    </button>
                  </form>
                </div>
              </header>

              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</main>
            </AppContentShell>
          </div>
        </CommandPaletteProvider>
      </ToastProvider>
    </SidebarProvider>
  );
}
