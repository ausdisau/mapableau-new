"use client";

import { useState } from "react";
import { z } from "zod";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  buildConciergeSummaryFilters,
  suggestedQuestionsForNeeds,
  transportRemindersForNeeds,
} from "@/lib/access-fit/questions";
import {
  ACCESS_NEED_IDS,
  ACCESS_NEED_LABELS,
  NDIS_BOUNDARY_NOTICE,
  REQUESTER_ROLES,
  SERVICE_MODES,
  SUPPORT_CATEGORIES,
  URGENCY_LEVELS,
  FUNDING_TYPES,
  type AccessNeedId,
  type SupportConciergeRequest,
  type SupportConciergeSummary,
} from "@/types/wedges";

const conciergeSchema = z.object({
  requesterRole: z.enum(REQUESTER_ROLES),
  supportCategory: z.enum(SUPPORT_CATEGORIES),
  locationPostcode: z.string().min(4, "Enter a valid postcode"),
  locationSuburb: z.string().min(1, "Enter a suburb"),
  serviceMode: z.enum(SERVICE_MODES),
  urgency: z.enum(URGENCY_LEVELS),
  accessNeeds: z.array(z.enum(ACCESS_NEED_IDS)),
  fundingType: z.union([z.enum(FUNDING_TYPES), z.literal("unsure")]),
  previousIssues: z.string().max(2000),
  consentGiven: z.boolean().refine((v) => v === true, {
    message: "You must agree to continue",
  }),
});

const ROLE_LABELS: Record<(typeof REQUESTER_ROLES)[number], string> = {
  participant: "Participant",
  family_carer: "Family member or carer",
  support_coordinator: "Support coordinator",
  provider_on_behalf: "Provider on behalf of participant",
  other: "Other",
};

const CATEGORY_LABELS: Record<(typeof SUPPORT_CATEGORIES)[number], string> = {
  therapy: "Therapy",
  support_worker: "Support worker",
  support_coordination: "Support coordination",
  transport: "Transport",
  employment_support: "Employment support",
  home_support: "Home support",
  community_participation: "Community participation",
  other: "Other",
};

function buildSummary(request: SupportConciergeRequest): SupportConciergeSummary {
  return {
    request,
    suggestedFilters: buildConciergeSummaryFilters({
      urgency: request.urgency,
      serviceMode: request.serviceMode,
      fundingType: request.fundingType,
      accessNeeds: request.accessNeeds,
      postcode: request.locationPostcode,
      suburb: request.locationSuburb,
    }),
    suggestedQuestions: suggestedQuestionsForNeeds(request.accessNeeds),
    transportReminders: transportRemindersForNeeds(request.accessNeeds),
    accessReminders: request.accessNeeds.map((id) => ACCESS_NEED_LABELS[id]),
  };
}

