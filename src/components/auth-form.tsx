'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Icon } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { Spinner } from '@/components/ui/submit-button';

type Mode = 'login' | 'signup';

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;

        // If email confirmation is disabled in the Supabase project (typical
        // for a demo), the user is signed in immediately. Otherwise show a
        // message asking them to check their inbox.
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          router.push('/dashboard');
          router.refresh();
        } else {
          setMessage('Account created. Check your email to confirm, then log in.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input mt-1.5 py-2.5"
          placeholder="you@business.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <div className="relative mt-1.5">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input py-2.5 pr-11"
            placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-ink-4 transition-colors hover:bg-surface-muted hover:text-ink-2"
          >
            <Icon name={showPassword ? 'eyeOff' : 'eye'} className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && <Notice variant="error">{error}</Notice>}
      {message && <Notice variant="success">{message}</Notice>}

      <button type="submit" disabled={loading} aria-busy={loading} className="btn btn-primary btn-lg w-full">
        {loading ? (
          <>
            <Spinner />
            Please wait…
          </>
        ) : mode === 'signup' ? (
          'Create account'
        ) : (
          'Log in'
        )}
      </button>
    </form>
  );
}
