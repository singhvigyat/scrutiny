// src/components/StudentQuizView.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type QuizFull = {
  id?: string;
  title?: string;
  subject?: string;
  questions?: Array<{
    questionText: string;
    options: string[];
    correctAnswer?: number;
  }>;
  [k: string]: any;
};

interface Props {
  session: any;
  onFinished?: () => void;
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "";
const apiBase = BACKEND_URL ? BACKEND_URL.replace(/\/$/, "") : "/api";

export default function StudentQuizView({ session, onFinished }: Props): React.ReactElement {
  const [quiz, setQuiz] = useState<QuizFull | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const sessionEndsAt = session?.endsAt ? new Date(session.endsAt).getTime() : null;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const remainingMs = useMemo(() => (sessionEndsAt ? Math.max(0, sessionEndsAt - now) : null), [sessionEndsAt, now]);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const sessRes = await supabase.auth.getSession();
        const accessToken = sessRes?.data?.session?.access_token ?? null;
        if (!accessToken) {
          setMsg("Missing access token.");
          return;
        }

        const resp = await fetch(`${apiBase}/api/quizzes/${encodeURIComponent(session.quizId ?? session.quiz?.id ?? session.quizId)}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        });
        const text = await resp.text();
        let json: any = null;
        try { json = text ? JSON.parse(text) : null; } catch { json = null; }
        if (!resp.ok) {
          setMsg(json?.message ?? text ?? `Status ${resp.status}`);
          return;
        }
        const q = json?.quiz ?? json ?? null;
        setQuiz(q);
        setAnswers((q?.questions ?? []).map(() => -1));
      } catch (err: any) {
        console.error("[StudentQuizView] fetch quiz error:", err);
        setMsg(String(err?.message ?? err));
      }
    }
    fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.quizId]);

  const submit = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const sessRes = await supabase.auth.getSession();
      const accessToken = sessRes?.data?.session?.access_token ?? null;
      if (!accessToken) {
        setMsg("No access token.");
        setLoading(false);
        return;
      }

      // if session ended, avoid submitting
      if (remainingMs !== null && remainingMs <= 0) {
        setMsg("Time is up. Cannot submit.");
        setLoading(false);
        return;
      }

      const resp = await fetch(`/api/sessions/${encodeURIComponent(session.id)}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ answers }),
      });

      const text = await resp.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }

      if (!resp.ok) {
        setMsg(json?.message ?? text ?? `Status ${resp.status}`);
        setLoading(false);
        return;
      }

      setMsg("Submission received.");
      onFinished?.();
    } catch (err: any) {
      console.error("[StudentQuizView] submit error:", err);
      setMsg(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  if (!session) return <div className="p-4">No session data</div>;
  if (!quiz) return <div className="p-4">Loading quiz...</div>;

  return (
    <div className="bg-white border rounded p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-gray-600">Quiz</div>
          <div className="text-lg font-semibold">{quiz.title}</div>
          <div className="text-xs text-gray-500">{quiz.subject}</div>
        </div>

        <div className="text-right">
          <div className="text-sm">Time remaining</div>
          <div className="font-medium">{remainingMs !== null ? `${Math.ceil(remainingMs / 1000)}s` : "—"}</div>
        </div>
      </div>

      <div className="space-y-4">
        {(quiz.questions ?? []).map((q, i) => (
          <div key={i} className="border rounded p-3">
            <div className="font-medium mb-2">{i + 1}. {q.questionText}</div>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <label key={oi} className="flex items-center gap-2">
                  <input type="radio" name={`q-${i}`} checked={answers[i] === oi} onChange={() => {
                    setAnswers(prev => {
                      const copy = [...prev];
                      copy[i] = oi;
                      return copy;
                    });
                  }} />
                  <div>{opt}</div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {msg && <div className="text-sm text-green-600 mt-3">{msg}</div>}

      <div className="mt-4 flex gap-2">
        <button onClick={submit} disabled={loading} className="px-3 py-1 bg-blue-600 text-white rounded">
          {loading ? "Submitting..." : "Submit Answers"}
        </button>
      </div>
    </div>
  );
}
