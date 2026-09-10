"use client";

import { useMemo, useState } from "react";

import {
  PARTICIPANT_SUPPORT_PLAN_FIELDS,
  buildConsentedSupportSummary,
  createEmptyParticipantSupportPlan,
  type ConsentedSupportSummary,
  type ParticipantSupportPlan,
  type ParticipantSupportPlanField,
} from "@/lib/ask-mapable/participant-support-plan";

const FIELD_COPY: Record<
  ParticipantSupportPlanField,
  { label: string; prompt: string }
> = {
  noticeFirst: {
    label: "What I notice first",
    prompt: "Changes, feelings or situations you notice before things become harder.",
  },
  thingsICanTry: {
    label: "Things I can try",
    prompt: "Things you choose that can help you get through the next few minutes or hours.",
  },
  groundingPeoplePlaces: {
    label: "People or places that help me feel grounded",
    prompt: "People, places or activities you choose for connection or distraction.",
  },
  peopleIChoose: {
    label: "People I choose to ask for support",
    prompt: "Only people you choose. MapAble will not contact them from this plan.",
  },
  professionalSupports: {
    label: "Professional or crisis supports I choose",
    prompt: "Services, clinicians or crisis supports you would choose to contact.",
  },
  saferEnvironment: {
    label: "Things that make my environment feel safer",
    prompt: "Changes you choose or things you want help arranging. MapAble will not make these changes automatically.",
  },
  communicationAccess: {
    label: "How I communicate",
    prompt: "For example: AAC, text, Auslan, relay, extra response time or one question at a time.",
  },
};

export function ParticipantSupportPlanCard() {
  const [plan, setPlan] = useState<ParticipantSupportPlan>(
    createEmptyParticipantSupportPlan,
  );
  const [selectedFields, setSelectedFields] = useState<
    ParticipantSupportPlanField[]
  >([]);
  const [preview, setPreview] = useState<ConsentedSupportSummary | null>(null);
  const [previewAttempted, setPreviewAttempted] = useState(false);

  const completedCount = useMemo(
    () => PARTICIPANT_SUPPORT_PLAN_FIELDS.filter((field) => plan[field].trim()).length,
    [plan],
  );

  function updateField(field: ParticipantSupportPlanField, value: string) {
    setPlan((current) => ({ ...current, [field]: value.slice(0, 1200) }));
    setPreview(null);
    setPreviewAttempted(false);
  }

  function toggleSelected(field: ParticipantSupportPlanField) {
    setSelectedFields((current) =>
      current.includes(field)
        ? current.filter((item) => item !== field)
        : [...current, field],
    );
    setPreview(null);
    setPreviewAttempted(false);
  }

  function makePreview() {
    setPreviewAttempted(true);
    setPreview(buildConsentedSupportSummary({ plan, selectedFields }));
  }

  function clearPlan() {
    setPlan(createEmptyParticipantSupportPlan());
    setSelectedFields([]);
    setPreview(null);
    setPreviewAttempted(false);
  }

  return (
    <section
      id="my-support-plan"
      aria-labelledby="participant-support-plan-heading"
      className="scroll-mt-24 rounded-xl border border-border bg-card p-5"
    >
      <div className="space-y-2">
        <h2 id="participant-support-plan-heading" className="text-2xl font-bold">
          My support plan
        </h2>
        <p className="leading-6">
          Put your own words in a plan for what can help when things become hard.
          This is <strong>not a risk score or clinical assessment</strong>, and
          finishing it does not mean MapAble has decided you are safe or unsafe.
        </p>
        <p className="text-sm text-muted-foreground">
          This draft stays on this device in this browser session. It is not
          automatically saved to your MapAble account and nothing is sent to a
          person or service. You can leave any section blank.
        </p>
      </div>

      <div className="mt-5 space-y-5">
        {PARTICIPANT_SUPPORT_PLAN_FIELDS.map((field) => {
          const copy = FIELD_COPY[field];
          const fieldId = `support-plan-${field}`;
          const includeId = `support-plan-include-${field}`;
          return (
            <fieldset key={field} className="rounded-lg border border-border p-4">
              <legend className="px-1 font-semibold">{copy.label}</legend>
              <label htmlFor={fieldId} className="mt-1 block text-sm text-muted-foreground">
                {copy.prompt}
              </label>
              <textarea
                id={fieldId}
                aria-label={copy.label}
                value={plan[field]}
                onChange={(event) => updateField(field, event.target.value)}
                rows={3}
                maxLength={1200}
                className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-3 text-base leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <label
                htmlFor={includeId}
                className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <input
                  id={includeId}
                  type="checkbox"
                  checked={selectedFields.includes(field)}
                  onChange={() => toggleSelected(field)}
                  className="h-5 w-5"
                />
                Include {copy.label.toLowerCase()} in a private preview
              </label>
            </fieldset>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        {completedCount} of {PARTICIPANT_SUPPORT_PLAN_FIELDS.length} sections have text.
        Completion is not a safety assessment.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={makePreview}
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Make private preview
        </button>
        <button
          type="button"
          onClick={clearPlan}
          className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Clear this draft
        </button>
      </div>

      {preview ? (
        <section
          data-testid="support-plan-preview"
          aria-labelledby="support-plan-preview-heading"
          className="mt-5 rounded-lg border-2 border-primary/30 bg-muted/30 p-4"
        >
          <h3 id="support-plan-preview-heading" className="text-lg font-bold">
            Private preview
          </h3>
          <p className="mt-1 text-sm font-medium">
            This preview has not been sent or shared.
          </p>
          <dl className="mt-4 space-y-4">
            {preview.sections.map((section) => (
              <div key={section.label}>
                <dt className="font-semibold">{section.label}</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-6">
                  {section.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Selecting a section only prepares this preview. A future sharing
            step must separately ask what you want to share, with whom and why.
          </p>
        </section>
      ) : previewAttempted ? (
        <p className="mt-4 text-sm" role="status">
          Choose at least one section that contains your text before making a preview.
        </p>
      ) : null}
    </section>
  );
}
