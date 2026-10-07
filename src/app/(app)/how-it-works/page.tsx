import type { Metadata } from 'next';
import { requireBusiness } from '@/lib/business';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { Icon, type IconName } from '@/components/ui/icons';

export const metadata: Metadata = { title: 'How it works' };

const steps: { title: string; description: string; icon: IconName }[] = [
  {
    title: 'Add a customer',
    description: 'Add a customer on the Customers page, one at a time or in bulk from a CSV.',
    icon: 'users',
  },
  {
    title: 'Request scheduled',
    description: 'A review request is scheduled automatically after your chosen delay.',
    icon: 'clock',
  },
  {
    title: 'Email sent',
    description: 'The scheduled job sends the email once it\u2019s due. Failed sends are retried automatically.',
    icon: 'mail',
  },
  {
    title: 'Click tracked',
    description:
      'Clicking the button in the email is tracked here, then redirects to your Google review page.',
    icon: 'cursor',
  },
];

const alsoRunning: { title: string; description: string; icon: IconName }[] = [
  {
    title: 'Follow-up reminders',
    description: 'A gentle reminder on day 3 and a final one on day 7 \u2014 stopped the moment a customer clicks or sends feedback.',
    icon: 'refresh',
  },
  {
    title: 'Rebooking reminders',
    description: 'Customers who are due for another visit, based on each service\u2019s rebooking interval, are nudged to book.',
    icon: 'calendar',
  },
  {
    title: 'Win-back and birthdays',
    description: 'Lapsed customers get a win-back message, and birthday matches get a birthday note.',
    icon: 'heart',
  },
];

export default async function HowItWorksPage() {
  const business = await requireBusiness();

  return (
    <div>
      <PageHeader
        title="How it works"
        icon="lightbulb"
        tone="amber"
        description="A quick overview of what happens automatically after you add a customer."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <SectionCard className="lg:col-span-3" title="From new customer to review">
          <ol>
            {steps.map((step, index) => (
              <li key={step.title} className="relative flex gap-4 pb-7 last:pb-0">
                {index < steps.length - 1 && (
                  <span aria-hidden="true" className="absolute left-4 top-9 h-[calc(100%-2.25rem)] w-px bg-line-strong" />
                )}
                <span className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/25">
                  <Icon name={step.icon} className="h-4 w-4" />
                </span>
                <div className="min-w-0 pt-1">
                  <p className="text-sm font-semibold text-ink">
                    {step.title === 'Request scheduled'
                      ? `Request scheduled (${business.delay_hours}h delay)`
                      : step.title}
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-ink-3">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard className="lg:col-span-2" title="Also running in the background">
          <ul className="space-y-5">
            {alsoRunning.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-surface-muted text-ink-3">
                  <Icon name={item.icon} className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-0.5 text-[13px] leading-5 text-ink-3">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <section className="mt-6 flex flex-col gap-4 rounded-xl border border-brand-600/20 bg-brand-50/60 p-5 sm:flex-row sm:p-6 dark:border-brand-400/20 dark:bg-brand-500/5">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface text-brand-700 shadow-xs ring-1 ring-inset ring-brand-600/15 dark:text-brand-300">
          <Icon name="shield" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-ink">Compliant by design: why private feedback too?</h2>
          <p className="mt-1.5 max-w-3xl text-[13px] leading-6 text-ink-2">
            Every review request email and landing page shows both the public Google review link and a
            private feedback option, to every customer, unconditionally. ReviewFlow never decides who
            sees the public link based on how they might rate you &mdash; that kind of review gating is
            against Google&apos;s policies. The private option just gives unhappy customers a direct
            channel to you instead of a public review, which they can also choose any time regardless.
          </p>
        </div>
      </section>
    </div>
  );
}
