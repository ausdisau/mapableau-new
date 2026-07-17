"use client";

import { useState } from "react";

const TOPICS = [
  { id: "quarterly_reports", label: "Quarterly reports" },
  { id: "corrections", label: "Corrections" },
  { id: "datasets", label: "New datasets" },
  { id: "commitments", label: "Commitment updates" },
  { id: "governance", label: "Governance decisions" },
  { id: "ai_register", label: "AI register changes" },
  { id: "disruptions", label: "Service disruption notices" },
  { id: "accessibility", label: "Accessibility data updates" },
] as const;

export function SubscribeForm() {
  const [topics, setTopics] = useState<string[]>(["corrections", "quarterly_reports"]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function toggleTopic(id: string) {
    setTopics((current) =>
      current.includes(id) ? current.filter((t) => t !== id) : [...current, id]
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/accountability/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topics, channel: "email" }),
      });
      const data = (await response.json()) as { error?: string; ok?: boolean };
      if (!response.ok) {
        setError(data.error ?? "Unable to subscribe");
        return;
      }
      setMessage(
        "Subscription recorded. You can revoke consent at any time by contacting MapAble or unsubscribing from future emails."
      );
      setEmail("");
    } catch {
      setError("Unable to subscribe. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <fieldset>
        <legend className="text-sm font-medium">Topics</legend>
        <ul className="mt-2 space-y-2">
          {TOPICS.map((topic) => (
            <li key={topic.id}>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={topics.includes(topic.id)}
                  onChange={() => toggleTopic(topic.id)}
                  className="h-4 w-4"
                />
                {topic.label}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Consent-based only. We store a hashed email for delivery and never sell
        subscription lists.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-sm text-secondary">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || topics.length === 0}
        className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
      >
        {pending ? "Saving…" : "Subscribe"}
      </button>
    </form>
  );
}
