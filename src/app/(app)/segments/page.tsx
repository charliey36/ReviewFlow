import { requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { evaluateSegment, type SegmentCondition } from '@/lib/segments';
import { CreateSegmentForm } from './create-segment-form';
import { DeleteSegmentButton } from './delete-segment-button';

const fieldLabels: Record<string, string> = {
  days_since_last_visit: 'Days since last visit',
  lifetime_value: 'Lifetime value',
  visit_count: 'Visit count',
  tag: 'Tag',
};

const operatorLabels: Record<string, string> = {
  gt: '>',
  gte: '\u2265',
  lt: '<',
  lte: '\u2264',
  eq: '=',
};

export default async function SegmentsPage() {
  const business = await requireBusiness();
  const supabase = createClient();

  const { data: segments } = await supabase
    .from('segments')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false });

  const segmentsWithCounts = await Promise.all(
    (segments ?? []).map(async (segment) => {
      const members = await evaluateSegment(
        supabase,
        business.id,
        segment.rule_definition as SegmentCondition[]
      );
      return { ...segment, memberCount: members.length };
    })
  );

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Segments</h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        Dynamic customer segments, evaluated live from visit history, spend, and tags — not a
        static list that goes stale.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-md dark:border-slate-700/70 dark:bg-surface-card">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Create a segment</h2>
        <div className="mt-4">
          <CreateSegmentForm />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {segmentsWithCounts.length > 0 ? (
          segmentsWithCounts.map((segment) => {
            const condition = (segment.rule_definition as SegmentCondition[])[0];
            return (
              <div
                key={segment.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white p-5 shadow-md dark:border-slate-700/70 dark:bg-surface-card"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{segment.name}</p>
                  {condition && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {fieldLabels[condition.field]} {operatorLabels[condition.operator]} {condition.value}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {segment.memberCount} customer{segment.memberCount === 1 ? '' : 's'}
                  </span>
                  <DeleteSegmentButton segmentId={segment.id} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-slate-200/70 bg-white p-10 text-center shadow-md dark:border-slate-700/70 dark:bg-surface-card">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No segments yet</p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Create one above to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
