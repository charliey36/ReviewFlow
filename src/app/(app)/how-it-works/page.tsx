import { requireBusiness } from '@/lib/business';

const steps = [
  {
    title: 'Add a customer',
    description: 'Add a customer on the Customers page.',
  },
  {
    title: 'Request scheduled',
    description: 'A review request is scheduled automatically after your chosen delay.',
  },
  {
    title: 'Email sent',
    description: "The scheduled job sends the email once it\u2019s due.",
  },
  {
    title: 'Click tracked',
    description:
      'Clicking the button in the email is tracked here, then redirects to your Google review page.',
  },
];

export default async function HowItWorksPage() {
  const business = await requireBusiness();

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
        How it works
      </h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        A quick overview of what happens automatically after you add a customer.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-md dark:border-slate-700/70 dark:bg-surface-card">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {step.title === 'Request scheduled'
                    ? `Request scheduled (${business.delay_hours}h delay)`
                    : step.title}
                </p>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-md dark:border-slate-700/70 dark:bg-surface-card">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Why private feedback too?</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Every review request email and landing page shows both the public Google review link and
          a private feedback option, to every customer, unconditionally. ReviewFlow never decides
          who sees the public link based on how they might rate you — that kind of review gating is
          against Google&apos;s policies. The private option just gives unhappy customers a direct
          channel to you instead of a public review, which they can also choose any time regardless.
        </p>
      </div>
    </div>
  );
}
