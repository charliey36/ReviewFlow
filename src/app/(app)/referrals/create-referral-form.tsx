'use client';

import { useFormState } from 'react-dom';
import type { Customer } from '@/lib/database.types';
import { CopyButton } from '@/components/ui/copy-button';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { createReferralCode, type ReferralFormResult } from './actions';

export function CreateReferralForm({ customers }: { customers: Customer[] }) {
  const [state, formAction] = useFormState<ReferralFormResult, FormData>(createReferralCode, {});

  return (
    <div>
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="customer_id" className="label">
            Referring customer
          </label>
          <select id="customer_id" name="customer_id" required className="input mt-1.5" defaultValue="">
            <option value="" disabled>
              Select a customer…
            </option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.email})
              </option>
            ))}
          </select>
        </div>
        <SubmitButton pendingText="Generating…">Generate code</SubmitButton>
      </form>

      {state.error && <Notice variant="error" className="mt-4">{state.error}</Notice>}
      {state.success && state.code && (
        <Notice variant="success" className="mt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              Referral code generated:{' '}
              <span className="font-mono font-semibold tracking-wide">{state.code}</span>
            </span>
            <CopyButton value={state.code} />
          </div>
        </Notice>
      )}
    </div>
  );
}
