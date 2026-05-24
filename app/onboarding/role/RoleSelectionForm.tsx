"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface RoleOption {
  value: string;
  label: string;
  description: string;
}

export default function RoleSelectionForm({
  roles,
  privilegedRoles,
}: {
  roles: readonly RoleOption[];
  privilegedRoles: readonly string[];
}) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("participant");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
          const response = await fetch("/api/auth/onboarding-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: selectedRole }),
          });

          if (!response.ok) {
            const data = (await response.json()) as { error?: string };
            setError(data.error ?? "Could not save role selection.");
            return;
          }

          if (privilegedRoles.includes(selectedRole)) {
            router.push("/onboarding/verification");
            return;
          }

          router.push("/onboarding");
        } finally {
          setLoading(false);
        }
      }}
    >
      <fieldset>
        <legend className="sr-only">Select your MapAble role</legend>
        <div className="space-y-3">
          {roles.map((role) => (
            <label
              key={role.value}
              className="flex cursor-pointer gap-3 rounded-lg border border-border p-4 hover:border-primary/40"
            >
              <input
                type="radio"
                name="role"
                value={role.value}
                checked={selectedRole === role.value}
                onChange={() => setSelectedRole(role.value)}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">{role.label}</span>
                <span className="block text-sm text-muted-foreground">
                  {role.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" variant="default" size="lg" className="w-full" loading={loading}>
        Continue
      </Button>
    </form>
  );
}
