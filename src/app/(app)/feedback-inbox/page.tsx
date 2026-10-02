import { requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { FeedbackList } from './feedback-list';

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
    customer: item.customer_id ? customerById.get(item.customer_id) ?? null : null,
  }));

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Feedback inbox</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Private feedback customers chose to share directly with you instead of (or alongside) a
        public review.
      </p>

      <div className="mt-6">
        <FeedbackList items={items} />
      </div>
    </div>
  );
}
