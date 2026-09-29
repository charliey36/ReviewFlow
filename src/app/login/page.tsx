import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Log in to Review<span className="text-brand-600">Flow</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back. Enter your details below.
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
    </main>
  );
}
