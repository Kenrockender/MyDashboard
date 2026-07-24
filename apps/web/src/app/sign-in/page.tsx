'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authErrorMessage } from '@/lib/auth-errors';
import { useAuthContext } from '@/lib/auth-context';

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user, loading } = useAuthContext();
  const router = useRouter();

  // Someone already signed in has no reason to sit on this page.
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  async function handleGoogleSignIn() {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.push('/dashboard');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-1">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-ink p-12 text-paper lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <span className="relative font-display text-2xl italic">Ledger</span>
        <h1 className="relative max-w-md font-display text-5xl italic leading-tight">
          Every dollar, accounted for.
        </h1>
        <p className="relative max-w-sm text-sm text-paper/60">
          Income, expenses, and profitability across every project — in one
          quiet place.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-paper p-6">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col gap-1 lg:hidden">
            <span className="font-display text-xl italic text-ink">Ledger</span>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-2xl text-ink">Welcome back</h2>
            <p className="text-sm text-ink-muted">Sign in to continue to your dashboard.</p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="flex items-center justify-center gap-3 rounded-md border border-border bg-paper-raised px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-border/30 disabled:opacity-60"
          >
            <svg viewBox="0 0 18 18" className="h-4 w-4 shrink-0" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.33A9 9 0 0 0 9 18Z"
              />
              <path
                fill="#FBBC05"
                d="M3.95 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l2.99-2.33Z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l2.99 2.33C4.66 5.16 6.65 3.58 9 3.58Z"
              />
            </svg>
            {submitting ? 'Signing in…' : 'Continue with Google'}
          </button>

          {error && <p className="text-sm text-negative">{error}</p>}
        </div>
      </div>
    </div>
  );
}
