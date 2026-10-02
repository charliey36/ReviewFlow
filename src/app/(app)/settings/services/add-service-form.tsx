'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createService, type ServiceFormResult } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Adding\u2026' : 'Add service'}
    </button>
  );
}

const inputClasses =
  'mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm transition-shadow focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

export function AddServiceForm() {
  const [state, formAction] = useFormState<ServiceFormResult, FormData>(createService, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Service name
        </label>
        <input id="name" name="name" type="text" required className={inputClasses} placeholder="Haircut" />
      </div>

      <div>
        <label htmlFor="recurrence_interval_days" className="block text-sm font-medium text-slate-700">
          Rebook after (days)
        </label>
        <input
          id="recurrence_interval_days"
          name="recurrence_interval_days"
          type="number"
          min={1}
          className={inputClasses}
          placeholder="30"
        />
      </div>

      <div>
        <label htmlFor="default_price" className="block text-sm font-medium text-slate-700">
          Default price
        </label>
        <input
          id="default_price"
          name="default_price"
          type="number"
          min={0}
          step={0.01}
          className={inputClasses}
          placeholder="45.00"
        />
      </div>

      <SubmitButton />

      {state.error && (
        <p className="sm:col-span-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-100">
          {state.error}
        </p>
      )}
    </form>
  );
}
