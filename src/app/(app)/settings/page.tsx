import { requireBusiness } from '@/lib/business';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const business = await requireBusiness();

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Settings</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Configure your business details and when review requests are sent.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card sm:p-8">
        <SettingsForm business={business} />
      </div>
    </div>
  );
}
