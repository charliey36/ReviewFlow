import { createAdminClient } from '@/lib/supabase/admin';
import { PrivateFeedbackForm } from './private-feedback-form';

export const dynamic = 'force-dynamic';

/**
 * Public landing page for the private feedback link included in every
 * review request message, alongside (never instead of) the public review
 * link — see src/lib/compliance.ts for why this page exists unconditionally
 * rather than being gated behind a sentiment check.
 */
export default async function FeedbackPage({ params }: { params: { messageId: string } }) {
  const supabase = createAdminClient();

  const { data: message } = await supabase
    .from('messages')
    .select('id, business_id')
    .eq('id', params.messageId)
    .maybeSingle();

  let businessName = 'this business';
  if (message) {
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', message.business_id)
      .maybeSingle();
    if (business) businessName = business.name;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Share feedback with {businessName}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          This goes directly and privately to the business — it&apos;s not posted publicly.
        </p>

        <div className="mt-6">
          {message ? (
            <PrivateFeedbackForm messageId={params.messageId} />
          ) : (
            <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
              This feedback link is no longer valid.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
