"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { AccessibilityPreferenceFields } from "@/components/registration/AccessibilityPreferenceFields";
import { AddressLiteFields } from "@/components/registration/AddressLiteFields";
import { CommunicationPreferenceFields } from "@/components/registration/CommunicationPreferenceFields";
import { ConsentCheckboxGroup } from "@/components/registration/ConsentCheckboxGroup";
import { RegistrationErrorSummary } from "@/components/registration/RegistrationErrorSummary";
import { SaveAndContinueButton } from "@/components/onboarding/SaveAndContinueButton";
import {
  fieldErrorsToMap,
  postOnboarding,
} from "@/lib/registration/client-api";
import type { RegistrationRole } from "@/types/registration";

interface BaseRegistrationFormProps {
  role: RegistrationRole;
}

export function BaseRegistrationForm({ role }: BaseRegistrationFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [country, setCountry] = useState<"AU" | "NZ">("AU");
  const [stateOrTerritory, setStateOrTerritory] = useState("NSW");
  const [postcode, setPostcode] = useState("");
  const [preferredCommunicationMethod, setPreferredCommunicationMethod] =
    useState("plain_language");
  const [accessibilityCommunicationPreference, setAccessibilityPref] =
    useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacyPolicy, setAcceptedPrivacy] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (session?.user?.email) setEmail(session.user.email);
    const name = session?.user?.name ?? "";
    const parts = name.split(" ");
    if (parts[0]) setFirstName(parts[0]);
    if (parts.length > 1) setLastName(parts.slice(1).join(" "));
  }, [session]);

  return (
    <form
      className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setErrors({});
        setStatus("Saving your details…");
        setLoading(true);
        const result = await postOnboarding("/api/registration/base", {
          role,
          firstName,
          lastName,
          email,
          mobile,
          country,
          stateOrTerritory,
          postcode,
          preferredCommunicationMethod,
          accessibilityCommunicationPreference:
            accessibilityCommunicationPreference || undefined,
          acceptedTerms,
          acceptedPrivacyPolicy,
          marketingConsent,
        });
        setLoading(false);
        if (!result.success) {
          setErrors(fieldErrorsToMap(result.errors));
          setStatus("");
          return;
        }
        setStatus("Saved. Opening your role onboarding…");
        router.push(result.nextStep ?? "/onboarding/complete");
      }}
      noValidate
    >
      <RegistrationErrorSummary errors={errors} />

      <div className="grid gap-4 sm:grid-cols-2">
        <AccessibleFormField
          id="firstName"
          label="First name"
          required
          error={errors.firstName}
        >
          <input
            id="firstName"
            className={formInputClass}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
          />
        </AccessibleFormField>
        <AccessibleFormField
          id="lastName"
          label="Last name"
          required
          error={errors.lastName}
        >
          <input
            id="lastName"
            className={formInputClass}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
          />
        </AccessibleFormField>
      </div>

      <AccessibleFormField
        id="email"
        label="Email"
        required
        error={errors.email}
      >
        <input
          id="email"
          type="email"
          className={formInputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="mobile"
        label="Mobile phone"
        required
        hint="Used for important booking updates — not shared publicly."
        error={errors.mobile}
      >
        <input
          id="mobile"
          type="tel"
          className={formInputClass}
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          autoComplete="tel"
        />
      </AccessibleFormField>

      <AddressLiteFields
        country={country}
        stateOrTerritory={stateOrTerritory}
        postcode={postcode}
        onCountryChange={setCountry}
        onStateChange={setStateOrTerritory}
        onPostcodeChange={setPostcode}
        errors={errors}
      />

      <CommunicationPreferenceFields
        preferredCommunicationMethod={preferredCommunicationMethod}
        onPreferredChange={setPreferredCommunicationMethod}
        errors={errors}
      />

      <AccessibilityPreferenceFields
        value={accessibilityCommunicationPreference}
        onChange={setAccessibilityPref}
        errors={errors}
      />

      <ConsentCheckboxGroup
        acceptedTerms={acceptedTerms}
        acceptedPrivacyPolicy={acceptedPrivacyPolicy}
        marketingConsent={marketingConsent}
        onAcceptedTermsChange={setAcceptedTerms}
        onAcceptedPrivacyChange={setAcceptedPrivacy}
        onMarketingConsentChange={setMarketingConsent}
        errors={errors}
      />

      {status ? (
        <p role="status" aria-live="polite" className="text-sm">
          {status}
        </p>
      ) : null}

      <SaveAndContinueButton loading={loading} />
    </form>
  );
}
