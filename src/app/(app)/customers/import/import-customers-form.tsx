'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { importCustomers, type ImportCustomersResult } from './actions';

const resultTones: Record<string, string> = {
  created: 'text-brand-700 dark:text-brand-300',
  skipped_duplicate: 'text-amber-700 dark:text-amber-300',
  error: 'text-red-700 dark:text-red-300',
};

const resultLabels: Record<string, string> = {
  created: 'Added',
  skipped_duplicate: 'Skipped (duplicate email)',
  error: 'Error',
};

export function ImportCustomersForm() {
  const [state, formAction] = useFormState<ImportCustomersResult, FormData>(
    importCustomers,
    {}
  );
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div>
      <form action={formAction} className="space-y-5">
        {/* The real file input is stretched invisibly over the drop zone, so
            clicking, keyboard focus and native drag-and-drop all just work. */}
        <div className="relative">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface-subtle px-6 py-10 text-center transition-colors duration-150 [&:has(input:hover)]:border-brand-500 [&:has(input:hover)]:bg-brand-50/50 [&:has(input:focus-visible)]:border-brand-500 [&:has(input:focus-visible)]:ring-[3px] [&:has(input:focus-visible)]:ring-brand-500/20 dark:[&:has(input:hover)]:bg-brand-500/5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-ink-3 shadow-xs ring-1 ring-inset ring-line">
              <Icon name="upload" className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <label htmlFor="file" className="mt-4 text-sm font-semibold text-ink">
              {fileName ?? 'Choose a CSV file'}
            </label>
            <p className="mt-1 text-[13px] text-ink-3">
              {fileName ? 'Click to choose a different file' : 'or drag and drop it here \u2014 up to 2 MB and 2,000 rows'}
            </p>
            <input
              id="file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
        </div>

        <p className="field-hint !mt-3">
          The first row must be a header row with <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[12px] text-ink-2">name</code> and{' '}
          <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[12px] text-ink-2">email</code> columns.
          Existing customers are matched by email and skipped.
        </p>

        <SubmitButton pendingText="Importing…" icon={<Icon name="upload" className="h-4 w-4" />}>
          Import customers
        </SubmitButton>
      </form>

      {state.error && <Notice variant="error" className="mt-5">{state.error}</Notice>}

      {state.summary && (
        <div className="mt-8 animate-fade-in border-t border-line pt-6">
          <h3 className="text-sm font-semibold text-ink">Import results</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="success" dot>
              {state.summary.created} added
            </Badge>
            {state.summary.duplicates > 0 && (
              <Badge tone="warning" dot>
                {state.summary.duplicates} duplicate{state.summary.duplicates === 1 ? '' : 's'} skipped
              </Badge>
            )}
            {state.summary.errors > 0 && (
              <Badge tone="danger" dot>
                {state.summary.errors} error{state.summary.errors === 1 ? '' : 's'}
              </Badge>
            )}
            <Badge>{state.summary.totalRows} rows total</Badge>
          </div>

          {state.summary.results.some((r) => r.status !== 'created') && (
            <div className="scroll-thin mt-5 max-h-80 overflow-auto rounded-xl border border-line">
              <table className="data-table">
                <thead className="sticky top-0">
                  <tr>
                    <th>Row</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {state.summary.results
                    .filter((r) => r.status !== 'created')
                    .map((r) => (
                      <tr key={r.row}>
                        <td className="tabular-nums text-ink-3">{r.row}</td>
                        <td>{r.name || '\u2014'}</td>
                        <td>{r.email || '\u2014'}</td>
                        <td className={`font-medium ${resultTones[r.status]}`}>
                          {resultLabels[r.status]}
                          {r.status === 'error' && 'reason' in r ? `: ${r.reason}` : ''}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
