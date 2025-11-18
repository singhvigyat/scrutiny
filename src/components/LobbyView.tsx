// src/components/LobbyView.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useSessionPoll } from "../hooks/useSessionPoll";
import { supabase } from "../lib/supabaseClient";

interface Props {
  sessionId: string;
  role: "teacher" | "student";
  onClose?: () => void;
  onSessionStarted?: (session: any) => void;
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";
const apiBase = BACKEND_URL ? BACKEND_URL.replace(/\/$/, "") : "/api";

export default function LobbyView({ sessionId, role, onClose, onSessionStarted }: Props): React.ReactElement {
  const { session, loading, error, setSession } = useSessionPoll(sessionId);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // If the session becomes active, notify parent (so students can open quiz)
  useEffect(() => {
    if (session?.status === "active") {
      onSessionStarted?.(session);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.status]);

  const participants = useMemo(() => session?.participants ?? [], [session]);

  const startSession = async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      const sessRes = await supabase.auth.getSession();
      const accessToken = sessRes?.data?.session?.access_token ?? null;
      if (!accessToken) {
        setActionError("No access token.");
        setActionLoading(false);
        return;
      }
      const resp = await fetch(`${apiBase}/api/sessions/${encodeURIComponent(sessionId)}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      const text = await resp.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }
      if (!resp.ok) {
        setActionError(json?.message ?? text ?? `Status ${resp.status}`);
        setActionLoading(false);
        return;
      }
      // Update local session (server will also be polled)
      setSession(json ?? session);
      console.log("[LobbyView] started session:", json);
    } catch (err: any) {
      console.error("[LobbyView] start error:", err);
      setActionError(String(err?.message ?? err));
    } finally {
      setActionLoading(false);
    }
  };

  const endSession = async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      const sessRes = await supabase.auth.getSession();
      const accessToken = sessRes?.data?.session?.access_token ?? null;
      if (!accessToken) {
        setActionError("No access token.");
        setActionLoading(false);
        return;
      }
      const resp = await fetch(`${apiBase}/api/sessions/${encodeURIComponent(sessionId)}/end`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      const text = await resp.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }
      if (!resp.ok) {
        setActionError(json?.message ?? text ?? `Status ${resp.status}`);
        setActionLoading(false);
        return;
      }
      setSession(json ?? session);
      console.log("[LobbyView] ended session:", json);
    } catch (err: any) {
      console.error("[LobbyView] end error:", err);
      setActionError(String(err?.message ?? err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-gray-600">Session</div>
          <div className="text-lg font-semibold">{session?.id ?? sessionId}</div>
          <div className="text-xs text-gray-500">{session?.pin ? `PIN: ${session.pin}` : ""}</div>
        </div>

        <div className="text-right">
          <div className="text-sm">Status</div>
          <div className="font-medium">{session?.status ?? "unknown"}</div>
          <div className="text-xs text-gray-500">{session?.startsAt ? `Starts: ${new Date(session.startsAt).toLocaleString()}` : ""}</div>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {actionError && <div className="text-sm text-red-600">{actionError}</div>}

      <div className="mb-3">
        <div className="text-sm font-medium mb-2">Participants ({participants.length})</div>
        <div className="space-y-2">
          {participants.length === 0 ? (
            <div className="text-sm text-gray-500">No participants yet</div>
          ) : (
            participants.map((p, i) => (
              <div key={p.id ?? i} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.name ?? p.email ?? p.id}</div>
                  <div className="text-xs text-gray-500">{p.email ?? ""}</div>
                </div>
                <div className="text-xs text-gray-500">{p.id}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {role === "teacher" && (
          <>
            <button onClick={startSession} disabled={actionLoading || session?.status === "active"} className="px-3 py-1 bg-green-600 text-white rounded">
              {actionLoading ? "Working..." : session?.status === "active" ? "Active" : "Start"}
            </button>
            <button onClick={endSession} disabled={actionLoading || session?.status !== "active"} className="px-3 py-1 border rounded">
              End
            </button>
          </>
        )}

        <button onClick={() => onClose?.()} className="px-3 py-1 border rounded">
          Close Lobby
        </button>
      </div>
    </div>
  );
}
