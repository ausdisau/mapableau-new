"use client";

import { useState } from "react";

export default function MovesBookPage() {
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/moves/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "telehealth" }),
    });
    setDone(true);
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="font-heading text-2xl font-bold">Book allied health</h1>
      {done ? (
        <p role="status">Request submitted. Your provider will confirm the time.</p>
      ) : (
        <form onSubmit={submit}>
          <button type="submit" className="min-h-11 rounded bg-primary px-4 text-primary-foreground">
            Request telehealth appointment
          </button>
        </form>
      )}
    </main>
  );
}
