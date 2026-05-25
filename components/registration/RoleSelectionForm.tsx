"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ALL_ROLES, roleLabel } from "@/lib/auth/roles";
import { roleRequiresApproval } from "@/types/roles";
import type { UserRole } from "@/types/mapable";

const ONBOARDING_ROLES: UserRole[] = ALL_ROLES.filter(
  (r) => r !== "mapable_admin"
);

export function RoleSelectionForm() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("participant");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setStatus("Saving your role…");

        const res = await fetch("/api/onboarding/role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatus("");
          setError(data.error ?? "Could not save role");
          return;
        }

        setStatus("Role saved.");
        router.push(data.nextStepPath ?? "/onboarding/complete");
        router.refresh();
      }}
      className="flex flex-col gap-4"
    >
      {error ? (
        <div role="alert" className="text-red-800 bg-red-50 border border-red-200 rounded-md p-3 text-sm">
          {error}
        </div>
      ) : null}

      <fieldset>
        <legend className="text-sm font-medium text-slate-800 mb-2">
          How will you use MapAble?
        </legend>
        <div className="flex flex-col gap-2">
          {ONBOARDING_ROLES.map((r) => (
            <label
              key={r}
              className="flex items-start gap-3 min-h-11 p-3 border border-slate-200 rounded-md cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-600"
            >
              <input
                type="radio"
                name="role"
                value={r}
                checked={role === r}
                onChange={() => setRole(r)}
                className="mt-1"
              />
              <span>
                <span className="font-medium block">{roleLabel(r)}</span>
                {roleRequiresApproval(r) ? (
                  <span className="text-sm text-slate-600">
                    Requires verification before paid services
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        className="min-h-11 rounded-md bg-blue-700 text-white font-medium"
      >
        Continue
      </button>
      <p aria-live="polite" className="text-sm text-slate-600">
        {status}
      </p>
    </form>
  );
}
