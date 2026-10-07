import type { Metadata } from 'next';
import Link from 'next/link';
import { requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Icon } from '@/components/ui/icons';
import { AddCustomerPanel } from './add-customer-panel';
import { CustomersTable, type CustomerRow } from './customers-table';

export const metadata: Metadata = { title: 'Customers' };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: { add?: string };
}) {
  const business = await requireBusiness();
  const supabase = createClient();

  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, email, created_at, review_requests(status, send_at, sent_at)')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load customers: ${error.message}`);
  }

  // Dates are formatted here (server) and passed down as strings: formatting
  // in the client component would differ between server and browser locale
  // and trigger hydration mismatches.
  const rows: CustomerRow[] = (customers ?? []).map((customer) => {
    const request = Array.isArray(customer.review_requests)
      ? customer.review_requests[0]
      : customer.review_requests;

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      addedLabel: formatDate(customer.created_at),
      status: request?.status ?? null,
      requestLabel: request
        ? request.status === 'sent' && request.sent_at
          ? `Sent ${formatDateTime(request.sent_at)}`
          : `Due ${formatDateTime(request.send_at)}`
        : null,
    };
  });

  const wantsAdd = searchParams?.add === '1';

  return (
    <div>
      <PageHeader
        title="Customers"
        icon="users"
        tone="sky"
        description={`${rows.length.toLocaleString('en-US')} ${
          rows.length === 1 ? 'customer' : 'customers'
        }. Add a customer to automatically schedule a review request email.`}
        actions={
          <Link href="/customers/import" className="btn btn-secondary">
            <Icon name="upload" className="h-4 w-4" />
            Import CSV
          </Link>
        }
      />

      <AddCustomerPanel defaultOpen={wantsAdd || rows.length === 0} autoFocus={wantsAdd} />

      <CustomersTable rows={rows} />
    </div>
  );
}
