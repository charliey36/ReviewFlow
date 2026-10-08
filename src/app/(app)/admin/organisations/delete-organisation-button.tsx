'use client';

import { useRef, useState, useTransition } from 'react';
import { Spinner } from '@/components/ui/submit-button';
import { deleteOrganisation } from './actions';

export function DeleteOrganisationButton({ id, name }: { id: string; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  function confirm() {
    start(async () => {
      const res = await deleteOrganisation(id);
      if (res.error) setError(res.error);
      else dialog.current?.close();
    });
  }

  return (
    <>
      <button type="button" className="btn btn-sm btn-danger-ghost" onClick={() => dialog.current?.showModal()}>
        Delete
      </button>
      <dialog ref={dialog} className="card w-full max-w-sm p-6 backdrop:bg-black/50" aria-labelledby={`del-${id}`}>
        <h2 id={`del-${id}`} className="text-base font-semibold text-ink">Are you sure you want to delete this organisation?</h2>
        <p className="mt-2 text-sm text-ink-3">
          “{name || 'Unnamed business'}” and its users, customers and requests will be permanently deleted. This cannot be undone.
        </p>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => dialog.current?.close()} disabled={pending}>
            Cancel
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={confirm} disabled={pending}>
            {pending ? <Spinner className="h-3.5 w-3.5" /> : 'Delete organisation'}
          </button>
        </div>
      </dialog>
    </>
  );
}
