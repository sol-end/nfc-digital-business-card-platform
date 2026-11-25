
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          name,
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          Array.isArray(result.message)
            ? result.message.join(', ')
            : result.message ?? 'Authentication failed',
        );
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-20 flex items-center justify-between">
          <span className="text-2xl font-bold tracking-tight">
            NFC<span className="text-cyan-400">Connect</span>
          </span>
          <Link href="/dashboard" className="text-sm text-slate-300">
            Dashboard
          </Link>
        </header>

        <div className="grid gap-16 md:grid-cols-2 md:items-center">
          <section>
            <p className="mb-4 font-semibold text-cyan-400">
              The modern way to connect
            </p>
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Your business card.
              <span className="block text-cyan-400">
                Reimagined.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              Share your professional identity instantly.
              Turn connections into opportunities with a
              digital business card, QR code, and lead capture.
            </p>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <h2 className="text-2xl font-bold">
              {mode === 'register'
                ? 'Create your account'
                : 'Welcome back'}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {mode === 'register'
                ? 'Start building your digital identity.'
                : 'Sign in to manage your cards.'}
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              {mode === 'register' && (
                <label className="block text-sm">
                  Full name
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
                  />
                </label>
              )}

              <label className="block text-sm">
                Email address
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
                />
              </label>

              <label className="block text-sm">
                Password
                <input
                  type="password"
                  minLength={mode === 'register' ? 12 : undefined}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
                />
              </label>

              {error && (
                <p role="alert" className="text-sm text-red-400">
                  {error}
                </p>
              )}

              <button
                disabled={loading}
                className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'register'
                    ? 'Create account'
                    : 'Sign in'}
              </button>
            </form>

            <button
              onClick={() => {
                setMode(mode === 'register' ? 'login' : 'register');
                setError('');
              }}
              className="mt-6 text-sm text-cyan-400"
            >
              {mode === 'register'
                ? 'Already have an account? Sign in'
                : 'New here? Create an account'}
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}