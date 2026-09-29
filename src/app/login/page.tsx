import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="relative w-full max-w-sm">
        <div className="absolute inset-x-6 -top-4 h-24 rounded-full bg-brand-100/60 blur-2xl" aria-hidden="true" />
        <div className="relative rounded-2xl border border-slate-200/70 bg-white p-8 shadow-card-lg">
          <div className="mb-6 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-base font-bold text-white shadow-sm">
              R
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Review<span className="text-brand-600">Flow</span>
            </span>
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">
            Log in to keep review requests flowing.
          </p>

          <div className="mt-6">
            <AuthForm mode="login" />
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
