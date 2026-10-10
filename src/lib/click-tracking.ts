/**
 * Review-link click tracking.
 *
 * Every review request / reminder email links to
 *   {APP_URL}/r/{tracking_token}
 * instead of the business's Google review URL. When the link is opened:
 *
 *   1. resolve the token to the message (or legacy review_request)
 *   2. classify the hit - real person vs. email security scanner / link
 *      preview / bot / prefetch
 *   3. record it (interaction_events + per-send counters), de-duplicating
 *      rapid repeat clicks from the same visitor
 *   4. 302 to the business's review URL
 *
 * Guarantees:
 *   - The visitor is ALWAYS redirected, even if recording fails or the hit is
 *     classified as automated. Analytics problems must never break the link.
 *   - Automated hits are stored as `review_link_scan` (audit only) and never
 *     counted, and never stop a journey - so a corporate mail scanner can't
 *     inflate click-through or cancel the customer's follow-up reminders.
 *   - Old links keep working: /api/track/{reviewRequestId} and
 *     /api/track-message/{messageId} delegate to the same handler.
 *
 * Privacy: the stored IP is anonymised (IPv4 last octet zeroed, IPv6 truncated
 * to /48), which is enough to de-duplicate and spot scanner ranges without
 * keeping a full personal identifier.
 */
import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/database.types';
import { exitJourneyEnrollment } from '@/lib/journeys';
import { isValidReviewUrl, reviewUnavailableUrl } from '@/lib/review-destination';

type Db = SupabaseClient<Database>;

/** Repeat clicks by the same visitor on the same link inside this window count once. */
export const DEDUPE_WINDOW_MS = 30_000;
/** A human cannot receive, open and click an email faster than this; faster = scanner. */
export const MIN_HUMAN_DELAY_MS = 3_000;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

// ---------------------------------------------------------------------------
// Link construction
// ---------------------------------------------------------------------------

/**
 * The URL to put in an email. Uses the row's unguessable tracking_token; falls
 * back to the row id (which /r/ also resolves) when the token column isn't
 * available yet (migration 0018 not applied), so sending never breaks.
 */
export function reviewTrackingUrl(appUrl: string, row: { id: string; tracking_token?: string | null }): string {
  return `${appUrl.replace(/\/+$/, '')}/r/${row.tracking_token || row.id}`;
}

/**
 * Structured diagnostics for the whole link lifecycle. Every line starts with
 * `[review-link]` so it can be grepped in the server / Vercel logs:
 *   url_generated -> request -> lookup -> click -> redirect
 * Never logs IPs or full user agents.
 */
export function logTracking(stage: string, fields: Record<string, unknown> = {}): void {
  console.log(`[review-link] ${stage} ${JSON.stringify(fields)}`);
}

/** Builds the emailed link and logs exactly what was generated. */
export function buildTrackingUrl(
  appUrl: string,
  row: { id: string; tracking_token?: string | null },
  context: { source: string; kind: 'message' | 'review_request' }
): string {
  const url = reviewTrackingUrl(appUrl, row);
  logTracking('url_generated', {
    url,
    source: context.source,
    kind: context.kind,
    id: row.id,
    hasToken: Boolean(row.tracking_token),
  });
  return url;
}

// ---------------------------------------------------------------------------
// Bot / scanner / duplicate classification (pure - unit tested)
// ---------------------------------------------------------------------------

const AUTOMATED_UA =
  /bot\b|bot[\/_ -]|crawl|spider|slurp|scanner|preview|monitor|headless|phantomjs|puppeteer|playwright|selenium|lighthouse|python-requests|python-urllib|aiohttp|curl\/|wget\/|libwww|go-http-client|java\/|okhttp|apache-httpclient|httpclient|node-fetch|undici|axios|postman|insomnia|facebookexternalhit|slackbot|whatsapp|telegrambot|twitterbot|discordbot|linkedinbot|skypeuripreview|googleimageproxy|google-read-aloud|google-safety|googleother|proofpoint|mimecast|barracuda|symantec|messagelabs|forcepoint|trendmicro|sophos|fireeye|zscaler|ironport|cisco|paloalto|sonicwall|safelinks|ms-office|microsoft office|urlscan|virustotal|mailscanner|linkchecker/i;

export type ClickClassification =
  | { automated: false }
  | { automated: true; reason: string };

type HeaderReader = { get(name: string): string | null };

/**
 * Decides whether a hit on a tracking link is an automated scan rather than a
 * person. Heuristics, in order: non-GET method, prefetch/preview headers,
 * missing or known-automation user agent, and "clicked impossibly soon after
 * the email was sent" (security gateways scan on delivery).
 */
