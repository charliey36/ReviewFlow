import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';
import { LogoStacked } from '@/components/logo';

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="relative w-full max-w-sm">
        <div className="absolute inset-x-6 -top-4 h-24 rounded-full bg-brand-100/60 blur-2xl" aria-hidden="true" />
        <div className="relative rounded-2xl border border-slate-200/70 bg-white p-8 shadow-card-lg">
          <div className="mb-6 flex justify-center">
            <LogoStacked />
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Start sending automated review requests in minutes.
          </p>

          <div className="mt-6">
            <AuthForm mode="signup" />
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
