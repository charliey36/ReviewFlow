'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { requestRebooking, type RequestRebookingResult } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Sending\u2026' : 'Request this time'}
    </button>
  );
}

export function RequestRebookingForm({ customerId }: { customerId: string }) {
  const boundAction = requestRebooking.bind(null, customerId);
  const [state, formAction] = useFormState<RequestRebookingResult, FormData>(boundAction, {});

  if (state.success) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
        Thanks — the business will reach out to confirm your appointment.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="preferred_time" className="block text-sm font-medium text-slate-700">
          Preferred day/time
        </label>
        <input
          id="preferred_time"
          name="preferred_time"
          type="text"
          required
          placeholder="e.g. Tuesday afternoon, next week"
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
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
