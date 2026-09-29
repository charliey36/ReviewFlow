'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { Business } from '@/lib/database.types';
import { saveSettings, type SaveSettingsResult } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Saving…' : 'Save settings'}
    </button>
  );
}

export function SettingsForm({ business }: { business: Business }) {
  const [state, formAction] = useFormState<SaveSettingsResult, FormData>(
    saveSettings,
    {}
  );

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Business name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={business.name}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Acme Coffee Co."
        />
      </div>

      <div>
        <label
          htmlFor="google_review_url"
          className="block text-sm font-medium text-slate-700"
        >
          Google review URL
        </label>
        <input
          id="google_review_url"
          name="google_review_url"
          type="url"
          required
          defaultValue={business.google_review_url}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="https://g.page/r/your-place/review"
        />
        <p className="mt-1 text-xs text-slate-500">
          Customers who click the review button in their email land here.
        </p>
      </div>

      <div>
        <label htmlFor="delay_hours" className="block text-sm font-medium text-slate-700">
          Send delay (hours)
        </label>
        <input
          id="delay_hours"
          name="delay_hours"
          type="number"
          min={0.1}
          step={0.1}
          required
          defaultValue={business.delay_hours}
          className="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <p className="mt-1 text-xs text-slate-500">
          How long after a customer is added before the review request email is sent.
        </p>
      </div>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Settings saved.
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
