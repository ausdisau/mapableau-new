"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { AccessCapabilitySelector } from "@/components/onboarding/AccessCapabilitySelector";
import { ProviderTypeSelector } from "@/components/onboarding/ProviderTypeSelector";
import { ServiceRegionFields } from "@/components/onboarding/ServiceRegionFields";
import { SaveAndContinueButton } from "@/components/onboarding/SaveAndContinueButton";
import { VerificationNotice } from "@/components/onboarding/VerificationNotice";
import { RegistrationErrorSummary } from "@/components/registration/RegistrationErrorSummary";
import { StringListField } from "@/components/onboarding/StringListField";
import {
  fieldErrorsToMap,
  postOnboarding,
} from "@/lib/registration/client-api";

export function ProviderOnboardingForm() {
  const router = useRouter();
  const [organisationLegalName, setLegalName] = useState("");
  const [abnOrNzbn, setAbn] = useState("");
  const [primaryContactName, setContactName] = useState("");
  const [primaryContactRole, setContactRole] = useState("");
  const [phone, setPhone] = useState("");
  const [businessAddress, setAddress] = useState("");
  const [publicServiceRegions, setRegions] = useState<string[]>([]);
  const [providerTypes, setProviderTypes] = useState<string[]>([]);
  const [servicesOffered, setServices] = useState<string[]>([]);
  const [accessCapabilities, setAccess] = useState<string[]>([]);
  const [ndisRegisteredClaim, setNdisClaim] = useState(false);
  const [ndisRegistrationNumber, setNdisNum] = useState("");
  const [codeOfConductAcceptance, setCode] = useState(false);
  const [privacyDataHandlingAcceptance, setPrivacy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await postOnboarding("/api/onboarding/provider", {
          organisationLegalName,
          abnOrNzbn,
          primaryContactName,
          primaryContactRole,
          phone,
          businessAddress,
          publicServiceRegions,
          providerTypes,
          servicesOffered,
          accessCapabilities,
          ndisRegisteredClaim,
          ndisRegistrationNumber: ndisRegisteredClaim ? ndisRegistrationNumber : undefined,
          codeOfConductAcceptance,
          privacyDataHandlingAcceptance,
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
      <VerificationNotice message="Directory listing and booking eligibility require verification after your profile is reviewed. Bank details are not collected at signup." />

      <AccessibleFormField id="organisationLegalName" label="Legal organisation name" required error={errors.organisationLegalName}>
        <input id="organisationLegalName" className={formInputClass} value={organisationLegalName} onChange={(e) => setLegalName(e.target.value)} />
      </AccessibleFormField>
      <AccessibleFormField id="abnOrNzbn" label="ABN or NZBN" required error={errors.abnOrNzbn}>
        <input id="abnOrNzbn" className={formInputClass} value={abnOrNzbn} onChange={(e) => setAbn(e.target.value)} />
      </AccessibleFormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <AccessibleFormField id="primaryContactName" label="Primary contact name" required error={errors.primaryContactName}>
          <input id="primaryContactName" className={formInputClass} value={primaryContactName} onChange={(e) => setContactName(e.target.value)} />
        </AccessibleFormField>
        <AccessibleFormField id="primaryContactRole" label="Primary contact role" required error={errors.primaryContactRole}>
          <input id="primaryContactRole" className={formInputClass} value={primaryContactRole} onChange={(e) => setContactRole(e.target.value)} />
        </AccessibleFormField>
      </div>
      <AccessibleFormField id="phone" label="Business phone" required error={errors.phone}>
        <input id="phone" type="tel" className={formInputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </AccessibleFormField>
      <AccessibleFormField id="businessAddress" label="Business address" required hint="Only add your full address when it is needed for a booking, transport trip or home visit." error={errors.businessAddress}>
        <textarea id="businessAddress" className={`${formInputClass} min-h-20`} value={businessAddress} onChange={(e) => setAddress(e.target.value)} rows={3} />
      </AccessibleFormField>
      <ServiceRegionFields value={publicServiceRegions} onChange={setRegions} error={errors.publicServiceRegions} />
      <ProviderTypeSelector value={providerTypes} onChange={setProviderTypes} error={errors.providerTypes} />
      <StringListField id="servicesOffered" label="Services offered" value={servicesOffered} onChange={setServices} required error={errors.servicesOffered} />
      <AccessCapabilitySelector value={accessCapabilities} onChange={setAccess} error={errors.accessCapabilities} />
      <AccessibleFormField id="ndisRegisteredClaim" label="We are NDIS registered" error={errors.ndisRegisteredClaim}>
        <input id="ndisRegisteredClaim" type="checkbox" className="h-5 w-5" checked={ndisRegisteredClaim} onChange={(e) => setNdisClaim(e.target.checked)} />
      </AccessibleFormField>
      {ndisRegisteredClaim ? (
        <AccessibleFormField id="ndisRegistrationNumber" label="NDIS registration number" required error={errors.ndisRegistrationNumber}>
          <input id="ndisRegistrationNumber" className={formInputClass} value={ndisRegistrationNumber} onChange={(e) => setNdisNum(e.target.value)} />
        </AccessibleFormField>
      ) : null}
      <label className="flex gap-2 text-sm">
        <input type="checkbox" checked={codeOfConductAcceptance} onChange={(e) => setCode(e.target.checked)} />
        I accept the NDIS Code of Conduct and MapAble provider standards
      </label>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" checked={privacyDataHandlingAcceptance} onChange={(e) => setPrivacy(e.target.checked)} />
        I accept privacy and data handling requirements for participant information
      </label>
      <SaveAndContinueButton loading={loading} />
    </form>
  );
}
