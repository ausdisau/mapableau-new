import React from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isBusy?: boolean;
};

export function RegistrationPasswordInput({
  id,
  value,
  onChange,
  onSubmit,
  disabled = false,
  isBusy = false,
}: Props) {
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <AccessibleFormField
        id={id}
        label="Password"
        required
        hint="At least 8 characters. Your password is not shown in the chat."
      >
        <input
          id={id}
          type="password"
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          minLength={8}
          required
          disabled={disabled || isBusy}
          className={formInputClass}
        />
      </AccessibleFormField>
      <Button
        type="submit"
        variant="default"
        disabled={disabled || isBusy || value.trim().length < 8}
        loading={isBusy}
      >
        Continue
      </Button>
    </form>
  );
}
