'use client';

import { useRef, useState } from 'react';
import { Icon } from '@/components/ui/icons';
import { Spinner } from '@/components/ui/submit-button';
import { addCustomerTag, removeCustomerTag } from './actions';
import type { CustomerTag } from '@/lib/database.types';

export function TagEditor({ customerId, tags }: { customerId: string; tags: CustomerTag[] }) {
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex animate-pop-in items-center gap-1 rounded-full bg-surface-muted py-0.5 pl-2.5 pr-1 text-xs font-medium text-ink-2 ring-1 ring-inset ring-line-strong/70"
          >
            {tag.tag}
            <button
              type="button"
              onClick={() => removeCustomerTag(tag.id, customerId)}
              className="flex h-4 w-4 items-center justify-center rounded-full text-ink-4 transition-colors duration-150 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400"
              aria-label={`Remove tag ${tag.tag}`}
            >
              <Icon name="x" className="h-3 w-3" strokeWidth={2.2} />
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-[13px] text-ink-4">No tags yet</span>}
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const value = inputRef.current?.value.trim();
          if (!value) return;
          setPending(true);
          await addCustomerTag(customerId, value);
          if (inputRef.current) inputRef.current.value = '';
          setPending(false);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          aria-label="New tag"
          placeholder="Add a tag (e.g. vip)"
          className="input min-w-0 flex-1 py-1.5"
        />
        <button type="submit" disabled={pending} className="btn btn-secondary btn-sm">
          {pending ? <Spinner className="h-3.5 w-3.5" /> : 'Add'}
        </button>
      </form>
    </div>
  );
}
