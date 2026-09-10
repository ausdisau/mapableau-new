"use client";

import { useState } from "react";

const ACCESS_OPTIONS = [
  {
    value: "aac_or_typed",
    label: "I use AAC or typed communication",
  },
  {
    value: "extra_response_time",
    label: "I may need extra time to respond",
  },
  {
    value: "relay_or_text_preferred",
    label: "I prefer relay or text-based communication",
  },
] as const;

type RequestState = "idle" | "submitting" | "recorded" | "fallback";

export function CrisisHumanAssistanceCard() {
  const [selected, setSelected] = useState<string[]>([]);
  const [state, setState] = useState<RequestState>("idle");
  const [message, setMessage] = useState<string>("");

  function toggle(value: string) {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function requestHumanReview() {
    if (state === "submitting") return;
    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/mapable/crisis/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communicationAccess: selected }),
      });
      const data = (await response.json().catch(() => null)) as
        | { message?: string; recorded?: boolean }
        | null;

      if (!response.ok || !data?.recorded) {
        setState("fallback");
        setMessage(
          data?.message ??
            "MapAble could not record a human-review request. Please use one of the crisis contacts on this page directly.",
        );
        return;
      }

      setState("recorded");
      setMessage(
        data.message ??
          "Your request for MapAble human review was recorded. This is not confirmation that a person or external service has accepted the request yet.",
      );
    } catch {
      setState("fallback");
      setMessage(
        "MapAble could not record a human-review request. Please use one of the crisis contacts on this page directly.",
      );
    }
  }

  return (
    <section
      aria-labelledby="mapable-human-help-heading"
      className="rounded-xl border border-border bg-card p-5"
    >
      <h2 id="mapable-human-help-heading" className="text-xl font-bold">
        Ask a MapAble person to help
      </h2>
      <p className="mt-2 leading-6">
        You can ask for human review without sending your crisis conversation,
        location, contacts or disability narrative. Choose any communication
        access needs you want us to know.
      </p>

      <fieldset className="mt-4 space-y-2">
        <legend className="text-sm font-semibold">Communication access</legend>
        {ACCESS_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2"
          >
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => toggle(option.value)}
              className="h-5 w-5"
            />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
      </fieldset>

      <button
        type="button"
        onClick={requestHumanReview}
        disabled={state === "submitting" || state === "recorded"}
        className="mt-4 inline-flex min-h-12 items-center rounded-lg border border-border px-5 py-3 font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "submitting"
          ? "Recording request…"
          : state === "recorded"
            ? "Human-review request recorded"
            : "Request MapAble human review"}
      </button>

      <p className="mt-3 text-sm text-muted-foreground">
        This does not contact Lifeline, 000 or another external service. It also
        does not mean a MapAble person has accepted the request yet. If you may
        be in immediate danger, use 000 or another crisis pathway above now.
      </p>

      {message ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm leading-6"
        >
          {message}
        </div>
      ) : null}
    </section>
  );
}
