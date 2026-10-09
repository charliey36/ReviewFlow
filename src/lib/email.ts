import { Resend } from 'resend';
import { renderReviewRequestEmail } from '@/lib/email-templates/review-request';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY environment variable.');
  }
  return new Resend(apiKey);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Builds the legacy-flow review request email. `trackingUrl` points at our own
 * /api/track/[reviewRequestId] endpoint, which records the click and then
 * redirects to the business's real Google review URL. `unsubscribeUrl`
 * points at /api/unsubscribe/[customerId] so every send includes a working
 * opt-out link, as required by CAN-SPAM. The layout is shared with the
 * generalized messages flow (lib/email-templates/review-request.ts).
 */
export function buildReviewRequestEmail(params: {
  businessName: string;
  customerName: string;
  trackingUrl: string;
  unsubscribeUrl: string;
}) {
  const { businessName, customerName, trackingUrl, unsubscribeUrl } = params;
  const { subject, html, text } = renderReviewRequestEmail({
    variant: 'request',
    businessName,
    customerName,
    reviewLink: trackingUrl,
    unsubscribeUrl,
  });
  return { subject, html, text };
}

export async function sendReviewRequestEmail(params: {
  to: string;
  businessName: string;
  customerName: string;
  trackingUrl: string;
  unsubscribeUrl: string;
}) {
  const resend = getResendClient();
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const { subject, html, text } = buildReviewRequestEmail(params);

  const { error } = await resend.emails.send({
    from: `${params.businessName} via ReviewFlow <${from}>`,
    to: params.to,
    subject,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<${params.unsubscribeUrl}>`,
    },
  });

  if (error) {
    throw new Error(typeof error === 'string' ? error : error.message);
  }
}

// ---------------------------------------------------------------------------
// Account notification emails (welcome / campaign sent / trial ending).
// Plain HTML, sent through Resend. With no RESEND_API_KEY (local dev) the
// email is logged instead of sent, so nothing breaks.
// ---------------------------------------------------------------------------

export type NotificationKind = 'welcome' | 'campaign' | 'trial_ending';

function layout(body: string) {
  return `<div style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#0f172a">
<p style="font-size:18px;font-weight:700;color:#188038;margin:0 0 24px">ReviewFlow</p>${body}
<p style="font-size:13px;color:#64748b;margin-top:32px">Questions? Just reply to this email.</p></div>`;
}

export function buildNotificationEmail(kind: NotificationKind, businessName: string) {
  const app = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const name = escapeHtml(businessName);
  const button = (href: string, label: string) =>
    `<p style="margin:24px 0"><a href="${href}" style="background:#188038;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block">${label}</a></p>`;

  switch (kind) {
    case 'welcome':
      return {
        subject: 'Welcome to ReviewFlow',
        html: layout(`<p>Welcome, ${name}!</p><p>Add your Google review link and your first customer and we'll send your first review request.</p>${button(`${app}/dashboard`, 'Get started')}`),
      };
    case 'campaign':
      return {
        subject: 'Your campaign has been sent',
        html: layout(`<p>Good news: your first review request from ${name} has been sent.</p><p>Track clicks and feedback on your dashboard.</p>${button(`${app}/dashboard`, 'View dashboard')}`),
      };
    case 'trial_ending':
      return {
        subject: 'Your ReviewFlow trial ends soon',
        html: layout(`<p>Your free trial for ${name} ends in a few days.</p><p>Subscribe to keep sending review requests.</p>${button(`${app}/settings/billing`, 'Subscribe')}`),
      };
  }
}

export async function sendNotificationEmail(to: string, kind: NotificationKind, businessName: string) {
  const { subject, html } = buildNotificationEmail(kind, businessName);
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email stub] to=${to} subject="${subject}"`);
    return;
  }
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const { error } = await getResendClient().emails.send({ from: `ReviewFlow <${from}>`, to, subject, html });
  if (error) throw new Error(typeof error === 'string' ? error : error.message);
}
