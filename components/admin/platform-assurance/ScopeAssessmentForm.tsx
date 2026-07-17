"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { ScopeQuestion } from "@/lib/platform-assurance/scope-questionnaire";

type AnswerValue = "yes" | "no" | "unknown" | "not_applicable";

export function ScopeAssessmentForm({
  sourceVersionId,
  sourceTitle,
  questions,
}: {
  sourceVersionId: string;
  sourceTitle: string;
  questions: ScopeQuestion[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [functionName, setFunctionName] = useState("");
  const [functionDescription, setFunctionDescription] = useState("");
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function setAnswer(id: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/platform-assurance/scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          functionName,
          functionDescription,
          moduleKeys: ["marketplace", "care", "access"],
          sourceVersionId,
          answers,
          evidenceRefs: [],
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        assessment?: { id: string; result: string };
      };

      if (!response.ok) {
        setError(data.error ?? "Could not save assessment");
        return;
      }

      setSuccess(
        `Saved assessment ${data.assessment?.id}. Result: ${data.assessment?.result}. This is not a legal classification.`
      );
      setFunctionName("");
      setFunctionDescription("");
      setAnswers({});
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border p-4"
      aria-labelledby="scope-form-heading"
    >
      <h2 id="scope-form-heading" className="text-lg font-semibold">
        New scope assessment
      </h2>
      <p className="text-sm text-muted-foreground">
        Anchored to source: {sourceTitle}
      </p>

      <div className="space-y-1">
        <label htmlFor="functionName" className="text-sm font-medium">
          MapAble function name
        </label>
        <input
          id="functionName"
          name="functionName"
          required
          value={functionName}
          onChange={(e) => setFunctionName(e.target.value)}
          className="min-h-11 w-full rounded-md border px-3"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="functionDescription" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="functionDescription"
          name="functionDescription"
          value={functionDescription}
          onChange={(e) => setFunctionDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium">Questionnaire</legend>
        {questions.map((question) => (
          <div key={question.id} className="space-y-2 rounded border p-3">
            <p className="font-medium" id={`${question.id}-label`}>
              {question.prompt}
            </p>
            <p className="text-sm text-muted-foreground">{question.helpText}</p>
            <div
              role="group"
              aria-labelledby={`${question.id}-label`}
              className="flex flex-wrap gap-2"
            >
              {(
                [
                  "yes",
                  "no",
                  "unknown",
                  "not_applicable",
                ] as AnswerValue[]
              ).map((value) => (
                <label
                  key={value}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded border px-3"
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={value}
                    checked={answers[question.id] === value}
                    onChange={() => setAnswer(question.id, value)}
                  />
                  <span className="text-sm">{value.replace("_", " ")}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </fieldset>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-green-800" role="status">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-md bg-foreground px-4 text-background disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save for legal review"}
      </button>
    </form>
  );
}
