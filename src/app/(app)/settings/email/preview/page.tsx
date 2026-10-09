import type { Metadata } from 'next';
import { requireBusiness } from '@/lib/business';
import { PageHeader } from '@/components/ui/page-header';
import { EmailPreview } from './email-preview';

export const metadata: Metadata = { title: 'Email Preview' };

export default async function EmailPreviewPage() {
  const business = await requireBusiness();

  return (
    <div>
      <PageHeader
        title="Review email preview"
        icon="eye"
        tone="sky"
        description="See exactly how review request emails look before they are sent — rendered by the same template the send jobs use."
        back={{ href: '/settings/email', label: 'Email settings' }}
      />
      <EmailPreview defaultBusinessName={business.name} />
    </div>
  );
}
