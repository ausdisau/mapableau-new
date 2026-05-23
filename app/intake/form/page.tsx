"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function IntakeFormPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);

  async function start() {
    const res = await fetch("/api/intake/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "form" }),
    });
    const data = await res.json();
    setSessionId(data.session.id);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sessionId) return;
    const form = new FormData(e.currentTarget);
    await fetch(`/api/intake/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "user",
        content: String(form.get("summary")),
      }),
    });
    await fetch(`/api/intake/sessions/${sessionId}/extract`, { method: "POST" });
    router.push(`/intake/review/${sessionId}`);
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="font-heading text-2xl font-bold">Step-by-step intake</h1>
      {!sessionId ? (
        <button type="button" onClick={start} className="min-h-11 rounded bg-primary px-4 text-primary-foreground">
          Start
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <label htmlFor="summary" className="block text-sm font-medium">
            What support do you need?
          </label>
          <textarea id="summary" name="summary" rows={5} required className="w-full rounded border p-3" />
          <button type="submit" className="min-h-11 rounded bg-primary px-4 text-primary-foreground">
            Review draft request
          </button>
        </form>
      )}
    </main>
  );
}
