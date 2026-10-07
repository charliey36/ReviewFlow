import type { Metadata } from 'next';
import { requireBusiness } from '@/lib/business';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { ImportCustomersForm } from './import-customers-form';

export const metadata: Metadata = { title: 'Import customers' };

export default async function ImportCustomersPage() {
  await requireBusiness();

  return (
    <div>
      <PageHeader
        back={{ href: '/customers', label: 'Customers' }}
        title="Import customers"
        icon="upload"
        tone="sky"
        description="Upload a CSV of your existing customers to add them all at once. A review request is scheduled for each new customer, same as adding them one at a time."
      />

      <SectionCard>
        <ImportCustomersForm />
      </SectionCard>
    </div>
  );
}
