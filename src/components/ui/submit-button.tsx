'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
} as const;

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
    </svg>
  );
}

/**
 * Submit button for <form action={...}> forms. Reads the pending state from
 * the surrounding form, disables itself, and swaps in a spinner so every
 * submission gives immediate feedback.
 */
export function SubmitButton({
  children,
  pendingText = 'Saving\u2026',
  variant = 'primary',
  icon,
  className = '',
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: keyof typeof variants;
  icon?: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`btn ${variants[variant]} ${className}`}
    >
      {pending ? (
        <>
          <Spinner />
          {pendingText}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
