"use client";

import { useId, useMemo, useState } from "react";

import { assessDayPlan } from "@/lib/day/day-planner";
import { buildDisplayRecoveryOptions } from "@/lib/day/recovery-display";
import {
  MAPABLE_DAY_SCENARIOS,
  makeSyntheticDayPlan,
  type MapAbleDayScenarioId,
} from "@/lib/day/synthetic-fixtures";

/**
 * Continuity scenario explorer — synthetic only; never mutates SOR.
 */
export function DayContinuityDemo() {
  const headingId = useId();
  const [scenarioId, setScenarioId] =
    useState<MapAbleDayScenarioId>("worker_cancelled");

  const { plan, assessment, recovery } = useMemo(() => {
    const nextPlan = makeSyntheticDayPlan(scenarioId);
    const nextAssessment = assessDayPlan(nextPlan);
    const morning =
      nextPlan.activities.find((item) => item.id === "morning-care") ??
      nextPlan.activities[0]!;
    const proposals = buildDisplayRecoveryOptions({ activity: morning });
    return { plan: nextPlan, assessment: nextAssessment, recovery: proposals };
  }, [scenarioId]);

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-4 rounded-2xl border border-dashed border-[#0C1833]/30 bg-white p-5"
      data-testid="day-continuity-demo"
    >
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#005B7F]">
          Synthetic continuity
        </p>
        <h2 id={headingId} className="font-heading text-xl font-bold text-[#0C1833]">
          Continuity scenarios
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Dependency impact only. Recovery options are proposals — they do not
          assign workers, book transport, or change records.
        </p>
      </div>

      <label className="block text-sm font-semibold text-[#0C1833]">
        Scenario
        <select
          className="mt-1 block min-h-11 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 text-sm"
          value={scenarioId}
          onChange={(event) =>
            setScenarioId(event.target.value as MapAbleDayScenarioId)
          }
        >
          {MAPABLE_DAY_SCENARIOS.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.label}
            </option>
          ))}
        </select>
      </label>

      <p className="text-sm text-slate-700" role="status">
        {plan.description}
      </p>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-900">
          Ready {assessment.readyCount}
        </span>
        <span className="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-900">
          Review {assessment.reviewCount}
        </span>
        <span className="rounded-full bg-rose-50 px-3 py-1 font-bold text-rose-900">
          Blocked {assessment.blockedCount}
        </span>
        {assessment.humanReviewRequired ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-800">
            Human review required
          </span>
        ) : null}
      </div>

      <ul className="space-y-2">
        {assessment.activities.map((activity) => {
          const source = plan.activities.find((item) => item.id === activity.activityId);
          return (
            <li
              key={activity.activityId}
              className="rounded-lg border border-slate-200 p-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-[#0C1833]">
                  {source?.title ?? activity.activityId}
                </strong>
                <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-slate-100 px-3 text-xs font-extrabold uppercase tracking-wide text-slate-800">
                  <span aria-hidden="true">●</span>
                  {activity.readiness}
                </span>
              </div>
              {activity.reasons.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                  {activity.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
          Recovery proposals (display only)
        </h3>
        <ul className="mt-2 space-y-2">
          {recovery.map((option) => (
            <li
              key={`${option.source}-${option.id}`}
              className="rounded-lg border border-slate-200 bg-[#F8FBFE] p-3 text-sm"
            >
              <p className="font-bold text-[#0C1833]">{option.label}</p>
              <p className="mt-1 text-slate-700">{option.detail}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Requires your confirmation · never auto-assigns · source:{" "}
                {option.source}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
