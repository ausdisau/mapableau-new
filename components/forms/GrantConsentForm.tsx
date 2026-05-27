"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

const SCOPES = [
  "profile.read",
  "accessibility.read",
  "booking.read",
  "care.accessibility_share",
  "transport.accessibility_share",
  "transport.trip_access",
] as const;

const SCOPE_LABELS: Record<(typeof SCOPES)[number], string> = {
  "profile.read": "Profile summary",
  "accessibility.read": "Accessibility profile",
  "booking.read": "Booking details",
  "care.accessibility_share": "Share care accessibility with provider",
  "transport.accessibility_share":
    "Share transport mobility needs with provider (for matching vehicles)",
  "transport.trip_access":
    "View transport trip summary (pickup suburb, status — not full addresses)",
};

export function GrantConsentForm({
  organisations,
}: {
  organisations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [scope, setScope] = useState<string>(SCOPES[0]);
  const [organisationId, setOrganisationId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await fetch("/api/consents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scope,
            purpose,
            grantedToOrganisationId: organisationId || undefined,
          }),
        });
        setLoading(false);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Could not grant consent");
          return;
        }
        router.push("/dashboard/consent");
        router.refresh();
      }}
    >
      <AccessibleFormField id="scope" label="What to share" required>
        <select
          id="scope"
          className={formInputClass}
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        >
          {SCOPES.map((s) => (
            <option key={s} value={s}>
              {SCOPE_LABELS[s]}
            </option>
          ))}
        </select>
      </AccessibleFormField>

      <AccessibleFormField
        id="org"
        label="Organisation"
        hint="Who can use this consent"
        required
      >
        <select
          id="org"
          className={formInputClass}
          value={organisationId}
          onChange={(e) => setOrganisationId(e.target.value)}
          required
        >
          <option value="">Select organisation</option>
          {organisations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </AccessibleFormField>

      <AccessibleFormField
        id="purpose"
        label="Purpose"
        hint="Plain language explanation of why you are sharing"
        required
      >
        <textarea
          id="purpose"
          className={formInputClass}
          rows={3}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          required
        />
      </AccessibleFormField>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="default" size="default" loading={loading}>
        Grant consent
      </Button>
    </form>
  );
}
