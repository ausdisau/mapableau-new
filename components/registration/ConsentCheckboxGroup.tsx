import { AccessibleFormField } from "@/components/forms/AccessibleFormField";
import { formInputClass } from "@/components/forms/AccessibleFormField";

interface ConsentCheckboxGroupProps {
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
  marketingConsent: boolean;
  onAcceptedTermsChange: (v: boolean) => void;
  onAcceptedPrivacyChange: (v: boolean) => void;
  onMarketingConsentChange: (v: boolean) => void;
  errors?: Record<string, string>;
}

export function ConsentCheckboxGroup({
  acceptedTerms,
  acceptedPrivacyPolicy,
  marketingConsent,
  onAcceptedTermsChange,
  onAcceptedPrivacyChange,
  onMarketingConsentChange,
  errors = {},
}: ConsentCheckboxGroupProps) {
  const checkboxClass = `${formInputClass} h-5 w-5 min-h-5 shrink-0`;

  return (
    <fieldset className="space-y-4 rounded-lg border border-border p-4">
      <legend className="text-base font-semibold px-1">Agreements</legend>

      <AccessibleFormField
        id="acceptedTerms"
        label="I accept the terms of use"
        required
        error={errors.acceptedTerms}
      >
        <input
          id="acceptedTerms"
          type="checkbox"
          className={checkboxClass}
          checked={acceptedTerms}
          onChange={(e) => onAcceptedTermsChange(e.target.checked)}
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="acceptedPrivacyPolicy"
        label="I accept the privacy policy"
        required
        error={errors.acceptedPrivacyPolicy}
      >
        <input
          id="acceptedPrivacyPolicy"
          type="checkbox"
          className={checkboxClass}
          checked={acceptedPrivacyPolicy}
          onChange={(e) => onAcceptedPrivacyChange(e.target.checked)}
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="marketingConsent"
        label="Send me occasional product updates (optional)"
        hint="Marketing consent is separate from terms and privacy. You can change this later."
        error={errors.marketingConsent}
      >
        <input
          id="marketingConsent"
          type="checkbox"
          className={checkboxClass}
          checked={marketingConsent}
          onChange={(e) => onMarketingConsentChange(e.target.checked)}
        />
      </AccessibleFormField>
    </fieldset>
  );
}
