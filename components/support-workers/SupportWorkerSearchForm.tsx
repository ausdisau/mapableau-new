"use client";

import { useCallback, useState } from "react";

import { AccessibleFormField } from "@/components/forms/AccessibleFormField";
import { SupportWorkerMatchCard } from "@/components/support-workers/SupportWorkerMatchCard";
import type { SupportType, WorkerMatch } from "@/types/support-workers";

const SUPPORT_TYPES: { value: SupportType; label: string }[] = [
  { value: "personal_care", label: "Personal care" },
  { value: "domestic_assistance", label: "Domestic assistance" },
  { value: "community_access", label: "Community access" },
  { value: "appointment_support", label: "Appointment support" },
  { value: "employment_support", label: "Employment support" },
  { value: "meal_preparation", label: "Meal preparation" },
  { value: "therapy_assistance", label: "Therapy assistance" },
  { value: "skill_building", label: "Skill building" },
  { value: "overnight_support", label: "Overnight support" },
  { value: "other", label: "Other" },
];

export function SupportWorkerSearchForm() {
  const [supportType, setSupportType] = useState<SupportType>("community_access");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [capabilities, setCapabilities] = useState("");
  const [languages, setLanguages] = useState("");
  const [communicationModes, setCommunicationModes] = useState("");
  const [preferredGender, setPreferredGender] = useState("");
  const [maxDistanceKm, setMaxDistanceKm] = useState("40");
  const [requiresBsp, setRequiresBsp] = useState(false);

  const [matches, setMatches] = useState<WorkerMatch[]>([]);
  const [matchRunId, setMatchRunId] = useState<string | null>(null);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const buildBody = useCallback(
    (extraExclude?: string[]) => ({
      supportType,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      requiredCapabilities: capabilities
        ? capabilities.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
      languages: languages
        ? languages.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
      communicationModes: communicationModes
        ? communicationModes.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
      preferredGender: preferredGender || undefined,
      maxDistanceKm: maxDistanceKm ? Number(maxDistanceKm) : undefined,
      requiresBehaviourSupportPlan: requiresBsp,
      excludeWorkerIds: [...excludeIds, ...(extraExclude ?? [])],
      limit: 10,
    }),
    [
      supportType,
      startsAt,
      endsAt,
      lat,
      lng,
      capabilities,
      languages,
      communicationModes,
      preferredGender,
      maxDistanceKm,
      requiresBsp,
      excludeIds,
    ]
  );

  async function runMatch(extraExclude?: string[]) {
    setLoading(true);
    setError(null);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/support-workers/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(extraExclude)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Match failed");
      setMatches(data.matches ?? []);
      setMatchRunId(data.matchRunId ?? null);
      setStatusMessage(
        `${data.matches?.length ?? 0} workers matched. Results are ranked by fit score with plain-language reasons.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not find matches");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  function requestMoreOptions() {
    const ids = matches.map((m) => m.worker.id);
    setExcludeIds((prev) => [...new Set([...prev, ...ids])]);
    void runMatch(ids);
  }

  return (
    <div className="space-y-8">
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          setExcludeIds([]);
          void runMatch();
        }}
      >
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">What support do you need?</legend>
          <AccessibleFormField label="Support type" id="support-type" required>
            <select
              id="support-type"
              className="w-full rounded-md border px-3 py-2"
              value={supportType}
              onChange={(e) => setSupportType(e.target.value as SupportType)}
            >
              {SUPPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </AccessibleFormField>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="sr-only">When</legend>
          <AccessibleFormField label="Starts" id="starts-at" required>
            <input
              id="starts-at"
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
          </AccessibleFormField>
          <AccessibleFormField label="Ends" id="ends-at" required>
            <input
              id="ends-at"
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required
            />
          </AccessibleFormField>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="sr-only">Location (optional coordinates only)</legend>
          <AccessibleFormField
            label="Latitude"
            id="lat"
            hint="Use map pin or suburb search elsewhere — home address is not sent to external services."
          >
            <input
              id="lat"
              type="number"
              step="any"
              className="w-full rounded-md border px-3 py-2"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </AccessibleFormField>
          <AccessibleFormField label="Longitude" id="lng">
            <input
              id="lng"
              type="number"
              step="any"
              className="w-full rounded-md border px-3 py-2"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </AccessibleFormField>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-base font-semibold">Preferences</legend>
          <AccessibleFormField
            label="Required capabilities"
            id="capabilities"
            hint="Comma-separated, e.g. manual_handling, bsp_trained"
          >
            <input
              id="capabilities"
              className="w-full rounded-md border px-3 py-2"
              value={capabilities}
              onChange={(e) => setCapabilities(e.target.value)}
            />
          </AccessibleFormField>
          <AccessibleFormField label="Languages" id="languages">
            <input
              id="languages"
              className="w-full rounded-md border px-3 py-2"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="English, Auslan"
            />
          </AccessibleFormField>
          <AccessibleFormField label="Communication modes" id="comm-modes">
            <input
              id="comm-modes"
              className="w-full rounded-md border px-3 py-2"
              value={communicationModes}
              onChange={(e) => setCommunicationModes(e.target.value)}
              placeholder="plain_english, aac"
            />
          </AccessibleFormField>
          <AccessibleFormField label="Preferred gender (optional)" id="gender">
            <input
              id="gender"
              className="w-full rounded-md border px-3 py-2"
              value={preferredGender}
              onChange={(e) => setPreferredGender(e.target.value)}
            />
          </AccessibleFormField>
          <AccessibleFormField label="Maximum distance (km)" id="max-km">
            <input
              id="max-km"
              type="number"
              min={1}
              max={500}
              className="w-full rounded-md border px-3 py-2"
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(e.target.value)}
            />
          </AccessibleFormField>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requiresBsp}
              onChange={(e) => setRequiresBsp(e.target.checked)}
            />
            Behaviour support plan trained worker required
          </label>
        </fieldset>

        <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Finding matches…" : "Find support workers"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {statusMessage && (
        <p className="text-sm" role="status" aria-live="polite">
          {statusMessage}
        </p>
      )}

      {matches.length > 0 && (
        <section aria-labelledby="results-heading">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="results-heading" className="text-lg font-semibold">
              Your matches
            </h2>
            <button
              type="button"
              className="rounded border px-3 py-2 text-sm"
              disabled={loading}
              onClick={requestMoreOptions}
            >
              Request more options
            </button>
          </div>
          <ul className="space-y-6" role="list">
            {matches.map((m) => (
              <li key={m.worker.id}>
                <SupportWorkerMatchCard
                  match={m}
                  matchRunId={matchRunId}
                  onAction={() => {
                    setExcludeIds((prev) =>
                      prev.includes(m.worker.id) ? prev : [...prev, m.worker.id]
                    );
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
