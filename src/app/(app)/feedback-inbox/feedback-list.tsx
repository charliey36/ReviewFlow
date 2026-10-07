'use client';

import { useMemo, useState, useTransition } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, StarFilled } from '@/components/ui/icons';
import { Spinner } from '@/components/ui/submit-button';
import { updateFeedbackStatus } from './actions';

type FeedbackStatus = 'new' | 'acknowledged' | 'resolved';

type FeedbackItem = {
  id: string;
  rating: number | null;
  comment: string;
  status: FeedbackStatus;
  createdLabel: string;
  customer: { name: string; email: string } | null;
};

const statusTones: Record<FeedbackStatus, BadgeTone> = {
  new: 'warning',
  acknowledged: 'info',
  resolved: 'success',
};

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'resolved', label: 'Resolved' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-px" role="img" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <StarFilled
          key={value}
          className={`h-4 w-4 ${value <= rating ? 'text-amber-400' : 'text-line-strong'}`}
        />
      ))}
    </span>
  );
}

function StatusActions({ item }: { item: FeedbackItem }) {
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<'acknowledged' | 'resolved' | null>(null);

  function update(status: 'acknowledged' | 'resolved') {
    setTarget(status);
    startTransition(async () => {
      await updateFeedbackStatus(item.id, status);
    });
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {item.status !== 'acknowledged' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => update('acknowledged')}
          className="btn btn-secondary btn-sm"
        >
          {pending && target === 'acknowledged' ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="eye" className="h-3.5 w-3.5" />}
          Mark acknowledged
        </button>
      )}
      {item.status !== 'resolved' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => update('resolved')}
          className="btn btn-secondary btn-sm"
        >
          {pending && target === 'resolved' ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2} />}
          Mark resolved
        </button>
      )}
    </div>
  );
}

export function FeedbackList({ items }: { items: FeedbackItem[] }) {
  const [tab, setTab] = useState<TabKey>('all');

  const counts = useMemo(() => {
    const result: Record<TabKey, number> = { all: items.length, new: 0, acknowledged: 0, resolved: 0 };
    for (const item of items) result[item.status] += 1;
    return result;
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon="inbox"
          title="No feedback yet"
          description="Private feedback submitted by customers from a review request will show up here."
        />
      </div>
    );
  }

  const visible = tab === 'all' ? items : items.filter((item) => item.status === tab);

  return (
    <div>
      <div role="tablist" aria-label="Filter feedback by status" className="scroll-thin mb-4 flex gap-1 overflow-x-auto">
        {tabs.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.key)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
                active
                  ? 'bg-surface text-ink shadow-xs ring-1 ring-inset ring-line-strong'
                  : 'text-ink-3 hover:bg-surface-muted hover:text-ink'
              }`}
            >
              {item.label}
              <span className={`text-xs tabular-nums ${active ? 'text-ink-3' : 'text-ink-4'}`}>{counts[item.key]}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="inbox"
            title={`Nothing ${tab === 'new' ? 'new' : tab}`}
            description="You're all caught up for this view."
            className="py-12"
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => (
            <li
              key={item.id}
              className={`card animate-fade-in p-5 sm:p-6 ${
                item.status === 'new' ? 'border-l-[3px] border-l-brand-500' : ''
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={item.customer?.name ?? '?'} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {item.customer?.name ?? 'Unknown customer'}
                    </p>
                    {item.customer?.email && <p className="truncate text-[13px] text-ink-3">{item.customer.email}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {item.rating && <Stars rating={item.rating} />}
                  <Badge tone={statusTones[item.status]} dot className="capitalize">
                    {item.status}
                  </Badge>
                  <span className="text-xs text-ink-3">{item.createdLabel}</span>
                </div>
              </div>

              <p className="mt-4 whitespace-pre-line rounded-lg bg-surface-subtle px-4 py-3 text-sm leading-6 text-ink-2 ring-1 ring-inset ring-line">
                {item.comment}
              </p>

              <StatusActions item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
