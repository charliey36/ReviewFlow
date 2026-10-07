'use client';

import { useFormState } from 'react-dom';
import { PublicSuccess } from '@/components/public-shell';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { requestRebooking, type RequestRebookingResult } from './actions';

export function RequestRebookingForm({ customerId }: { customerId: string }) {
  const boundAction = requestRebooking.bind(null, customerId);
  const [state, formAction] = useFormState<RequestRebookingResult, FormData>(boundAction, {});

  if (state.success) {
    return (
      <PublicSuccess
        title="Request sent"
        message="Thanks — the business will reach out to confirm your appointment."
      />
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="preferred_time" className="label">
          Preferred day/time
        </label>
        <input
          id="preferred_time"
          name="preferred_time"
          type="text"
          required
          placeholder="e.g. Tuesday afternoon, next week"
          className="input mt-1.5 py-2.5"
        />
        <p className="field-hint">The business will confirm the exact time with you.</p>
      </div>

      {state.error && <Notice variant="error">{state.error}</Notice>}

      <SubmitButton pendingText="Sending…" className="btn-lg w-full">
        Request this time
      </SubmitButton>
    </form>
  );
}
