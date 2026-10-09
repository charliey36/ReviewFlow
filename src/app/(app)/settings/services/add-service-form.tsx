'use client';

import { useEffect, useRef } from 'react';
import { useActionToast } from '@/components/toast';
import { useFormState } from 'react-dom';
import { Icon } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { createService, type ServiceFormResult } from './actions';

export function AddServiceForm() {
  const [state, formAction] = useFormState<ServiceFormResult, FormData>(createService, {});
  useActionToast(state, { title: 'Service added' });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end"
    >
      <div className="sm:col-span-2 lg:col-span-1">
        <label htmlFor="name" className="label">
          Service name
        </label>
        <input id="name" name="name" type="text" required className="input mt-1.5" placeholder="Haircut" />
      </div>

      <div>
        <label htmlFor="recurrence_interval_days" className="label">
          Rebook after
        </label>
        <div className="relative mt-1.5">
          <input
            id="recurrence_interval_days"
            name="recurrence_interval_days"
            type="number"
            min={1}
            className="input pr-14 tabular-nums"
            placeholder="30"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-4">days</span>
        </div>
      </div>

      <div>
        <label htmlFor="default_price" className="label">
          Default price
        </label>
        <div className="relative mt-1.5">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-4">£</span>
          <input
            id="default_price"
            name="default_price"
            type="number"
            min={0}
            step={0.01}
            className="input pl-7 tabular-nums"
            placeholder="45.00"
          />
        </div>
      </div>

      <SubmitButton
        pendingText="Adding…"
        icon={<Icon name="plus" className="h-4 w-4" strokeWidth={2} />}
        className="sm:col-span-2 lg:col-span-1"
      >
        Add service
      </SubmitButton>

      {state.error && <Notice variant="error" className="sm:col-span-2 lg:col-span-4">{state.error}</Notice>}
    </form>
  );
}
