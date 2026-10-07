'use client';

import { useRef, useState } from 'react';
import { useActionToast } from '@/components/toast';
import { useFormState, useFormStatus } from 'react-dom';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icons';
import { Spinner } from '@/components/ui/submit-button';
import { uploadBusinessLogo, type UploadLogoResult } from './actions';

function PendingOverlay() {
  // Mirrors the pending state into the avatar via useFormStatus, which only
  // works for a descendant of the <form>.
  const { pending } = useFormStatus();
  return pending ? (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white"
    >
      <Spinner className="h-6 w-6" />
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
  useActionToast(state, { title: 'Profile picture updated' });
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const displaySrc = preview ?? state.logoUrl ?? logoUrl;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    formRef.current?.requestSubmit();
  };

  return (
    <div className="flex flex-wrap items-center gap-5">
      <form ref={formRef} action={formAction} className="relative">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Change business profile picture"
          className="group relative block rounded-full focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/40"
        >
          <Avatar name={businessName || '?'} src={displaySrc} size="xl" className="!h-16 !w-16 !text-xl" />

          {/* Hover overlay with a camera icon, hinting the avatar is clickable */}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition duration-150 group-hover:bg-black/45 group-hover:opacity-100">
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

      <div className="min-w-0 text-sm">
        <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary btn-sm">
          <Icon name="upload" className="h-3.5 w-3.5" />
          Upload new picture
        </button>
        <p className="mt-2 text-[13px] text-ink-3">PNG, JPEG or WEBP, up to 2 MB.</p>
        {state.error && (
          <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}
      </div>
    </div>
  );
}
