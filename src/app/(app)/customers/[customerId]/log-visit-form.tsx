'use client';

import { useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { logVisit, type LogVisitResult } from './actions';
import type { Service } from '@/lib/database.types';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Logging\u2026' : 'Log visit'}
    </button>
  );
}

const inputClasses =
  'mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm transition-shadow focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

export function LogVisitForm({ customerId, services }: { customerId: string; services: Service[] }) {
  const boundAction = logVisit.bind(null, customerId);
  const [state, formAction] = useFormState<LogVisitResult, FormData>(boundAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        const result = await formAction(fd);
        return result;
      }}
      className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end"
    >
      <div>
        <label htmlFor="service_id" className="block text-sm font-medium text-slate-700">
          Service
        </label>
        <select id="service_id" name="service_id" className={inputClasses}>
          <option value="">General visit</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-slate-700">
          Price
        </label>
        <input id="price" name="price" type="number" min={0} step={0.01} className={inputClasses} placeholder="45.00" />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
          Notes
        </label>
        <input id="notes" name="notes" type="text" className={inputClasses} placeholder="Optional" />
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
