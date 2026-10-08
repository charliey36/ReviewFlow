'use client';

import { useState, useTransition } from 'react';
import { Spinner } from '@/components/ui/submit-button';
import { syncDemoNow, testImport } from './actions';

/** Small action button with a status line. Used for "Test import" and the demo sync. */
export function ActionButton({ kind, label }: { kind: 'test' | 'sync'; label: string }) {
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <button type="button" className="btn btn-secondary btn-sm" disabled={pending}
        onClick={() => start(async () => setMsg((await (kind === 'test' ? testImport() : syncDemoNow())).message))}>
        {pending && <Spinner className="h-3.5 w-3.5" />}
        {label}
      </button>
      {msg && <p role="status" className="text-sm text-ink-2">{msg}</p>}
    </div>
  );
}
