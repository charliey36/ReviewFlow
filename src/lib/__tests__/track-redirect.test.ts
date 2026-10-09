/**
 * Click-tracking flow: click recorded -> business review URL loaded -> HTTP
 * redirect to Google; missing/invalid destination -> branded Pentriq page
 * (never a raw 404); no link can point at a legacy domain.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

type Row = Record<string, unknown> | null;
const state: { message: Row; reviewRequest: Row; business: Row; inserts: Array<{ table: string; row: unknown }> } = {
  message: null,
  reviewRequest: null,
  business: null,
  inserts: [],
};

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data:
              table === 'messages'
                ? state.message
                : table === 'review_requests'
                  ? state.reviewRequest
                  : state.business,
          }),
        }),
      }),
      insert: async (row: unknown) => {
        state.inserts.push({ table, row });
        return { error: null };
      },
    }),
  }),
}));
jest.mock('@/lib/journeys', () => ({ exitJourneyEnrollment: jest.fn(async () => undefined) }));

// eslint-disable-next-line import/first
import { GET as trackMessage } from '../../app/api/track-message/[messageId]/route';
// eslint-disable-next-line import/first
import { GET as trackLegacy } from '../../app/api/track/[reviewRequestId]/route';
// eslint-disable-next-line import/first
import { isValidReviewUrl, reviewUnavailableUrl } from '../review-destination';
// eslint-disable-next-line import/first
import { getAppUrl } from '../brand';

const ID = '123e4567-e89b-12d3-a456-426614174000';
const GOOGLE = 'https://g.page/r/abc123/review';
const req = (path: string) => new NextRequest(`https://pentriq-blond.vercel.app${path}`);

beforeEach(() => {
  state.message = { id: ID, business_id: 'b1', customer_id: 'c1', journey_enrollment_id: 'e1' };
  state.reviewRequest = { id: ID, business_id: 'b1' };
  state.business = { google_review_url: GOOGLE };
  state.inserts = [];
});

describe('isValidReviewUrl', () => {
  it('accepts absolute http(s) URLs only', () => {
    expect(isValidReviewUrl(GOOGLE)).toBe(true);
    expect(isValidReviewUrl('http://example.com')).toBe(true);
    for (const bad of ['', '   ', 'g.page/r/abc', 'javascript:alert(1)', 'ftp://x.com', null, undefined, 42]) {
      expect(isValidReviewUrl(bad)).toBe(false);
    }
  });
});

describe('/api/track-message/[messageId]', () => {
  it('records the click and 302-redirects to the Google review URL', async () => {
    const res = await trackMessage(req(`/api/track-message/${ID}`), { params: { messageId: ID } });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(GOOGLE);
    expect(state.inserts).toEqual([
      { table: 'interaction_events', row: expect.objectContaining({ message_id: ID, event_type: 'click', business_id: 'b1' }) },
    ]);
  });

  it('shows the branded page (not a 404) when no review URL is configured, still counting the click', async () => {
    state.business = { google_review_url: null };
    const res = await trackMessage(req(`/api/track-message/${ID}`), { params: { messageId: ID } });
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get('location')).toBe('https://pentriq-blond.vercel.app/review-unavailable?reason=not-configured');
    expect(state.inserts).toHaveLength(1);
  });

  it('treats a malformed review URL as not configured', async () => {
    state.business = { google_review_url: 'not a url' };
    const res = await trackMessage(req(`/api/track-message/${ID}`), { params: { messageId: ID } });
    expect(res.headers.get('location')).toContain('/review-unavailable?reason=not-configured');
  });

  it('sends unknown / malformed ids to the branded page', async () => {
    state.message = null;
    const unknown = await trackMessage(req(`/api/track-message/${ID}`), { params: { messageId: ID } });
    expect(unknown.headers.get('location')).toContain('/review-unavailable?reason=invalid-link');
    const bad = await trackMessage(req('/api/track-message/nope'), { params: { messageId: 'nope' } });
    expect(bad.headers.get('location')).toContain('/review-unavailable?reason=invalid-link');
    expect(state.inserts).toHaveLength(0);
  });
});

describe('/api/track/[reviewRequestId] (legacy)', () => {
  it('records the click and redirects to Google', async () => {
    const res = await trackLegacy(req(`/api/track/${ID}`), { params: { reviewRequestId: ID } });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(GOOGLE);
    expect(state.inserts[0]).toEqual({ table: 'click_events', row: expect.objectContaining({ review_request_id: ID }) });
  });

  it('shows the branded page when no review URL is configured', async () => {
    state.business = { google_review_url: '' };
    const res = await trackLegacy(req(`/api/track/${ID}`), { params: { reviewRequestId: ID } });
    expect(res.headers.get('location')).toContain('/review-unavailable?reason=not-configured');
  });
});

describe('app URL single source of truth', () => {
  it('reviewUnavailableUrl is built from the request origin', () => {
    expect(reviewUnavailableUrl('https://x.test/api/track/1', 'invalid-link').toString()).toBe(
      'https://x.test/review-unavailable?reason=invalid-link'
    );
  });

  it('getAppUrl never yields a legacy or localhost default', () => {
    const saved = process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getAppUrl()).not.toMatch(/localhost|review[\s_-]?flow/i);
    if (saved !== undefined) process.env.NEXT_PUBLIC_APP_URL = saved;
  });
});
