'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { addCustomer, type AddCustomerResult } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Adding…' : 'Add customer'}
    </button>
  );
}

export function AddCustomerForm() {
  const [state, formAction] = useFormState<AddCustomerResult, FormData>(
    addCustomer,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Jane Doe"
        />
      </div>

      <div className="flex-1">
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="jane@example.com"
        />
      </div>

      <SubmitButton />

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:ml-3">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 sm:ml-3">
          Customer added — review request scheduled.
        </p>
      )}
    </form>
  );
}
