import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const features = [
  {
    title: 'Automatic scheduling',
    description: 'Set a delay once, and every new customer gets a timely request.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
  {
    title: 'Simple tracking',
    description: 'See emails sent and review link clicks at a glance.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    ),
  },
  {
    title: 'Built for small teams',
    description: 'No clutter, no setup headaches, just a clean flow for review requests.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
      />
    ),
  },
];

export default async function HomePage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center">
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white shadow-sm">
          R
        </span>
      </div>
      <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Review<span className="text-brand-600">Flow</span>
      </h1>
      <p className="mt-3 max-w-md text-slate-600">
        Automatically ask happy customers for a review, on a schedule you set.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          Sign up
        </Link>
      </div>

      <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-slate-200/70 bg-white p-6 text-left shadow-card"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
              <svg
                className="h-5 w-5 text-brand-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
                aria-hidden="true"
              >
                {feature.icon}
              </svg>
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-900">{feature.title}</p>
            <p className="mt-1 text-sm text-slate-500">{feature.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
