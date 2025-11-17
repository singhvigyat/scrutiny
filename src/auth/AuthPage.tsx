// src/auth/AuthPage.tsx
// Improved Sign In / Sign Up UI using TailwindCSS + supabase-js v2
// - Drop this file into src/auth/
// - Requires: src/lib/supabaseClient.ts (exporting `supabase`)
// - Add Tailwind to your project (postcss/tailwind config) or adapt classes
// - Use <AuthPage /> in your App.tsx inside AuthProvider

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

type View = 'sign-in' | 'sign-up';
type Role = 'student' | 'teacher';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-600 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

export default function AuthPage() {
  const [view, setView] = useState<View>('sign-in');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        <div className="p-8 md:p-10 bg-gradient-to-b from-sky-600 to-indigo-600 text-white flex flex-col justify-center">
          <h1 className="text-3xl font-semibold">Welcome to Scrutiny</h1>
          <p className="mt-4 text-sky-100">Secure sign-in for teachers and students. Select your role at sign up.</p>

          <div className="mt-8 space-x-2">
            <button
              onClick={() => setView('sign-in')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'sign-in' ? 'bg-white/90 text-sky-700' : 'bg-white/10 text-white/90'}`}>
              Sign in
            </button>
            <button
              onClick={() => setView('sign-up')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'sign-up' ? 'bg-white/90 text-sky-700' : 'bg-white/10 text-white/90'}`}>
              Create account
            </button>
          </div>

          <div className="mt-6 text-sm text-white/80">
            <p><strong>Tip:</strong> Students enter MIS, teachers enter Employee ID during sign-up.</p>
          </div>

          <div className="mt-auto text-xs text-white/60">
            <p>Built with ♥ · Electron + Vite + React</p>
          </div>
        </div>

        <div className="p-8 md:p-10">
          {view === 'sign-in' ? <SignInForm /> : <SignUpForm onAfterSignUp={() => setView('sign-in')} />}
        </div>
      </div>
    </div>
  );
}

// ---------- SignInForm ----------
function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignIn(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const accessToken = (data as any)?.session?.access_token ?? null;
      if (!accessToken) {
        setMessage('Signed in but no access token was returned.');
        setLoading(false);
        return;
      }

      const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || '';

      // send token to backend for session bootstrapping
      try {
        const resp = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/auth/me`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ source: 'electron-client' }),
        });
        if (!resp.ok) {
          const txt = await resp.text();
          setMessage(`Server rejected token: ${resp.status} ${txt}`);
        } else {
          const json = await resp.json();
          setMessage('Signed in — server accepted token.');
          console.log('Server reply:', json);
        }
      } catch (err: any) {
        setMessage('Failed to contact server: ' + (err?.message ?? String(err)));
      }

    } catch (err: any) {
      setMessage(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-700">Sign in</h2>

      <div>
        <Field label="Email">
          <input
            className="mt-1 block w-full rounded-md border-slate-200 shadow-sm focus:ring-2 focus:ring-sky-400 focus:outline-none p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="you@example.com"
          />
        </Field>
      </div>

      <div>
        <Field label="Password">
          <input
            className="mt-1 block w-full rounded-md border-slate-200 shadow-sm focus:ring-2 focus:ring-sky-400 focus:outline-none p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            placeholder="••••••••"
          />
        </Field>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">Forgot password? (not implemented)</div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-sky-700 disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      {message && <div className="text-sm text-red-600">{message}</div>}
    </form>
  );
}

// ---------- SignUpForm ----------
function SignUpForm({ onAfterSignUp }: { onAfterSignUp?: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [misId, setMisId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const clear = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setMisId('');
    setEmployeeId('');
  };

  async function handleSignUp(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setMessage(null);

    // basic validation
    if (!fullName.trim()) {
      setMessage('Full name is required.');
      setLoading(false);
      return;
    }

    if (role === 'student' && !misId.trim()) {
      setMessage('MIS is required for students.');
      setLoading(false);
      return;
    }

    if (role === 'teacher' && !employeeId.trim()) {
      setMessage('Employee ID is required for teachers.');
      setLoading(false);
      return;
    }

    try {
      const metadata: Record<string, any> = { role, full_name: fullName };
      if (role === 'student') metadata.mis_id = misId;
      if (role === 'teacher') metadata.employee_id = employeeId;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });

      if (error) throw error;

      setMessage('Check your email for confirmation (if enabled). Account created.');
      clear();
      onAfterSignUp?.();

    } catch (err: any) {
      setMessage(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-700">Create an account</h2>

      <div>
        <Field label="Full name">
          <input className="mt-1 block w-full rounded-md border-slate-200 p-2" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </Field>
      </div>

      <div>
        <Field label="Email">
          <input type="email" className="mt-1 block w-full rounded-md border-slate-200 p-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
      </div>

      <div>
        <Field label="Password">
          <input type="password" className="mt-1 block w-full rounded-md border-slate-200 p-2" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </Field>
      </div>

      <div>
        <Field label="Role">
          <div className="flex gap-4">
            <label className={`inline-flex items-center gap-2 ${role === 'student' ? 'text-sky-600' : 'text-slate-600'}`}>
              <input type="radio" name="role" checked={role === 'student'} onChange={() => setRole('student')} />
              <span className="text-sm">Student</span>
            </label>
            <label className={`inline-flex items-center gap-2 ${role === 'teacher' ? 'text-sky-600' : 'text-slate-600'}`}>
              <input type="radio" name="role" checked={role === 'teacher'} onChange={() => setRole('teacher')} />
              <span className="text-sm">Teacher</span>
            </label>
          </div>
        </Field>
      </div>

      {role === 'student' ? (
        <div>
          <Field label="MIS ID">
            <input value={misId} onChange={(e) => setMisId(e.target.value)} className="mt-1 block w-full rounded-md border-slate-200 p-2" placeholder="e.g. 2021ABC123" />
          </Field>
        </div>
      ) : (
        <div>
          <Field label="Employee ID">
            <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="mt-1 block w-full rounded-md border-slate-200 p-2" placeholder="e.g. EMP-4567" />
          </Field>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button type="submit" disabled={loading} className="bg-white border border-slate-200 px-4 py-2 rounded-md shadow-sm hover:bg-slate-50">
          {loading ? 'Creating...' : 'Create account'}
        </button>
        <div className="text-sm text-slate-500">Already have an account? <button type="button" className="text-sky-600" onClick={() => onAfterSignUp && onAfterSignUp()}>Sign in</button></div>
      </div>

      {message && <div className="text-sm text-slate-600">{message}</div>}
    </form>
  );
}
