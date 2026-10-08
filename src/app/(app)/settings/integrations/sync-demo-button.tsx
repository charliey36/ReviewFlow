'use client';

import { useState, useTransition } from 'react';
import { Spinner } from '@/components/ui/submit-button';
import { syncDemoNow } from './actions';

export function SyncDemoButton() {
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <button type="button" className="btn btn-secondary btn-sm" disabled={pending}
        onClick={() => start(async () => setMsg((await syncDemoNow()).message))}>
        {pending && <Spinner className="h-3.5 w-3.5" />}
        Sync now
      </button>
      {msg && <p role="status" className="text-sm text-ink-2">{msg}</p>}
    </div>
  );
}
