import type { Metadata } from 'next';
import { requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { FeedbackList } from './feedback-list';
import { formatUKDateTime } from '@/lib/uk-defaults';

export const metadata: Metadata = { title: 'Feedback inbox' };

function formatDateTime(value: string) {
  return formatUKDateTime(new Date(value));
}

export default async function FeedbackInboxPage() {
  const business = await requireBusiness();
  const supabase = createClient();

  const { data: feedback } = await supabase
    .from('private_feedback')
    .select('id, rating, comment, status, created_at, customer_id')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false });

  const customerIds = [...new Set((feedback ?? []).map((f) => f.customer_id).filter(Boolean))] as string[];
  const { data: customers } = customerIds.length
    ? await supabase.from('customers').select('id, name, email').in('id', customerIds)
    : { data: [] };

  const customerById = new Map((customers ?? []).map((c) => [c.id, c]));

  const items = (feedback ?? []).map((item) => ({
    ...item,
    // Formatted on the server so the client component renders identical text.
    createdLabel: formatDateTime(item.created_at),
    customer: item.customer_id ? customerById.get(item.customer_id) ?? null : null,
  }));

  return (
    <div>
      <PageHeader
        title="Feedback inbox"
        icon="chat"
        tone="rose"
        description="Private feedback customers chose to share directly with you instead of (or alongside) a public review."
      />

      <FeedbackList items={items} />
    </div>
  );
}
