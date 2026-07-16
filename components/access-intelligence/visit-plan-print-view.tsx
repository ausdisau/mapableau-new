"use client";

import React from "react";

import type { AgentAccessPlan, AccessibleRoute } from "@/lib/access-intelligence/schemas";

import { AccessStatusBadge } from "./access-status-badge";

export function VisitPlanPrintView({
  plan,
  route,
}: {
  plan: AgentAccessPlan;
  route?: AccessibleRoute | null;
}) {
  const printRoute = route ?? plan.recommendedRoute;
  return (
    <div className="print-only hidden print:block" id="access-intelligence-print">
      <h1 className="text-2xl font-black">Visit plan — MapAble Access Intelligence</h1>
      <p className="mt-2 text-sm">
        Planning support only — not a legal accessibility certification or approved
        evacuation plan.
      </p>
      {plan.status ? <AccessStatusBadge status={plan.status} className="mt-3" /> : null}
      <p className="mt-3">{plan.summary}</p>
      <h2 className="mt-4 text-lg font-bold">Confirmed</h2>
      <ul className="list-disc pl-5">
        {plan.confirmedFeatures.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <h2 className="mt-4 text-lg font-bold">Unknown</h2>
      <ul className="list-disc pl-5">
        {plan.unknowns.map((u) => (
          <li key={u}>{u}</li>
        ))}
      </ul>
      {printRoute ? (
        <>
          <h2 className="mt-4 text-lg font-bold">Route instructions</h2>
          <ol className="list-decimal pl-5">
            {printRoute.steps.map((s) => (
              <li key={s.order}>{s.instruction}</li>
            ))}
          </ol>
        </>
      ) : null}
      <p className="mt-6 text-xs">Generated {plan.lastCheckedAt}</p>
    </div>
  );
}
