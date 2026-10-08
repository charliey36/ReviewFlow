'use client';

import { useState, useTransition } from 'react';
import { Spinner } from '@/components/ui/submit-button';
import { completeService } from './actions';

export function CompleteServiceButton({ customerId, lastServiceDate }: { customerId: string; lastServiceDate: string | null }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  return (
    <div className="text-right">
      <button
        type="button"
        className="btn btn-primary"
        disabled={pending}
        onClick={() => start(async () => setError((await completeService(customerId)).error ?? ''))}
      >
        {pending && <Spinner className="h-4 w-4" />}
        Complete Service
      </button>
      <p className="mt-1.5 text-xs text-ink-4">
        {lastServiceDate ? `Last service: ${new Date(lastServiceDate).toLocaleDateString('en-GB')}` : 'No service recorded yet'}
      </p>
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
