"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { DocumentUploadPlaceholder } from "@/components/onboarding/DocumentUploadPlaceholder";
import { SaveAndContinueButton } from "@/components/onboarding/SaveAndContinueButton";
import { VerificationNotice } from "@/components/onboarding/VerificationNotice";
import { RegistrationErrorSummary } from "@/components/registration/RegistrationErrorSummary";
import { StringListField } from "@/components/onboarding/StringListField";
import {
  fieldErrorsToMap,
  postOnboarding,
} from "@/lib/registration/client-api";

export function WorkerOnboardingForm() {
  const router = useRouter();
  const [legalFirstName, setFirst] = useState("");
  const [legalLastName, setLast] = useState("");
  const [displayName, setDisplay] = useState("");
  const [dateOfBirth, setDob] = useState("");
  const [stateOrTerritory, setState] = useState("NSW");
  const [postcode, setPostcode] = useState("");
  const [workType, setWorkType] = useState("contractor");
  const [servicesOffered, setServices] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [codeOfConductAcceptance, setCode] = useState(false);
  const [workerAgreementAcceptance, setAgreement] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await postOnboarding("/api/onboarding/worker", {
          legalFirstName,
          legalLastName,
          displayName,
          dateOfBirth,
          stateOrTerritory,
          postcode,
          workType,
          servicesOffered,
          skills,
          codeOfConductAcceptance,
          workerAgreementAcceptance,
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
      <VerificationNotice message="Your profile can be submitted now. Matching eligibility requires worker verification checks (screening, WWCC, etc.)." />

      <div className="grid gap-4 sm:grid-cols-2">
        <AccessibleFormField id="legalFirstName" label="Legal first name" required error={errors.legalFirstName}>
          <input id="legalFirstName" className={formInputClass} value={legalFirstName} onChange={(e) => setFirst(e.target.value)} />
        </AccessibleFormField>
        <AccessibleFormField id="legalLastName" label="Legal last name" required error={errors.legalLastName}>
          <input id="legalLastName" className={formInputClass} value={legalLastName} onChange={(e) => setLast(e.target.value)} />
        </AccessibleFormField>
      </div>
      <AccessibleFormField id="displayName" label="Display name" required error={errors.displayName}>
        <input id="displayName" className={formInputClass} value={displayName} onChange={(e) => setDisplay(e.target.value)} />
      </AccessibleFormField>
      <AccessibleFormField id="dateOfBirth" label="Date of birth" required error={errors.dateOfBirth}>
        <input id="dateOfBirth" type="date" className={formInputClass} value={dateOfBirth} onChange={(e) => setDob(e.target.value)} />
      </AccessibleFormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <AccessibleFormField id="stateOrTerritory" label="State" required error={errors.stateOrTerritory}>
          <input id="stateOrTerritory" className={formInputClass} value={stateOrTerritory} onChange={(e) => setState(e.target.value)} />
        </AccessibleFormField>
        <AccessibleFormField id="postcode" label="Postcode" required error={errors.postcode}>
          <input id="postcode" className={formInputClass} value={postcode} onChange={(e) => setPostcode(e.target.value)} />
        </AccessibleFormField>
      </div>
      <AccessibleFormField id="workType" label="Work type" required error={errors.workType}>
        <select id="workType" className={formInputClass} value={workType} onChange={(e) => setWorkType(e.target.value)}>
          <option value="employee">Employee</option>
          <option value="contractor">Contractor</option>
          <option value="sole_trader">Sole trader</option>
        </select>
      </AccessibleFormField>
      <StringListField id="servicesOffered" label="Services you offer" value={servicesOffered} onChange={setServices} required error={errors.servicesOffered} />
      <StringListField id="skills" label="Skills" value={skills} onChange={setSkills} required error={errors.skills} />
      <DocumentUploadPlaceholder label="Worker screening & WWCC (add later)" />
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={codeOfConductAcceptance} onChange={(e) => setCode(e.target.checked)} /> Code of conduct acceptance</label>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={workerAgreementAcceptance} onChange={(e) => setAgreement(e.target.checked)} /> Worker agreement acceptance</label>
      <SaveAndContinueButton loading={loading} />
    </form>
  );
}
