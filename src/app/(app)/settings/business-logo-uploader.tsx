'use client';

import { useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { uploadBusinessLogo, type UploadLogoResult } from './actions';

function PendingOverlay() {
  // Mirrors the pending state into the avatar button via useFormStatus,
  // which only works for a descendant of the <form>.
  const { pending } = useFormStatus();
  return pending ? (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40"
    >
      <svg className="h-6 w-6 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z"
        />
      </svg>
    </div>
  ) : null;
}

export function BusinessLogoUploader({
  businessName,
  logoUrl,
}: {
  businessName: string;
  logoUrl: string | null;
}) {
  const [state, formAction] = useFormState<UploadLogoResult, FormData>(uploadBusinessLogo, {});
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const initials = (businessName.trim()?.[0] || '?').toUpperCase();
  const displaySrc = preview ?? state.logoUrl ?? logoUrl;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    formRef.current?.requestSubmit();
  };

  return (
    <div className="flex items-center gap-4">
      <form ref={formRef} action={formAction} className="relative">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Change business profile picture"
          className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-xl font-semibold text-brand-700 ring-1 ring-inset ring-brand-100 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:bg-brand-900/40 dark:text-brand-300 dark:ring-brand-900/50"
        >
          {displaySrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displaySrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden="true">{initials}</span>
          )}

          {/* Hover overlay with a camera icon, hinting the avatar is clickable */}
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 8.98 4.5h6.04a2.31 2.31 0 0 1 2.153 1.675l.102.361c.118.418.504.714.938.714h.937c1.07 0 1.95.858 1.95 1.924v8.054a1.95 1.95 0 0 1-1.95 1.95H4.85a1.95 1.95 0 0 1-1.95-1.95V9.174c0-1.066.879-1.924 1.95-1.924h.937a.978.978 0 0 0 .938-.714l.102-.361Z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </span>

          <PendingOverlay />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
      </form>

      <div className="text-sm">
        <p className="font-medium text-slate-700 dark:text-slate-300">Profile picture</p>
        <p className="mt-0.5 text-slate-500 dark:text-slate-400">
          Click the circle to upload a PNG, JPEG, or WEBP, up to 2 MB.
        </p>
        {state.error && <p className="mt-1 text-red-700 dark:text-red-400">{state.error}</p>}
        {state.success && !state.error && <p className="mt-1 text-brand-700 dark:text-brand-400">Profile picture updated.</p>}
      </div>
    </div>
  );
}
