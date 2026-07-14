"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

type Question = {
  id: string;
  prompt: string;
  optionsJson: unknown;
};

export function LessonPlayerActions({
  enrolmentId,
  lessonId,
  nextHref,
}: {
  enrolmentId: string;
  lessonId: string;
  nextHref?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function markComplete() {
    setError(null);
    const res = await fetch(`/api/academy/enrolments/${enrolmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "progress",
        lessonId,
        status: "completed",
        percentComplete: 100,
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not save progress.");
      return;
    }
    if (nextHref) router.push(nextHref);
    else router.push(`/academy/learn/${enrolmentId}`);
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-2">
      <button
        type="button"
        onClick={markComplete}
        className="rounded bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        Mark lesson complete and continue
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function QuizForm({
  enrolmentId,
  assessmentId,
  questions,
  passingScore,
}: {
  enrolmentId: string;
  assessmentId: string;
  questions: Question[];
  passingScore: number;
}) {
  const router = useRouter();
  const formId = useId();
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (answers.some((a) => a < 0)) {
      setError("Please choose an answer for each question.");
      return;
    }
    const res = await fetch(`/api/academy/enrolments/${enrolmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "attempt",
        assessmentId,
        answers,
      }),
    });
    const data = (await res.json().catch(() => null)) as {
      error?: string;
      passed?: boolean;
      attempt?: { score: number | null };
    } | null;
    if (!res.ok) {
      setError(data?.error ?? "Could not submit the quiz.");
      return;
    }
    setMessage(
      data?.passed
        ? `You passed with ${data.attempt?.score}%. You can finish the course.`
        : `Score ${data?.attempt?.score}%. Passing score is ${passingScore}%. You can try again — there is no time limit.`,
    );
    router.refresh();
  }

  async function completeCourse() {
    const res = await fetch(`/api/academy/enrolments/${enrolmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
    });
    const data = (await res.json().catch(() => null)) as {
      error?: string;
      credential?: { publicId: string };
    } | null;
    if (!res.ok) {
      setError(data?.error ?? "Could not complete the course yet.");
      return;
    }
    router.push("/academy/credentials");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6" aria-labelledby={`${formId}-title`}>
      <h2 id={`${formId}-title`} className="text-xl font-semibold text-teal-950">
        Foundations check
      </h2>
      <p className="text-sm text-slate-600">
        No time limit. You can save and return later. Submitted attempts cannot be edited.
      </p>
      {questions.map((q, qi) => {
        const options = Array.isArray(q.optionsJson)
          ? (q.optionsJson as string[])
          : [];
        return (
          <fieldset key={q.id} className="space-y-2 rounded border border-slate-200 p-4">
            <legend className="font-medium text-slate-900">{q.prompt}</legend>
            <div className="space-y-2">
              {options.map((opt, oi) => (
                <label key={oi} className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={oi}
                    checked={answers[qi] === oi}
                    onChange={() => {
                      const next = [...answers];
                      next[qi] = oi;
                      setAnswers(next);
                    }}
                    className="mt-1"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded bg-teal-800 px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Submit quiz
        </button>
        <button
          type="button"
          onClick={completeCourse}
          className="rounded border border-teal-800 px-4 py-2 text-sm font-medium text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Finish course and issue certificate
        </button>
      </div>
      {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}
