// src/hooks/useSessionPoll.ts
// polls only the /api/sessions/:id/status endpoint at a configurable interval
import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

type PollCallback = (sessionObj: any | null, rawText?: string | null) => void;

interface UseSessionPollOpts {
  intervalMs?: number;
}

/**
 * useSessionPoll(sessionId, onUpdate, opts)
 * - sessionId: id to poll
 * - onUpdate: called with parsed JSON session object (or null) each poll
 * - opts.intervalMs: poll interval in ms (default 2000)
 */
export default function useSessionPoll(sessionId: string | null, onUpdate: PollCallback, opts?: UseSessionPollOpts) {
  const intervalMs = opts?.intervalMs ?? 2000;
  const stopped = useRef(false);

  useEffect(() => {
    stopped.current = false;
    let mounted = true;
    if (!sessionId) {
      return () => {
        stopped.current = true;
        mounted = false;
      };
    }

    const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";
    const apiBase = BACKEND_URL ? BACKEND_URL.replace(/\/$/, "") : "/api";

    const url = `${apiBase}/api/sessions/${encodeURIComponent(sessionId)}/status`;

    let loopId: number | null = null;

    const loop = async () => {
      if (stopped.current || !mounted) return;
      try {
        const sessRes = await supabase.auth.getSession();
        const accessToken = sessRes?.data?.session?.access_token ?? null;

        // If no token, inform parent with null and stop
        if (!accessToken) {
          console.warn("[useSessionPoll] no access token, aborting poll");
          onUpdate(null, null);
          stopped.current = true;
          return;
        }

        console.log(`[useSessionPoll] Trying GET ${url}`);
        const resp = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        });

        const text = await resp.text();
        if (!resp.ok) {
          console.warn(`[useSessionPoll] GET ${url} returned non-OK: ${resp.status} ${text.slice(0,200)}`);
          // call update but with null to indicate not-ready / error
          onUpdate(null, text);
        } else {
          // Try parse JSON; if not JSON, pass null but provide raw text
          let json: any = null;
          try {
            json = text ? JSON.parse(text) : null;
          } catch (parseErr) {
            console.warn(`[useSessionPoll] Response for ${url} not JSON:`, parseErr, "raw:", text.slice(0,200));
            onUpdate(null, text);
            // schedule next
            if (!stopped.current) loopId = window.setTimeout(loop, intervalMs);
            return;
          }

          console.log(`[useSessionPoll] Successful GET ${url}`, json);
          onUpdate(json, text);
        }
      } catch (err: any) {
        console.error("[useSessionPoll] fetch error:", err);
        onUpdate(null, null);
      } finally {
        if (!stopped.current) loopId = window.setTimeout(loop, intervalMs);
      }
    };

    // kick off
    loop();

    return () => {
      stopped.current = true;
      mounted = false;
      if (loopId) clearTimeout(loopId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, intervalMs]);
}