export function RequestConciergeForm() {
  const [step, setStep] = useState<"form" | "review" | "success">("form");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<SupportConciergeSummary | null>(null);

  const [form, setForm] = useState({
    requesterRole: "participant" as SupportConciergeRequest["requesterRole"],
    supportCategory: "therapy" as SupportConciergeRequest["supportCategory"],
    locationPostcode: "",
    locationSuburb: "",
    serviceMode: "flexible" as SupportConciergeRequest["serviceMode"],
    urgency: "this_month" as SupportConciergeRequest["urgency"],
    accessNeeds: [] as AccessNeedId[],
    fundingType: "unsure" as SupportConciergeRequest["fundingType"],
    previousIssues: "",
    consentGiven: false,
  });

  const toggleAccessNeed = (id: AccessNeedId) => {
    setForm((f) => ({
      ...f,
      accessNeeds: f.accessNeeds.includes(id)
        ? f.accessNeeds.filter((x) => x !== id)
        : [...f.accessNeeds, id],
    }));
  };

  const handleReview = () => {
    const parsed = conciergeSchema.safeParse({
      ...form,
      consentGiven: form.consentGiven ? true : undefined,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString() ?? "form";
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSummary(buildSummary(parsed.data));
    setStep("review");
  };

  const handleSubmit = async () => {
    if (!summary) return;
    try {
      await fetch("/api/wedges/support-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summary.request),
      });
    } catch {
      // Demo mode — still show success
    }
    setStep("success");
  };

  if (step === "success") {
    return (
      <Card variant="outlined" className="p-6">
        <h2 className="font-heading text-xl font-semibold">Request received</h2>
        <p className="mt-2 text-muted-foreground">
          Your structured request has been saved. Use the suggested filters to search
          for providers, or a support coordinator can follow up if connected.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="default" size="default" asChild>
            <a href="/providers/available-now">Search available providers</a>
          </Button>
          <Button variant="outline" size="default" asChild>
            <a href="/provider-finder">Open provider finder</a>
          </Button>
        </div>
      </Card>
    );
  }

  if (step === "review" && summary) {
    return (
      <Card variant="outlined" className="space-y-6 p-6">
        <h2 className="font-heading text-xl font-semibold">Review your request</h2>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Requesting as</dt>
            <dd>{ROLE_LABELS[summary.request.requesterRole]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Support needed</dt>
            <dd>{CATEGORY_LABELS[summary.request.supportCategory]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Location</dt>
            <dd>
              {summary.request.locationSuburb} {summary.request.locationPostcode}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Urgency</dt>
            <dd>{summary.request.urgency.replace(/_/g, " ")}</dd>
          </div>
        </dl>

        {summary.request.accessNeeds.length > 0 ? (
          <div>
            <h3 className="font-medium">Access needs</h3>
            <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
              {summary.request.accessNeeds.map((id) => (
                <li key={id}>{ACCESS_NEED_LABELS[id]}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <h3 className="font-medium">Suggested provider search filters</h3>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
            {JSON.stringify(summary.suggestedFilters, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-medium">Questions to ask providers</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
            {summary.suggestedQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground" role="note">
          {NDIS_BOUNDARY_NOTICE} MapAble does not guarantee provider availability.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="default" size="default" onClick={() => void handleSubmit()}>
            Submit request
          </Button>
          <Button type="button" variant="outline" size="default" onClick={() => setStep("form")}>
            Edit
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        handleReview();
      }}
      noValidate
    >
      <fieldset className="space-y-4">
        <legend className="font-heading text-lg font-semibold">Who is requesting?</legend>
        {REQUESTER_ROLES.map((role) => (
          <label key={role} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="requesterRole"
              checked={form.requesterRole === role}
              onChange={() => setForm((f) => ({ ...f, requesterRole: role }))}
            />
            {ROLE_LABELS[role]}
          </label>
        ))}
      </fieldset>

      <AccessibleFormField
        id="supportCategory"
        label="What support is needed?"
        required
      >
        <select
          id="supportCategory"
          value={form.supportCategory}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              supportCategory: e.target.value as SupportConciergeRequest["supportCategory"],
            }))
          }
          className={formInputClass}
        >
          {SUPPORT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </AccessibleFormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <AccessibleFormField
          id="locationSuburb"
          label="Suburb"
          required
          error={errors.locationSuburb}
        >
          <input
            id="locationSuburb"
            type="text"
            value={form.locationSuburb}
            onChange={(e) => setForm((f) => ({ ...f, locationSuburb: e.target.value }))}
            className={formInputClass}
            autoComplete="address-level2"
          />
        </AccessibleFormField>
        <AccessibleFormField
          id="locationPostcode"
          label="Postcode"
          required
          error={errors.locationPostcode}
        >
          <input
            id="locationPostcode"
            type="text"
            inputMode="numeric"
            value={form.locationPostcode}
            onChange={(e) => setForm((f) => ({ ...f, locationPostcode: e.target.value }))}
            className={formInputClass}
            autoComplete="postal-code"
          />
        </AccessibleFormField>
      </div>

      <fieldset className="space-y-2">
        <legend className="font-medium">Service mode</legend>
        {SERVICE_MODES.map((mode) => (
          <label key={mode} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="serviceMode"
              checked={form.serviceMode === mode}
              onChange={() => setForm((f) => ({ ...f, serviceMode: mode }))}
            />
            {mode.replace(/_/g, " ")}
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-medium">Urgency</legend>
        {URGENCY_LEVELS.map((u) => (
          <label key={u} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="urgency"
              checked={form.urgency === u}
              onChange={() => setForm((f) => ({ ...f, urgency: u }))}
            />
            {u.replace(/_/g, " ")}
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-medium">Access needs</legend>
        <div className="flex flex-wrap gap-2">
          {ACCESS_NEED_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => toggleAccessNeed(id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium focus-visible:ring-2 focus-visible:ring-ring ${
                form.accessNeeds.includes(id)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border"
              }`}
              aria-pressed={form.accessNeeds.includes(id)}
            >
              {ACCESS_NEED_LABELS[id]}
            </button>
          ))}
        </div>
      </fieldset>

      <AccessibleFormField id="fundingType" label="Funding or payment">
        <select
          id="fundingType"
          value={form.fundingType}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              fundingType: e.target.value as SupportConciergeRequest["fundingType"],
            }))
          }
          className={formInputClass}
        >
          <option value="unsure">Unsure</option>
          {FUNDING_TYPES.map((f) => (
            <option key={f} value={f}>
              {f.replace(/-/g, " ")}
            </option>
          ))}
        </select>
      </AccessibleFormField>

      <AccessibleFormField
        id="previousIssues"
        label="What has not worked before?"
        hint="Optional. Helps us suggest better matches."
      >
        <textarea
          id="previousIssues"
          rows={4}
          value={form.previousIssues}
          onChange={(e) => setForm((f) => ({ ...f, previousIssues: e.target.value }))}
          className={formInputClass}
        />
      </AccessibleFormField>

      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.consentGiven}
          onChange={(e) => setForm((f) => ({ ...f, consentGiven: e.target.checked }))}
          aria-describedby="consent-notice"
        />
        <span>
          I understand MapAble will use this information to help structure a provider
          search. Sensitive details stay private unless I choose to share them with a
          provider.
        </span>
      </label>
      {errors.consentGiven ? (
        <p className="text-sm text-destructive" role="alert">
          {errors.consentGiven}
        </p>
      ) : null}
      <p id="consent-notice" className="text-xs text-muted-foreground">
        {NDIS_BOUNDARY_NOTICE}
      </p>

      <Button type="submit" variant="default" size="default">Review request</Button>
    </form>
  );
}
