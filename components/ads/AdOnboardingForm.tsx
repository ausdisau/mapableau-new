"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AccessibleFormField } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const CATEGORIES = [
  { value: "ndis_provider", label: "NDIS provider" },
  { value: "allied_health", label: "Allied health provider" },
  { value: "support_coordinator", label: "Support coordinator" },
  { value: "plan_manager", label: "Plan manager" },
  { value: "accessible_transport", label: "Accessible transport operator" },
  { value: "assistive_technology", label: "Assistive technology supplier" },
  { value: "inclusive_employer", label: "Inclusive employer" },
  { value: "accessible_tourism", label: "Accessible tourism provider" },
  { value: "disability_education", label: "Disability education / training" },
  { value: "council_public_interest", label: "Council / public interest campaign" },
];

export function AdOnboardingForm({ organisationId }: { organisationId: string }) {
  const router = useRouter();
  const [category, setCategory] = useState("ndis_provider");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/ads/advertiser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisationId,
          category,
          contactName: contactName || undefined,
          contactEmail: contactEmail || undefined,
          acceptTerms: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Onboarding failed");
      router.push(`/provider/ads?org=${organisationId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onboarding failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <AccessibleFormField id="category" label="Advertiser category" required>
          <select
            id="category"
            className="w-full rounded-lg border border-input bg-background px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </AccessibleFormField>

        <AccessibleFormField id="contactName" label="Contact name">
          <input
            id="contactName"
            className="w-full rounded-lg border border-input bg-background px-3 py-2"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </AccessibleFormField>

        <AccessibleFormField id="contactEmail" label="Contact email">
          <input
            id="contactEmail"
            type="email"
            className="w-full rounded-lg border border-input bg-background px-3 py-2"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </AccessibleFormField>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1"
            required
          />
          <span>
            I accept the MapAble advertising policy: ads are clearly labelled,
            accessible, use contextual targeting only, and never target
            sensitive participant data.
          </span>
        </label>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" variant="default" size="default" disabled={saving || !acceptTerms}>
          {saving ? "Saving…" : "Complete onboarding"}
        </Button>
      </form>
    </Card>
  );
}
