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

export function DriverOnboardingForm() {
  const router = useRouter();
  const [licenceNumber, setLicence] = useState("");
  const [licenceState, setLicenceState] = useState("NSW");
  const [licenceExpiry, setExpiry] = useState("");
  const [vehicleOperatorType, setOpType] = useState("own_vehicle");
  const [vehicleRegistration, setReg] = useState("");
  const [vehicleAccessibilityFeatures, setFeatures] = useState<string[]>([]);
  const [driverAssistanceOffered, setAssistance] = useState<string[]>([]);
  const [serviceRegions, setRegions] = useState<string[]>([]);
  const [transportSafetyAgreementAcceptance, setSafety] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await postOnboarding("/api/onboarding/driver", {
          licenceNumber,
          licenceState,
          licenceExpiry,
          vehicleOperatorType,
          vehicleRegistration,
          vehicleAccessibilityFeatures,
          driverAssistanceOffered,
          serviceRegions,
          transportSafetyAgreementAcceptance,
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
      <VerificationNotice message="Dispatch eligibility requires licence, vehicle checks, and verification before trips can be assigned." />

      <AccessibleFormField id="licenceNumber" label="Driver licence number" required error={errors.licenceNumber}>
        <input id="licenceNumber" className={formInputClass} value={licenceNumber} onChange={(e) => setLicence(e.target.value)} />
      </AccessibleFormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <AccessibleFormField id="licenceState" label="Licence state" required error={errors.licenceState}>
          <input id="licenceState" className={formInputClass} value={licenceState} onChange={(e) => setLicenceState(e.target.value)} />
        </AccessibleFormField>
        <AccessibleFormField id="licenceExpiry" label="Licence expiry" required error={errors.licenceExpiry}>
          <input id="licenceExpiry" type="date" className={formInputClass} value={licenceExpiry} onChange={(e) => setExpiry(e.target.value)} />
        </AccessibleFormField>
      </div>
      <AccessibleFormField id="vehicleOperatorType" label="Vehicle operator type" required error={errors.vehicleOperatorType}>
        <select id="vehicleOperatorType" className={formInputClass} value={vehicleOperatorType} onChange={(e) => setOpType(e.target.value)}>
          <option value="own_vehicle">Own vehicle</option>
          <option value="organisation_fleet">Organisation fleet</option>
        </select>
      </AccessibleFormField>
      <AccessibleFormField id="vehicleRegistration" label="Vehicle registration" required error={errors.vehicleRegistration}>
        <input id="vehicleRegistration" className={formInputClass} value={vehicleRegistration} onChange={(e) => setReg(e.target.value)} />
      </AccessibleFormField>
      <StringListField id="vehicleAccessibilityFeatures" label="Vehicle accessibility features" value={vehicleAccessibilityFeatures} onChange={setFeatures} required error={errors.vehicleAccessibilityFeatures} />
      <StringListField id="driverAssistanceOffered" label="Driver assistance offered" value={driverAssistanceOffered} onChange={setAssistance} required error={errors.driverAssistanceOffered} />
      <ServiceRegionFields value={serviceRegions} onChange={setRegions} error={errors.serviceRegions} />
      <DocumentUploadPlaceholder label="Vehicle insurance (upload later)" />
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={transportSafetyAgreementAcceptance} onChange={(e) => setSafety(e.target.checked)} /> Transport safety agreement</label>
      <SaveAndContinueButton loading={loading} />
    </form>
  );
}
