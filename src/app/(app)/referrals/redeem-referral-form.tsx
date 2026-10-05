'use client';

import { useState } from 'react';
import type { Customer } from '@/lib/database.types';
import { redeemReferralCode } from './actions';

export function RedeemReferralForm({ customers }: { customers: Customer[] }) {
  const [code, setCode] = useState('');
  const [refereeId, setRefereeId] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setMessage(null);
        const result = await redeemReferralCode(code, refereeId);
        if (result?.error) {
          setMessage({ type: 'error', text: result.error });
        } else {
          setMessage({ type: 'success', text: 'Referral redeemed — both customers rewarded.' });
          setCode('');
          setRefereeId('');
        }
        setPending(false);
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label htmlFor="code" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Referral code
        </label>
        <input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono uppercase shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          placeholder="ABC123"
        />
      </div>
      <div className="flex-1">
        <label htmlFor="referee" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          New customer
        </label>
        <select
          id="referee"
          value={refereeId}
          onChange={(e) => setRefereeId(e.target.value)}
          required
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
        >
          <option value="">Select a customer\u2026</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} ({customer.email})
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700"
      >
        {pending ? 'Redeeming\u2026' : 'Redeem'}
      </button>

      {message && (
        <p
          className={`sm:col-span-3 w-full rounded-lg px-3 py-2 text-sm ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/50'
              : 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-900/50'
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
