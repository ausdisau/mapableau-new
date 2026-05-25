import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";

interface AccessibilityPreferenceFieldsProps {
  value: string;
  onChange: (v: string) => void;
  errors?: Record<string, string>;
}

export function AccessibilityPreferenceFields({
  value,
  onChange,
  errors = {},
}: AccessibilityPreferenceFieldsProps) {
  return (
    <AccessibleFormField
      id="accessibilityCommunicationPreference"
      label="Communication accessibility preferences (optional)"
      hint="For example: need extra time to respond, prefer written instructions, or use AAC."
      error={errors.accessibilityCommunicationPreference}
    >
      <textarea
        id="accessibilityCommunicationPreference"
        className={`${formInputClass} min-h-24`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    </AccessibleFormField>
  );
}
