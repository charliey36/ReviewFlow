'use client';

import { useFormState } from 'react-dom';
import { useActionToast } from '@/components/toast';
import type { Business } from '@/lib/database.types';
import { Icon } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { SectionCard } from '@/components/ui/section-card';
import { SubmitButton } from '@/components/ui/submit-button';
import { saveSettings, type SaveSettingsResult } from './actions';

export function SettingsForm({ business }: { business: Business }) {
  const [state, formAction] = useFormState<SaveSettingsResult, FormData>(
    saveSettings,
    {}
  );
  useActionToast(state, { title: 'Settings saved' });

  return (
    <form action={formAction} className="space-y-6">
      <SectionCard title="Business" description="The name customers see on review request emails and feedback pages.">
        <div className="max-w-lg">
          <label htmlFor="name" className="label">
            Business name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={business.name}
            className="input mt-1.5"
            placeholder="Acme Coffee Co."
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Review requests"
        description="Where customers land when they click the review button, and when the request goes out."
      >
        <div className="max-w-lg space-y-6">
          <div>
            <label htmlFor="google_review_url" className="label">
              Google review URL <span className="font-normal text-ink-4">(optional)</span>
            </label>
            <input
              id="google_review_url"
              name="google_review_url"
              type="url"
              defaultValue={business.google_review_url}
              className="input mt-1.5"
              placeholder="https://g.page/r/your-place/review"
            />
            <p className="field-hint">
              Customers who click the review button in their email land here. You can add this later &mdash;
              review request emails just won&apos;t include a review link until it&apos;s set.
            </p>
          </div>

          <div>
            <label htmlFor="delay_hours" className="label">
              Send delay
            </label>
            <div className="relative mt-1.5 w-44">
              <input
                id="delay_hours"
                name="delay_hours"
                type="number"
                min={0.1}
                step={0.1}
                required
                defaultValue={business.delay_hours}
                className="input pr-14 tabular-nums"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-4">
                hours
              </span>
            </div>
            <p className="field-hint">How long after a customer is added before the review request email is sent.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Service timing"
        description="Review and rebooking messages are based on each customer's last service date."
      >
        <div className="grid max-w-lg gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="review_request_window_days" className="label">Review request window (days)</label>
            <input id="review_request_window_days" name="review_request_window_days" type="number" min={1} required
              defaultValue={business.review_request_window_days ?? 14} className="input mt-1.5 tabular-nums" />
            <p className="field-hint">Only customers serviced within this many days get review requests.</p>
          </div>
          <div>
            <label htmlFor="rebooking_reminder_interval_days" className="label">Rebooking reminder after (days)</label>
            <input id="rebooking_reminder_interval_days" name="rebooking_reminder_interval_days" type="number" min={1} required
              defaultValue={business.rebooking_reminder_interval_days ?? 90} className="input mt-1.5 tabular-nums" />
            <p className="field-hint">Customers get a rebooking reminder this many days after their service.</p>
          </div>
        </div>
      </SectionCard>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pendingText="Saving…" icon={<Icon name="check" className="h-4 w-4" strokeWidth={2.2} />}>
          Save changes
        </SubmitButton>
        {state.error && <Notice variant="error">{state.error}</Notice>}
      </div>
    </form>
  );
}
