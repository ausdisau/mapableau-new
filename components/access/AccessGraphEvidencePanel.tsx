"use client";

import { useEffect, useState } from "react";

import type {
  AccessGraphEvidenceDto,
  AccessGraphEvidenceFreshnessState,
} from "@/lib/access/experience/access-graph-evidence-dto";

const FRESHNESS_LABELS: Record<AccessGraphEvidenceFreshnessState, string> = {
  fresh: "Fresh",
  stale: "Review due soon",
  expired: "Outdated",
  unknown_age: "Age unknown",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function featureLabel(value: string): string {
  return value
    .replaceAll(/[._-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function observationValue(
  value: string | number | boolean,
  unit: string | null,
): string {
  const rendered =
    typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return unit ? `${rendered} ${unit}` : rendered;
}

export function AccessGraphEvidencePanel({
  placeId,
  enabled,
}: {
  placeId: string;
  enabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [evidence, setEvidence] = useState<AccessGraphEvidenceDto | null>(null);

  useEffect(() => {
    setExpanded(false);
    setState("idle");
    setEvidence(null);
  }, [placeId]);

  if (!enabled) return null;

  const loadEvidence = async () => {
    if (state === "loading" || evidence) return;

    setState("loading");
    try {
      const response = await fetch(
        `/api/access/places/${encodeURIComponent(placeId)}/graph-evidence`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) {
        throw new Error("Evidence unavailable");
      }

      const payload = (await response.json()) as {
        evidence?: AccessGraphEvidenceDto;
      };
      if (!payload.evidence) {
        throw new Error("Evidence unavailable");
      }

      setEvidence(payload.evidence);
      setState("ready");
    } catch {
      setState("error");
    }
  };

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !evidence && state !== "loading") {
      void loadEvidence();
    }
  };

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-4"
      aria-labelledby="access-graph-evidence-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="access-graph-evidence-heading"
            className="text-lg font-black text-[#0C1833]"
          >
            Why does MapAble say this?
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Inspect feature-level observations, source status and freshness.
            Unknown remains unknown until stronger evidence exists.
          </p>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="access-graph-evidence-details"
          onClick={toggle}
          className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-[#0C1833] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#005B7F] focus:ring-offset-2"
        >
          {expanded ? "Hide evidence" : "Show evidence"}
        </button>
      </div>

      {expanded ? (
        <div id="access-graph-evidence-details" className="mt-4">
          {state === "loading" ? (
            <p className="text-sm text-slate-600" role="status" aria-live="polite">
              Loading feature evidence…
            </p>
          ) : null}

          {state === "error" ? (
            <div
              className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
              role="status"
            >
              <p>
                Detailed graph evidence is not available for this place right
                now. The existing AccessFit summary remains available.
              </p>
              <button
                type="button"
                onClick={() => {
                  setState("idle");
                  void loadEvidence();
                }}
                className="mt-3 min-h-11 rounded-lg border border-amber-300 bg-white px-3 font-semibold"
              >
                Try again
              </button>
            </div>
          ) : null}

          {state === "ready" && evidence ? (
            <>
              <dl className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Features
                  </dt>
                  <dd className="mt-1 text-lg font-black text-[#0C1833]">
                    {evidence.featureCount}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Unverified
                  </dt>
                  <dd className="mt-1 text-lg font-black text-[#0C1833]">
                    {evidence.unverifiedCount}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Outdated
                  </dt>
                  <dd className="mt-1 text-lg font-black text-[#0C1833]">
                    {evidence.expiredCount}
                  </dd>
                </div>
              </dl>

              {evidence.observations.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  No feature-level Access Graph observations are published for
                  this place yet. Missing evidence is unknown, not inaccessible.
                </p>
              ) : (
                <ol className="mt-4 space-y-3" aria-label="Feature evidence">
                  {evidence.observations.map((observation) => (
                    <li
                      key={observation.id}
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-[#0C1833]">
                            {featureLabel(observation.featureKey)}
                          </h3>
                          <p className="mt-1 text-sm text-slate-700">
                            Observed value:{" "}
                            <strong>
                              {observationValue(
                                observation.value,
                                observation.unit,
                              )}
                            </strong>
                          </p>
                        </div>
                        <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                          {observation.provenance.displayLabel}
                        </span>
                      </div>

                      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                        <div>
                          <dt className="font-bold text-slate-500">Observed</dt>
                          <dd className="mt-0.5 text-slate-700">
                            {formatDate(observation.observedAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-bold text-slate-500">Freshness</dt>
                          <dd className="mt-0.5 text-slate-700">
                            {FRESHNESS_LABELS[observation.freshness.state]}
                          </dd>
                        </div>
                      </dl>

                      {observation.confidence != null ? (
                        <p className="mt-2 text-xs text-slate-600">
                          Confidence:{" "}
                          {Math.round(observation.confidence * 100)}%
                        </p>
                      ) : null}

                      {observation.provenance.aiInferred ? (
                        <p className="mt-2 rounded-lg border border-violet-200 bg-violet-50 p-2 text-xs font-semibold text-violet-950">
                          AI-inferred evidence is unverified and cannot be
                          promoted automatically to verified fact.
                        </p>
                      ) : null}

                      {observation.disputed ? (
                        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs font-semibold text-amber-950">
                          This observation is disputed. Review conflicting
                          evidence before relying on it.
                        </p>
                      ) : null}

                      {observation.freshness.state === "expired" ? (
                        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950">
                          This observation is outdated. Conditions may have
                          changed.
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}

              {evidence.observationCount > evidence.observations.length ? (
                <p className="mt-3 text-xs text-slate-500">
                  Showing the {evidence.observations.length} most recent of{" "}
                  {evidence.observationCount} observations.
                </p>
              ) : null}

              <p className="mt-4 text-xs leading-5 text-slate-500">
                {evidence.note}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
