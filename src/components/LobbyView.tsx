// src/components/LobbyView.tsx
import React, { useEffect, useState } from "react";
import useSessionPoll from "../hooks/useSessionPoll";

export interface LobbyViewProps {
  sessionId: string | null;
  role?: "teacher" | "student" | string;
  onSessionStarted?: (session: any) => void;
  onSessionUpdate?: (session: any) => void;
  onClose?: () => void;
  pollIntervalMs?: number;
}

/**
 * normalizeSession(raw)
 * Attempt to extract a consistent shape from various possible backend payloads.
 */
function normalizeSession(raw: any) {
  if (!raw) return null;

  const id = raw.id ?? raw.sessionId ?? raw.session_id ?? raw.session?.id ?? null;

  let quizId =
    raw.quizId ??
    raw.quiz_id ??
    raw.quiz?.id ??
    raw.quiz?.quizId ??
    raw.payload?.quizId ??
    raw.meta?.quizId ??
    raw.data?.quizId ??
    null;

  if (!quizId && raw.quiz && typeof raw.quiz === "object") {
    quizId = raw.quiz.id ?? raw.quiz.quizId ?? raw.quiz._id ?? null;
  }

  if (!quizId && raw.session && typeof raw.session === "object") {
    quizId = raw.session.quizId ?? raw.session.quiz_id ?? raw.session.quiz?.id ?? null;
  }

  const participants = raw.participants ?? raw.users ?? raw.participantList ?? [];

  const status = (raw.status ?? raw.state ?? "").toString();

  const startsAt =
    raw.startsAt ??
    raw.startTime ??
    raw.start_time ??
    raw.starts_at ??
    raw.session?.startsAt ??
    raw.session?.startTime ??
    null;
  const endsAt =
    raw.endsAt ??
    raw.endTime ??
    raw.end_time ??
    raw.ends_at ??
    raw.session?.endsAt ??
    raw.session?.endTime ??
    null;

  const pin = raw.pin ?? raw.pinCode ?? raw.code ?? raw.session?.pin ?? null;

  return {
    ...raw,
    id,
    quizId,
    participants,
    status,
    startsAt,
    endsAt,
    pin,
  };
}

export default function LobbyView({
  sessionId,
  role,
  onSessionStarted,
  onSessionUpdate,
  onClose,
  pollIntervalMs,
}: LobbyViewProps) {
  const [lastNormalized, setLastNormalized] = useState<any | null>(null);

  useSessionPoll(sessionId, (raw, rawText) => {
    try {
      const normalized = normalizeSession(raw);
      console.log("[LobbyView] poll returned normalized:", normalized);

      setLastNormalized(normalized);
      onSessionUpdate?.(normalized);

      if (normalized && String(normalized.status ?? "").toLowerCase() === "active") {
        if (!normalized.quizId) {
          console.warn("[LobbyView] detected active session but missing quizId in normalized session:", normalized);
          onSessionStarted?.({ ...normalized, quizMissing: true });
        } else {
          console.log("[LobbyView] detected active session with quizId:", normalized.quizId);
          onSessionStarted?.(normalized);
        }
      }
    } catch (err: any) {
      console.error("[LobbyView] error processing poll result:", err);
    }
  }, { intervalMs: pollIntervalMs });

  // show simple UI
  return (
    <div className="bg-white rounded shadow-sm">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="text-sm font-medium">
          {role === "teacher" ? "Teacher Lobby" : role === "student" ? "Student Lobby" : "Lobby"}
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-2 py-1 border rounded text-sm hover:bg-gray-100"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {!sessionId ? (
          <div className="text-sm text-gray-500">No session selected.</div>
        ) : lastNormalized ? (
          <div className="space-y-2 text-sm text-gray-700">
            <div>Session: <strong>{lastNormalized.id ?? sessionId}</strong></div>
            <div>PIN: <strong>{lastNormalized.pin ?? "—"}</strong></div>
            <div>Status: <strong>{String(lastNormalized.status ?? "unknown")}</strong></div>
            <div>Quiz ID: <strong>{lastNormalized.quizId ?? "—"}</strong></div>
            <div>Participants: <strong>{(lastNormalized.participants ?? []).length}</strong></div>
            {lastNormalized.startsAt && <div>Starts: <strong>{String(lastNormalized.startsAt)}</strong></div>}
            {lastNormalized.endsAt && <div>Ends: <strong>{String(lastNormalized.endsAt)}</strong></div>}
          </div>
        ) : (
          <div className="text-sm text-gray-500">Waiting for session info...</div>
        )}
      </div>
    </div>
  );
}
