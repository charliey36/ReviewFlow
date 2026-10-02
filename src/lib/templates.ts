import { escapeHtml } from '@/lib/html';
import { assertCompliantReviewLinks } from '@/lib/compliance';
import type { MessageChannel } from '@/lib/messaging';
import type { Database } from '@/lib/database.types';

export type MessagePurpose = Database['public']['Tables']['messages']['Row']['purpose'];

export type RenderedMessage = { subject?: string; html?: string; text: string };

type TemplateContext = {
  businessName: string;
  customerName: string;
  publicReviewUrl?: string | null;
  privateFeedbackUrl?: string;
  unsubscribeUrl?: string;
  rebookingUrl?: string;
  referralCode?: string;
  loyaltyPointsBalance?: number;
};

function wrapEmailHtml(bodyHtml: string, footerHtml: string): string {
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
      ${bodyHtml}
      ${footerHtml}
    </div>
  `;
}

function unsubscribeFooterHtml(businessName: string, unsubscribeUrl?: string): string {
  const safeBusinessName = escapeHtml(businessName);
  return `
    <p style="font-size: 13px; color: #64748b; margin: 24px 0 8px;">
      Sent by ${safeBusinessName} via ReviewFlow.
    </p>
    ${
      unsubscribeUrl
        ? `<p style="font-size: 13px; color: #94a3b8; margin: 0;">
            <a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a> from future emails.
          </p>`
        : ''
    }
  `;
}

/**
 * Renders a message for a given purpose/channel. This is the one place
 * template copy lives, so businesses customizing their messaging (future
 * work) or an AI-drafting feature (see lib/ai.ts) have a single integration
 * point rather than duplicated copy per call site.
 *
 * review_request and review_reminder both render BOTH the public review
 * link (if configured) and the private feedback link — see
 * assertCompliantReviewLinks. There is no code path here that reads a
 * rating/sentiment and conditionally omits either link.
 */
export function renderMessage(
  purpose: MessagePurpose,
  channel: MessageChannel,
  ctx: TemplateContext
): RenderedMessage {
  const name = escapeHtml(ctx.customerName);
  const business = escapeHtml(ctx.businessName);

  switch (purpose) {
    case 'review_request':
    case 'review_reminder': {
      assertCompliantReviewLinks({
        publicReviewUrl: ctx.publicReviewUrl ?? null,
        privateFeedbackUrl: ctx.privateFeedbackUrl ?? '',
      });

      const isReminder = purpose === 'review_reminder';
      const subject = isReminder
        ? `Quick reminder — how was your visit to ${ctx.businessName}?`
        : `How was your visit to ${ctx.businessName}?`;

      const intro = isReminder
        ? `Just a quick reminder — we'd still love to hear about your visit to ${business}.`
        : `Thanks for visiting ${business}. We'd love your feedback.`;

      if (channel === 'email') {
        const reviewButton = ctx.publicReviewUrl
          ? `<div style="text-align: center; margin: 32px 0;">
              <a href="${ctx.publicReviewUrl}" style="background-color: #188038; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
                Leave a review
              </a>
            </div>`
          : '';

        const feedbackLink = `<p style="text-align: center; font-size: 14px; margin: 8px 0 0;">
            <a href="${ctx.privateFeedbackUrl}" style="color: #475569; text-decoration: underline;">
              Had an issue? Share private feedback instead
            </a>
          </p>`;

        const html = wrapEmailHtml(
          `<p style="font-size: 16px; margin: 0 0 16px;">Hi ${name},</p>
           <p style="font-size: 16px; line-height: 1.5; margin: 0 0 8px;">${intro}</p>
           ${reviewButton}
           ${feedbackLink}`,
          unsubscribeFooterHtml(ctx.businessName, ctx.unsubscribeUrl)
        );

        const text = [
          `Hi ${ctx.customerName},`,
          '',
          intro,
          '',
          ctx.publicReviewUrl ? `Leave a review: ${ctx.publicReviewUrl}` : '',
          `Had an issue? Share private feedback: ${ctx.privateFeedbackUrl}`,
          '',
          `Sent by ${ctx.businessName} via ReviewFlow.`,
          ctx.unsubscribeUrl ? `Unsubscribe: ${ctx.unsubscribeUrl}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        return { subject, html, text };
      }

      // SMS/WhatsApp: short, link-forward, same dual-link requirement.
      const text = `Hi ${ctx.customerName}, ${intro} ${
        ctx.publicReviewUrl ? `Review: ${ctx.publicReviewUrl} ` : ''
      }Feedback: ${ctx.privateFeedbackUrl}`;
      return { text };
    }

    case 'rebooking_reminder': {
      const intro = `It's been a while since your last visit to ${business} — ready to book your next one?`;
      if (channel === 'email') {
        const subject = `Time to rebook with ${ctx.businessName}?`;
        const button = ctx.rebookingUrl
          ? `<div style="text-align: center; margin: 32px 0;">
              <a href="${ctx.rebookingUrl}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
                Book my next visit
              </a>
            </div>`
          : '';
        const html = wrapEmailHtml(
          `<p style="font-size: 16px; margin: 0 0 16px;">Hi ${name},</p>
           <p style="font-size: 16px; line-height: 1.5; margin: 0 0 8px;">${intro}</p>
           ${button}`,
          unsubscribeFooterHtml(ctx.businessName, ctx.unsubscribeUrl)
        );
        const text = `Hi ${ctx.customerName}, ${intro}${ctx.rebookingUrl ? ` Book here: ${ctx.rebookingUrl}` : ''}`;
        return { subject, html, text };
      }
      return { text: `Hi ${ctx.customerName}, ${intro}${ctx.rebookingUrl ? ` ${ctx.rebookingUrl}` : ''}` };
    }

    case 'win_back': {
      const intro = `We miss you! It's been a while since we've seen you at ${business} — come back and see what's new.`;
      if (channel === 'email') {
        const subject = `We miss you at ${ctx.businessName}`;
        const html = wrapEmailHtml(
          `<p style="font-size: 16px; margin: 0 0 16px;">Hi ${name},</p>
           <p style="font-size: 16px; line-height: 1.5; margin: 0 0 8px;">${intro}</p>`,
          unsubscribeFooterHtml(ctx.businessName, ctx.unsubscribeUrl)
        );
        return { subject, html, text: `Hi ${ctx.customerName}, ${intro}` };
      }
      return { text: `Hi ${ctx.customerName}, ${intro}` };
    }

    case 'birthday': {
      const intro = `Happy birthday from everyone at ${business}! 🎉`;
      if (channel === 'email') {
        const subject = `Happy birthday from ${ctx.businessName}!`;
        const html = wrapEmailHtml(
          `<p style="font-size: 16px; margin: 0 0 16px;">Hi ${name},</p>
           <p style="font-size: 16px; line-height: 1.5; margin: 0 0 8px;">${intro}</p>`,
          unsubscribeFooterHtml(ctx.businessName, ctx.unsubscribeUrl)
        );
        return { subject, html, text: `Hi ${ctx.customerName}, ${intro}` };
      }
      return { text: `Hi ${ctx.customerName}, ${intro}` };
    }

    case 'referral': {
      const intro = `Thanks for being a loyal customer of ${business}! Share your referral code and you'll both get rewarded.`;
      const codeText = ctx.referralCode ? ` Your code: ${ctx.referralCode}` : '';
      if (channel === 'email') {
        const subject = `Refer a friend to ${ctx.businessName}`;
        const html = wrapEmailHtml(
          `<p style="font-size: 16px; margin: 0 0 16px;">Hi ${name},</p>
           <p style="font-size: 16px; line-height: 1.5; margin: 0 0 8px;">${intro}${codeText}</p>`,
          unsubscribeFooterHtml(ctx.businessName, ctx.unsubscribeUrl)
        );
        return { subject, html, text: `Hi ${ctx.customerName}, ${intro}${codeText}` };
      }
      return { text: `Hi ${ctx.customerName}, ${intro}${codeText}` };
    }

    case 'loyalty': {
      const intro = `You now have ${ctx.loyaltyPointsBalance ?? 0} loyalty points with ${business}!`;
      if (channel === 'email') {
        const subject = `Your loyalty points at ${ctx.businessName}`;
        const html = wrapEmailHtml(
          `<p style="font-size: 16px; margin: 0 0 16px;">Hi ${name},</p>
           <p style="font-size: 16px; line-height: 1.5; margin: 0 0 8px;">${intro}</p>`,
          unsubscribeFooterHtml(ctx.businessName, ctx.unsubscribeUrl)
        );
        return { subject, html, text: `Hi ${ctx.customerName}, ${intro}` };
      }
      return { text: `Hi ${ctx.customerName}, ${intro}` };
    }

    default: {
      return { text: `Hi ${ctx.customerName}, message from ${ctx.businessName}.` };
    }
  }
}
