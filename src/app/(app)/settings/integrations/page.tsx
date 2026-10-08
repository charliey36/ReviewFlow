import type { Metadata } from 'next';
import Link from 'next/link';
import { requireBusiness } from '@/lib/business';
import { generateApiKey, getApiKeyInfo } from '@/lib/api-keys';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { CopyButton } from '@/components/ui/copy-button';
import { SettingsTabs } from '@/components/settings-tabs';
import { ApiKeyPanel } from './api-key-panel';
import { ActionButton } from './sync-demo-button';

export const metadata: Metadata = { title: 'Integrations' };

const ICON = { imported: '✅', updated: '✅', duplicate: '➖', failed: '❌' } as const;

export default async function IntegrationsPage() {
  const business = await requireBusiness();

  // Every organisation gets a key automatically on first visit (shown once).
  const info = await getApiKeyInfo(business.id);
  const newKey = info ? null : await generateApiKey(business.id);

  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const endpoint = `${base}/api/integrations/service-completed`;

  const { data: events } = await createAdminClient()
    .from('integration_events')
    .select('id, status, message, source, created_at')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(20);

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
        <SectionCard title="Endpoint" description="Customers are created or updated by email, and a service visit is recorded.">
          <label className="label">ReviewFlow endpoint (POST)</label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <code className="input flex-1 select-all overflow-x-auto font-mono text-sm">{endpoint}</code>
            <CopyButton value={endpoint} label="Copy endpoint" />
          </div>
        </SectionCard>

        <SectionCard title="API key" description="Send it in the x-api-key header. Treat it like a password.">
          <ApiKeyPanel initialKey={newKey} prefix={info?.key_prefix ?? null} />
        </SectionCard>

        <SectionCard
          title="Zapier setup"
          description={<>Google Sheets → Zapier → ReviewFlow. <Link href="/integrations/docs" className="underline">Full guide</Link></>}
        >
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink-2">
            <li>Create a Google Sheet with columns: <code>Name, Email, Phone, AmountSpent, ServiceDate</code>.</li>
            <li>In Zapier, create a Zap: trigger <b>Google Sheets → New Spreadsheet Row</b>.</li>
            <li>Add action <b>Webhooks by Zapier → POST</b>. URL: the endpoint above. Payload Type: <b>Json</b>.</li>
            <li>Map the data: customerName ← Name, email ← Email, phone ← Phone, amountSpent ← AmountSpent, serviceDate ← ServiceDate.</li>
            <li>Under Headers add <code>x-api-key</code> with your API key. Test the Zap, then add a row to your sheet.</li>
          </ol>
        </SectionCard>

        <SectionCard title="Test import" description="Sends a sample customer through the same pipeline as the endpoint, no Zapier needed.">
          <ActionButton label="Test Import" />
        </SectionCard>

        <SectionCard
          title="Recent events"
          description="The last 20 requests received."
          action={<Link href="/settings/integrations" className="btn btn-ghost btn-sm">Refresh</Link>}
        >
          {events && events.length > 0 ? (
            <ul className="divide-y divide-line text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2.5">
                  <span aria-label={e.status}>{ICON[e.status]}</span>
                  <span className="min-w-0 flex-1 break-words text-ink">
                    {e.message}
                    {e.source === 'test' && <span className="ml-2 text-xs text-ink-4">(test)</span>}
                  </span>
                  <time className="text-xs text-ink-4" dateTime={e.created_at}>
                    {new Date(e.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-3">No events yet. Click Test Import, or add a row to your Google Sheet.</p>
          )}
        </SectionCard>

      </div>
    </div>
  );
}
