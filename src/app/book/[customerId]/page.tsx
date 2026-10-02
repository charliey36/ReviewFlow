import { createAdminClient } from '@/lib/supabase/admin';
import { RequestRebookingForm } from './request-rebooking-form';

export const dynamic = 'force-dynamic';

export default async function BookPage({ params }: { params: { customerId: string } }) {
  const supabase = createAdminClient();

  const { data: customer } = await supabase
    .from('customers')
    .select('id, business_id')
    .eq('id', params.customerId)
    .maybeSingle();

  let businessName = 'this business';
  if (customer) {
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', customer.business_id)
      .maybeSingle();
    if (business) businessName = business.name;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Book your next visit with {businessName}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Let us know when works for you and we&apos;ll confirm your appointment.
        </p>

        <div className="mt-6">
          {customer ? (
            <RequestRebookingForm customerId={params.customerId} />
          ) : (
            <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
              This booking link is no longer valid.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