export function classifyClick(input: {
  method: string;
  headers: HeaderReader;
  sentAt?: string | null;
  now?: number;
}): ClickClassification {
  const { method, headers } = input;
  if (method.toUpperCase() !== 'GET') return { automated: true, reason: `method-${method.toLowerCase()}` };

  for (const name of ['purpose', 'sec-purpose', 'x-purpose', 'x-moz', 'x-middleware-prefetch']) {
    const value = headers.get(name);
    if (value && /prefetch|preview|prerender/i.test(value)) return { automated: true, reason: 'prefetch' };
  }
  if (headers.get('x-middleware-prefetch') === '1') return { automated: true, reason: 'prefetch' };

  const ua = (headers.get('user-agent') ?? '').trim();
  if (!ua) return { automated: true, reason: 'missing-user-agent' };
  if (AUTOMATED_UA.test(ua)) return { automated: true, reason: 'automated-user-agent' };

  if (input.sentAt) {
    const sent = Date.parse(input.sentAt);
    const now = input.now ?? Date.now();
    if (Number.isFinite(sent) && now - sent < MIN_HUMAN_DELAY_MS) return { automated: true, reason: 'too-soon-after-send' };
  }

  return { automated: false };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(headers: HeaderReader): string | null {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip')?.trim() || headers.get('cf-connecting-ip')?.trim() || null;
}

/** Zero the last IPv4 octet / keep only the /48 of an IPv6 address. */
export function anonymiseIp(ip: string | null | undefined): string | null {
  const value = (ip ?? '').trim();
  if (!value) return null;

  const v4 = value.match(/(?:^|:)(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
  if (v4) return `${v4[1]}.0`;

  if (value.includes(':')) {
    const head = value.split('::')[0].split(':').filter(Boolean).slice(0, 3);
    return head.length > 0 ? `${head.join(':')}::` : null;
  }
  return null;
}

/** Stable, non-reversible id for "same visitor" (anonymised IP + user agent). */
export function visitorHash(anonIp: string | null, userAgent: string | null): string {
  return createHash('sha256').update(`${anonIp ?? ''}|${userAgent ?? ''}`).digest('hex').slice(0, 16);
}

/** Pure dedupe rule: has this visitor already produced a counted click inside the window? */
export function isDuplicateClick(
  recent: Array<{ occurred_at: string; metadata: unknown }>,
  visitor: string,
  now: number,
  windowMs: number = DEDUPE_WINDOW_MS
): boolean {
  return recent.some((event) => {
    const at = Date.parse(event.occurred_at);
    const meta = (event.metadata ?? {}) as { visitor?: string };
    return Number.isFinite(at) && now - at < windowMs && meta.visitor === visitor;
  });
}

// ---------------------------------------------------------------------------
// Target resolution
// ---------------------------------------------------------------------------

export type ClickTarget = {
  kind: 'message' | 'review_request';
  id: string;
  business_id: string;
  customer_id: string;
  journey_enrollment_id: string | null;
  sent_at: string | null;
};

export type ClickLookup =
  /** /r/{token}: a tracking token, or (older links) a raw message / review_request id. */
  | { by: 'token'; value: string }
  /** /api/track-message/{id} */
  | { by: 'message_id'; value: string }
  /** /api/track/{id} */
  | { by: 'review_request_id'; value: string };

async function loadMessage(supabase: Db, column: 'tracking_token' | 'id', value: string): Promise<ClickTarget | null> {
  const { data, error } = await supabase.from('messages').select('*').eq(column, value).maybeSingle();
  if (error) logTracking('lookup_error', { table: 'messages', column, error: error.message });
  if (!data) return null;
  return {
    kind: 'message',
    id: data.id,
    business_id: data.business_id,
    customer_id: data.customer_id,
    journey_enrollment_id: data.journey_enrollment_id ?? null,
    sent_at: data.sent_at ?? null,
  };
}

async function loadReviewRequest(supabase: Db, column: 'tracking_token' | 'id', value: string): Promise<ClickTarget | null> {
  const { data, error } = await supabase.from('review_requests').select('*').eq(column, value).maybeSingle();
  if (error) logTracking('lookup_error', { table: 'review_requests', column, error: error.message });
  if (!data) return null;
  return {
    kind: 'review_request',
    id: data.id,
    business_id: data.business_id,
    customer_id: data.customer_id,
    journey_enrollment_id: null,
    sent_at: data.sent_at ?? null,
  };
}

export function isPlausibleLinkRef(value: string): boolean {
  return UUID_PATTERN.test(value) || TOKEN_PATTERN.test(value);
}

export async function resolveClickTarget(supabase: Db, lookup: ClickLookup): Promise<ClickTarget | null> {
  const target = await resolveClickTargetInner(supabase, lookup);
  logTracking('lookup', {
    by: lookup.by,
    ref: lookup.value,
    found: Boolean(target),
    kind: target?.kind ?? null,
    id: target?.id ?? null,
    reason: target ? undefined : isPlausibleLinkRef(lookup.value) ? 'no-matching-row' : 'malformed-ref',
  });
  return target;
}

async function resolveClickTargetInner(supabase: Db, lookup: ClickLookup): Promise<ClickTarget | null> {
  if (!isPlausibleLinkRef(lookup.value)) return null;

  if (lookup.by === 'message_id') return UUID_PATTERN.test(lookup.value) ? loadMessage(supabase, 'id', lookup.value) : null;
  if (lookup.by === 'review_request_id') {
    return UUID_PATTERN.test(lookup.value) ? loadReviewRequest(supabase, 'id', lookup.value) : null;
  }

  // /r/{token}: tokens first, then raw ids so links built before the token
  // column existed (or while it's missing) still resolve.
  const byToken =
    (await loadMessage(supabase, 'tracking_token', lookup.value)) ??
    (await loadReviewRequest(supabase, 'tracking_token', lookup.value));
  if (byToken) return byToken;

  if (UUID_PATTERN.test(lookup.value)) {
    return (await loadMessage(supabase, 'id', lookup.value)) ?? (await loadReviewRequest(supabase, 'id', lookup.value));
  }
  return null;
}

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

export type RecordedClick = {
  /** 'counted' = real click recorded; 'duplicate' = ignored repeat; 'automated' = logged as a scan only. */
  outcome: 'counted' | 'duplicate' | 'automated';
  reason?: string;
};

export type ClickContext = {
  method: string;
  headers: HeaderReader;
  destinationUrl: string | null;
  now?: number;
};

const MAX_UA_LENGTH = 512;

async function lookupCampaignId(supabase: Db, enrollmentId: string | null): Promise<string | null> {
  if (!enrollmentId) return null;
  const { data } = await supabase.from('journey_enrollments').select('journey_id').eq('id', enrollmentId).maybeSingle();
  return data?.journey_id ?? null;
}

async function bumpCounters(supabase: Db, target: ClickTarget, nowIso: string, destination: string | null): Promise<void> {
  const table = target.kind === 'message' ? 'messages' : 'review_requests';
  // Optimistic concurrency: PostgREST has no `column = column + 1`, so we
  // compare-and-set on the previous count and retry if a concurrent click won.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data: current, error: readError } = await supabase
      .from(table)
      .select('click_count, first_clicked_at')
      .eq('id', target.id)
      .maybeSingle();
    if (readError || !current) return; // counters unavailable (e.g. migration pending)

    const previous = current.click_count ?? 0;
    const patch = {
      click_count: previous + 1,
      first_clicked_at: current.first_clicked_at ?? nowIso,
      last_clicked_at: nowIso,
      destination_url: destination,
    };
    const { data: updated, error } =
      table === 'messages'
        ? await supabase.from('messages').update(patch).eq('id', target.id).eq('click_count', previous).select('id')
        : await supabase.from('review_requests').update(patch).eq('id', target.id).eq('click_count', previous).select('id');
    if (error) return;
    if (updated && updated.length > 0) return;
  }
}

/**
 * Classifies and records one hit. Never throws: tracking must not break the
 * redirect. Returns what happened so callers/tests can assert on it.
 */
export async function recordReviewLinkClick(supabase: Db, target: ClickTarget, ctx: ClickContext): Promise<RecordedClick> {
  const now = ctx.now ?? Date.now();
  const nowIso = new Date(now).toISOString();
  const userAgent = (ctx.headers.get('user-agent') ?? '').slice(0, MAX_UA_LENGTH) || null;
  const ip = anonymiseIp(clientIp(ctx.headers));
  const visitor = visitorHash(ip, userAgent);

  try {
    const verdict = classifyClick({ method: ctx.method, headers: ctx.headers, sentAt: target.sent_at, now });

    // HEAD / non-GET probes are not worth a row at all.
    if (verdict.automated && verdict.reason.startsWith('method-')) {
      return { outcome: 'automated', reason: verdict.reason };
    }

    const base = {
      business_id: target.business_id,
      customer_id: target.customer_id,
      message_id: target.kind === 'message' ? target.id : null,
      review_request_id: target.kind === 'review_request' ? target.id : null,
      user_agent: userAgent,
      ip_address: ip,
      destination_url: ctx.destinationUrl,
      occurred_at: nowIso,
    };

    if (verdict.automated) {
      await supabase.from('interaction_events').insert({
        ...base,
        event_type: 'review_link_scan',
        metadata: { visitor, automated: true, reason: verdict.reason },
      });
      return { outcome: 'automated', reason: verdict.reason };
    }

    // Human click: ignore an immediate repeat from the same visitor.
    const since = new Date(now - DEDUPE_WINDOW_MS).toISOString();
    const recentQuery = supabase
      .from('interaction_events')
      .select('occurred_at, metadata')
      .eq('event_type', 'review_link_clicked')
      .gte('occurred_at', since);
    const { data: recent } = await (target.kind === 'message'
      ? recentQuery.eq('message_id', target.id)
      : recentQuery.eq('review_request_id', target.id)
    ).limit(20);

    if (isDuplicateClick(recent ?? [], visitor, now)) return { outcome: 'duplicate' };

    const campaignId = await lookupCampaignId(supabase, target.journey_enrollment_id);
    const { error: insertError } = await supabase.from('interaction_events').insert({
      ...base,
      campaign_id: campaignId,
      event_type: 'review_link_clicked',
      metadata: { visitor, automated: false },
    });

    if (insertError) {
      // Migration 0018 not applied yet: fall back to the pre-existing shapes so
      // the click is still counted by the legacy dashboard queries.
      console.error('[click-tracking] review_link_clicked insert failed, using legacy shape:', insertError.message);
      if (target.kind === 'message') {
        await supabase.from('interaction_events').insert({
          business_id: target.business_id,
          message_id: target.id,
          customer_id: target.customer_id,
          event_type: 'click',
          occurred_at: nowIso,
          metadata: { visitor, legacy_fallback: true },
        });
      } else {
        await supabase.from('click_events').insert({
          business_id: target.business_id,
          review_request_id: target.id,
          clicked_at: nowIso,
        });
      }
    }

    await bumpCounters(supabase, target, nowIso, ctx.destinationUrl);

    // A genuine click means the customer engaged: stop the follow-up reminders.
    if (target.journey_enrollment_id) {
      await exitJourneyEnrollment(supabase, target.journey_enrollment_id);
    }
    return { outcome: 'counted' };
  } catch (error) {
    console.error('[click-tracking] failed to record click:', error);
    return { outcome: 'automated', reason: 'record-error' };
  }
}

// ---------------------------------------------------------------------------
// HTTP handler shared by /r/[token], /api/track/[id], /api/track-message/[id]
// ---------------------------------------------------------------------------

function redirectNoStore(url: string | URL): NextResponse {
  const response = NextResponse.redirect(url, 302);
  // Never let a browser/proxy cache the redirect, or later clicks would skip us.
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

export async function handleReviewLinkRequest(
  request: Request,
  lookup: ClickLookup,
  supabase: Db = createAdminClient()
): Promise<NextResponse> {
  logTracking('request', { by: lookup.by, ref: lookup.value, method: request.method, host: new URL(request.url).host });
  let target: ClickTarget | null = null;
  try {
    target = await resolveClickTarget(supabase, lookup);
  } catch (error) {
    logTracking('lookup_exception', { by: lookup.by, ref: lookup.value, error: error instanceof Error ? error.message : String(error) });
  }
  if (!target) {
    // Graceful fallback: a branded page, never a generic 404.
    const fallback = reviewUnavailableUrl(request.url, 'invalid-link');
    logTracking('redirect', { to: fallback.toString(), why: 'lookup-failed' });
    return redirectNoStore(fallback);
  }

  let destination: string | null = null;
  try {
    const { data: business, error } = await supabase
      .from('businesses')
      .select('google_review_url')
      .eq('id', target.business_id)
      .maybeSingle();
    if (error) logTracking('business_lookup_error', { businessId: target.business_id, error: error.message });
    destination = business?.google_review_url?.trim() || null;
  } catch (error) {
    logTracking('business_lookup_exception', { businessId: target.business_id, error: error instanceof Error ? error.message : String(error) });
  }

  // Record BEFORE redirecting, regardless of whether a destination is set - a
  // click on an unconfigured link is still a click.
  const recorded = await recordReviewLinkClick(supabase, target, {
    method: request.method,
    headers: request.headers,
    destinationUrl: destination,
  });
  logTracking('click', { targetKind: target.kind, targetId: target.id, outcome: recorded.outcome, reason: recorded.reason });

  if (!isValidReviewUrl(destination)) {
    const fallback = reviewUnavailableUrl(request.url, 'not-configured');
    logTracking('redirect', { to: fallback.toString(), why: 'review-url-missing-or-invalid', businessId: target.business_id });
    return redirectNoStore(fallback);
  }
  logTracking('redirect', { to: destination, why: 'ok' });
  return redirectNoStore(destination);
}
