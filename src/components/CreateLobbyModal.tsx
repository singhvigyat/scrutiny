// src/components/CreateLobbyModal.tsx
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface Props {
  quizId: string;
  onCreated?: (sessionId: string, pin: string) => void;
  onClose?: () => void;
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";
const apiBase = BACKEND_URL ? BACKEND_URL.replace(/\/$/, "") : "/api";

export default function CreateLobbyModal({ quizId, onCreated, onClose }: Props): React.ReactElement {
  const [duration, setDuration] = useState<number>(15);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const createLobby = async () => {
    setErr(null);
    setLoading(true);
    try {
      const sessRes = await supabase.auth.getSession();
      const accessToken = sessRes?.data?.session?.access_token ?? null;
      if (!accessToken) {
        setErr("No access token. Please re-login.");
        setLoading(false);
        return;
      }

      const resp = await fetch(`${apiBase}/api/quizzes/${encodeURIComponent(quizId)}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ duration }),
      });

      const text = await resp.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }

      if (!resp.ok) {
        setErr(json?.message ?? text ?? `Status ${resp.status}`);
        setLoading(false);
        return;
      }

      const sessionId = json?.sessionId ?? json?.id ?? json?.session_id ?? null;
      const pin = json?.pin ?? json?.pinCode ?? null;
      console.log("[CreateLobbyModal] created:", json);
      if (sessionId && pin) {
        onCreated?.(String(sessionId), String(pin));
      } else {
        // If backend returned the whole session object
        if (json?.session?.id && json?.session?.pin) {
          onCreated?.(json.session.id, json.session.pin);
        } else {
          setErr("Unexpected response: missing sessionId/pin");
        }
      }
    } catch (err: any) {
      console.error("[CreateLobbyModal] error:", err);
      setErr(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold">Create Lobby</h3>
      <p className="text-sm text-gray-600">Enter duration (minutes) and create a lobby. Students will join with a PIN.</p>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-24 rounded border px-2 py-1"
        />
        <div className="text-sm text-gray-500">minutes</div>
      </div>

      {err && <div className="text-sm text-red-600 mt-2">{err}</div>}

      <div className="mt-4 flex gap-2">
        <button onClick={createLobby} className="bg-blue-600 text-white px-3 py-1 rounded" disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </button>

        <button onClick={() => onClose?.()} className="px-3 py-1 border rounded">
          Cancel
        </button>
      </div>
    </div>
  );
}
