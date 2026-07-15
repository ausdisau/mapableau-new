"use client";

import React, { useEffect, useState } from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { RouteSteps } from "@/components/access-intelligence/access-plan-card";
import { AccessStatusBadge } from "@/components/access-intelligence/access-status-badge";
import { Button } from "@/components/ui/button";
import type { DecisionStatus, VisitPlan } from "@/lib/access-intelligence/schemas";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function VisitPlansClient() {
  const [plans, setPlans] = useState<VisitPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setError(null);
    const res = await fetch("/api/access-intelligence/visit-plans");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load plans");
      return;
    }
    setPlans(data.plans ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const createDemo = async () => {
    setCreating(true);
    setError(null);
    const res = await fetch("/api/access-intelligence/visit-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placeId: "place-mapable-community-hub",
        passportId: "passport-power-chair",
        destination: "Meeting Room 2.1",
        visitAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      setError(data.error || "Could not create plan");
      return;
    }
    await load();
  };

  return (
    <AccessIntelligenceShell
      title="Saved visit plans"
      description="Structured visit plans with plain-language and map-free route lists. Sharing requires consent elsewhere in Ask Access."
    >
      <Button
        type="button"
        variant="default"
        size="default"
        disabled={creating}
        onClick={() => void createDemo()}
      >
        {creating ? "Saving…" : "Save demo plan (Hub Room 2.1)"}
      </Button>
      {error ? (
        <p className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {plans.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No saved plans yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {plans.map((plan) => (
            <li key={plan.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">{plan.destination}</h2>
                  <p className="text-sm text-slate-600">
                    {plan.placeId}
                    {plan.visitAt
                      ? ` · ${new Date(plan.visitAt).toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <AccessStatusBadge
                  status={plan.accessDecision.status as DecisionStatus}
                />
              </div>
              <ul className="mt-3 list-disc pl-5 text-sm">
                {plan.arrivalInstructions.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              {plan.route ? <RouteSteps route={plan.route} /> : null}
              <Button
                type="button"
                variant="outline"
                size="default"
                className={`mt-3 ${mapableCareFocusRing}`}
                onClick={() => window.print()}
              >
                Print this plan
              </Button>
            </li>
          ))}
        </ul>
      )}
    </AccessIntelligenceShell>
  );
}
