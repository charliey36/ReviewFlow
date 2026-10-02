'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { submitPrivateFeedback, type SubmitFeedbackResult } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Sending\u2026' : 'Send feedback'}
    </button>
  );
}

export function PrivateFeedbackForm({ messageId }: { messageId: string }) {
  const boundAction = submitPrivateFeedback.bind(null, messageId);
  const [state, formAction] = useFormState<SubmitFeedbackResult, FormData>(boundAction, {});

  if (state.success) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
        Thanks — your feedback has been sent directly to the business.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          How would you rate your experience? <span className="text-slate-400">(optional)</span>
        </label>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 [&:has(input:checked)]:border-slate-900 [&:has(input:checked)]:bg-slate-900 [&:has(input:checked)]:text-white"
            >
              <input type="radio" name="rating" value={value} className="sr-only" />
              {value}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-slate-700">
          Your feedback
        </label>
        <textarea
          id="comment"
          name="comment"
          required
          rows={5}
          maxLength={5000}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
          placeholder="Tell us what happened..."
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-100">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
