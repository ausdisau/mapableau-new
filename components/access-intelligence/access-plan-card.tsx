"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import type { AgentAccessPlan, AccessibleRoute } from "@/lib/access-intelligence/schemas";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

import { AccessStatusBadge, ConfidenceIndicator } from "./access-status-badge";

export function AccessPlanCard({
  plan,
  onRequestVerification,
  onPrint,
}: {
  plan: AgentAccessPlan;
  onRequestVerification?: () => void;
  onPrint?: () => void;
}) {
  if (!plan.status) {
    return (
      <section
        aria-labelledby="access-plan-heading"
        className="rounded-2xl border border-dashed border-slate-300 bg-white p-5"
      >
        <h2 id="access-plan-heading" className="text-lg font-black">
          Access plan
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Ask a question to generate a structured access plan from evidence and your
          passport.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="access-plan-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="access-plan-heading" className="text-lg font-black text-[#0C1833]">
            Access plan
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {plan.placeName ?? "Place"}
            {plan.destination ? ` → ${plan.destination}` : ""}
            {plan.visitAt ? ` · ${new Date(plan.visitAt).toLocaleString()}` : ""}
          </p>
        </div>
        <AccessStatusBadge status={plan.status} />
      </div>

      <p className="mt-4 text-base text-slate-800">{plan.summary}</p>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Personal fit
          </dt>
          <dd className="text-lg font-black text-[#0C1833]">
            {plan.personalFit == null ? "Not scored" : `${plan.personalFit}/100`}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Live reliability
          </dt>
          <dd className="text-lg font-black text-[#0C1833]">
            {plan.liveReliability == null ? "Unknown" : `${plan.liveReliability}/100`}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Baseline
          </dt>
          <dd className="text-lg font-black text-[#0C1833]">
            {plan.baselineScore == null ? "n/a" : `${plan.baselineScore}/100`}
          </dd>
        </div>
      </dl>

      <div className="mt-3">
        <ConfidenceIndicator value={plan.evidenceConfidence} />
        <p className="text-xs text-slate-500">
          Last checked {new Date(plan.lastCheckedAt).toLocaleString()}
        </p>
      </div>

      {plan.blockers.length > 0 ? (
        <PlanList title="Confirmed blockers" items={plan.blockers} tone="danger" />
      ) : null}
      {plan.conditions.length > 0 ? (
        <PlanList title="Conditions" items={plan.conditions} tone="warn" />
      ) : null}
      {plan.unknowns.length > 0 ? (
        <PlanList title="Unknown information" items={plan.unknowns} tone="neutral" />
      ) : null}
      {plan.confirmedFeatures.length > 0 ? (
        <PlanList title="Confirmed" items={plan.confirmedFeatures} tone="ok" />
      ) : null}
      {plan.alternatives.length > 0 ? (
        <PlanList title="Alternatives" items={plan.alternatives} tone="neutral" />
      ) : null}

      {plan.recommendedRoute ? (
        <RouteSteps route={plan.recommendedRoute} />
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {onRequestVerification ? (
          <Button variant="default" size="default" type="button" onClick={onRequestVerification}>
            Review venue verification request
          </Button>
        ) : null}
        {onPrint ? (
          <Button size="default"
            type="button"
            variant="outline"
            onClick={onPrint}
            className={mapableCareFocusRing}
          >
            Print or save visit plan
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function PlanList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "danger" | "warn" | "ok" | "neutral";
}) {
  const border =
    tone === "danger"
      ? "border-red-300"
      : tone === "warn"
        ? "border-amber-300"
        : tone === "ok"
          ? "border-emerald-300"
          : "border-slate-200";
  return (
    <div className={`mt-4 rounded-xl border ${border} p-3`}>
      <h3 className="text-sm font-black text-[#0C1833]">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function RouteSteps({ route }: { route: AccessibleRoute }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-[#F6FBFC] p-3">
      <h3 className="text-sm font-black text-[#0C1833]">Recommended route</h3>
      <p className="mt-1 text-sm text-slate-600">
        {route.fromLabel} → {route.toLabel} · {route.totalDistanceMetres} m · about{" "}
        {route.estimatedAdditionalMinutes} min additional access time
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-800">
        {route.steps.map((step) => (
          <li key={`${step.order}-${step.instruction}`}>
            <span>{step.instruction}</span>
            {step.evidenceConfidence != null ? (
              <span className="ml-2 text-xs text-slate-500">
                (segment confidence {Math.round(step.evidenceConfidence * 100)}%)
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <div className="mt-3 border-t border-slate-200 pt-3">
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Text instructions (map-free)
        </h4>
        <p className="mt-1 whitespace-pre-line text-sm text-slate-800">
          {route.steps.map((s) => s.instruction).join("\n")}
        </p>
      </div>
    </div>
  );
}

export function RouteAlternatives({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <aside className="rounded-xl border border-slate-200 p-3" aria-label="Route alternatives">
      <h3 className="text-sm font-black">Alternatives</h3>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}
