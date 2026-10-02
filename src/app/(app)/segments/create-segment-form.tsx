'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createSegment, type SegmentFormResult } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Creating\u2026' : 'Create segment'}
    </button>
  );
}

const inputClasses =
  'mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm transition-shadow focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

export function CreateSegmentForm() {
  const [state, formAction] = useFormState<SegmentFormResult, FormData>(createSegment, {});

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-5 sm:items-end">
      <div className="sm:col-span-2">
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Segment name
        </label>
        <input id="name" name="name" type="text" required className={inputClasses} placeholder="Lapsed high-value" />
      </div>

      <div>
        <label htmlFor="field" className="block text-sm font-medium text-slate-700">
          Field
        </label>
        <select id="field" name="field" className={inputClasses} defaultValue="days_since_last_visit">
          <option value="days_since_last_visit">Days since last visit</option>
          <option value="lifetime_value">Lifetime value</option>
          <option value="visit_count">Visit count</option>
          <option value="tag">Tag</option>
        </select>
      </div>

      <div>
        <label htmlFor="operator" className="block text-sm font-medium text-slate-700">
          Operator
        </label>
        <select id="operator" name="operator" className={inputClasses} defaultValue="gte">
          <option value="gt">&gt;</option>
          <option value="gte">&ge;</option>
          <option value="lt">&lt;</option>
          <option value="lte">&le;</option>
          <option value="eq">=</option>
        </select>
      </div>

      <div>
        <label htmlFor="value" className="block text-sm font-medium text-slate-700">
          Value
        </label>
        <input id="value" name="value" type="text" required className={inputClasses} placeholder="60" />
      </div>

      <div className="sm:col-span-5">
        <SubmitButton />
      </div>

      {state.error && (
        <p className="sm:col-span-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-100">
          {state.error}
        </p>
      )}
    </form>
  );
}
