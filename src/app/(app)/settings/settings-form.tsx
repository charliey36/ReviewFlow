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
      className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        'Saving\u2026'
      ) : (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
          Save settings
        </>
      )}
    </button>
  );
}

const inputClasses =
  'mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm transition-shadow focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500';

export function SettingsForm({ business }: { business: Business }) {
  const [state, formAction] = useFormState<SaveSettingsResult, FormData>(
    saveSettings,
    {}
  );

  return (
    <form action={formAction} className="max-w-lg space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Business name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={business.name}
          className={inputClasses}
          placeholder="Acme Coffee Co."
        />
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-700" />

      <div>
        <label
          htmlFor="google_review_url"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Google review URL <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
        </label>
        <input
          id="google_review_url"
          name="google_review_url"
          type="url"
          defaultValue={business.google_review_url}
          className={inputClasses}
          placeholder="https://g.page/r/your-place/review"
        />
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Customers who click the review button in their email land here. You can add this
          later — review request emails just won't include a review link until it's set.
        </p>
      </div>

      <div>
        <label htmlFor="delay_hours" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
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
          className={`${inputClasses} w-40`}
        />
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          How long after a customer is added before the review request email is sent.
        </p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/50">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 ring-1 ring-inset ring-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-900/50">
          Settings saved.
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
