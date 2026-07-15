"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

const STARTERS = [
  "Can I reach the meeting room on level three in my power chair?",
  "Find a quiet café with a step-free entrance and accessible toilet.",
  "Which entrance should I use at the demo civic centre?",
  "Check whether the lift is operating before my appointment.",
  "Build a visit plan that I can share with my support worker.",
  "I have an interview in Room 3.12 at Harbour Civic Centre tomorrow at 10 am. Can I get there?",
];

export function StarterPrompts({
  onSelect,
  disabled,
}: {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <section aria-labelledby="starter-prompts-heading" className="space-y-3">
      <h2 id="starter-prompts-heading" className="text-lg font-black text-[#0C1833]">
        Starter prompts
      </h2>
      <ul className="grid gap-2 md:grid-cols-2">
        {STARTERS.map((prompt) => (
          <li key={prompt}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(prompt)}
              className={`w-full min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:border-[#005B7F] hover:bg-[#F6FBFC] disabled:opacity-50 ${mapableCareFocusRing}`}
            >
              {prompt}
            </button>
          </li>
        ))}
      </ul>
      <Button size="default"
        type="button"
        variant="outline"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      >
        Starters
      </Button>
    </section>
  );
}
