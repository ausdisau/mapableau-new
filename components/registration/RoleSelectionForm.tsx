"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { RegistrationErrorSummary } from "@/components/registration/RegistrationErrorSummary";
import { SaveAndContinueButton } from "@/components/onboarding/SaveAndContinueButton";
import { REGISTRATION_ROLES, type RegistrationRole } from "@/types/registration";
import {
  fieldErrorsToMap,
  postOnboarding,
} from "@/lib/registration/client-api";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/registration/constants";

export function RoleSelectionForm() {
  const router = useRouter();
  const [role, setRole] = useState<RegistrationRole | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setErrors({});
        setStatus("Saving your role…");
        setLoading(true);
        if (!role) {
          setErrors({ role: "Please choose how you will use MapAble" });
          setLoading(false);
          setStatus("");
          return;
        }
        const result = await postOnboarding("/api/onboarding/role", { role });
        setLoading(false);
        if (!result.success) {
          setErrors(fieldErrorsToMap(result.errors));
          setStatus("");
          return;
        }
        setStatus("Role saved. Continuing to your details…");
        router.push("/onboarding");
      }}
      noValidate
    >
      <RegistrationErrorSummary errors={errors} />
      <fieldset className="space-y-3">
        <legend className="text-base font-semibold">
          How will you use MapAble?
        </legend>
        <p className="text-sm text-muted-foreground">
          Choose the option that best matches you. You can contact support if you
          need a different access type.
        </p>
        <ul className="space-y-3">
          {REGISTRATION_ROLES.map((r) => (
            <li key={r}>
              <label className="flex min-h-14 cursor-pointer gap-3 rounded-lg border border-border p-4 has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-ring">
                <input
                  type="radio"
                  name="role"
                  className="mt-1 h-5 w-5 shrink-0"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                />
                <span>
                  <span className="block font-medium">{ROLE_LABELS[r]}</span>
                  <span className="block text-sm text-muted-foreground">
                    {ROLE_DESCRIPTIONS[r]}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        {errors.role ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.role}
          </p>
        ) : null}
      </fieldset>
      {status ? (
        <p role="status" aria-live="polite" className="text-sm">
          {status}
        </p>
      ) : null}
      <SaveAndContinueButton loading={loading} label="Continue" />
    </form>
  );
}
