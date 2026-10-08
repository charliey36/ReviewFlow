'use client';

import { useState, useTransition } from 'react';
import { CopyButton } from '@/components/ui/copy-button';
import { Notice } from '@/components/ui/notice';
import { Spinner } from '@/components/ui/submit-button';
import { regenerateApiKey } from './actions';

export function ApiKeyPanel({ initialKey, prefix }: { initialKey: string | null; prefix: string | null }) {
  const [key, setKey] = useState(initialKey);
  const [currentPrefix, setCurrentPrefix] = useState(prefix);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  function regenerate() {
    if (!window.confirm('Regenerate the API key? Any integration using the old key will stop working.')) return;
    start(async () => {
      const res = await regenerateApiKey();
      if (res.key) {
        setKey(res.key);
        setCurrentPrefix(res.key.slice(0, 7));
        setError('');
      } else setError(res.error ?? 'Failed.');
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">API key</label>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <code className="input flex-1 select-all overflow-x-auto font-mono text-sm">
            {key ?? `${currentPrefix}••••••••••••••••••••`}
          </code>
          {key && <CopyButton value={key} />}
        </div>
        {key ? (
          <Notice variant="warning">Copy this key now. For security it is only shown once.</Notice>
        ) : (
          <p className="field-hint">The full key is hidden. Regenerate to get a new one.</p>
        )}
      </div>
      {error && <Notice variant="error">{error}</Notice>}
      <button type="button" className="btn btn-secondary btn-sm" onClick={regenerate} disabled={pending}>
        {pending && <Spinner className="h-3.5 w-3.5" />}
        Regenerate API key
      </button>
    </div>
  );
}
