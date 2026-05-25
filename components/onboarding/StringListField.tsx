"use client";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";

interface StringListFieldProps {
  id: string;
  label: string;
  hint?: string;
  value: string[];
  onChange: (v: string[]) => void;
  required?: boolean;
  error?: string;
}

/** Comma-separated entry for accessible multi-value fields. */
export function StringListField({
  id,
  label,
  hint,
  value,
  onChange,
  required,
  error,
}: StringListFieldProps) {
  const text = value.join(", ");

  return (
    <AccessibleFormField
      id={id}
      label={label}
      hint={hint ?? "Separate items with commas."}
      required={required}
      error={error}
    >
      <input
        id={id}
        type="text"
        className={formInputClass}
        value={text}
        onChange={(e) => {
          const parts = e.target.value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          onChange(parts);
        }}
      />
    </AccessibleFormField>
  );
}

export function parseCommaList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
