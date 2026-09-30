import React, { useState } from 'react';
import { LockKeyhole, LogIn, ShieldCheck, UserRound } from 'lucide-react';
import { signIn, signUp } from '../services/auth';

export default function LoginScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'signup' && fullName.trim().length < 2) {
      setError('Enter your name.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        const result = await signUp(email, password, fullName);
        if (!result.session) {
          setMessage('Account created. Check your email to confirm your account, then sign in.');
          setMode('signin');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8] px-5 py-10 text-[#17211B]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-[2rem] border border-[#DCE5DF] bg-white p-7 shadow-[0_24px_70px_-42px_rgba(23,58,44,0.35)] md:p-9">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#087F5B] text-white">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">MEDIGUARD</p>
              <p className="text-xs text-[#718078]">Medication safety, with your context in mind.</p>
            </div>
          </div>

          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#087F5B]">
              Private account
            </p>
            <h1 className="font-serif text-3xl tracking-tight text-[#173A2C]">
              {mode === 'signin' ? 'Welcome back.' : 'Create your account.'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#66736B]">
              Your safety history and health context stay tied to your account.
            </p>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            {mode === 'signup' && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#526057]">Full name</span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#87958C]" size={17} />
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-[#D5E0D9] bg-[#FBFCFB] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/10"
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#526057]">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#D5E0D9] bg-[#FBFCFB] px-3 py-3 text-sm outline-none transition focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/10"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#526057]">Password</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#87958C]" size={17} />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#D5E0D9] bg-[#FBFCFB] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/10"
                  type="password"
                  placeholder="••••••••"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                />
              </div>
            </label>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#087F5B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#066F50] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={17} />
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 border-t border-[#E7ECE8] pt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
                setMessage('');
              }}
              className="text-sm font-medium text-[#087F5B] hover:underline"
            >
              {mode === 'signin' ? 'Create an account' : 'Already have an account? Sign in'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
