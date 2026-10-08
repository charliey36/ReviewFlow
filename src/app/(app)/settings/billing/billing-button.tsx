'use client';

import { useFormState } from 'react-dom';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import type { BillingResult } from './actions';

export function BillingButton({
  action,
  label,
}: {
  action: (prev: BillingResult, fd: FormData) => Promise<BillingResult>;
  label: string;
}) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className="space-y-3">
      <SubmitButton pendingText="One moment…">{label}</SubmitButton>
      {state.error && <Notice variant="error">{state.error}</Notice>}
    </form>
  );
}
