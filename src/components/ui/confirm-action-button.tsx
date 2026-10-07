'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Spinner } from './submit-button';

/**
 * Two-step destructive button: the first click arms it ("Confirm?"), the
 * second performs the action. It disarms itself after a few seconds. Gives
 * delete/remove actions a safety net without a modal.
 */
export function ConfirmActionButton({
  label,
  confirmLabel = 'Confirm?',
  ariaLabel,
  onConfirm,
}: {
  label: string;
  confirmLabel?: string;
  ariaLabel: string;
  onConfirm: () => Promise<unknown> | void;
}) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleClick() {
    if (!armed) {
      setArmed(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setArmed(false), 3500);
      return;
    }
    clearTimeout(timer.current);
    startTransition(async () => {
      await onConfirm();
      setArmed(false);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onBlur={() => setArmed(false)}
      disabled={pending}
      aria-label={armed ? `${ariaLabel} \u2014 click again to confirm` : ariaLabel}
      className={`btn btn-sm ${
        armed
          ? 'border-red-600/30 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20'
          : 'btn-danger-ghost'
      }`}
    >
      {pending ? <Spinner className="h-3.5 w-3.5" /> : armed ? confirmLabel : label}
    </button>
  );
}
