"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { roleRequiresMfaEnrollment } from "@/lib/auth/mfa-policy";
import type { UserRole } from "@/types/mapable";

type MfaMethodRow = {
  id: string;
  type: string;
  label: string | null;
  status: string;
  enabledAt: string | null;
};

type MfaMethodListProps = {
  primaryRole: UserRole;
  onChanged: () => void;
};

const TYPE_LABELS: Record<string, string> = {
  totp: "Authenticator app",
  email: "Email",
  sms: "SMS",
  webauthn: "Passkey / security key",
};

export function MfaMethodList({ primaryRole, onChanged }: MfaMethodListProps) {
  const [methods, setMethods] = useState<MfaMethodRow[]>([]);
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/mfa/methods");
    const data = await res.json();
    if (res.ok) {
      setMethods(data.methods ?? []);
      setPlaceholders(data.placeholders ?? {});
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeMethod(id: string) {
    setError("");
    const res = await fetch(`/api/mfa/methods/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not remove method");
      return;
    }
    onChanged();
    await load();
  }

  const mfaRequired = roleRequiresMfaEnrollment(
    primaryRole as import("@prisma/client").MapAbleUserRole,
  );

  return (
    <section aria-labelledby="mfa-methods-heading" className="space-y-4">
      <h2 id="mfa-methods-heading" className="text-lg font-semibold">
        Your sign-in methods
      </h2>

      {loading ? (
        <p className="text-sm text-muted-foreground" role="status">
          Loading methods…
        </p>
      ) : null}

      <ul className="space-y-2" aria-label="Active MFA methods">
        {methods.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-3"
          >
            <div>
              <p className="font-medium">
                {TYPE_LABELS[m.type] ?? m.label ?? m.type}
              </p>
              <p className="text-sm text-muted-foreground">
                Status:{" "}
                <span className="font-medium text-foreground">
                  {m.type === "totp" ? "Active" : m.status}
                </span>
              </p>
            </div>
            {m.type === "totp" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeMethod(m.id)}
                disabled={mfaRequired && methods.length <= 1}
                aria-disabled={mfaRequired && methods.length <= 1}
              >
                Remove
              </Button>
            ) : null}
          </li>
        ))}
        {methods.length === 0 && !loading ? (
          <li className="text-sm text-muted-foreground">No MFA methods yet.</li>
        ) : null}
      </ul>

      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Coming later</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{placeholders.email}</li>
          <li>{placeholders.sms}</li>
          <li>{placeholders.webauthn}</li>
        </ul>
      </div>

      <div aria-live="polite">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
