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
  const [description, setDescription] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
  const [urgency, setUrgency] = useState(
    (restored?.payload.urgency as string) || "standard",
  );
  const [observedAt, setObservedAt] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [anonymous, setAnonymous] = useState(
    restored?.payload.anonymous === false ? false : true,
  );
  const [consentToContact, setConsentToContact] = useState(false);
  const [errors, setErrors] = useState<FormErrorItem[]>([]);
  const [reference, setReference] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState(
    restored
      ? "Progress restored on this device (category and urgency only). Sensitive description text is not stored locally."
      : "",
  );
  const [loading, setLoading] = useState(false);

  function persistLocal() {
    saveLocalDraft({
      workflowKey: WORKFLOW_KEY,
      stepId: "details",
      payload: {
        category,
        urgency,
        placeSlug,
        placeName,
        anonymous,
        stepId: "details",
      },
    });
    setDraftMessage(
      "Progress saved on this device. Description and contact details are not stored in local browser storage.",
    );
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
      <DraftStatus message={draftMessage || "You can save a partial draft without a full description."} />

      {urgency === "safety_critical" ? (
        <div
          className="rounded-xl border-2 border-red-800 bg-red-50 p-4 text-sm text-red-950"
          role="alert"
          data-testid="barrier-emergency-boundary"
        >
          <p className="font-black">This is not emergency monitoring</p>
          <p className="mt-1">
            MapAble does not provide emergency response. If anyone is in
            immediate danger, call emergency services now (000 in Australia).
            Use this form for non-emergency access barrier reporting and
            follow-up only.
          </p>
        </div>
      ) : null}

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
        hint="Required for final submission. Drafts may be empty or short. Image upload is deferred — describe the barrier in text."
        error={errors.find((item) => item.id === "barrier-description")?.message}
      >
        <textarea
          id="barrier-description"
          className={formInputClass}
          rows={5}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
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

      <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        Photo upload is deferred until a keyboard-accessible, MIME-restricted
        upload service is wired. Do not paste remote image URLs — they are not
        accepted.
      </p>

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
          Save progress on this device
        </Button>
      </div>
    </form>
  );
}
