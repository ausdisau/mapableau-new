"use client";

import { useEffect, useState } from "react";

import type { AccessRequirements } from "@/lib/gais/compatibility";
import { COMPATIBILITY_RESULT_LABELS } from "@/lib/gais/compatibility";
import {
  fetchGaisCompatibility,
  type GaisCompatibilityResponse,
} from "@/lib/gais/client/fetch-compatibility";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

function RuleList({
  title,
  items,
  tone,
}: {
  title: string;
  items: GaisCompatibilityResponse["evaluation"]["rules"];
  tone: "match" | "difficulty" | "unknown" | "conflict";
}) {
  if (!items.length) return null;

  const toneClasses = {
    match: "text-emerald-900",
    difficulty: "text-amber-900",
    unknown: "text-slate-700",
    conflict: "text-rose-900",
  };

  return (
    <div className="mt-2">
      <h5 className="text-xs font-bold uppercase tracking-wide">{title}</h5>
      <ul className={`mt-1 space-y-1 text-xs ${toneClasses[tone]}`}>
        {items.map((rule) => (
          <li key={rule.requirement}>
            <span className="font-semibold">{rule.requirement}:</span> {rule.explanation}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GaisCompatibilityPanel({
  featureId,
  placeId,
  requirements,
  useStoredProfile = false,
}: {
  featureId?: string;
  placeId?: string;
  requirements?: AccessRequirements;
  useStoredProfile?: boolean;
}) {
  const [data, setData] = useState<GaisCompatibilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!featureId && !placeId) return;
    if (!requirements && !useStoredProfile) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchGaisCompatibility({
      featureId,
      placeId,
      requirements,
      useStoredProfile,
      signal: controller.signal,
    })
      .then(setData)
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [featureId, placeId, requirements, useStoredProfile]);

  if (!featureId && !placeId) return null;
  if (!requirements && !useStoredProfile) return null;

  return (
    <section
      className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
      aria-labelledby="gais-compatibility-heading"
    >
      <h4
        id="gais-compatibility-heading"
        className="text-xs font-bold uppercase tracking-wide text-[#005B7F]"
      >
        How this matches your requirements
      </h4>

      {loading ? (
        <p className="mt-2 text-xs text-slate-600">Checking compatibility…</p>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs text-rose-800" role="alert">
          {error}
        </p>
      ) : null}

      {data ? (
        <>
          <p className="mt-2 text-sm font-semibold text-[#0C1833]">
            {COMPATIBILITY_RESULT_LABELS[data.result]}
          </p>

          <RuleList title="Known matches" items={data.evaluation.matches} tone="match" />
          <RuleList
            title="Potential difficulties"
            items={data.evaluation.difficulties}
            tone="difficulty"
          />
          <RuleList title="Known conflicts" items={data.evaluation.conflicts} tone="conflict" />

          {data.evaluation.unknowns.length ? (
            <div className="mt-2">
              <h5 className="text-xs font-bold uppercase tracking-wide">Unknown information</h5>
              <ul className="mt-1 list-disc pl-4 text-xs text-slate-700">
                {data.evaluation.unknowns.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="mt-2 text-xs text-slate-500" role="note">
            This compares recorded environmental facts with your configured requirements. It does
            not determine whether you can or cannot undertake an activity.
          </p>
        </>
      ) : null}

      {!loading && !error && !data ? (
        <button
          type="button"
          className={`mt-2 min-h-9 rounded-lg border border-slate-300 px-2 text-xs font-semibold ${mapableCareFocusRing}`}
          onClick={() => {
            setLoading(true);
            fetchGaisCompatibility({ featureId, placeId, requirements, useStoredProfile })
              .then(setData)
              .catch((err: Error) => setError(err.message))
              .finally(() => setLoading(false));
          }}
        >
          Check requirements
        </button>
      ) : null}
    </section>
  );
}
