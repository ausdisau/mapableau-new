"use client";

import Link from "next/link";
import React, { useId, useState } from "react";

import type { AuraModule, AuraResponse } from "@/lib/aura/schemas";

const MODULE_OPTIONS: Array<{
  id: AuraModule;
  label: string;
  description: string;
}> = [
  {
    id: "core_calendar",
    label: "Core and Calendar",
    description: "Appointments and schedule conflicts",
  },
  {
    id: "transport",
    label: "Transport",
    description: "Accessible transport options",
  },
  {
    id: "access",
    label: "Access",
    description: "Place evidence, fit, and routes",
  },
  {
    id: "access_passport",
    label: "Selected Access Passport",
    description: "Your explicitly selected functional requirements",
  },
  {
    id: "care",
    label: "Care",
    description: "Authorised care summaries (if available)",
  },
  {
    id: "jobs",
    label: "Jobs",
    description: "Interview and workplace access context",
  },
];

type Props = {
  demoEnabled?: boolean;
};

export function AuraMissionBuilder({ demoEnabled = true }: Props) {
  const formId = useId();
  const [goal, setGoal] = useState(
    "Interview in Room 3.12 at Harbour Civic Centre tomorrow at 10:00 am",
  );
  const [modules, setModules] = useState<AuraModule[]>([
    "core_calendar",
    "transport",
    "access",
    "access_passport",
  ]);
  const [profileOptIn, setProfileOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuraResponse | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  function toggleModule(id: AuraModule) {
    setModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setLiveMessage("Building accessibility mission…");
    try {
      const res = await fetch("/api/intelligence/aura/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          selectedModules: modules,
          accessibilityProfileOptIn: profileOptIn,
          placeId: "place-harbour-civic",
          scenarioId: "taylor-harbour-interview",
          userId: "demo-participant-taylor",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AURA request failed");
      }
      setResult(data as AuraResponse);
      setLiveMessage("Mission plan ready for review.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setLiveMessage("Mission could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function onStop() {
    if (!result?.missionId) return;
    setBusy(true);
    setLiveMessage("Stopping AURA…");
    try {
      const res = await fetch(
        `/api/intelligence/aura/missions/${result.missionId}/stop`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: "demo-participant-taylor" }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Stop failed");
      setResult(data.response as AuraResponse);
      setLiveMessage("AURA stopped. Leases revoked. Standard services remain available.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stop failed");
    } finally {
      setBusy(false);
    }
  }

  if (!demoEnabled) {
    return (
      <p role="status">
        MapAble AURA is not enabled. Use the standard Ask MapAble tools below, or
        open the <Link href="/access">access map</Link>.
      </p>
    );
  }

  return (
    <section
      aria-labelledby={`${formId}-heading`}
      className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm"
    >
      <h2 id={`${formId}-heading`} className="text-xl font-semibold text-slate-900">
        Accessibility Mission (AURA)
      </h2>
      <p className="mt-1 text-sm text-slate-700">
        Participant-controlled planning. Agents recommend; you decide; MapAble
        services execute. Wave 1 is read-only — no automatic writes.
      </p>
      <p className="mt-1 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-1">
        Demo uses the synthetic Harbour Civic Centre Living Twin. Not a live venue.
      </p>

      <div className="sr-only" aria-live="polite">
        {liveMessage}
      </div>

      {!result ? (
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor={`${formId}-goal`} className="block text-sm font-medium">
              My goal
            </label>
            <textarea
              id={`${formId}-goal`}
              className="mt-1 w-full rounded border border-slate-400 px-3 py-2 text-sm"
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium">Modules AURA may use</legend>
            <ul className="mt-2 space-y-2">
              {MODULE_OPTIONS.map((m) => (
                <li key={m.id} className="flex items-start gap-2 text-sm">
                  <input
                    id={`${formId}-mod-${m.id}`}
                    type="checkbox"
                    className="mt-1"
                    checked={modules.includes(m.id)}
                    onChange={() => toggleModule(m.id)}
                    aria-describedby={`${formId}-${m.id}-desc`}
                  />
                  <div>
                    <label
                      htmlFor={`${formId}-mod-${m.id}`}
                      className="font-medium"
                    >
                      {m.label}
                    </label>
                    <p
                      id={`${formId}-${m.id}-desc`}
                      className="block text-slate-600"
                    >
                      {m.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </fieldset>

          <div className="flex items-start gap-2 text-sm">
            <input
              id={`${formId}-profile-optin`}
              type="checkbox"
              className="mt-1"
              checked={profileOptIn}
              onChange={(e) => setProfileOptIn(e.target.checked)}
              aria-describedby={`${formId}-profile-optin-desc`}
            />
            <div>
              <label
                htmlFor={`${formId}-profile-optin`}
                className="font-medium"
              >
                Accessibility-profile opt-in
              </label>
              <p
                id={`${formId}-profile-optin-desc`}
                className="block text-slate-600"
              >
                Off by default. Enable only if you want AURA to read your saved
                Accessibility Profile for this mission.
              </p>
            </div>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || modules.length === 0}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Planning…" : "Build mission plan"}
          </button>
        </form>
      ) : (
        <AuraMissionResultView
          result={result}
          busy={busy}
          error={error}
          onStop={onStop}
          onReset={() => {
            setResult(null);
            setError(null);
            setLiveMessage("");
          }}
        />
      )}
    </section>
  );
}

function AuraMissionResultView({
  result,
  busy,
  error,
  onStop,
  onReset,
}: {
  result: AuraResponse;
  busy: boolean;
  error: string | null;
  onStop: () => void;
  onReset: () => void;
}) {
  const stopped = result.missionState === "stopped";
  return (
    <div className="mt-4 space-y-4">
      <AuraAuthorityIndicator
        current={result.authority.currentLevel}
        maximum={result.authority.maximumLevel}
        leaseCount={result.authority.activeCapabilityCount}
      />

      <AuraStopControl
        disabled={busy || stopped}
        onStop={onStop}
      />

      {error ? (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <AuraProofPlanCard plan={result} />
      <AuraMissionGraph graph={result.missionGraph} />
      <AuraUnknownsPanel unknowns={result.unknowns} />
      <AuraBlockersPanel blockers={result.blockers} />
      <AuraEvidencePanel
        facts={result.knownFacts}
        conditions={result.conditions}
        alternatives={result.alternatives}
      />
      <AuraPlanVerifierResult verifier={result.verifier} />
      <AuraHumanReviewPanel review={result.humanReview} />

      <section aria-labelledby="aura-non-ai">
        <h3 id="aura-non-ai" className="text-sm font-semibold">
          Standard non-AI actions
        </h3>
        <ul className="mt-1 list-disc pl-5 text-sm">
          {result.nonAiRoutes.map((r) => (
            <li key={r.href}>
              <a className="underline" href={r.href}>
                {r.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        className="text-sm underline"
        onClick={onReset}
      >
        Start another mission
      </button>
    </div>
  );
}

export function AuraAuthorityIndicator({
  current,
  maximum,
  leaseCount,
}: {
  current: string;
  maximum: string;
  leaseCount: number;
}) {
  return (
    <p
      className="rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
      role="status"
    >
      <span className="font-medium">Authority:</span> {current} (ceiling{" "}
      {maximum}). Active capability leases: {leaseCount}. Text labels accompany
      status — not colour alone.
    </p>
  );
}

export function AuraStopControl({
  disabled,
  onStop,
}: {
  disabled?: boolean;
  onStop: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onStop}
      disabled={disabled}
      className="rounded border-2 border-red-800 bg-red-50 px-4 py-2 text-sm font-semibold text-red-950 disabled:opacity-50"
    >
      Stop AURA
    </button>
  );
}

export function AuraProofPlanCard({ plan }: { plan: AuraResponse }) {
  const p = plan.plan;
  return (
    <section aria-labelledby="aura-plan" className="space-y-2">
      <h3 id="aura-plan" className="text-sm font-semibold">
        Recommended plan
      </h3>
      <p className="text-sm">
        Status: <strong>{p?.status ?? "n/a"}</strong>
        {plan.syntheticDemo ? " (synthetic demo)" : null}
      </p>
      {p?.recommendedRoute ? (
        <p className="text-sm">
          Route: {p.recommendedRoute.entranceLabel} → {p.recommendedRoute.liftLabel}{" "}
          — {p.recommendedRoute.summary}
        </p>
      ) : null}
      <p className="text-sm text-slate-700">
        Why: deterministic fit and route engines evaluated your selected Passport
        against Harbour Civic evidence. Conditions and unknowns are listed below.
      </p>
    </section>
  );
}

export function AuraMissionGraph({
  graph,
}: {
  graph: AuraResponse["missionGraph"];
}) {
  return (
    <section aria-labelledby="aura-graph">
      <h3 id="aura-graph" className="text-sm font-semibold">
        Mission dependency graph
      </h3>
      <p className="text-xs text-slate-600">
        Visual summary with a structured list alternative for screen readers.
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {graph.nodes.map((n) => (
          <li key={n.id}>
            <span className="font-medium">{n.label}</span>
            {" — "}
            <span>
              {n.type}; status {n.status}
            </span>
          </li>
        ))}
      </ul>
      <details className="mt-2 text-sm">
        <summary>Dependencies ({graph.edges.length})</summary>
        <ul className="mt-1 list-disc pl-5">
          {graph.edges.map((e) => (
            <li key={e.id}>
              {e.from} {e.type} {e.to}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

export function AuraUnknownsPanel({ unknowns }: { unknowns: string[] }) {
  return (
    <section aria-labelledby="aura-unknowns">
      <h3 id="aura-unknowns" className="text-sm font-semibold">
        Unknown information
      </h3>
      <ul className="mt-1 list-disc pl-5 text-sm">
        {unknowns.length === 0 ? (
          <li>No unknowns listed.</li>
        ) : (
          unknowns.map((u) => <li key={u}>{u}</li>)
        )}
      </ul>
    </section>
  );
}

export function AuraBlockersPanel({ blockers }: { blockers: string[] }) {
  return (
    <section aria-labelledby="aura-blockers">
      <h3 id="aura-blockers" className="text-sm font-semibold">
        Blockers
      </h3>
      <ul className="mt-1 list-disc pl-5 text-sm">
        {blockers.length === 0 ? (
          <li>No hard blockers on the recommended route (conditions may still apply).</li>
        ) : (
          blockers.map((b) => <li key={b}>{b}</li>)
        )}
      </ul>
    </section>
  );
}

export function AuraEvidencePanel({
  facts,
  conditions,
  alternatives,
}: {
  facts: string[];
  conditions: string[];
  alternatives: string[];
}) {
  return (
    <section aria-labelledby="aura-evidence">
      <h3 id="aura-evidence" className="text-sm font-semibold">
        What information AURA used
      </h3>
      <h4 className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
        Known facts
      </h4>
      <ul className="list-disc pl-5 text-sm">
        {facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <h4 className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
        Conditions
      </h4>
      <ul className="list-disc pl-5 text-sm">
        {conditions.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <h4 className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
        Alternatives
      </h4>
      <ul className="list-disc pl-5 text-sm">
        {alternatives.length === 0 ? (
          <li>None listed.</li>
        ) : (
          alternatives.map((a) => <li key={a}>{a}</li>)
        )}
      </ul>
    </section>
  );
}

export function AuraPlanVerifierResult({
  verifier,
}: {
  verifier: AuraResponse["verifier"];
}) {
  if (!verifier) return null;
  return (
    <section aria-labelledby="aura-verifier">
      <h3 id="aura-verifier" className="text-sm font-semibold">
        Independent plan verifier
      </h3>
      <p className="text-sm">
        Result: <strong>{verifier.status}</strong> ({verifier.verifierVersion})
      </p>
      <ul className="mt-1 list-disc pl-5 text-sm">
        {verifier.findings.length === 0 ? (
          <li>No findings.</li>
        ) : (
          verifier.findings.map((f) => (
            <li key={f.code}>
              [{f.severity}] {f.message}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export function AuraHumanReviewPanel({
  review,
}: {
  review: AuraResponse["humanReview"];
}) {
  return (
    <section aria-labelledby="aura-human">
      <h3 id="aura-human" className="text-sm font-semibold">
        Human-review state
      </h3>
      <p className="text-sm">
        {review.required
          ? `Human review required: ${review.reason ?? "see mission"}`
          : "Human review not required for this read-only plan."}
      </p>
    </section>
  );
}
