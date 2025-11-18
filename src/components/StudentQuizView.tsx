// src/components/StudentQuizView.tsx
import React from "react";

interface QuizFull {
  id?: string;
  title?: string;
  subject?: string;
  questions?: Array<{
    questionText: string;
    options: string[];
    correctAnswer: number;
  }>;
  [k: string]: any;
}

interface Props {
  quiz: QuizFull | null;
}

export default function StudentQuizView({ quiz }: Props) {
  if (!quiz) {
    return <div className="p-4 text-sm text-gray-600">No quiz loaded.</div>;
  }

  return (
    <div className="p-4 border rounded bg-white space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{quiz.title}</h3>
        <div className="text-xs text-gray-500">{quiz.subject}</div>
      </div>

      <div>
        {(quiz.questions ?? []).map((q, i) => (
          <div key={i} className="border rounded p-3 mb-3 bg-gray-50">
            <div className="font-medium mb-2">{i + 1}. {q.questionText}</div>
            <div className="space-y-1">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <div className="w-6 text-sm font-semibold">{String.fromCharCode(65 + oi)}.</div>
                  <div className="text-sm">{opt}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500">This is a read-only view — the student runner (submit answers) is not implemented here yet.</div>
    </div>
  );
}
