import type { Metadata } from 'next';
import { requireBusiness } from '@/lib/business';
import { generateApiKey, getApiKeyInfo } from '@/lib/api-keys';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { CopyButton } from '@/components/ui/copy-button';
import { SettingsTabs } from '@/components/settings-tabs';
import { ApiKeyPanel } from './api-key-panel';
import { SyncDemoButton } from './sync-demo-button';

export const metadata: Metadata = { title: 'Integrations' };

export default async function IntegrationsPage() {
  const business = await requireBusiness();

  // Every organisation gets a key automatically on first visit (shown once).
  const info = await getApiKeyInfo(business.id);
  const newKey = info ? null : await generateApiKey(business.id);

  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const endpoint = `${base}/api/integrations/service-completed`;

  return (
    <div>
      <PageHeader
        title="Integrations"
        icon="cog"
        tone="slate"
        description="Let Zapier, Make or your CRM tell ReviewFlow when a service is completed."
        tabs={<SettingsTabs />}
      />
      <div className="space-y-6">
        <SectionCard title="API key" description="Send it in the x-api-key header. Treat it like a password.">
          <ApiKeyPanel initialKey={newKey} prefix={info?.key_prefix ?? null} />
        </SectionCard>

        <SectionCard title="Endpoint" description="Customers are created or updated by email, and a service visit is recorded.">
          <div className="flex flex-wrap items-center gap-2">
            <code className="input flex-1 overflow-x-auto font-mono text-sm">POST {endpoint}</code>
            <CopyButton value={endpoint} />
          </div>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-surface-muted p-4 text-xs text-ink-2">{`{
  "customerName": "John Smith",
  "email": "john@email.com",
  "phone": "07123456789",
  "amountSpent": 350.00,
  "serviceDate": "2026-10-08"
}`}</pre>
        </SectionCard>

        <SectionCard
          title="Demo company database"
          description="Simulated company records (table demo_company_records in Supabase). Add a row there, then sync to import it as a customer and service visit."
        >
          <SyncDemoButton />
        </SectionCard>
      </div>
    </div>
  );
}
