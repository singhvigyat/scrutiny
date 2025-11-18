// src/components/EnterPinModal.tsx
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface Props {
  onJoined?: (sessionId: string) => void;
  onClose?: () => void;
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";
const apiBase = BACKEND_URL ? BACKEND_URL.replace(/\/$/, "") : "/api";

export default function EnterPinModal({ onJoined, onClose }: Props): React.ReactElement {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const join = async () => {
    setErr(null);
    setLoading(true);
    try {
      const sessRes = await supabase.auth.getSession();
      const accessToken = sessRes?.data?.session?.access_token ?? null;
      if (!accessToken) {
        setErr("No access token.");
        setLoading(false);
        return;
      }

      const resp = await fetch(`${apiBase}/api/sessions/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const text = await resp.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }

      if (!resp.ok) {
        setErr(json?.message ?? text ?? `Status ${resp.status}`);
        setLoading(false);
        return;
      }

      const sessionId = json?.sessionId ?? json?.session?.id ?? json?.id ?? null;
      if (sessionId) {
        console.log("[EnterPinModal] joined session", sessionId);
        onJoined?.(String(sessionId));
      } else {
        setErr("Unexpected join response: missing sessionId");
      }
    } catch (err: any) {
      console.error("[EnterPinModal] error:", err);
      setErr(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold">Enter PIN</h3>
      <p className="text-sm text-gray-600">Enter the PIN provided by your teacher.</p>

      <div className="mt-3">
        <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="123456" className="rounded border px-3 py-2 w-full" />
        {err && <div className="text-sm text-red-600 mt-2">{err}</div>}
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={join} disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded">
          {loading ? "Joining..." : "Join"}
        </button>
        <button onClick={() => onClose?.()} className="px-3 py-1 border rounded">Cancel</button>
      </div>
    </div>
  );
}
