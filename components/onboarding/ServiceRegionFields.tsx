"use client";

import { StringListField } from "@/components/onboarding/StringListField";

interface ServiceRegionFieldsProps {
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
}

export function ServiceRegionFields({
  value,
  onChange,
  error,
}: ServiceRegionFieldsProps) {
  return (
    <StringListField
      id="serviceRegions"
      label="Service regions"
      hint="Suburbs, LGAs, or states where you operate — comma separated."
      value={value}
      onChange={onChange}
      required
      error={error}
    />
  );
}
