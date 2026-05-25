"use client";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";

interface FundingTypeSelectorProps {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

export function FundingTypeSelector({
  value,
  onChange,
  error,
}: FundingTypeSelectorProps) {
  return (
    <AccessibleFormField
      id="fundingType"
      label="How do you usually pay for supports?"
      required
      error={error}
    >
      <select
        id="fundingType"
        className={formInputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        <option value="ndis">NDIS</option>
        <option value="private">Private / self-funded</option>
        <option value="mixed">Mixed</option>
        <option value="unknown">Not sure yet</option>
      </select>
    </AccessibleFormField>
  );
}
