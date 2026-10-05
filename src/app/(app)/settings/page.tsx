import { requireBusiness } from '@/lib/business';
import { SettingsForm } from './settings-form';
import { BusinessLogoUploader } from './business-logo-uploader';

export default async function SettingsPage() {
  const business = await requireBusiness();

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Settings</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Configure your business details and when review requests are sent.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card sm:p-8">
        <BusinessLogoUploader businessName={business.name} logoUrl={business.brand_logo_url} />

        <div className="my-6 h-px bg-slate-100" />

        <SettingsForm business={business} />
      </div>
    </div>
  );
}
