// src/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface AuthContextType {
  user: any;
  role: string | null;
  roleLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  roleLoading: false,
});

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🟠 AuthStateChange:", event, session?.user);

      if (!session?.user) {
        setUser(null);
        setRole(null);
        localStorage.removeItem("role");
        return;
      }

      setUser(session.user);

      // if role is already stored, load instantly
      const savedRole = localStorage.getItem("role");
      if (savedRole) {
        console.log("🟢 Using persisted role:", savedRole);
        setRole(savedRole);
        return;
      }

      // otherwise fetch manually (backend or supabase)
      setRoleLoading(true);

      try {
        const token = session.access_token;
        const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });

        const json = await resp.json();
        const r = json?.user?.role ?? null;
        console.log("🟢 Loaded role from backend:", r);

        if (r) {
          localStorage.setItem("role", r);
        }
        setRole(r);
      } finally {
        setRoleLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, roleLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
