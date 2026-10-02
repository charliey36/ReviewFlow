'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { LoyaltyProgram } from '@/lib/database.types';
import { saveLoyaltyProgram, type LoyaltyFormResult } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Saving\u2026' : 'Save loyalty program'}
    </button>
  );
}

const inputClasses =
  'mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm transition-shadow focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

export function LoyaltyProgramForm({ program }: { program: LoyaltyProgram | null }) {
  const [state, formAction] = useFormState<LoyaltyFormResult, FormData>(saveLoyaltyProgram, {});

  return (
    <form action={formAction} className="max-w-lg space-y-6">
      <label className="flex items-center gap-2">
        <input type="checkbox" name="is_active" defaultChecked={program?.is_active ?? false} className="h-4 w-4 rounded border-slate-300" />
        <span className="text-sm font-medium text-slate-700">Loyalty program is active</span>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="points_per_visit" className="block text-sm font-medium text-slate-700">
            Points per visit
          </label>
          <input
            id="points_per_visit"
            name="points_per_visit"
            type="number"
            min={0}
            defaultValue={program?.points_per_visit ?? 10}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="points_per_referral" className="block text-sm font-medium text-slate-700">
            Points per referral
          </label>
          <input
            id="points_per_referral"
            name="points_per_referral"
            type="number"
            min={0}
            defaultValue={program?.points_per_referral ?? 50}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="points_per_review" className="block text-sm font-medium text-slate-700">
            Points per review
          </label>
          <input
            id="points_per_review"
            name="points_per_review"
            type="number"
            min={0}
            defaultValue={program?.points_per_review ?? 20}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      <div>
        <label htmlFor="redemption_points" className="block text-sm font-medium text-slate-700">
          Points needed to redeem
        </label>
        <input
          id="redemption_points"
          name="redemption_points"
          type="number"
          min={1}
          defaultValue={program?.redemption_points ?? 100}
          className={`${inputClasses} w-40`}
        />
      </div>

      <div>
        <label htmlFor="redemption_reward_description" className="block text-sm font-medium text-slate-700">
          Reward description
        </label>
        <input
          id="redemption_reward_description"
          name="redemption_reward_description"
          type="text"
          required
          defaultValue={program?.redemption_reward_description ?? '$10 off your next visit'}
          className={inputClasses}
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-100">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 ring-1 ring-inset ring-brand-100">
          Saved.
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
