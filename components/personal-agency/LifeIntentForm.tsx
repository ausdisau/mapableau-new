"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LifeIntentForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [expression, setExpression] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/my/life-intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalExpression: expression }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save. Please try again.");
        return;
      }
      router.push(redirectTo ?? `/my/life/${data.id}`);
      router.refresh();
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4"
      aria-labelledby="life-intent-form-title"
    >
      <div>
        <label
          htmlFor="life-intent-expression"
          className="block text-sm font-semibold"
        >
          In your own words
        </label>
        <p id="life-intent-form-title" className="sr-only">
          Add something that matters to you
        </p>
        <textarea
          id="life-intent-expression"
          required
          rows={4}
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          placeholder='For example: "I want to start swimming."'
        />
        <p className="mt-1 text-xs text-slate-600">
          Your words are kept exactly as you write them. MapAble will not
          replace them with an AI summary.
        </p>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-lg bg-[#F8C51C] px-5 py-2 text-sm font-bold text-[#0C1833] disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-[#005B7F]/30"
      >
        {pending ? "Saving…" : "Save to My Life"}
      </button>
    </form>
  );
}
