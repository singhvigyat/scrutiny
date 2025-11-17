// src/auth/SignIn.tsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const BACKEND_URL =
    (import.meta.env.VITE_BACKEND_URL as string) || ''; // fallback: relative /api

  const getApiBase = () => {
    if (BACKEND_URL) return BACKEND_URL.replace(/\/$/, '');
    return '/api';
  };

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    console.log("🔵 [DEBUG] Starting Sign-in...");
    console.log("🔵 [DEBUG] API Base =", getApiBase());
    console.log("🔵 [DEBUG] Email entered =", email);

    try {
      // 1) Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("🟣 [DEBUG] Supabase signIn result =", data);

      if (error) {
        console.error("🔴 [DEBUG] Supabase signIn error:", error);
        setMsg(error.message);
        setLoading(false);
        return;
      }

      // 2) Extract JWT
      const session = (data as any)?.session;
      const accessToken = session?.access_token ?? null;

      console.log("🟣 [DEBUG] Supabase session =", session);
      console.log(
        "🟣 [DEBUG] Access Token (truncated) =",
        accessToken
          ? `${accessToken.slice(0, 20)}...${accessToken.slice(-10)}`
          : "NULL"
      );

      if (!accessToken) {
        setMsg('No access token received from Supabase.');
        setLoading(false);
        return;
      }

      // 3) Call backend /api/auth/me
      const apiBase = getApiBase();
      const url = `${apiBase}/api/auth/me`;

      console.log("🟠 [DEBUG] Calling backend:", url);
      console.log("🟠 [DEBUG] Authorization header =", `Bearer ${accessToken.slice(0, 15)}...`);

      try {
        const resp = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        console.log("🟠 [DEBUG] Backend response status =", resp.status);

        const txt = await resp.text();
        console.log("🟠 [DEBUG] Backend raw response =", txt);

        if (!resp.ok) {
          setMsg(`Server rejected token: ${resp.status} ${txt}`);
        } else {
          setMsg('Signed in — server accepted token.');
        }
      } catch (err: any) {
        console.error("🔴 [DEBUG] Backend request failed:", err);
        setMsg('Failed to contact server: ' + (err?.message ?? String(err)));
      }

    } catch (err: any) {
      console.error("🔴 [DEBUG] Unexpected sign-in error:", err);
      setMsg(err?.message ?? String(err));
    } finally {
      console.log("🟢 [DEBUG] Sign-in finished.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSignIn} style={{ maxWidth: 420 }}>
      <h2>Sign in</h2>

      <div>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div>
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in'}
      </button>

      {msg && <p>{msg}</p>}
    </form>
  );
};

export default SignIn;
