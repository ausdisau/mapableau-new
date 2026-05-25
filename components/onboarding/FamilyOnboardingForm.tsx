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
import {
  fieldErrorsToMap,
  postOnboarding,
} from "@/lib/registration/client-api";
import { StringListField } from "@/components/onboarding/StringListField";

export function FamilyOnboardingForm() {
  const router = useRouter();
  const [relationshipToParticipant, setRelationship] = useState("");
  const [participantLinkMethod, setLinkMethod] = useState("later");
  const [authorityType, setAuthorityType] = useState("informal_support");
  const [permissionScopes, setPermissionScopes] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await postOnboarding("/api/onboarding/family", {
          relationshipToParticipant,
          participantLinkMethod,
          authorityType,
          permissionScopes,
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
      <VerificationNotice message="Linked participant access requires consent before you can view their profile or bookings." />

      <AccessibleFormField
        id="relationshipToParticipant"
        label="Your relationship to the participant"
        required
        error={errors.relationshipToParticipant}
      >
        <input
          id="relationshipToParticipant"
          className={formInputClass}
          value={relationshipToParticipant}
          onChange={(e) => setRelationship(e.target.value)}
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="participantLinkMethod"
        label="How will you connect to the participant?"
        required
        error={errors.participantLinkMethod}
      >
        <select
          id="participantLinkMethod"
          className={formInputClass}
          value={participantLinkMethod}
          onChange={(e) => setLinkMethod(e.target.value)}
        >
          <option value="invite_email">Send them an email invite</option>
          <option value="existing_participant_id">They already have a MapAble ID</option>
          <option value="later">Link later from dashboard</option>
        </select>
      </AccessibleFormField>

      <AccessibleFormField
        id="authorityType"
        label="Type of authority"
        required
        error={errors.authorityType}
      >
        <select
          id="authorityType"
          className={formInputClass}
          value={authorityType}
          onChange={(e) => setAuthorityType(e.target.value)}
        >
          <option value="informal_support">Informal family support</option>
          <option value="nominee">Formal nominee</option>
          <option value="guardian">Guardian</option>
          <option value="other">Other</option>
        </select>
      </AccessibleFormField>

      <StringListField
        id="permissionScopes"
        label="What would you like permission to help with?"
        hint="e.g. bookings, messages, funding — comma separated."
        value={permissionScopes}
        onChange={setPermissionScopes}
        required
        error={errors.permissionScopes}
      />

      {(authorityType === "nominee" || authorityType === "guardian") && (
        <DocumentUploadPlaceholder label="Proof of authority (upload later)" />
      )}

      <SaveAndContinueButton loading={loading} />
    </form>
  );
}
