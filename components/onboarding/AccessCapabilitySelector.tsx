"use client";

import { StringListField } from "@/components/onboarding/StringListField";

interface AccessCapabilitySelectorProps {
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
}

export function AccessCapabilitySelector({
  value,
  onChange,
  error,
}: AccessCapabilitySelectorProps) {
  return (
    <StringListField
      id="accessCapabilities"
      label="Accessibility capabilities your organisation offers"
      hint="e.g. Auslan, sensory-friendly spaces, hoist transfers."
      value={value}
      onChange={onChange}
      required
      error={error}
    />
  );
}
