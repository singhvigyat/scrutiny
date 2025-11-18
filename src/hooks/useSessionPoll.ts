// src/hooks/useSessionPoll.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Poll a session resource and return the latest server session object.
 * Tries the new /api/sessions/:id/status endpoint first, then falls back to other patterns.
 *
 * Usage:
 *   const { session, loading, error, setSession } = useSessionPoll(sessionId);
 *
 * Notes:
 * - Sends Authorization header with Supabase access token (if present).
 * - Sends ngrok header (kept as you required).
 * - Poll interval defaults to 1500ms.
 */

type AnyObj = any;

export function useSessionPoll(sessionId: string | null, pollIntervalMs = 1500) {
  const [session, setSession] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // remember the last successful URL we used (so we prefer it next time)
  const lastGoodUrl = useRef<string | null>(null);
  const stopRef = useRef(false);

  // derive apiBase as other components do
  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";
  const apiBase = BACKEND_URL ? BACKEND_URL.replace(/\/$/, "") : "/api";

  const getCandidateUrls = (id: string) => {
    // Try the new status endpoint first (your backend exposed it)
    return [
      // new canonical status endpoint
      `${apiBase}/api/sessions/${encodeURIComponent(id)}/status`,
    ];
  };

  const fetchOnce = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const sessRes = await supabase.auth.getSession();
        const accessToken = sessRes?.data?.session?.access_token ?? null;

        // If we have last good url, try it first
        const candidates = lastGoodUrl.current
          ? [lastGoodUrl.current, ...getCandidateUrls(id).filter((u) => u !== lastGoodUrl.current)]
          : getCandidateUrls(id);

        let lastErr: string | null = null;

        for (const url of candidates) {
          try {
            // Build headers
            const headers: Record<string, string> = {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            };
            if (accessToken) {
              headers["Authorization"] = `Bearer ${accessToken}`;
            }

            console.log(`[useSessionPoll] Trying GET ${url}`);
            const resp = await fetch(url, { method: "GET", headers });

            const text = await resp.text();

            // If 404, try next candidate
            if (resp.status === 404) {
              console.warn(`[useSessionPoll] 404 for ${url} — trying next candidate`);
              lastErr = `404 ${url}`;
              continue;
            }

            // Try parse JSON; if it fails, log raw text
            let json: any = null;
            try {
              json = text ? JSON.parse(text) : null;
            } catch (parseErr) {
              console.warn(`[useSessionPoll] Response for ${url} not JSON:`, parseErr, "raw:", text);
              // If endpoint returned HTML error page, treat as failure and try next
              if (!resp.ok) {
                lastErr = `Non-JSON error ${resp.status}`;
                continue;
              }
            }

            if (!resp.ok) {
              // non-OK status with some text, surface it
              const msg = json?.message ?? text ?? `Status ${resp.status}`;
              console.warn(`[useSessionPoll] GET ${url} returned non-ok:`, resp.status, msg);
              lastErr = `Status ${resp.status}: ${msg}`;
              continue;
            }

            // success: normalize common shapes: { session: {...} } | direct session object
            const payload = json ?? null;
            // sometimes status endpoints return { status: 'active', session: {...} } or similar;
            // resolve the most likely session object
            let resolved = payload?.session ?? payload;

            // If payload looks like { status: 'active', sessionId: '...', ... } treat payload as session too
            if (!resolved?.id && (payload?.sessionId || payload?.status)) {
              resolved = payload;
            }

            // remember this url for next time
            lastGoodUrl.current = url;
            console.log(`[useSessionPoll] Successful GET ${url}`, resolved);

            setSession(resolved);
            setLoading(false);
            setError(null);
            return resolved;
          } catch (innerErr: any) {
            console.error(`[useSessionPoll] Error fetching ${url}:`, innerErr);
            lastErr = String(innerErr?.message ?? innerErr);
            // try next candidate
            continue;
          }
        }

        // if we arrive here, all candidates failed
        const errMsg = lastErr ?? `No candidate URL worked for session ${id}`;
        setError(errMsg);
        setLoading(false);
        console.warn("[useSessionPoll] All URL candidates failed:", errMsg);
        return null;
      } catch (err: any) {
        const msg = String(err?.message ?? err);
        setError(msg);
        setLoading(false);
        console.error("[useSessionPoll] Unexpected error:", msg);
        return null;
      }
    },
    [apiBase]
  );

  useEffect(() => {
    stopRef.current = false;
    if (!sessionId) {
      setSession(null);
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;
    let timer: any = null;

    const loop = async () => {
      if (!mounted || stopRef.current) return;

      await fetchOnce(sessionId);

      if (!mounted || stopRef.current) return;
      timer = setTimeout(loop, pollIntervalMs);
    };

    // initial run
    (async () => {
      setLoading(true);
      await loop();
    })();

    return () => {
      mounted = false;
      stopRef.current = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, fetchOnce, pollIntervalMs]);

  // expose setter so callers can push local changes (start returned object)
  return { session, loading, error, setSession };
}

export default useSessionPoll;
