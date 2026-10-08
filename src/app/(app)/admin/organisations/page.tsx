import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isAdminEmail, requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { AdminBusinessesTable } from '../../dashboard/admin-businesses-table';

export const metadata: Metadata = { title: 'Organisations' };

export default async function AdminOrganisationsPage() {
  const own = await requireBusiness();
  const { data } = await createClient().auth.getUser();
  if (!isAdminEmail(data.user?.email)) notFound();

  return (
    <div>
      <PageHeader title="Organisations" icon="users" tone="slate" description="Admin only. Deleting an organisation is permanent." />
      <AdminBusinessesTable currentBusinessId={own.id} />
    </div>
  );
}
