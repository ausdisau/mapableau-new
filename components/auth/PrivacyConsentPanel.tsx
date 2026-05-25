"use client";

import { useId } from "react";

export function PrivacyConsentPanel({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <fieldset className="space-y-2 rounded-md border border-border p-4">
      <legend className="text-sm font-medium">Privacy and collection notice</legend>
      <p className="text-sm text-muted-foreground">
        We collect only what is needed to provide disability care and support
        services. You can review consent settings in your dashboard after sign-in.
      </p>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-border"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="text-sm">
          I have read and agree to the MapAble privacy policy and terms (APP/OAIC
          collection notice).
        </span>
      </label>
    </fieldset>
  );
}
