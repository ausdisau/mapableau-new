"use client";

import Link from "next/link";
import { useState } from "react";

import type { MapAbleMissionPlan } from "@/lib/ai/platform/missions/types";

type MissionPresentation = {
  heading: string;
  summary: string;
  readiness: string;
  servicesInvolved: string[];
  sections: Array<{ title: string; body: string; items?: string[] }>;
};

export type MissionViewProps = {
  lifeIntentId?: string;
  initialObjective: string;
  onClose?: () => void;
};

export function MissionView({
  lifeIntentId,
  initialObjective,
  onClose,
}: MissionViewProps) {
  const [objective, setObjective] = useState(initialObjective);
  const [useProfile, setUseProfile] = useState(false);
  const [profileConsent, setProfileConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<MapAbleMissionPlan | null>(null);
  const [presentation, setPresentation] = useState<MissionPresentation | null>(
    null,
  );

  async function buildMission() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/missions/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective: objective.trim(),
          lifeIntentId,
          plainLanguage: true,
          requestedUseOfAccessibilityProfile: useProfile,
          profileConsentGranted: useProfile ? profileConsent : false,
          consentScopes: profileConsent ? ["profile.read"] : [],
          source: lifeIntentId ? "life_intent" : "participant_text",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        plan?: MapAbleMissionPlan;
        presentation?: MissionPresentation;
      };
      if (!res.ok || !data.plan) {
        setError(data.error ?? "Could not build mission plan.");
        return;
      }
      setPlan(data.plan);
      setPresentation(data.presentation ?? null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function rejectRecommendation(recId: string) {
    if (!plan) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/ai/missions/${plan.missionId}/replan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectedRecommendationIds: [recId] }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        plan?: MapAbleMissionPlan;
        presentation?: MissionPresentation;
      };
      if (res.ok && data.plan) {
        setPlan(data.plan);
        setPresentation(data.presentation ?? null);
      }
    } finally {
      setBusy(false);
    }
  }

  const buttonClass =
    "inline-flex min-h-11 items-center justify-center rounded-lg border border-[#005B7F] bg-white px-4 py-2 text-sm font-semibold text-[#0C1833] hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 disabled:opacity-50";

  return (
    <section
      aria-labelledby="mission-view-heading"
      className="rounded-xl border border-slate-200 bg-white p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="mission-view-heading" className="text-xl font-bold">
          Build a mission plan
        </h2>
        {onClose ? (
          <button type="button" className={buttonClass} onClick={onClose}>
            Close
          </button>
        ) : null}
      </div>

      {!plan ? (
        <div className="mt-4 space-y-4">
          <label htmlFor="mission-objective" className="block text-sm font-semibold">
            What do you want to achieve?
          </label>
          <textarea
            id="mission-objective"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useProfile}
              onChange={(e) => setUseProfile(e.target.checked)}
            />
            Use my accessibility profile for functional requirements
          </label>
          {useProfile ? (
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={profileConsent}
                onChange={(e) => setProfileConsent(e.target.checked)}
              />
              I consent to using my profile for this mission only
            </label>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            disabled={busy || !objective.trim()}
            className="inline-flex min-h-11 items-center rounded-lg bg-[#005B7F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={() => void buildMission()}
          >
            {busy ? "Planning…" : "Build mission plan"}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          <p role="status" className="text-sm font-semibold text-[#005B7F]">
            {presentation?.readiness ?? plan.status}
          </p>
          <p className="text-sm text-slate-700">{presentation?.summary ?? plan.summary}</p>

          {presentation?.sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#005B7F]">
                {section.title}
              </h3>
              <p className="mt-1 text-sm text-slate-700">{section.body}</p>
              {section.items?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}

          <div className="space-y-2">
            <h3 className="text-sm font-bold">Recommendations</h3>
            <ul className="space-y-2">
              {plan.recommendations.map((rec) => (
                <li
                  key={rec.id}
                  className="rounded-lg border border-slate-200 p-3 text-sm"
                >
                  <p className="font-semibold">{rec.what}</p>
                  <p className="mt-1 text-slate-600">{rec.why}</p>
                  <button
                    type="button"
                    className={`${buttonClass} mt-2`}
                    disabled={busy}
                    onClick={() => void rejectRecommendation(rec.id)}
                  >
                    Reject this recommendation
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm">
            <Link href={plan.nonAiPath.href} className="font-semibold text-[#005B7F] underline">
              {plan.nonAiPath.label}
            </Link>
            {" — "}
            {plan.nonAiPath.description}
          </p>
        </div>
      )}
    </section>
  );
}
