"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { ServiceRegionFields } from "@/components/onboarding/ServiceRegionFields";
import { SaveAndContinueButton } from "@/components/onboarding/SaveAndContinueButton";
import { VerificationNotice } from "@/components/onboarding/VerificationNotice";
import { RegistrationErrorSummary } from "@/components/registration/RegistrationErrorSummary";
import {
  fieldErrorsToMap,
  postOnboarding,
} from "@/lib/registration/client-api";

export function SupportCoordinatorOnboardingForm() {
  const router = useRouter();
  const [organisationOrSoleTraderName, setName] = useState("");
  const [serviceRegions, setRegions] = useState<string[]>([]);
  const [professionalExperienceSummary, setExp] = useState("");
  const [codeOfConductAcceptance, setCode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await postOnboarding("/api/onboarding/support-coordinator", {
          organisationOrSoleTraderName,
          serviceRegions,
          professionalExperienceSummary,
          codeOfConductAcceptance,
        });
        setLoading(false);
        if (!result.success) {
          setErrors(fieldErrorsToMap(result.errors));
          return;
        }
        router.push("/onboarding/complete");
      }}
      noValidate
    >
      <RegistrationErrorSummary errors={errors} />
      <VerificationNotice message="You cannot access a participant's plan or bookings without their consent link." />
      <AccessibleFormField id="organisationOrSoleTraderName" label="Organisation or sole trader name" required error={errors.organisationOrSoleTraderName}>
        <input id="organisationOrSoleTraderName" className={formInputClass} value={organisationOrSoleTraderName} onChange={(e) => setName(e.target.value)} />
      </AccessibleFormField>
      <ServiceRegionFields value={serviceRegions} onChange={setRegions} error={errors.serviceRegions} />
      <AccessibleFormField id="professionalExperienceSummary" label="Professional experience" required error={errors.professionalExperienceSummary}>
        <textarea id="professionalExperienceSummary" className={`${formInputClass} min-h-24`} value={professionalExperienceSummary} onChange={(e) => setExp(e.target.value)} rows={4} />
      </AccessibleFormField>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={codeOfConductAcceptance} onChange={(e) => setCode(e.target.checked)} /> Code of conduct acceptance</label>
      <SaveAndContinueButton loading={loading} />
    </form>
  );
}
