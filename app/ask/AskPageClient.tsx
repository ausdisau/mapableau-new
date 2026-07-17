"use client";

import { useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";

import { AuraMissionBuilder } from "@/components/aura/AuraMissionBuilder";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";

type Mode = "copilot" | "aura";

export function AskPageClient() {
  const searchParams = useSearchParams();
  const initialQuery = useMemo(() => {
    const q = searchParams.get("q")?.trim();
    if (q) return q;

    const provider = searchParams.get("provider")?.trim();
    if (!provider) return undefined;
    const name = provider.replace(/-/g, " ");
    return `Tell me about ${name} and what supports they offer`;
  }, [searchParams]);

  const initialMode: Mode =
    searchParams.get("mode") === "aura" ? "aura" : "copilot";
  const [mode, setMode] = useState<Mode>(initialMode);

  const auraEnabled =
    process.env.NEXT_PUBLIC_MAPABLE_AURA_UI === "true" ||
    process.env.NODE_ENV !== "production";

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Ask MapAble mode"
        className="flex flex-wrap gap-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "copilot"}
          className={`rounded px-3 py-2 text-sm font-medium ${
            mode === "copilot"
              ? "bg-slate-900 text-white"
              : "border border-slate-400 bg-white text-slate-900"
          }`}
          onClick={() => setMode("copilot")}
        >
          Ask MapAble
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "aura"}
          className={`rounded px-3 py-2 text-sm font-medium ${
            mode === "aura"
              ? "bg-slate-900 text-white"
              : "border border-slate-400 bg-white text-slate-900"
          }`}
          onClick={() => setMode("aura")}
        >
          Accessibility Mission (AURA)
        </button>
      </div>

      {mode === "aura" ? (
        <AuraMissionBuilder demoEnabled={auraEnabled} />
      ) : (
        <CopilotPanel initialQuery={initialQuery} />
      )}
    </div>
  );
}
