"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { FictionalBanner } from "@/components/access-intelligence/physical/fictional-banner";
import { Button } from "@/components/ui/button";

type StoredPlan = {
  id: string;
  passportId: string;
  destinationLabel: string;
  createdAt: string;
  plan: {
    decision: { status: string };
    route: { steps: Array<{ instruction: string }> } | null;
  };
};

export function PhysicalVisitsClient() {
  const [plans, setPlans] = useState<StoredPlan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/access-intelligence/physical/visit-plans");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load visits");
        return;
      }
      setPlans(data.plans ?? []);
    })();
  }, []);

  return (
    <AccessIntelligenceShell
      title="Physical Systems · Visit plans"
      description="Saved Harbour visit plans with deterministic decisions and printable text routes."
    >
      <FictionalBanner />
      <Button asChild variant="default" size="default">
        <Link href="/access-intelligence/physical/plan">Create new plan</Link>
      </Button>
      {error ? (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="mt-6 space-y-4">
        {plans.length === 0 ? (
          <li className="text-sm text-slate-600">No saved physical visit plans yet.</li>
        ) : (
          plans.map((p) => (
            <li key={p.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-bold">
                {p.destinationLabel} · {p.plan.decision.status}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {p.id} · passport {p.passportId} · {p.createdAt}
              </p>
              {p.plan.route ? (
                <ol className="mt-3 list-decimal pl-5 text-sm">
                  {p.plan.route.steps.slice(0, 6).map((s, i) => (
                    <li key={`${p.id}-${i}`}>{s.instruction}</li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-sm text-slate-600">No route stored.</p>
              )}
            </li>
          ))
        )}
      </ul>
    </AccessIntelligenceShell>
  );
}
