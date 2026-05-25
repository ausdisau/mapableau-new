"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { DocumentUploadPlaceholder } from "@/components/onboarding/DocumentUploadPlaceholder";
import { ServiceRegionFields } from "@/components/onboarding/ServiceRegionFields";
import { SaveAndContinueButton } from "@/components/onboarding/SaveAndContinueButton";
import { VerificationNotice } from "@/components/onboarding/VerificationNotice";
import { RegistrationErrorSummary } from "@/components/registration/RegistrationErrorSummary";
import { StringListField } from "@/components/onboarding/StringListField";
import {
  fieldErrorsToMap,
  postOnboarding,
} from "@/lib/registration/client-api";

export function AlliedHealthOnboardingForm() {
  const router = useRouter();
  const [profession, setProfession] = useState("");
  const [qualificationsSummary, setQuals] = useState("");
  const [deliveryModes, setModes] = useState<string[]>([]);
  const [serviceRegions, setRegions] = useState<string[]>([]);
  const [ahpraRegistrationNumber, setAhpra] = useState("");
  const [professionalBody, setBody] = useState("");
  const [clinicalGovernanceAcceptance, setGov] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await postOnboarding("/api/onboarding/allied-health", {
          profession,
          qualificationsSummary,
          deliveryModes,
          serviceRegions,
          clinicalGovernanceAcceptance,
          ahpraRegistrationNumber: ahpraRegistrationNumber || undefined,
          professionalBody: professionalBody || undefined,
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
      <VerificationNotice message="Public listing and clinical booking require credential review where applicable." />
      <AccessibleFormField id="profession" label="Profession" required error={errors.profession}>
        <input id="profession" className={formInputClass} value={profession} onChange={(e) => setProfession(e.target.value)} />
      </AccessibleFormField>
      <AccessibleFormField id="qualificationsSummary" label="Qualifications summary" required error={errors.qualificationsSummary}>
        <textarea id="qualificationsSummary" className={`${formInputClass} min-h-24`} value={qualificationsSummary} onChange={(e) => setQuals(e.target.value)} rows={4} />
      </AccessibleFormField>
      <StringListField id="deliveryModes" label="Delivery modes" value={deliveryModes} onChange={setModes} required error={errors.deliveryModes} />
      <ServiceRegionFields value={serviceRegions} onChange={setRegions} error={errors.serviceRegions} />
      <AccessibleFormField id="ahpraRegistrationNumber" label="AHPRA registration number (if applicable)" error={errors.ahpraRegistrationNumber}>
        <input id="ahpraRegistrationNumber" className={formInputClass} value={ahpraRegistrationNumber} onChange={(e) => setAhpra(e.target.value)} />
      </AccessibleFormField>
      <AccessibleFormField id="professionalBody" label="Professional body (if not AHPRA-regulated)" error={errors.professionalBody}>
        <input id="professionalBody" className={formInputClass} value={professionalBody} onChange={(e) => setBody(e.target.value)} />
      </AccessibleFormField>
      <DocumentUploadPlaceholder label="Professional indemnity insurance" />
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={clinicalGovernanceAcceptance} onChange={(e) => setGov(e.target.checked)} /> Clinical governance acceptance</label>
      <SaveAndContinueButton loading={loading} />
    </form>
  );
}
