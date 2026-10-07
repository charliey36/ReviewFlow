'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/icons';
import { AddCustomerForm } from './add-customer-form';

/**
 * Collapsible "add a customer" panel. Collapsed once you have customers so
 * the list is the focus; open by default for first-run and when arriving
 * from a "+ Add customer" link (?add=1). State lives here (not on a native
 * <details>) so a server refresh after submitting never re-collapses it and
 * hides the success message.
 */
export function AddCustomerPanel({
  defaultOpen,
  autoFocus,
}: {
  defaultOpen: boolean;
  autoFocus: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="card mb-6">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="add-customer-panel"
        className="flex w-full items-center gap-3 rounded-xl px-5 py-4 text-left transition-colors duration-150 hover:bg-surface-subtle sm:px-6"
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          <Icon name="plus" className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink">Add a customer</span>
          <span className="block text-[13px] text-ink-3">A review request is scheduled automatically.</span>
        </span>
        <Icon
          name="chevronDown"
          className={`ml-auto h-4 w-4 flex-shrink-0 text-ink-4 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div id="add-customer-panel" className="animate-fade-in border-t border-line px-5 py-5 sm:px-6">
          <AddCustomerForm autoFocus={autoFocus} />
        </div>
      )}
    </section>
  );
}
