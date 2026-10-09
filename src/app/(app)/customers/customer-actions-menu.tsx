'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useToast } from '@/components/toast';
import { Icon, type IconName } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { Spinner } from '@/components/ui/submit-button';
import { useFormState, useFormStatus } from 'react-dom';
import {
  sendManualReviewRequest,
  sendManualRebookingReminder,
  archiveCustomer,
  unarchiveCustomer,
  editCustomer,
  type ManualActionResult,
} from './[customerId]/actions';

type MenuItem = {
  key: string;
  label: string;
  icon: IconName;
  onSelect: () => void;
  danger?: boolean;
};

/**
 * Per-customer actions dropdown shown in the customer detail header.
 *
 * Groups the manual workflows an owner performs on one customer:
 *   - Log visit                 (scrolls to the inline log-visit form)
 *   - Send review               (manual review request, sent now)
 *   - Send rebooking reminder   (manual reminder, sent now)
 *   - Edit                      (opens an inline edit dialog)
 *   - Archive / Restore         (soft-archive; destructive -> confirm dialog)
 *
 * Matches the app's existing glass popover menu (see WorkspaceMenu): closes on
 * outside click / Escape, returns focus to the trigger, and uses the shared
 * toast system for success/failure feedback.
 */
export function CustomerActionsMenu({
  customerId,
  customer,
  isArchived,
}: {
  customerId: string;
  customer: { name: string; email: string; phone: string | null };
  isArchived: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [pending, start] = useTransition();
  const { push } = useToast();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function runAction(action: () => Promise<ManualActionResult>, fallback: string) {
    start(async () => {
      const res = await action();
      if (res.error) push({ variant: 'error', title: fallback, description: res.error });
      else push({ variant: 'success', title: res.message ?? fallback });
    });
  }

  function scrollToLogVisit() {
    const el = document.getElementById('log-visit');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.querySelector<HTMLElement>('select, input, button')?.focus();
    }
  }

  const items: MenuItem[] = [
    { key: 'log-visit', label: 'Log visit', icon: 'calendar', onSelect: scrollToLogVisit },
    {
      key: 'send-review',
      label: 'Send review',
      icon: 'star',
      onSelect: () => runAction(() => sendManualReviewRequest(customerId), 'Could not send review'),
    },
    {
      key: 'send-rebooking',
      label: 'Send rebooking reminder',
      icon: 'refresh',
      onSelect: () => runAction(() => sendManualRebookingReminder(customerId), 'Could not send reminder'),
    },
    { key: 'edit', label: 'Edit', icon: 'cog', onSelect: () => setEditing(true) },
    isArchived
      ? {
          key: 'restore',
          label: 'Restore',
          icon: 'refresh',
          onSelect: () => runAction(() => unarchiveCustomer(customerId), 'Could not restore'),
        }
      : {
          key: 'archive',
          label: 'Archive',
          icon: 'inbox',
          danger: true,
          onSelect: () => setConfirmArchive(true),
        },
  ];

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={pending}
        className="btn btn-secondary"
      >
        {pending ? <Spinner className="h-4 w-4" /> : <Icon name="bolt" className="h-4 w-4" />}
        Actions
        <Icon name="chevronDown" className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 origin-top-right animate-palette-in overflow-hidden rounded-2xl border border-line bg-surface/95 p-1.5 shadow-pop backdrop-blur-xl"
        >
          {items.map((item, index) => (
            <div key={item.key}>
              {item.key === 'edit' && index > 0 && <div className="my-1 h-px bg-line" />}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${
                  item.danger
                    ? 'text-ink-2 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400'
                    : 'text-ink-2 hover:bg-brand-500/10 hover:text-ink'
                }`}
              >
                <Icon name={item.icon} className="h-4 w-4 text-ink-4" />
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}

      {confirmArchive && (
        <ConfirmDialog
          title={`Archive ${customer.name}?`}
          description="They'll be hidden from your active customer list and any queued messages are cancelled. Their history is kept and you can restore them at any time."
          confirmLabel="Archive customer"
          pending={pending}
          onCancel={() => setConfirmArchive(false)}
          onConfirm={() => {
            setConfirmArchive(false);
            runAction(() => archiveCustomer(customerId), 'Could not archive');
          }}
        />
      )}

      {editing && (
        <EditCustomerDialog customerId={customerId} customer={customer} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}

/**
 * Confirmation modal for destructive actions. Centered glass card over a
 * scrim, focus-trapped to the two buttons, dismissable with Escape or the
 * Cancel button — a deliberate speed-bump before an irreversible-looking
 * action.
 */
function ConfirmDialog({
  title,
  description,
  confirmLabel,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onCancel} aria-hidden="true" />
      <div className="relative w-full max-w-md animate-palette-in rounded-2xl border border-line bg-surface p-6 shadow-pop">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <Icon name="warning" className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
            <p className="mt-1.5 text-[13px] leading-5 text-ink-3">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            className="btn border-red-600/40 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/30"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending && <Spinner className="h-4 w-4" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Inline edit dialog for a customer's contact details. */
function EditCustomerDialog({
  customerId,
  customer,
  onClose,
}: {
  customerId: string;
  customer: { name: string; email: string; phone: string | null };
  onClose: () => void;
}) {
  const boundAction = editCustomer.bind(null, customerId);
  const [state, formAction] = useFormState<ManualActionResult, FormData>(boundAction, {});
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push({ variant: 'success', title: state.message ?? 'Customer updated' });
      onClose();
    }
  }, [state, push, onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Edit customer" className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md animate-palette-in rounded-2xl border border-line bg-surface p-6 shadow-pop">
        <h2 className="text-[15px] font-semibold text-ink">Edit customer</h2>
        <form action={formAction} className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-name" className="label">Name</label>
            <input id="edit-name" name="name" type="text" required defaultValue={customer.name} className="input mt-1.5" />
          </div>
          <div>
            <label htmlFor="edit-email" className="label">Email</label>
            <input id="edit-email" name="email" type="email" required defaultValue={customer.email} className="input mt-1.5" />
          </div>
          <div>
            <label htmlFor="edit-phone" className="label">
              Phone <span className="font-normal text-ink-4">(optional)</span>
            </label>
            <input id="edit-phone" name="phone" type="tel" defaultValue={customer.phone ?? ''} className="input mt-1.5" />
          </div>

          {state.error && <Notice variant="error">{state.error}</Notice>}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <SaveButton />
          </div>
        </form>
      </div>
    </div>
  );
}

function SaveButton() {
  // Local submit button that reflects pending state via useFormStatus.
  // Kept here (not the shared SubmitButton) so it sits inline with Cancel.
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
      {pending && <Spinner className="h-4 w-4" />}
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}
