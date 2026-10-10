/**
 * Review-link analytics: the single place that knows where click data lives,
 * so the dashboard and analytics page can't drift apart again.
 *
 * Sources of truth
 *   - Counted clicks: interaction_events with event_type in COUNTED_CLICK_TYPES
 *       'review_link_clicked'  every click recorded by /r/{token} (REVIEW_LINK_CLICKED)
 *       'click'                historical clicks from /api/track-message before 0018
 *     plus the legacy `click_events` table (original review_requests flow).
 *     'review_link_scan' rows (scanners/bots) are deliberately excluded.
 *   - Sent: review_requests(status=sent) + messages of review purposes (sent).
 *   - Delivered: equals Sent. There is no delivery webhook (Resend events) wired
 *     up yet, so "accepted by the email provider" is the best truthful signal.
 *   - Opened: not tracked (no open pixel / webhook) - never fabricated.
 *   - Reviews received: interaction_events 'review_confirmed'. Pentriq cannot
 *     read reviews back from Google, so this stays 0 until something records it.
 *
 * CTR = total counted clicks / delivered * 100 (one decimal).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

type Db = SupabaseClient<Database>;

export const COUNTED_CLICK_TYPES = ['click', 'review_link_clicked'] as const;
/** Message purposes whose emails carry the tracked review link. */
export const REVIEW_PURPOSES = ['review_request', 'review_reminder'] as const;

export function computeClickThroughRate(clicks: number, delivered: number): number | null {
  if (!Number.isFinite(clicks) || !Number.isFinite(delivered) || delivered <= 0) return null;
  return Math.round((clicks / delivered) * 1000) / 10;
}

/** No delivery webhook yet: a successfully handed-off email counts as delivered. */
export function deliveredFromSent(sent: number): number {
  return sent;
}

export type ReviewLinkTotals = {
  sent: number;
  delivered: number;
  /** Every counted click (repeat clicks by the same person included). */
  clicks: number;
  /** Distinct emails that were clicked at least once. */
  uniqueClicked: number;
  reviewsReceived: number;
  clickThroughRate: number | null;
};

async function headCount(query: PromiseLike<{ count: number | null }>): Promise<number> {
  const { count } = await query;
  return count ?? 0;
}

export async function countCountedClicks(supabase: Db, businessId: string): Promise<number> {
  const [legacy, events] = await Promise.all([
    headCount(supabase.from('click_events').select('id', { count: 'exact', head: true }).eq('business_id', businessId)),
    headCount(
      supabase
        .from('interaction_events')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .in('event_type', [...COUNTED_CLICK_TYPES])
    ),
  ]);
  return legacy + events;
}

export async function countSentReviewEmails(supabase: Db, businessId: string): Promise<number> {
  const [legacy, queue] = await Promise.all([
    headCount(
      supabase
        .from('review_requests')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'sent')
    ),
    headCount(
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .in('purpose', [...REVIEW_PURPOSES])
        .eq('status', 'sent')
    ),
  ]);
  return legacy + queue;
}

/** Distinct emails clicked at least once (uses the per-send click_count). */
export async function countUniqueClicked(supabase: Db, businessId: string): Promise<number> {
  const [messages, requests] = await Promise.all([
    headCount(
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .in('purpose', [...REVIEW_PURPOSES])
        .gt('click_count', 0)
    ),
    headCount(
      supabase
        .from('review_requests')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gt('click_count', 0)
    ),
  ]);
  return messages + requests;
}

export async function countReviewsReceived(supabase: Db, businessId: string): Promise<number> {
  return headCount(
    supabase
      .from('interaction_events')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('event_type', 'review_confirmed')
  );
}

export async function getReviewLinkTotals(supabase: Db, businessId: string): Promise<ReviewLinkTotals> {
  const [sent, clicks, uniqueClicked, reviewsReceived] = await Promise.all([
    countSentReviewEmails(supabase, businessId),
    countCountedClicks(supabase, businessId),
    countUniqueClicked(supabase, businessId),
    countReviewsReceived(supabase, businessId),
  ]);

  const delivered = deliveredFromSent(sent);
  return {
    sent,
    delivered,
    clicks,
    uniqueClicked,
    reviewsReceived,
    clickThroughRate: computeClickThroughRate(clicks, delivered),
  };
}

