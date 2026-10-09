import type { Metadata } from 'next';
import Link from 'next/link';
import { requireBusiness } from '@/lib/business';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { EmailDiagnosticsPanel } from './email-diagnostics-panel';

export const metadata: Metadata = { title: 'Email Settings' };

export default async function EmailSettingsPage() {
  await requireBusiness();

  return (
    <div>
      <PageHeader
        title="Email Configuration"
        icon="mail"
        tone="slate"
        description="Manage your email provider settings and test email delivery."
        back={{ href: '/settings', label: 'Settings' }}
      />

      <div className="space-y-6">
        <SectionCard
          title="Email Provider"
          description="ReviewFlow uses Resend to send transactional emails to your customers."
        >
          <EmailDiagnosticsPanel />
        </SectionCard>

        <SectionCard
          title="Review email design"
          description="Preview the branded review request and reminder emails exactly as customers will see them, on desktop and mobile."
          action={
            <Link href="/settings/email/preview" className="btn btn-secondary btn-sm">
              Preview emails
            </Link>
          }
        >
          <p className="text-sm text-ink-3">
            Try different customer names, business names and review links, or simulate missing values to
            check the fallbacks.
          </p>
        </SectionCard>

        <SectionCard
          title="Getting Started"
          description="Follow these steps to set up production email sending."
        >
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-slate-900">Currently in Sandbox Mode</h4>
              <p className="mt-1 text-slate-600">
                Your Resend account is in sandbox mode, which means emails can only be sent to the verified owner email address. This is perfect for testing before you go live.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900">To Send Emails to Customers</h4>
              <ol className="mt-2 space-y-2 list-decimal list-inside text-slate-600">
                <li>
                  Go to{' '}
                  <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    resend.com/domains
                  </a>
                </li>
                <li>Click "Add Domain" and follow Resend's verification process</li>
                <li>Once verified, update the EMAIL_FROM environment variable to use your domain</li>
                <li>Restart ReviewFlow, and emails will begin sending in production mode</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900">Environment Variables</h4>
              <div className="mt-2 rounded bg-slate-100 p-3 font-mono text-xs">
                <code>EMAIL_FROM=noreply@yourdomain.com</code>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
