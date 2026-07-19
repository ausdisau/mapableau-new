"use client";

import { useMemo, useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { FormErrorSummary, type FormErrorItem } from "@/components/forms/FormErrorSummary";
import { DraftStatus } from "@/components/forms/step/DraftStatus";
import { Button } from "@/components/ui/button";
import { clearLocalDraft, loadLocalDraft, saveLocalDraft } from "@/lib/form-drafts/draft-storage";

const CATEGORIES = [
  ["entrance", "Entrance"],
  ["lift", "Lift"],
  ["toilet", "Toilet"],
  ["parking_dropoff", "Parking / drop-off"],
  ["path_surface", "Path or surface"],
  ["signage", "Signage"],
  ["communication", "Communication"],
  ["sensory_environment", "Sensory environment"],
  ["website_booking", "Website or booking system"],
  ["staff_service_process", "Staff or service process"],
  ["incorrect_mapable_information", "Incorrect MapAble information"],
  ["other", "Other"],
] as const;

const WORKFLOW_KEY = "access-barrier-report";

export function BarrierReportForm({
  placeSlug,
  placeName,
}: {
  placeSlug?: string;
  placeName?: string;
}) {
  const restored = useMemo(() => loadLocalDraft(WORKFLOW_KEY), []);
  const [category, setCategory] = useState(
    (restored?.payload.category as string) || "entrance",
  );
  const [description, setDescription] = useState(
    (restored?.payload.description as string) || "",
  );
  const [locationDetail, setLocationDetail] = useState(
    (restored?.payload.locationDetail as string) || "",
  );
  const [urgency, setUrgency] = useState(
    (restored?.payload.urgency as string) || "standard",
  );
  const [observedAt, setObservedAt] = useState(
    (restored?.payload.observedAt as string) || "",
  );
  const [imageUrl, setImageUrl] = useState("");
  const [imageDescription, setImageDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [consentToContact, setConsentToContact] = useState(false);
  const [errors, setErrors] = useState<FormErrorItem[]>([]);
  const [reference, setReference] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState(
    restored ? "Draft restored on this device." : "",
  );
  const [loading, setLoading] = useState(false);

  function persistLocal() {
    saveLocalDraft({
      workflowKey: WORKFLOW_KEY,
      stepId: "details",
      payload: {
        category,
        description,
        locationDetail,
        urgency,
        observedAt,
        placeSlug,
        placeName,
      },
    });
    setDraftMessage("Draft saved on this device.");
  }

  async function submit(isDraft: boolean) {
    setErrors([]);
    setLoading(true);
    const res = await fetch("/api/access-barrier-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        description,
        locationDetail: locationDetail || undefined,
        urgency,
        observedAt: observedAt
          ? new Date(`${observedAt}T12:00:00.000Z`).toISOString()
          : undefined,
        placeSlug,
        placeName,
        imageUrl: imageUrl || undefined,
        imageDescription: imageDescription || undefined,
        contactEmail: anonymous ? undefined : contactEmail || undefined,
        anonymous,
        consentToContact,
        isDraft,
      }),
    });
    setLoading(false);
    const data = (await res.json()) as {
      error?: string;
      details?: { fieldErrors?: Record<string, string[]> };
      report?: { referenceNumber: string };
    };
    if (!res.ok) {
      const fieldErrors = data.details?.fieldErrors ?? {};
      const nextErrors = Object.entries(fieldErrors).flatMap(([field, messages]) =>
        (messages ?? []).map((message) => ({
          id: `barrier-${field}`,
          message,
        })),
      );
      setErrors(
        nextErrors.length
          ? nextErrors
          : [{ id: "barrier-description", message: data.error || "Could not submit." }],
      );
      document.getElementById("form-error-summary")?.focus();
      return;
    }
    clearLocalDraft(WORKFLOW_KEY);
    setReference(data.report?.referenceNumber ?? null);
    setDraftMessage(isDraft ? "Draft saved to MapAble." : "Report submitted.");
  }

  if (reference) {
    return (
      <div
        className="rounded-2xl border border-emerald-700 bg-emerald-50 p-5"
        role="status"
        data-testid="barrier-report-confirmation"
      >
        <h2 className="text-xl font-black text-emerald-950">Thank you</h2>
        <p className="mt-2 text-sm text-emerald-950">
          Your access barrier report reference is <strong>{reference}</strong>.
          Reporter details are not shown publicly. You can follow up through
          Contact if you chose to share contact details.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      data-testid="barrier-report-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(false);
      }}
    >
      <FormErrorSummary errors={errors} />
      <DraftStatus message={draftMessage || "You can save a draft without an image."} />

      <AccessibleFormField id="barrier-category" label="Barrier category">
        <select
          id="barrier-category"
          className={formInputClass}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {CATEGORIES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </AccessibleFormField>

      <AccessibleFormField
        id="barrier-description"
        label="Plain-language description"
        hint="Describe what blocked access. Images are optional."
        error={errors.find((item) => item.id === "barrier-description")?.message}
      >
        <textarea
          id="barrier-description"
          className={formInputClass}
          rows={5}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
      </AccessibleFormField>

      <AccessibleFormField id="barrier-location" label="Location detail (optional)">
        <input
          id="barrier-location"
          className={formInputClass}
          value={locationDetail}
          onChange={(event) => setLocationDetail(event.target.value)}
          placeholder="Example: Side entrance on George Street"
        />
      </AccessibleFormField>

      <AccessibleFormField id="barrier-urgency" label="Urgency">
        <select
          id="barrier-urgency"
          className={formInputClass}
          value={urgency}
          onChange={(event) => setUrgency(event.target.value)}
        >
          <option value="low">Low</option>
          <option value="standard">Standard</option>
          <option value="high">High</option>
          <option value="safety_critical">Safety critical</option>
        </select>
      </AccessibleFormField>

      <AccessibleFormField id="barrier-observed" label="Date observed (optional)">
        <input
          id="barrier-observed"
          type="date"
          className={formInputClass}
          value={observedAt}
          onChange={(event) => setObservedAt(event.target.value)}
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="barrier-image"
        label="Optional image URL"
        hint="Upload is keyboard accessible via URL or future file picker. Do not rely on drag-and-drop alone."
      >
        <input
          id="barrier-image"
          type="url"
          className={formInputClass}
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="barrier-image-description"
        label="Image description"
        hint="Required if you add an image."
      >
        <input
          id="barrier-image-description"
          className={formInputClass}
          value={imageDescription}
          onChange={(event) => setImageDescription(event.target.value)}
        />
      </AccessibleFormField>

      <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-black">Contact and consent</legend>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(event) => setAnonymous(event.target.checked)}
          />
          Report anonymously (allowed where policy permits)
        </label>
        {!anonymous ? (
          <>
            <AccessibleFormField id="barrier-email" label="Contact email (optional)">
              <input
                id="barrier-email"
                type="email"
                className={formInputClass}
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                autoComplete="email"
              />
            </AccessibleFormField>
            <label className="flex min-h-11 items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={consentToContact}
                onChange={(event) => setConsentToContact(event.target.checked)}
              />
              I consent to MapAble contacting me about this report. My details will
              not be shown publicly.
            </label>
          </>
        ) : null}
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="default" size="default" loading={loading}>
          Submit barrier report
        </Button>
        <Button
          type="button"
          variant="outline"
          size="default"
          loading={loading}
          onClick={() => {
            persistLocal();
            void submit(true);
          }}
        >
          Save as draft
        </Button>
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={persistLocal}
        >
          Save on this device
        </Button>
      </div>
    </form>
  );
}
