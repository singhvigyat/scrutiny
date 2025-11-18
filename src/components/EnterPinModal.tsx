// src/components/EnterPinModal.tsx
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface EnterPinModalProps {
  open: boolean;
  onClose: () => void;
  onJoined?: (sessionId: string, quizId?: string | null) => void;
}

export default function EnterPinModal({ open, onClose, onJoined }: EnterPinModalProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";
  const apiBase = BACKEND_URL ? BACKEND_URL.replace(/\/$/, "") : "/api";

  const joinWithPin = async () => {
    setMsg(null);
    if (!pin.trim()) {
      setMsg("Please enter a PIN.");
      return;
    }

    setLoading(true);
    try {
      const sessRes = await supabase.auth.getSession();
      const accessToken = sessRes?.data?.session?.access_token ?? null;
      if (!accessToken) {
        setMsg("No auth token. Please sign in.");
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
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        console.warn("[EnterPinModal] join returned non-JSON:", text.slice(0, 400));
      }

      if (!resp.ok) {
        const errMsg = json?.message ?? text ?? `Status ${resp.status}`;
        setMsg(`Join failed: ${errMsg}`);
        setLoading(false);
        return;
      }

      // server expected shape:
      // { message, sessionId, quizId, teacherId }
      const sessionId = json?.sessionId ?? json?.session?.id ?? null;
      const quizId = json?.quizId ?? json?.quiz_id ?? json?.quiz?.id ?? null;

      console.log("[EnterPinModal] joined session", sessionId, "quizId=", quizId);
      setMsg("Joined lobby. Waiting for teacher to start the quiz.");

      // notify parent of both sessionId and quizId (quizId may be null, but usually present)
      onJoined?.(String(sessionId), quizId ? String(quizId) : null);

      // keep modal open so student sees the lobby; parent can close if desired
    } catch (err: any) {
      console.error("[EnterPinModal] join error:", err);
      setMsg("Network or server error: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-md bg-white rounded shadow p-6 z-10">
        <h3 className="text-lg font-semibold mb-2">Enter PIN</h3>

        <div className="mb-3">
          <label className="text-sm block mb-1">PIN</label>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. 961971"
            autoFocus
          />
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={joinWithPin}
            disabled={loading}
            className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-60"
          >
            {loading ? "Joining..." : "Join"}
          </button>

          <button onClick={onClose} className="px-3 py-2 border rounded">
            Cancel
          </button>
        </div>

        {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
      </div>
    </div>
  );
}