/** Timestamps of counted clicks since `sinceIso` (both sources), newest first, for trend charts. */
export async function getClickTimestamps(supabase: Db, businessId: string, sinceIso: string, cap: number): Promise<string[]> {
  const [legacy, events] = await Promise.all([
    supabase
      .from('click_events')
      .select('clicked_at')
      .eq('business_id', businessId)
      .gte('clicked_at', sinceIso)
      .order('clicked_at', { ascending: false })
      .limit(cap),
    supabase
      .from('interaction_events')
      .select('occurred_at')
      .eq('business_id', businessId)
      .in('event_type', [...COUNTED_CLICK_TYPES])
      .gte('occurred_at', sinceIso)
      .order('occurred_at', { ascending: false })
      .limit(cap),
  ]);
  return [...(legacy.data ?? []).map((r) => r.clicked_at), ...(events.data ?? []).map((r) => r.occurred_at)].sort((a, b) =>
    a < b ? 1 : a > b ? -1 : 0
  );
}

// ---------------------------------------------------------------------------
// Campaign performance
// ---------------------------------------------------------------------------

export type CampaignRow = {
  key: string;
  label: string;
  sent: number;
  /** Distinct emails clicked at least once. */
  clicked: number;
  /** All counted clicks. */
  totalClicks: number;
  clickThroughRate: number | null;
};

type CampaignInput = {
  purpose: string;
  sequence_step: number;
  status: string;
  click_count: number | null;
};

function messageCampaign(purpose: string, step: number): { key: string; label: string; order: number } {
  if (purpose === 'review_request') return { key: 'review_request', label: 'Review request', order: 0 };
  return { key: `review_reminder_${step}`, label: `Reminder ${Math.max(1, step - 1)}`, order: step };
}

/**
 * Groups sent review emails into the initial request, each reminder step and
 * the legacy single-send flow. Clicks are the counted per-send click_count.
 */
export function summariseCampaigns(
  messages: CampaignInput[],
  legacyRequests: Array<{ status: string; click_count: number | null }>
): CampaignRow[] {
  const groups = new Map<string, CampaignRow & { order: number }>();

  const add = (key: string, label: string, order: number, sent: boolean, clicks: number) => {
    const row = groups.get(key) ?? { key, label, order, sent: 0, clicked: 0, totalClicks: 0, clickThroughRate: null };
    if (sent) row.sent += 1;
    if (clicks > 0) row.clicked += 1;
    row.totalClicks += clicks;
    groups.set(key, row);
  };

  for (const m of messages) {
    if (m.status !== 'sent') continue;
    const c = messageCampaign(m.purpose, m.sequence_step);
    add(c.key, c.label, c.order, true, m.click_count ?? 0);
  }
  for (const r of legacyRequests) {
    if (r.status !== 'sent') continue;
    add('legacy', 'Original review requests', 100, true, r.click_count ?? 0);
  }

  return [...groups.values()]
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...row }) => ({ ...row, clickThroughRate: computeClickThroughRate(row.totalClicks, row.sent) }));
}

export async function getCampaignPerformance(supabase: Db, businessId: string): Promise<CampaignRow[]> {
  const [messages, legacy] = await Promise.all([
    supabase
      .from('messages')
      .select('purpose, sequence_step, status, click_count')
      .eq('business_id', businessId)
      .in('purpose', [...REVIEW_PURPOSES])
      .eq('status', 'sent')
      .limit(5000),
    supabase
      .from('review_requests')
      .select('status, click_count')
      .eq('business_id', businessId)
      .eq('status', 'sent')
      .limit(5000),
  ]);
  return summariseCampaigns(messages.data ?? [], legacy.data ?? []);
}

// ---------------------------------------------------------------------------
// Recent activity
// ---------------------------------------------------------------------------

export type RecentClick = {
  id: string;
  occurredAt: string;
  customerName: string | null;
  customerId: string | null;
};

export async function getRecentClicks(supabase: Db, businessId: string, limit = 10): Promise<RecentClick[]> {
  const { data: events } = await supabase
    .from('interaction_events')
    .select('id, occurred_at, customer_id')
    .eq('business_id', businessId)
    .in('event_type', [...COUNTED_CLICK_TYPES])
    .order('occurred_at', { ascending: false })
    .limit(limit);

  const rows = events ?? [];
  const customerIds = [...new Set(rows.map((r) => r.customer_id).filter((id): id is string => Boolean(id)))];
  const { data: customers } = customerIds.length
    ? await supabase.from('customers').select('id, name').in('id', customerIds)
    : { data: [] as Array<{ id: string; name: string }> };
  const names = new Map((customers ?? []).map((c) => [c.id, c.name]));

  return rows.map((r) => ({
    id: r.id,
    occurredAt: r.occurred_at,
    customerId: r.customer_id,
    customerName: r.customer_id ? names.get(r.customer_id) ?? null : null,
  }));
}
