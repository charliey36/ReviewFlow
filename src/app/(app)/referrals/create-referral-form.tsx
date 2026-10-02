'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { Customer } from '@/lib/database.types';
import { createReferralCode, type ReferralFormResult } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Generating\u2026' : 'Generate code'}
    </button>
  );
}

export function CreateReferralForm({ customers }: { customers: Customer[] }) {
  const [state, formAction] = useFormState<ReferralFormResult, FormData>(createReferralCode, {});

  return (
    <div>
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="customer_id" className="block text-sm font-medium text-slate-700">
            Referring customer
          </label>
          <select
            id="customer_id"
            name="customer_id"
            required
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">Select a customer\u2026</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.email})
              </option>
            ))}
          </select>
        </div>
        <SubmitButton />
      </form>

      {state.error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-100">
          {state.error}
        </p>
      )}
      {state.success && state.code && (
        <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 ring-1 ring-inset ring-brand-100">
          Referral code generated: <span className="font-mono font-semibold">{state.code}</span>
        </p>
      )}
    </div>
  );
}
