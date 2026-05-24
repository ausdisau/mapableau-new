"use client";

import React from "react";

import { cn } from "@/app/lib/utils";
import {
  REGISTRATION_ACCOUNT_TYPES,
  type RegistrationAccountType,
} from "@/lib/auth/registration-roles";

type RegistrationRoleSelectorProps = {
  value: RegistrationAccountType;
  onChange: (value: RegistrationAccountType) => void;
  disabled?: boolean;
  error?: string;
};

export function RegistrationRoleSelector({
  value,
  onChange,
  disabled = false,
  error,
}: RegistrationRoleSelectorProps) {
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-sm font-medium text-foreground">
        I am signing up as
      </legend>
      <p className="text-xs text-muted-foreground">
        This helps MapAble show the right onboarding steps. Provider and worker
        accounts still require verification before accessing participant data.
      </p>
      <ul className="space-y-2" role="radiogroup" aria-label="Account type">
        {REGISTRATION_ACCOUNT_TYPES.map((type) => {
          const selected = value === type.id;
          return (
            <li key={type.id}>
              <label
                className={cn(
                  "flex min-h-12 cursor-pointer gap-3 rounded-xl border px-4 py-3 transition focus-within:ring-2 focus-within:ring-ring",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/30",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="radio"
                  name="accountType"
                  value={type.id}
                  checked={selected}
                  onChange={() => onChange(type.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-primary"
                  disabled={disabled}
                />
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {type.label}
                    {selected ? (
                      <span className="sr-only"> (selected)</span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {type.description}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
