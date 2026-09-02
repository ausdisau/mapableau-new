"use client";

import Link from "next/link";
import { useState } from "react";

import { ActionReview } from "@/components/personal-agency/ActionReview";
import type { MapAbleActionProposal } from "@/lib/ai/platform/actions";
import type {
  MissionWatchPresentation,
  ParticipantWatchAction,
} from "@/lib/ai/platform/mission-watch/types";
import type {
  MapAbleMissionPlan,
  MissionActionProposal,
} from "@/lib/ai/platform/missions/types";
import type {
  MapAbleRecoveryAlternative,
  MapAbleRecoveryState,
} from "@/lib/ai/platform/recovery/types";

type MissionPresentation = {
  heading: string;
  summary: string;
  readiness: string;
  servicesInvolved: string[];
  sections: Array<{ title: string; body: string; items?: string[] }>;
};

type RecoveryPresentation = {
  heading: string;
  status: string;
  sections: Array<{ title: string; body: string; items?: string[] }>;
};

type WatchPresentation = MissionWatchPresentation;

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
  const [actionFeedback, setActionFeedback] = useState<string[]>([]);
  const [recoveryState, setRecoveryState] =
    useState<MapAbleRecoveryState | null>(null);
  const [recoveryPresentation, setRecoveryPresentation] =
    useState<RecoveryPresentation | null>(null);
  const [watchPresentation, setWatchPresentation] =
    useState<WatchPresentation | null>(null);
  const [watchFeedback, setWatchFeedback] = useState<string | null>(null);

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
      setActionFeedback([]);
      setWatchFeedback(null);
      void loadRecovery(data.plan.missionId);
      void loadWatches(data.plan.missionId);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function loadRecovery(missionId: string) {
    try {
      const res = await fetch(`/api/ai/missions/${missionId}/recovery`);
      if (!res.ok) return;
      const data = (await res.json().catch(() => ({}))) as {
        state?: MapAbleRecoveryState | null;
        presentation?: RecoveryPresentation;
      };
      setRecoveryState(data.state ?? null);
      setRecoveryPresentation(data.presentation ?? null);
    } catch {
      /* optional when flag off */
    }
  }


  async function loadWatches(missionId: string) {
    try {
      const res = await fetch(`/api/ai/missions/${missionId}/watches`);
      if (!res.ok) return;
      const data = (await res.json().catch(() => ({}))) as {
        presentation?: WatchPresentation;
      };
      setWatchPresentation(data.presentation ?? null);
    } catch {
      /* optional when flag off */
    }
  }

  async function runWatchTick(missionId: string) {
    try {
      await fetch(`/api/ai/missions/${missionId}/watches/tick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await loadWatches(missionId);
    } catch {
      /* optional */
    }
  }

  async function applyWatchAction(
    watchId: string,
    action: ParticipantWatchAction,
  ) {
    if (!plan) return;
    setBusy(true);
    setError(null);
    setWatchFeedback(null);
    try {
      const res = await fetch(
        `/api/ai/missions/${plan.missionId}/watches/${watchId}/action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not update watch.");
        return;
      }
      setWatchFeedback(data.message ?? "Watch updated.");
      await loadWatches(plan.missionId);
      if (action === "reassess_now") {
        void loadRecovery(plan.missionId);
      }
    } finally {
      setBusy(false);
    }
  }

  async function selectAlternative(alt: MapAbleRecoveryAlternative) {
    if (!plan) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/ai/missions/${plan.missionId}/recovery/${alt.alternativeId}/select`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        state?: MapAbleRecoveryState;
        candidatePlan?: MapAbleMissionPlan;
        planPresentation?: MissionPresentation;
        recoveryPresentation?: RecoveryPresentation;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not select option.");
        return;
      }
      if (data.candidatePlan) {
        setPlan(data.candidatePlan);
        setPresentation(data.planPresentation ?? null);
      }
      setRecoveryState(data.state ?? null);
      setRecoveryPresentation(data.recoveryPresentation ?? null);
    } finally {
      setBusy(false);
    }
  }

  async function reassess() {
    if (!plan) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/missions/${plan.missionId}/reassess`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        state?: MapAbleRecoveryState;
        presentation?: RecoveryPresentation;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not reassess mission.");
        return;
      }
      setRecoveryState(data.state ?? null);
      setRecoveryPresentation(data.presentation ?? null);
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

          {plan.actionProposals.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold">Proposed actions</h3>
              <p className="text-sm text-slate-600">
                Each action needs your explicit review and approval. Nothing is
                booked, paid, or assigned automatically.
              </p>
              {plan.actionProposals.map((ap) => (
                <ActionReview
                  key={ap.id}
                  missionId={plan.missionId}
                  missionProposalId={ap.id}
                  actionKey={missionActionToKernelKey(ap.action)}
                  purpose={ap.purpose}
                  informationToShare={ap.informationToShare}
                  consentScopes={consentScopesForMissionAction(ap.action)}
                  payload={kernelPayloadFromMissionProposal(ap)}
                  onComplete={(result) => {
                    setActionFeedback((prev) => [
                      ...prev,
                      result.missionFeedback,
                    ]);
                  }}
                />
              ))}
            </div>
          ) : null}

          {actionFeedback.length > 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h3 className="text-sm font-bold">Action results</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {actionFeedback.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {watchPresentation ? (
            <section
              aria-labelledby="mission-watch-heading"
              className="rounded-lg border border-slate-200 bg-slate-50/80 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3
                  id="mission-watch-heading"
                  className="text-sm font-bold uppercase tracking-wide text-[#005B7F]"
                >
                  {watchPresentation.heading}
                </h3>
                <button
                  type="button"
                  className={buttonClass}
                  disabled={busy || !plan}
                  onClick={() => plan && void runWatchTick(plan.missionId)}
                >
                  Check watches now
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-700">{watchPresentation.summary}</p>
              <p className="mt-1 text-sm text-slate-600">
                Watches notice and recommend. They never book, pay, or message for you.
              </p>
              {watchFeedback ? (
                <p role="status" className="mt-2 text-sm font-semibold text-[#0C1833]">
                  {watchFeedback}
                </p>
              ) : null}
              {watchPresentation.sections.map((section) => (
                <div key={section.id} className="mt-4">
                  <h4 className="text-sm font-bold">{section.title}</h4>
                  <p className="mt-1 text-sm text-slate-700">{section.body}</p>
                  {section.items.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">Nothing here right now.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {section.items.map((item) => (
                        <li
                          key={`${section.id}-${item.alertId}`}
                          className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
                        >
                          <p className="font-semibold">{item.title}</p>
                          <p className="mt-1 text-slate-700">{item.body}</p>
                          <p className="mt-1 text-slate-600">{item.recommendation}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.actions.map((action) => (
                              <button
                                key={`${item.alertId}-${action}`}
                                type="button"
                                className={buttonClass}
                                disabled={busy}
                                onClick={() => void applyWatchAction(item.watchId, action)}
                              >
                                {watchActionLabel(action)}
                              </button>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          ) : null}

          {recoveryState ? (
            <section
              aria-labelledby="recovery-heading"
              className="rounded-lg border border-amber-200 bg-amber-50/50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3
                  id="recovery-heading"
                  className="text-sm font-bold uppercase tracking-wide text-[#005B7F]"
                >
                  Mission recovery
                </h3>
                <button
                  type="button"
                  className={buttonClass}
                  disabled={busy}
                  onClick={() => void reassess()}
                >
                  Review changes
                </button>
              </div>
              <p role="status" className="mt-2 text-sm font-semibold">
                {recoveryPresentation?.status ?? recoveryState.status}
              </p>
              {recoveryPresentation?.sections.map((section) => (
                <div key={section.title} className="mt-4">
                  <h4 className="text-sm font-bold">{section.title}</h4>
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
              {recoveryState.alternatives.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-bold">Choose an option</h4>
                  <p className="text-sm text-slate-600">
                    Selecting an option updates your candidate plan and may prepare
                    Action Kernel proposals for your review. Nothing is booked automatically.
                  </p>
                  <ul className="space-y-2">
                    {recoveryState.alternatives.map((alt) => (
                      <li
                        key={alt.alternativeId}
                        className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
                      >
                        <p className="font-semibold">{alt.label}</p>
                        <p className="mt-1 text-slate-600">{alt.summary}</p>
                        <button
                          type="button"
                          className={`${buttonClass} mt-2`}
                          disabled={busy}
                          onClick={() => void selectAlternative(alt)}
                        >
                          Choose this option
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}

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

function watchActionLabel(action: ParticipantWatchAction): string {
  switch (action) {
    case "snooze":
      return "Snooze";
    case "disable_optional":
      return "Disable this watch";
    case "request_human_help":
      return "Request human help";
    case "reassess_now":
      return "Reassess now";
    case "open_evidence":
      return "Open evidence";
    case "take_no_action":
      return "Take no action";
    default: {
      const _never: never = action;
      return _never;
    }
  }
}

function missionActionToKernelKey(
  action: MissionActionProposal["action"],
): MapAbleActionProposal["actionKey"] {
  switch (action) {
    case "prepare_transport_request":
      return "submit_transport_request";
    case "prepare_care_request":
      return "submit_care_request";
    case "prepare_provider_message":
      return "send_provider_message";
    case "request_human_coordination":
      return "request_human_coordination";
    case "prepare_adjustment_request":
      return "save_participant_preference";
    default: {
      const _never: never = action;
      void _never;
      return "request_human_coordination";
    }
  }
}

function consentScopesForMissionAction(
  action: MissionActionProposal["action"],
): string[] {
  switch (action) {
    case "prepare_care_request":
      return ["care.manage"];
    case "prepare_transport_request":
      return ["transport.manage"];
    case "prepare_provider_message":
      return ["messages.send"];
    case "prepare_adjustment_request":
      return ["profile.write"];
    case "request_human_coordination":
      return [];
    default: {
      const _never: never = action;
      void _never;
      return [];
    }
  }
}

function kernelPayloadFromMissionProposal(
  ap: MissionActionProposal,
): Record<string, unknown> {
  const key = missionActionToKernelKey(ap.action);
  if (key === "submit_care_request") {
    return {
      requestType: "employment_support",
      title: "Support for mission goal",
      description: String(
        ap.payload.objective ??
          ap.payload.supportPurpose ??
          "Support request from mission plan",
      ),
    };
  }
  if (key === "submit_transport_request") {
    return {
      pickupAddress: "To be confirmed by participant",
      dropoffAddress: "To be confirmed by participant",
      scheduledStart: new Date(Date.now() + 86_400_000).toISOString(),
      mobilityRequirements: {
        requiresWheelchairAccessible:
          ap.payload.mobilityRequirement ===
          "requires_wheelchair_accessible_vehicle",
      },
    };
  }
  if (key === "request_human_coordination") {
    return {
      category: "general_coordination",
      title: "Mission coordination request",
      summary: String(ap.purpose),
      priority: "attention",
    };
  }
  return ap.payload;
}
