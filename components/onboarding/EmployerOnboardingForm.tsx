"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { SaveAndContinueButton } from "@/components/onboarding/SaveAndContinueButton";
import { VerificationNotice } from "@/components/onboarding/VerificationNotice";
import { RegistrationErrorSummary } from "@/components/registration/RegistrationErrorSummary";
import { StringListField } from "@/components/onboarding/StringListField";
import {
  fieldErrorsToMap,
  postOnboarding,
} from "@/lib/registration/client-api";

export function EmployerOnboardingForm() {
  const router = useRouter();
  const [organisationName, setOrg] = useState("");
  const [abnOrNzbn, setAbn] = useState("");
  const [contactPerson, setContact] = useState("");
  const [contactRole, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [inclusiveHiringCommitment, setCommitment] = useState("");
  const [workplaceAccessibilitySummary, setAccess] = useState("");
  const [jobPostingPermission, setJobPerm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await postOnboarding("/api/onboarding/employer", {
          organisationName,
          abnOrNzbn,
          contactPerson,
          contactRole,
          industry,
          locations,
          inclusiveHiringCommitment,
          workplaceAccessibilitySummary,
          jobPostingPermission,
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
      <VerificationNotice message="Job posting requires employer profile approval after review." />
      <AccessibleFormField id="organisationName" label="Organisation name" required error={errors.organisationName}>
        <input id="organisationName" className={formInputClass} value={organisationName} onChange={(e) => setOrg(e.target.value)} />
      </AccessibleFormField>
      <AccessibleFormField id="abnOrNzbn" label="ABN or NZBN" required error={errors.abnOrNzbn}>
        <input id="abnOrNzbn" className={formInputClass} value={abnOrNzbn} onChange={(e) => setAbn(e.target.value)} />
      </AccessibleFormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <AccessibleFormField id="contactPerson" label="Contact person" required error={errors.contactPerson}>
          <input id="contactPerson" className={formInputClass} value={contactPerson} onChange={(e) => setContact(e.target.value)} />
        </AccessibleFormField>
        <AccessibleFormField id="contactRole" label="Contact role" required error={errors.contactRole}>
          <input id="contactRole" className={formInputClass} value={contactRole} onChange={(e) => setRole(e.target.value)} />
        </AccessibleFormField>
      </div>
      <AccessibleFormField id="industry" label="Industry" required error={errors.industry}>
        <input id="industry" className={formInputClass} value={industry} onChange={(e) => setIndustry(e.target.value)} />
      </AccessibleFormField>
      <StringListField id="locations" label="Work locations" value={locations} onChange={setLocations} required error={errors.locations} />
      <AccessibleFormField id="inclusiveHiringCommitment" label="Inclusive hiring commitment" required error={errors.inclusiveHiringCommitment}>
        <textarea id="inclusiveHiringCommitment" className={`${formInputClass} min-h-20`} value={inclusiveHiringCommitment} onChange={(e) => setCommitment(e.target.value)} rows={3} />
      </AccessibleFormField>
      <AccessibleFormField id="workplaceAccessibilitySummary" label="Workplace accessibility summary" required error={errors.workplaceAccessibilitySummary}>
        <textarea id="workplaceAccessibilitySummary" className={`${formInputClass} min-h-20`} value={workplaceAccessibilitySummary} onChange={(e) => setAccess(e.target.value)} rows={3} />
      </AccessibleFormField>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={jobPostingPermission} onChange={(e) => setJobPerm(e.target.checked)} /> I request permission to post inclusive jobs after approval</label>
      <SaveAndContinueButton loading={loading} />
    </form>
  );
}
