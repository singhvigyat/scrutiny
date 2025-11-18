// src/auth/SignUp.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Role = 'student' | 'teacher';

interface SignUpProps {
  onAfterSignUp?: () => void;
}

export default function SignUp({ onAfterSignUp }: SignUpProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [mis, setMis] = useState('');
  const [employee_id, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const BACKEND_URL =
    (import.meta.env.VITE_BACKEND_URL as string) || '';

  const apiBase = BACKEND_URL ? BACKEND_URL.replace(/\/$/, '') : '/api';

  const clear = () => {
    setName('');
    setEmail('');
    setPassword('');
    setMis('');
    setEmployeeId('');
  };

  async function handleSignUp(e?: React.FormEvent) {
    e?.preventDefault();
    setMessage(null);

    // Basic frontend validation
    if (!name.trim()) {
      setMessage('Name is required.');
      return;
    }
    if (!email.trim()) {
      setMessage('Email is required.');
      return;
    }
    if (!password || password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }
    if (role === 'student' && !mis.trim()) {
      setMessage('MIS is required for students.');
      return;
    }
    if (role === 'teacher' && !employee_id.trim()) {
      setMessage('Employee ID is required for teachers.');
      return;
    }

    setLoading(true);

    try {
      // Build payload exactly as requested:
      // student -> { email, password, name, role, mis }
      // teacher -> { email, password, name, role, employee_id }
      const payload: Record<string, unknown> = {
        email: email,
        password: password,
        name: name,
        role: role,
      };

      if (role === 'student') payload.mis = mis;
      else payload.employee_id = employee_id;

      const resp = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        let errText = '';
        try {
          const j = await resp.json();
          errText = j?.error ?? JSON.stringify(j);
        } catch {
          errText = await resp.text();
        }
        setMessage(`Registration failed: ${resp.status} ${errText}`);
        setLoading(false);
        return;
      }

      const json = await resp.json();
      setMessage(json?.message ?? 'Account created. Check email for verification if enabled.');

      // clear sensitive fields
      clear();

      // notify parent (switch to sign in view, etc.)
      if (onAfterSignUp) {
        onAfterSignUp();
      } else {
        // if parent didn't provide a handler (e.g. dedicated /signup route),
        // navigate to the sign-in page.
        navigate('/signin');
      }
    } catch (err: any) {
      setMessage('Network or server error while registering: ' + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4" noValidate>
      <h2 className="text-2xl font-semibold text-slate-700">Create an account</h2>

      <div>
        <label className="block text-sm">
          <span className="text-gray-600 mb-1 block">Name</span>
          <input
            className="mt-1 block w-full rounded-md border-slate-200 p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Full name"
          />
        </label>
      </div>

      <div>
        <label className="block text-sm">
          <span className="text-gray-600 mb-1 block">Email</span>
          <input
            type="email"
            className="mt-1 block w-full rounded-md border-slate-200 p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
      </div>

      <div>
        <label className="block text-sm">
          <span className="text-gray-600 mb-1 block">Password</span>
          <input
            type="password"
            className="mt-1 block w-full rounded-md border-slate-200 p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Choose a strong password"
          />
        </label>
      </div>

      <div>
        <label className="block text-sm">
          <span className="text-gray-600 mb-1 block">Role</span>
          <div className="flex gap-4">
            <label className={`inline-flex items-center gap-2 ${role === 'student' ? 'text-sky-600' : 'text-slate-600'}`}>
              <input
                type="radio"
                name="role"
                value="student"
                checked={role === 'student'}
                onChange={() => setRole('student')}
              />
              <span className="text-sm">Student</span>
            </label>

            <label className={`inline-flex items-center gap-2 ${role === 'teacher' ? 'text-sky-600' : 'text-slate-600'}`}>
              <input
                type="radio"
                name="role"
                value="teacher"
                checked={role === 'teacher'}
                onChange={() => setRole('teacher')}
              />
              <span className="text-sm">Teacher</span>
            </label>
          </div>
        </label>
      </div>

      {role === 'student' ? (
        <div>
          <label className="block text-sm">
            <span className="text-gray-600 mb-1 block">MIS</span>
            <input
              value={mis}
              onChange={(e) => setMis(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-200 p-2"
              placeholder="e.g. 112233144"
              autoComplete="off"
            />
          </label>
        </div>
      ) : (
        <div>
          <label className="block text-sm">
            <span className="text-gray-600 mb-1 block">Employee ID</span>
            <input
              value={employee_id}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-200 p-2"
              placeholder="e.g. EMP-4567"
              autoComplete="off"
            />
          </label>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={loading}
          className="bg-white border border-slate-200 px-4 py-2 rounded-md shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Create account'}
        </button>

        <div className="text-sm text-slate-500">
          Already have an account?{' '}
          <button type="button" className="text-sky-600" onClick={() => { if (onAfterSignUp) onAfterSignUp(); else navigate('/signin'); }}>
            Sign in
          </button>
        </div>
      </div>

      {message && <div className="text-sm text-slate-600">{message}</div>}
    </form>
  );
}
