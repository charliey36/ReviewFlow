'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { PublicSuccess } from '@/components/public-shell';
import { StarFilled } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { submitPrivateFeedback, type SubmitFeedbackResult } from './actions';

const ratingLabels = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function StarRating() {
  const [value, setValue] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value ?? 0;

  return (
    <div>
      {/* Submitted only when a rating is chosen, matching an unselected radio group. */}
      {value !== null && <input type="hidden" name="rating" value={value} />}

      <div role="radiogroup" aria-label="Rating" className="flex items-center gap-1" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? '' : 's'}: ${ratingLabels[star - 1]}`}
            onClick={() => setValue(value === star ? null : star)}
            onMouseEnter={() => setHover(star)}
            onFocus={() => setHover(star)}
            onBlur={() => setHover(null)}
            className="rounded-md p-1 transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/30"
          >
            <StarFilled
              className={`h-9 w-9 transition-colors duration-150 ${star <= active ? 'text-amber-400' : 'text-line-strong'}`}
            />
          </button>
        ))}
        <span className="ml-2 min-w-[4.5rem] text-sm font-medium text-ink-3" aria-live="polite">
          {active > 0 ? ratingLabels[active - 1] : ''}
        </span>
      </div>
    </div>
  );
}

export function PrivateFeedbackForm({ messageId }: { messageId: string }) {
  const boundAction = submitPrivateFeedback.bind(null, messageId);
  const [state, formAction] = useFormState<SubmitFeedbackResult, FormData>(boundAction, {});

  if (state.success) {
    return (
      <PublicSuccess
        title="Thank you"
        message="Your feedback has been sent directly to the business."
      />
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <p className="label">
          How would you rate your experience? <span className="font-normal text-ink-4">(optional)</span>
        </p>
        <div className="mt-2">
          <StarRating />
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="label">
          Your feedback
        </label>
        <textarea
          id="comment"
          name="comment"
          required
          rows={5}
          maxLength={5000}
          className="input mt-1.5 resize-y leading-6"
          placeholder="Tell us what happened..."
        />
      </div>

      {state.error && <Notice variant="error">{state.error}</Notice>}

      <SubmitButton pendingText="Sending…" className="btn-lg w-full">
        Send feedback
      </SubmitButton>
    </form>
  );
}
