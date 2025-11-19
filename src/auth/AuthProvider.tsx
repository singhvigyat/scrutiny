// src/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type AuthContextType = {
  user: any | null;
  role: string | null;
  roleLoading: boolean;
  setRole: (r: string | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  roleLoading: false,
  setRole: () => {},
});

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRoleState] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // setter exposed to let SignIn set the authoritative role immediately
  const setRole = (r: string | null) => {
    setRoleState(r);
    if (typeof window !== "undefined") {
      if (r) localStorage.setItem("role", r);
      else localStorage.removeItem("role");
    }
  };

  useEffect(() => {
    let mounted = true;

    // On mount, try to restore session/user and persisted role quickly
    (async () => {
      try {
        const sessRes = await supabase.auth.getSession();
        const session = sessRes?.data?.session ?? null;
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          
          // Quickly read persisted role if available (fast path)
          const savedRole = typeof window !== "undefined" ? localStorage.getItem("role") : null;
          if (savedRole) {
            setRoleState(savedRole);
          } else {
            // If session exists but no role, fetch it
             console.log("[AuthProvider] init: session exists but no role, fetching...");
             setRoleLoading(true);
             try {
                const accessToken = session.access_token;
                const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";
                const apiBase = BACKEND_URL ? BACKEND_URL.replace(/\/$/, "") : "/api";
                
                const resp = await fetch(`${apiBase}/api/auth/me`, {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "ngrok-skip-browser-warning": "true",
                  },
                });

                if (resp.ok) {
                  const json = await resp.json();
                  const fetchedRole = json?.user?.role;
                  if (fetchedRole && mounted) {
                    setRole(fetchedRole);
                  }
                }
             } catch (e) {
               console.warn("[AuthProvider] init fetch failed", e);
             } finally {
               if (mounted) setRoleLoading(false);
             }
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn("[AuthProvider] getSession failed", err);
      }
    })();

    // Subscribe to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("[AuthProvider] onAuthStateChange:", _event, session?.user ?? null);

      if (!session?.user) {
        // signed out
        setUser(null);
        setRole(null);
        return;
      }

      setUser(session.user);

      // If a role is already persisted, use that
      const savedRole = typeof window !== "undefined" ? localStorage.getItem("role") : null;
      if (savedRole) {
        console.log("[AuthProvider] using persisted role:", savedRole);
        setRoleState(savedRole);
        setRoleLoading(false);
        return;
      }

      // If no role is persisted, fetch it from backend
      console.log("[AuthProvider] no persisted role, fetching from backend...");
      setRoleLoading(true);
      try {
        const accessToken = session.access_token;
        const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";
        const apiBase = BACKEND_URL ? BACKEND_URL.replace(/\/$/, "") : "/api";
        
        const resp = await fetch(`${apiBase}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        });

        if (resp.ok) {
          const json = await resp.json();
          const fetchedRole = json?.user?.role;
          console.log("[AuthProvider] fetched role:", fetchedRole);
          if (fetchedRole) {
            setRole(fetchedRole); // This updates state and localStorage
          }
        } else {
          console.warn("[AuthProvider] failed to fetch role:", resp.status);
        }
      } catch (err) {
        console.error("[AuthProvider] error fetching role:", err);
      } finally {
        setRoleLoading(false);
      }
    });

    return () => {
      mounted = false;
      try {
        listener?.subscription?.unsubscribe?.();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, roleLoading, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};
