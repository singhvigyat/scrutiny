// src/hooks/useSessionPoll.ts
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type SessionData = {
  id?: string;
  status?: string; // pending | active | ended
  pin?: string;
  participants?: Array<{ id?: string; name?: string; email?: string }>;
  quizId?: string;
  startsAt?: string;
  endsAt?: string;
  [k: string]: any;
};

export function useSessionPoll(sessionId: string | null) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const last = useRef<string | null>(null);
  const stopRef = useRef(false);

  useEffect(() => {
    stopRef.current = false;
    let timer: number | null = null;

    async function fetchOnce() {
      if (!sessionId) return;
      setLoading(true);
      setError(null);

      try {
        const sessRes = await supabase.auth.getSession();
        const accessToken = sessRes?.data?.session?.access_token ?? null;
        if (!accessToken) {
          setError("No access token available.");
          setLoading(false);
          return;
        }

        const resp = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        });

        const text = await resp.text();
        let json: any = null;
        try { json = text ? JSON.parse(text) : null; } catch { json = null; }

        if (!resp.ok) {
          setError(json?.message ?? `Status ${resp.status}`);
          setLoading(false);
          return;
        }

        // basic change detection by JSON string
        const jstr = JSON.stringify(json ?? {});
        if (jstr !== last.current) {
          last.current = jstr;
          setSession(json ?? null);
        }
      } catch (err: any) {
        console.error("[useSessionPoll] error:", err);
        setError(String(err?.message ?? err));
      } finally {
        setLoading(false);
      }
    }

    async function loop() {
      await fetchOnce();
      if (stopRef.current) return;
      timer = window.setTimeout(loop, 1500);
    }

    if (sessionId) loop();

    return () => {
      stopRef.current = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [sessionId]);

  return { session, loading, error, setSession };
}
