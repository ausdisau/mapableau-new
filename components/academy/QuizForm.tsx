"use client";

import { useState } from "react";

type Question = {
  id: string;
  questionText: string;
  options: string[];
};

type QuizFormProps = {
  quizId: string;
  title: string;
  passMarkPercent: number;
  questions: Question[];
  disabled?: boolean;
  onSubmitted: (result: {
    scorePercent: number;
    passed: boolean;
    passMark: number;
  }) => void;
};

export function QuizForm({
  quizId,
  title,
  passMarkPercent,
  questions,
  disabled,
  onSubmitted,
}: QuizFormProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (questions.some((q) => answers[q.id] === undefined)) {
      setError("Answer every question.");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/academy/quizzes/${quizId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedIndex: answers[q.id],
        })),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Submit failed");
      return;
    }
    onSubmitted({
      scorePercent: data.scorePercent,
      passed: data.passed,
      passMark: data.passMark,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-xl border border-border bg-card p-6">
      <div>
        <h2 className="font-heading text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          Pass mark: {passMarkPercent}%. Use Tab to move between options.
        </p>
      </div>
      <ol className="space-y-6">
        {questions.map((q, idx) => (
          <li key={q.id}>
            <fieldset>
              <legend className="font-medium">
                {idx + 1}. {q.questionText}
              </legend>
              <ul className="mt-2 space-y-2">
                {q.options.map((opt, optIdx) => (
                  <li key={optIdx}>
                    <label className="flex items-start gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={q.id}
                        value={optIdx}
                        disabled={disabled || submitting}
                        checked={answers[q.id] === optIdx}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                        }
                        className="mt-1"
                      />
                      {opt}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          </li>
        ))}
      </ol>
      {!disabled ? (
        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 rounded-lg bg-primary px-4 font-medium text-primary-foreground disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit quiz"}
        </button>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
