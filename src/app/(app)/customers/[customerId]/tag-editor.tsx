'use client';

import { useRef, useState } from 'react';
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
            className="group flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
          >
            {tag.tag}
            <button
              onClick={() => removeCustomerTag(tag.id, customerId)}
              className="text-slate-400 hover:text-red-600"
              aria-label={`Remove tag ${tag.tag}`}
            >
              &times;
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-slate-400">No tags yet</span>}
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
        className="mt-3 flex gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Add a tag (e.g. vip)"
          className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
        >
          Add
        </button>
      </form>
    </div>
  );
}
