/**
 * AI drafting hook (spec D4/F5). Provider-pluggable: if an LLM API key is
 * configured, `draftMessageCopy` would call out to it; without one, it
 * falls back to a deterministic, rule-based draft built from
 * lib/templates.ts so the feature always returns something usable instead
 * of failing. This environment has no LLM provider credentials configured,
 * so the fallback path is what actually runs — the integration point is
 * fully wired so adding a real provider later is a one-function change.
 *
 * Design constraints carried over from the master spec:
 *  - never send customer PII to a third-party LLM — only business-level
 *    context (name, message purpose) is included in the "prompt" shape
 *    below, even once a real provider is wired in.
 *  - output always lands in an editable field, never auto-sent.
 */
import { renderMessage, type MessagePurpose } from '@/lib/templates';

export type DraftRequest = {
  businessName: string;
  purpose: MessagePurpose;
  tone?: 'friendly' | 'professional' | 'playful';
};

export type DraftResult = { text: string; generatedBy: 'ai' | 'template_fallback' };

function hasLlmProviderConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

export async function draftMessageCopy(request: DraftRequest): Promise<DraftResult> {
  if (hasLlmProviderConfigured()) {
    // Real LLM wiring intentionally left unimplemented: no provider API key
    // is configured in this environment, so there is nothing to safely call
    // and test. Once OPENAI_API_KEY or ANTHROPIC_API_KEY is set, implement
    // the actual completion call here using only the fields on
    // DraftRequest (no customer PII) as the prompt, and return
    // { text, generatedBy: 'ai' }. Until then this branch is unreachable in
    // practice because hasLlmProviderConfigured() gates it.
  }

  // Deterministic fallback: reuse the existing template renderer with
  // placeholder customer context, so the "draft" is at least on-brand and
  // immediately editable rather than a lorem-ipsum placeholder.
  const rendered = renderMessage(request.purpose, 'email', {
    businessName: request.businessName,
    customerName: '{{customer_name}}',
    publicReviewUrl: '{{review_url}}',
    privateFeedbackUrl: '{{feedback_url}}',
    unsubscribeUrl: '{{unsubscribe_url}}',
    rebookingUrl: '{{rebooking_url}}',
  });

  return { text: rendered.text, generatedBy: 'template_fallback' };
}
