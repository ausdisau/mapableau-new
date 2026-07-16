"use client";

import React, { useCallback, useEffect, useState } from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { FictionalBanner } from "@/components/access-intelligence/physical/fictional-banner";
import { Button } from "@/components/ui/button";

type Execution = {
  id: string;
  state: string;
  updatedAt: string;
  proposal: {
    capabilityId: string;
    actionType: string;
    rationale: string;
    label?: string;
  };
  safetyReasons?: string[];
};

export function PhysicalActionsClient() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/access-intelligence/physical/actions");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load actions");
      return;
    }
    setExecutions(data.executions ?? []);
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 4000);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <AccessIntelligenceShell
      title="Physical Systems · Actions"
      description="Approval-gated physical action history. Polling refreshes state; acknowledgement is not success."
    >
      <FictionalBanner />
      <div className="flex gap-3">
        <Button type="button" variant="outline" size="default" onClick={() => void refresh()}>
          Refresh now
        </Button>
      </div>
      {error ? (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="mt-6 space-y-3" aria-live="polite">
        {executions.length === 0 ? (
          <li className="text-sm text-slate-600">No actions yet. Propose one from Concierge plan.</li>
        ) : (
          executions.map((e) => (
            <li key={e.id} className="rounded-xl border border-slate-200 p-4 text-sm">
              <p className="font-bold">
                {e.proposal.actionType} · <span className="text-[#005B7F]">{e.state}</span>
              </p>
              <p className="mt-1 text-slate-600">{e.proposal.rationale}</p>
              <p className="mt-1 text-xs text-slate-500">
                {e.id} · updated {e.updatedAt}
              </p>
              {e.safetyReasons?.length ? (
                <ul className="mt-2 list-disc pl-5 text-slate-600">
                  {e.safetyReasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </AccessIntelligenceShell>
  );
}
