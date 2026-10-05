'use client';

import { updateFeedbackStatus } from './actions';

type FeedbackItem = {
  id: string;
  rating: number | null;
  comment: string;
  status: 'new' | 'acknowledged' | 'resolved';
  created_at: string;
  customer: { name: string; email: string } | null;
};

const statusStyles: Record<string, string> = {
  new: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/50',
  acknowledged: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900/50',
  resolved: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-900/50',
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function FeedbackList({ items }: { items: FeedbackItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white p-10 text-center shadow-md dark:border-slate-700/70 dark:bg-surface-card">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No feedback yet</p>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
          Private feedback submitted by customers will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const customer = item.customer;
        return (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-md dark:border-slate-700/70 dark:bg-surface-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {customer?.name ?? 'Unknown customer'}
                </span>
                {item.rating && (
                  <span className="text-sm text-amber-500">{'★'.repeat(item.rating)}</span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[item.status]}`}
                >
                  {item.status}
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">{formatDateTime(item.created_at)}</span>
            </div>

            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{item.comment}</p>

            <div className="mt-4 flex gap-2">
              {item.status !== 'acknowledged' && (
                <button
                  onClick={() => updateFeedbackStatus(item.id, 'acknowledged')}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700"
                >
                  Mark acknowledged
                </button>
              )}
              {item.status !== 'resolved' && (
                <button
                  onClick={() => updateFeedbackStatus(item.id, 'resolved')}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700"
                >
                  Mark resolved
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
