'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { importCustomers, type ImportCustomersResult } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Importing\u2026' : 'Import customers'}
    </button>
  );
}

const resultRowStyles: Record<string, string> = {
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

  return (
    <div>
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="file" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            CSV file
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm transition-shadow file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:file:bg-slate-700 dark:file:text-slate-300"
          />
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            First row must be a header row with <code>name</code> and <code>email</code> columns.
          </p>
        </div>

        <SubmitButton />
      </form>

      {state.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/50">
          {state.error}
        </p>
      )}

      {state.summary && (
        <div className="mt-6">
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 ring-1 ring-inset ring-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-900/50">
              {state.summary.created} added
            </span>
            {state.summary.duplicates > 0 && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 ring-1 ring-inset ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/50">
                {state.summary.duplicates} duplicate{state.summary.duplicates === 1 ? '' : 's'} skipped
              </span>
            )}
            {state.summary.errors > 0 && (
              <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/50">
                {state.summary.errors} error{state.summary.errors === 1 ? '' : 's'}
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {state.summary.totalRows} rows total
            </span>
          </div>

          {state.summary.results.some((r) => r.status !== 'created') && (
            <div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-slate-200/70 dark:border-slate-700/70">
              <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-700">
                <thead className="bg-slate-50/60 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Row</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Email</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {state.summary.results
                    .filter((r) => r.status !== 'created')
                    .map((r) => (
                      <tr key={r.row}>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{r.row}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{r.name || '\u2014'}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{r.email || '\u2014'}</td>
                        <td className={`px-3 py-2 font-medium ${resultRowStyles[r.status]}`}>
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
