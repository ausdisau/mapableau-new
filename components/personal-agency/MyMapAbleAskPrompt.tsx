"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SUGGESTIONS = [
  "Plan a journey",
  "Find support",
  "Find somewhere accessible",
  "Plan something I want to do",
] as const;

export function MyMapAbleAskPrompt() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/my/ask?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <section
      aria-labelledby="ask-prompt-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 id="ask-prompt-heading" className="text-2xl font-bold text-[#0C1833]">
        What would you like to do?
      </h2>
      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          submit(query);
        }}
      >
        <label htmlFor="my-ask-input" className="sr-only">
          Ask or describe what you want
        </label>
        <input
          id="my-ask-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask or describe what you want…"
          className="min-h-11 flex-1 rounded-lg border border-slate-300 px-4 py-2 text-base focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
        />
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-[#F8C51C] px-6 py-2 text-sm font-bold text-[#0C1833] focus:outline-none focus:ring-4 focus:ring-[#005B7F]/30"
        >
          Ask
        </button>
      </form>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Suggestions
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => submit(s)}
                className="min-h-10 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-[#005B7F] hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
