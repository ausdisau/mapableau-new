"use client";

import { useMemo, useState } from "react";

import { evaluatePlaceCompatibility } from "@/lib/digital-twin/compatibility";
import { DEMO_ACCESS_PROFILES } from "@/lib/digital-twin/sample-data";
import type {
  AccessNeedProfile,
  ManualAccessNeeds,
  TwinCompatibilityResult,
  TwinFeature,
  TwinPathSegment,
  TwinPlace,
} from "@/lib/digital-twin/types";
type Props = {
  place: TwinPlace;
  features: TwinFeature[];
  pathSegments: TwinPathSegment[];
  demoProfiles?: AccessNeedProfile[];
};

const MANUAL_OPTIONS: { key: keyof ManualAccessNeeds; label: string }[] = [
  { key: "wheelchairOrMobilityAid", label: "Wheelchair or mobility aid" },
  { key: "needsStepFreeEntrance", label: "Needs step-free entrance" },
  { key: "needsAccessibleToilet", label: "Needs accessible toilet" },
  { key: "needsQuietSpace", label: "Needs quiet space" },
  { key: "needsHearingSupport", label: "Needs hearing support" },
  { key: "needsPlainLanguageInfo", label: "Needs plain-language information" },
  { key: "needsAssistanceAnimalReadiness", label: "Needs assistance animal readiness" },
  { key: "needsRampVehicleDropoff", label: "Needs ramp vehicle / drop-off" },
  { key: "needsFatigueBuffer", label: "Needs fatigue buffer / rest time" },
];

export function CompatibilityChecker({
  place,
  features,
  pathSegments,
  demoProfiles = DEMO_ACCESS_PROFILES,
}: Props) {
  const [mode, setMode] = useState<"demo" | "manual">("demo");
  const [profileId, setProfileId] = useState(demoProfiles[0]?.id ?? "");
  const [manualNeeds, setManualNeeds] = useState<ManualAccessNeeds>({});

  const result: TwinCompatibilityResult | null = useMemo(() => {
    if (mode === "demo" && profileId) {
      const profile = demoProfiles.find((p) => p.id === profileId);
      if (!profile) return null;
      return evaluatePlaceCompatibility(place, features, pathSegments, profile);
    }
    if (mode === "manual" && Object.values(manualNeeds).some(Boolean)) {
      return evaluatePlaceCompatibility(place, features, pathSegments, manualNeeds, "manual");
    }
    return null;
  }, [mode, profileId, manualNeeds, place, features, pathSegments, demoProfiles]);

  return (
    <section aria-labelledby="compat-heading" className="rounded-xl border border-border p-5">
      <h2 id="compat-heading" className="text-lg font-semibold">
        Check compatibility (demo)
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This demo check runs locally and does not save your access needs. Create an Access Pass
        later if you want to store and share preferences.
      </p>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium">Choose check mode</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          <label className="inline-flex min-h-11 items-center gap-2 text-sm">
            <input
              type="radio"
              name="compat-mode"
              checked={mode === "demo"}
              onChange={() => setMode("demo")}
            />
            Demo profile
          </label>
          <label className="inline-flex min-h-11 items-center gap-2 text-sm">
            <input
              type="radio"
              name="compat-mode"
              checked={mode === "manual"}
              onChange={() => setMode("manual")}
            />
            Select needs manually
          </label>
        </div>
      </fieldset>

      {mode === "demo" ? (
        <div className="mt-4">
          <label htmlFor="demo-profile" className="block text-sm font-medium">
            Demo access profile
          </label>
          <select
            id="demo-profile"
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
          >
            {demoProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName} (demo)
              </option>
            ))}
          </select>
        </div>
      ) : (
        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Your access needs (not saved)</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {MANUAL_OPTIONS.map(({ key, label }) => (
              <label key={key} className="inline-flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(manualNeeds[key])}
                  onChange={(e) =>
                    setManualNeeds((prev) => ({ ...prev, [key]: e.target.checked }))
                  }
                  className="size-4 rounded border-border"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div aria-live="polite" aria-atomic="true" className="mt-6">
        {result ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">
              Compatibility score:{" "}
              <strong>{result.compatibilityScore}</strong>
              <span className="sr-only"> out of 100</span>
              <span aria-hidden="true">/100</span>
              {" · "}
              Confidence: {result.confidence}
            </p>
            <p className="mt-2 text-sm">{result.explanationPlainLanguage}</p>
            {result.matchedNeeds.length > 0 && (
              <div className="mt-3">
                <h3 className="text-sm font-semibold">Matched needs</h3>
                <ul className="mt-1 list-inside list-disc text-sm">
                  {result.matchedNeeds.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.barriers.length > 0 && (
              <div className="mt-3">
                <h3 className="text-sm font-semibold">Barriers</h3>
                <ul className="mt-1 list-inside list-disc text-sm text-destructive">
                  {result.barriers.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.unknowns.length > 0 && (
              <div className="mt-3">
                <h3 className="text-sm font-semibold">Needs confirmation</h3>
                <ul className="mt-1 list-inside list-disc text-sm">
                  {result.unknowns.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.recommendedActions.length > 0 && (
              <div className="mt-3">
                <h3 className="text-sm font-semibold">Recommended actions</h3>
                <ul className="mt-1 list-inside list-disc text-sm">
                  {result.recommendedActions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select a demo profile or choose access needs to see compatibility results.
          </p>
        )}
      </div>
    </section>
  );
}
