"use client";

import { useId, useState } from "react";

export function ExplainThisPage({ summary }: { summary: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <button
        type="button"
        className="min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        Explain this page
      </button>
      {open ? (
        <div id={panelId} className="mt-2 text-sm text-slate-800" role="region">
          <p>{summary}</p>
        </div>
      ) : null}
    </div>
  );
}
