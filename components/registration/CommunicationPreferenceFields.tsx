import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";

interface CommunicationPreferenceFieldsProps {
  preferredCommunicationMethod: string;
  onPreferredChange: (v: string) => void;
  errors?: Record<string, string>;
}

export function CommunicationPreferenceFields({
  preferredCommunicationMethod,
  onPreferredChange,
  errors = {},
}: CommunicationPreferenceFieldsProps) {
  return (
    <AccessibleFormField
      id="preferredCommunicationMethod"
      label="Preferred way to hear from MapAble"
      required
      hint="We use plain language in emails and messages where we can."
      error={errors.preferredCommunicationMethod}
    >
      <select
        id="preferredCommunicationMethod"
        className={formInputClass}
        value={preferredCommunicationMethod}
        onChange={(e) => onPreferredChange(e.target.value)}
      >
        <option value="plain_language">Plain language (email)</option>
        <option value="email">Email</option>
        <option value="sms">SMS</option>
        <option value="phone">Phone call</option>
      </select>
    </AccessibleFormField>
  );
}
