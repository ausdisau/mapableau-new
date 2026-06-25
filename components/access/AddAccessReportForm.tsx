"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AccessReportPhotoUpload } from "@/components/access/AccessReportPhotoUpload";
import { RATING_CATEGORIES } from "@/lib/access-reviews/access-rating-service";

const VALUES = [
  "not_applicable",
  "unknown",
  "poor",
  "basic",
  "good",
  "excellent",
] as const;

const REPORT_TYPES = [
  ["venue", "Whole venue"],
  ["entrance", "Entrance"],
  ["toilet", "Toilet"],
  ["parking", "Parking"],
  ["route", "Route or path"],
  ["transport_stop", "Public transport stop"],
  ["sensory", "Sensory conditions"],
  ["temporary_alert", "Temporary access issue"],
] as const;

const MOBILITY_CATS = [
  "accessible_parking",
  "public_transport_dropoff",
  "path_to_entrance",
  "main_entrance",
  "doorway",
  "internal_movement",
  "ramps_lifts",
  "accessible_toilet",
  "ambulant_toilet",
];

const OTHER_CATS = RATING_CATEGORIES.filter((c) => !MOBILITY_CATS.includes(c));

export function AddAccessReportForm({ placeId }: { placeId: string }) {
  const router = useRouter();
  const formId = `access-report-${placeId}`;
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [savedDraft, setSavedDraft] = useState(false);

  const steps = ["About your visit", "Mobility access", "Other access", "Notes and photos"];

  async function saveDraft(form: HTMLFormElement, publish = false) {
    setError(null);
    const fd = new FormData(form);
    const key =
      localStorage.getItem(`access-draft-${placeId}`) ??
      crypto.randomUUID();
    localStorage.setItem(`access-draft-${placeId}`, key);

    const allCats = [...MOBILITY_CATS, ...OTHER_CATS];
    const ratings = allCats.map((category) => ({
      category,
      value: String(fd.get(`rating-${category}`) ?? "unknown"),
    }));

    const payload = {
      reportType: String(fd.get("reportType") ?? "venue"),
      reviewBody: String(fd.get("reviewBody") ?? "Draft access report"),
      displayNameMode: String(fd.get("displayNameMode") ?? "anonymous_public"),
      mobilityContext: String(fd.get("mobilityContext") ?? "") || undefined,
      visitDate: fd.get("visitDate")
        ? new Date(String(fd.get("visitDate"))).toISOString()
        : undefined,
      visitedInPerson: fd.get("visitedInPerson") === "on",
      publish,
      draftKey: key,
      ratings,
    };

    const url = reportId
      ? `/api/access/reports/${reportId}`
      : `/api/access/places/${placeId}/reports`;
    const method = reportId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === "string" ? j.error : "Could not save report");
      return null;
    }

    const j = await res.json();
    const id = j.report?.id ?? reportId;
    if (id) setReportId(id);
    setSavedDraft(true);
    return id;
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Report form progress">
        <ol className="flex flex-wrap gap-2 text-sm">
          {steps.map((label, i) => (
            <li
              key={label}
              aria-current={step === i ? "step" : undefined}
              className={
                step === i
                  ? "font-semibold"
                  : "text-muted-foreground"
              }
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>
      </nav>

      <form
        id={formId}
        className="space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const id = await saveDraft(e.currentTarget, true);
          if (id) router.push(`/access/places/${placeId}`);
        }}
      >
        <p className="text-sm text-muted-foreground">
          Describe observed access conditions in plain language. Example: &quot;The
          entrance had one 80 mm step on 20 June 2026.&quot; Avoid legal claims.
        </p>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {savedDraft ? (
          <p className="text-sm text-green-700" role="status">
            Draft saved — you can return later to finish.
          </p>
        ) : null}

        {step === 0 ? (
          <fieldset>
            <legend className="font-medium">About your visit</legend>
            <label className="mt-3 block text-sm">
              Report type
              <select
                name="reportType"
                className="mt-1 block w-full min-h-11 rounded border px-3"
                defaultValue="venue"
              >
                {REPORT_TYPES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm">
              Date visited
              <input
                type="date"
                name="visitDate"
                className="mt-1 block w-full min-h-11 rounded border px-3"
              />
            </label>
            <label className="mt-3 flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name="visitedInPerson" defaultChecked />
              I visited in person
            </label>
            <fieldset className="mt-4">
              <legend className="text-sm font-medium">Public display name</legend>
              <label className="mt-2 flex gap-2">
                <input
                  type="radio"
                  name="displayNameMode"
                  value="anonymous_public"
                  defaultChecked
                />
                Anonymous to public
              </label>
              <label className="mt-1 flex gap-2">
                <input type="radio" name="displayNameMode" value="first_name" />
                First name only
              </label>
            </fieldset>
          </fieldset>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            {MOBILITY_CATS.map((cat) => (
              <fieldset key={cat} className="rounded-lg border p-3">
                <legend className="text-sm font-medium capitalize">
                  {cat.replace(/_/g, " ")}
                </legend>
                <div className="mt-2 flex flex-wrap gap-3">
                  {VALUES.map((v) => (
                    <label key={v} className="flex min-h-11 items-center gap-1 text-sm">
                      <input
                        type="radio"
                        name={`rating-${cat}`}
                        value={v}
                        defaultChecked={v === "unknown"}
                      />
                      {v.replace(/_/g, " ")}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            {OTHER_CATS.map((cat) => (
              <fieldset key={cat} className="rounded-lg border p-3">
                <legend className="text-sm font-medium capitalize">
                  {cat.replace(/_/g, " ")}
                </legend>
                <div className="mt-2 flex flex-wrap gap-3">
                  {VALUES.map((v) => (
                    <label key={v} className="flex min-h-11 items-center gap-1 text-sm">
                      <input
                        type="radio"
                        name={`rating-${cat}`}
                        value={v}
                        defaultChecked={v === "unknown"}
                      />
                      {v.replace(/_/g, " ")}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <>
            <label className="block text-sm">
              <span className="font-medium">Access notes</span>
              <textarea
                name="reviewBody"
                required
                minLength={10}
                rows={5}
                className="mt-1 block w-full rounded border px-3 py-2"
                placeholder="Describe what you observed…"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Your mobility context (optional)</span>
              <input
                name="mobilityContext"
                className="mt-1 block w-full min-h-11 rounded border px-3"
                placeholder="e.g. Manual wheelchair user"
              />
            </label>
            {reportId ? (
              <AccessReportPhotoUpload reportId={reportId} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Save a draft first to add photos.
              </p>
            )}
          </>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {step > 0 ? (
            <button
              type="button"
              className="min-h-11 rounded-lg border px-4"
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </button>
          ) : null}
          {step < steps.length - 1 ? (
            <button
              type="button"
              className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground"
              onClick={async () => {
                const form = document.getElementById(formId) as HTMLFormElement;
                await saveDraft(form, false);
                setStep((s) => s + 1);
              }}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground"
            >
              Submit report
            </button>
          )}
          <button
            type="button"
            className="min-h-11 rounded-lg border px-4"
            onClick={async () => {
              const form = document.getElementById(formId) as HTMLFormElement;
              await saveDraft(form, false);
            }}
          >
            Save draft
          </button>
          <Link
            href={`/access/places/${placeId}`}
            className="inline-flex min-h-11 items-center px-4 text-sm underline"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
