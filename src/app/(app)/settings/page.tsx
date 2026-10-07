import type { Metadata } from 'next';
import { requireBusiness } from '@/lib/business';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { SettingsTabs } from '@/components/settings-tabs';
import { SettingsForm } from './settings-form';
import { BusinessLogoUploader } from './business-logo-uploader';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const business = await requireBusiness();

  return (
    <div>
      <PageHeader
        title="Settings"
        icon="cog"
        tone="slate"
        description="Configure your business details and when review requests are sent."
        tabs={<SettingsTabs />}
      />

      <div className="space-y-6">
        <SectionCard
          title="Profile picture"
          description="Shown in the app and on the feedback and booking pages your customers see."
        >
          <BusinessLogoUploader businessName={business.name} logoUrl={business.brand_logo_url} />
        </SectionCard>

        <SettingsForm business={business} />
      </div>
    </div>
  );
}
