import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Create your Review<span className="text-brand-600">Flow</span> account
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
    </main>
  );
}
