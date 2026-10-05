import Link from 'next/link';
import { requireBusiness } from '@/lib/business';
import { ImportCustomersForm } from './import-customers-form';

export default async function ImportCustomersPage() {
  await requireBusiness();

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Import customers
        </h1>
        <Link href="/customers" className="text-sm font-medium text-brand-700 transition-all duration-200 hover:underline dark:text-brand-400">
          &larr; Back to customers
        </Link>
      </div>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        Upload a CSV of your existing customers to add them all at once. A review request will
        be scheduled for each new customer, same as adding them one at a time.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-md dark:border-slate-700/70 dark:bg-surface-card sm:p-8">
        <ImportCustomersForm />
      </div>
    </div>
  );
}
