"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { DocumentUploadPlaceholder } from "@/components/onboarding/DocumentUploadPlaceholder";
import { FundingTypeSelector } from "@/components/onboarding/FundingTypeSelector";
import { SaveAndContinueButton } from "@/components/onboarding/SaveAndContinueButton";
import { RegistrationErrorSummary } from "@/components/registration/RegistrationErrorSummary";
import {
  fieldErrorsToMap,
  postOnboarding,
} from "@/lib/registration/client-api";

export function ParticipantOnboardingForm() {
  const router = useRouter();
  const [preferredName, setPreferredName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [participantType, setParticipantType] = useState("");
  const [fundingType, setFundingType] = useState("");
  const [primaryServiceRegion, setPrimaryServiceRegion] = useState("");
  const [mainSupportGoals, setMainSupportGoals] = useState("");
  const [accessNeedsSummary, setAccessNeedsSummary] = useState("");
  const [ndisNumber, setNdisNumber] = useState("");
  const [showNdis, setShowNdis] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);
        setStatus("Saving your participant profile…");
        const result = await postOnboarding("/api/onboarding/participant", {
          preferredName,
          dateOfBirth,
          participantType,
          fundingType,
          primaryServiceRegion,
          mainSupportGoals,
          accessNeedsSummary,
          communicationPreferences: ["plain_language"],
          consentPreferences: { shareAccessNeedsWithProviders: true },
          ndisNumber: showNdis && ndisNumber ? ndisNumber : undefined,
        });
        setLoading(false);
        if (!result.success) {
          setErrors(fieldErrorsToMap(result.errors));
          setStatus("");
          return;
        }
        router.push(result.nextStep ?? "/onboarding/complete");
      }}
      noValidate
    >
      <RegistrationErrorSummary errors={errors} />

      <AccessibleFormField
        id="preferredName"
        label="Preferred name"
        required
        error={errors.preferredName}
      >
        <input
          id="preferredName"
          className={formInputClass}
          value={preferredName}
          onChange={(e) => setPreferredName(e.target.value)}
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="dateOfBirth"
        label="Date of birth"
        required
        error={errors.dateOfBirth}
      >
        <input
          id="dateOfBirth"
          type="date"
          className={formInputClass}
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="participantType"
        label="How do you manage your supports?"
        required
        error={errors.participantType}
      >
        <select
          id="participantType"
          className={formInputClass}
          value={participantType}
          onChange={(e) => setParticipantType(e.target.value)}
        >
          <option value="">Select…</option>
          <option value="self_managed">Self-managed</option>
          <option value="plan_managed">Plan-managed</option>
          <option value="ndia_managed">NDIA-managed</option>
          <option value="exploring">Still exploring</option>
        </select>
      </AccessibleFormField>

      <FundingTypeSelector
        value={fundingType}
        onChange={setFundingType}
        error={errors.fundingType}
      />

      <AccessibleFormField
        id="primaryServiceRegion"
        label="Main area where you need services"
        required
        hint="Suburb or region — not your full street address."
        error={errors.primaryServiceRegion}
      >
        <input
          id="primaryServiceRegion"
          className={formInputClass}
          value={primaryServiceRegion}
          onChange={(e) => setPrimaryServiceRegion(e.target.value)}
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="mainSupportGoals"
        label="What are you hoping MapAble will help with?"
        required
        error={errors.mainSupportGoals}
      >
        <textarea
          id="mainSupportGoals"
          className={`${formInputClass} min-h-24`}
          value={mainSupportGoals}
          onChange={(e) => setMainSupportGoals(e.target.value)}
          rows={4}
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="accessNeedsSummary"
        label="Access and support needs summary"
        required
        hint="Share what helps providers support you well. You control who can see this information."
        error={errors.accessNeedsSummary}
      >
        <textarea
          id="accessNeedsSummary"
          className={`${formInputClass} min-h-24`}
          value={accessNeedsSummary}
          onChange={(e) => setAccessNeedsSummary(e.target.value)}
          rows={4}
        />
      </AccessibleFormField>

      <div className="space-y-2">
        <button
          type="button"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          onClick={() => setShowNdis((v) => !v)}
        >
          {showNdis ? "Hide NDIS number" : "Add NDIS number later (optional)"}
        </button>
        {showNdis ? (
          <AccessibleFormField
            id="ndisNumber"
            label="NDIS participant number (optional)"
            hint="Optional. You can add this later if you want MapAble to help organise NDIS-related services."
            error={errors.ndisNumber}
          >
            <input
              id="ndisNumber"
              className={formInputClass}
              value={ndisNumber}
              onChange={(e) => setNdisNumber(e.target.value)}
            />
          </AccessibleFormField>
        ) : null}
      </div>

      <DocumentUploadPlaceholder label="NDIS plan documents (optional)" />

      {status ? (
        <p role="status" aria-live="polite" className="text-sm">
          {status}
        </p>
      ) : null}

      <SaveAndContinueButton loading={loading} />
    </form>
  );
}
