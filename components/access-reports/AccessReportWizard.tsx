"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  AccessReportDomainStep,
  collectRatingsFromForm,
  getAllDomainSteps,
} from "@/components/access-reports/AccessReportDomainStep";
import { AccessReportPhotoUpload } from "@/components/access-reports/AccessReportPhotoUpload";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { ACCESS_LABELS } from "@/lib/access-map/copy";
import { DOMAIN_LABELS } from "@/lib/access-reports/access-domain-config";

const REPORT_TYPES = [
  { value: "venue", label: "Whole venue" },
  { value: "toilet", label: "Toilet" },
  { value: "parking", label: "Parking" },
  { value: "entrance", label: "Entrance" },
  { value: "route", label: "Route or path" },
  { value: "transport_stop", label: "Public transport stop" },
  { value: "sensory", label: "Sensory conditions" },
  { value: "temporary_alert", label: "Temporary access issue" },
] as const;

const STEPS = ["type", ...getAllDomainSteps(), "evidence", "review"] as const;

export function AccessReportWizard({
  placeId,
  placeName,
  draftId,
}: {
  placeId: string;
  placeName: string;
  draftId?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportId, setReportId] = useState<string | undefined>(draftId);
  const stepId = STEPS[step]!;
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  function goNext() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    stepHeadingRef.current?.focus();
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
    stepHeadingRef.current?.focus();
  }

  async function saveDraft(publish = false) {
    if (!formRef.current) return;
    setError(null);
    setLoading(true);
    const fd = new FormData(formRef.current);
    const ratings = collectRatingsFromForm(fd);
    const payload = {
      reportType: String(fd.get("reportType") ?? "venue"),
      displayNameMode: String(fd.get("displayNameMode") ?? "anonymous_public"),
      reviewBody: String(fd.get("reviewBody") ?? ""),
      mobilityContext: String(fd.get("mobilityContext") ?? "") || undefined,
      evidenceNotes: String(fd.get("evidenceNotes") ?? "") || undefined,
      visitedInPerson: fd.get("visitedInPerson") === "on",
      visitDate: fd.get("visitDate")
        ? new Date(String(fd.get("visitDate"))).toISOString()
        : undefined,
      publish,
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
    setLoading(false);

    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Could not save report");
      return null;
    }

    const j = await res.json();
    const id = j.report?.id ?? reportId;
    if (id) setReportId(id);
    return id;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = await saveDraft(true);
    if (id) router.push(`/access/places/${placeId}`);
  }

  return (
    <form ref={formRef} className="space-y-6" onSubmit={onSubmit}>
      <p className="text-sm text-muted-foreground">{ACCESS_LABELS.reportGuidance}</p>

      <div aria-live="polite" className="text-sm text-muted-foreground">
        Step {step + 1} of {STEPS.length}
      </div>

      <h2
        ref={stepHeadingRef}
        tabIndex={-1}
        className="text-xl font-semibold outline-none"
      >
        {stepId === "type"
          ? "What are you reporting?"
          : stepId === "evidence"
            ? "Add evidence"
            : stepId === "review"
              ? "Review and submit"
              : DOMAIN_LABELS[stepId as keyof typeof DOMAIN_LABELS]}
      </h2>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {stepId === "type" ? (
        <div className="space-y-4">
          <AccessibleFormField id="reportType" label="Report type" required>
            <select id="reportType" name="reportType" className={formInputClass} defaultValue="venue">
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </AccessibleFormField>

          <fieldset>
            <legend className="text-sm font-medium">Public display name</legend>
            <label className="mt-2 flex min-h-11 items-center gap-2">
              <input type="radio" name="displayNameMode" value="anonymous_public" defaultChecked />
              Anonymous to public
            </label>
            <label className="mt-1 flex min-h-11 items-center gap-2">
              <input type="radio" name="displayNameMode" value="first_name" />
              First name only
            </label>
            <label className="mt-1 flex min-h-11 items-center gap-2">
              <input type="radio" name="displayNameMode" value="named" />
              Full name
            </label>
          </fieldset>
        </div>
      ) : null}

      {getAllDomainSteps().includes(stepId as never) ? (
        <AccessReportDomainStep domain={stepId as never} />
      ) : null}

      {stepId === "evidence" ? (
        <div className="space-y-4">
          <AccessibleFormField
            id="reviewBody"
            label="Describe what you observed"
            hint="Use plain language. Describe steps, widths, noise levels, staff responses, etc."
            required
          >
            <textarea
              id="reviewBody"
              name="reviewBody"
              rows={5}
              required
              minLength={10}
              className={formInputClass}
              placeholder="Example: The main entrance had one 80mm step and no handrail."
            />
          </AccessibleFormField>

          <AccessibleFormField id="evidenceNotes" label="Additional notes">
            <textarea
              id="evidenceNotes"
              name="evidenceNotes"
              rows={3}
              className={formInputClass}
            />
          </AccessibleFormField>

          <AccessibleFormField id="visitDate" label="Date visited">
            <input id="visitDate" name="visitDate" type="date" className={formInputClass} />
          </AccessibleFormField>

          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="visitedInPerson" />
            I visited in person
          </label>

          {reportId ? (
            <AccessReportPhotoUpload reportId={reportId} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Save a draft first to upload photos, or continue to review.
            </p>
          )}
        </div>
      ) : null}

      {stepId === "review" ? (
        <div className="space-y-4">
          <p className="text-sm">
            Your report will be labelled as community-reported information. It is
            not a legal compliance assessment.
          </p>
          <p className="text-sm text-muted-foreground">
            Place: {placeName}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {step > 0 ? (
          <Button type="button" variant="outline" size="default" onClick={goBack}>
            Back
          </Button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="default"
              loading={loading}
              onClick={async () => {
                await saveDraft(false);
                goNext();
              }}
            >
              Save draft & continue
            </Button>
            <Button type="button" variant="default" size="default" onClick={goNext}>
              Continue
            </Button>
          </>
        ) : (
          <Button type="submit" variant="default" size="default" loading={loading}>
            Submit report
          </Button>
        )}
      </div>
    </form>
  );
}
