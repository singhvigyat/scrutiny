// src/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

interface AuthContextValue {
  session: Session | null;
  user: any | null;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;

    // fetch initial session
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        // getSession returns { data: { session } }
        const s = (data as any)?.session ?? null;
        if (mounted) {
          setSession(s);
          setUser(s?.user ?? null);
        }
      } catch (err) {
        // optional: log error
        console.warn('Failed to get initial session', err);
      }
    })();

    // subscribe to auth state changes
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // newSession is the new session object (or null)
      setSession(newSession ?? null);
      setUser((newSession as any)?.user ?? null);
    });

    // data may be undefined in some typings — be defensive
    const subscription = (data as any)?.subscription;

    return () => {
      mounted = false;
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      } catch (err) {
        console.warn('Failed to unsubscribe from auth state changes', err);
      }
    };
  }, []);

  const refresh = async () => {
    const { data } = await supabase.auth.getSession();
    const s = (data as any)?.session ?? null;
    setSession(s);
    setUser(s?.user ?? null);
  };

  return <AuthContext.Provider value={{ session, user, refresh }}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
};
