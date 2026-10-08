'use client';

import { useState, useTransition } from 'react';
import { Spinner } from '@/components/ui/submit-button';
import { cancelReview, sendReviewNow } from './actions';

/** Send now / Cancel for a customer whose review request is scheduled or held. */
export function ReviewRowActions({ messageId }: { messageId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        disabled={pending}
        onClick={() => start(async () => setError((await sendReviewNow(messageId)).message.includes('failed') ? 'Failed' : ''))}
      >
        {pending ? <Spinner className="h-3.5 w-3.5" /> : 'Send now'}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => start(async () => void (await cancelReview(messageId)))}>
        Cancel
      </button>
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

/** Header button: send the next batch of held review requests. */
export function SendHeldButton({ count }: { count: number }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState('');
  return (
    <div className="flex items-center gap-2">
      {msg && <span role="status" className="text-xs text-ink-3">{msg}</span>}
      <button type="button" className="btn btn-primary" disabled={pending} onClick={() => start(async () => setMsg((await sendReviewNow()).message))}>
        {pending && <Spinner className="h-4 w-4" />}
        Send held ({count})
      </button>
    </div>
  );
}
