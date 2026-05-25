"use client";

import { StringListField } from "@/components/onboarding/StringListField";

interface ProviderTypeSelectorProps {
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
}

export function ProviderTypeSelector({
  value,
  onChange,
  error,
}: ProviderTypeSelectorProps) {
  return (
    <StringListField
      id="providerTypes"
      label="Provider types"
      hint="e.g. SIL, community access, therapy — comma separated."
      value={value}
      onChange={onChange}
      required
      error={error}
    />
  );
}
