import { Resend } from 'resend';

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
 * Builds the review request email HTML. `trackingUrl` points at our own
 * /api/track/[reviewRequestId] endpoint, which records the click and then
 * redirects to the business's real Google review URL.
 */
export function buildReviewRequestEmail(params: {
  businessName: string;
  customerName: string;
  trackingUrl: string;
}) {
  const { businessName, customerName, trackingUrl } = params;
  const safeBusinessName = escapeHtml(businessName);
  const safeCustomerName = escapeHtml(customerName);

  const subject = `How was your visit to ${businessName}?`;

  const html = `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
      <p style="font-size: 16px; margin: 0 0 16px;">Hi ${safeCustomerName},</p>
      <p style="font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
        Thanks for visiting ${safeBusinessName}. We'd love your feedback.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a
          href="${trackingUrl}"
          style="background-color: #188038; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;"
        >
          Leave a review
        </a>
      </div>
      <p style="font-size: 13px; color: #64748b; margin: 0;">
        Sent by ${safeBusinessName} via ReviewFlow.
      </p>
    </div>
  `;

  const text = `Hi ${customerName},\n\nThanks for visiting ${businessName}. We'd love your feedback.\n\nLeave a review: ${trackingUrl}\n\nSent by ${businessName} via ReviewFlow.`;

  return { subject, html, text };
}

export async function sendReviewRequestEmail(params: {
  to: string;
  businessName: string;
  customerName: string;
  trackingUrl: string;
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
  });

  if (error) {
    throw new Error(typeof error === 'string' ? error : error.message);
  }
}
