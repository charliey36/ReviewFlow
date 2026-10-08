import type { Metadata } from 'next';
import { requireBusiness } from '@/lib/business';
import { OnboardingForm } from './onboarding-form';

export const metadata: Metadata = { title: 'Get started' };

export default async function OnboardingPage() {
  const business = await requireBusiness();
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Send your first review request</h1>
      <p className="mt-2 text-sm text-ink-3">Two minutes, one form. No setup needed beyond this.</p>
      <OnboardingForm defaultName={business.name === 'My Business' ? '' : business.name} defaultUrl={business.google_review_url} />
    </div>
  );
}
