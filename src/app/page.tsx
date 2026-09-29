import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">
        Review<span className="text-brand-600">Flow</span>
      </h1>
      <p className="mt-3 max-w-md text-slate-600">
        Automatically ask happy customers for a review, on a schedule you set.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
