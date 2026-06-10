"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { fetchJson } from "@/lib/client/fetch-json";

const FUNDING_TYPES = [
  { value: "ndis_plan_managed", label: "NDIS plan-managed" },
  { value: "ndis_self_managed", label: "NDIS self-managed" },
  { value: "private_card", label: "Private card" },
  { value: "organisation_invoice", label: "Organisation invoice" },
  { value: "grant", label: "Grant" },
  { value: "other", label: "Other" },
] as const;

export default function NewBillingFundingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [type, setType] = useState<string>("ndis_plan_managed");
  const [label, setLabel] = useState("");
  const [ndisParticipantNumber, setNdisParticipantNumber] = useState("");
  const [planManagerName, setPlanManagerName] = useState("");
  const [planManagerEmail, setPlanManagerEmail] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    if (!label.trim()) nextErrors.label = "Label is required.";
    if (
      type === "ndis_plan_managed" &&
      planManagerEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(planManagerEmail.trim())
    ) {
      nextErrors.planManagerEmail = "Enter a valid plan manager email.";
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    const body: Record<string, unknown> = {
      type,
      label: label.trim(),
      isDefault,
    };
    if (ndisParticipantNumber.trim()) {
      body.ndisParticipantNumber = ndisParticipantNumber.trim();
    }
    if (planManagerName.trim()) body.planManagerName = planManagerName.trim();
    if (planManagerEmail.trim()) body.planManagerEmail = planManagerEmail.trim();

    const result = await fetchJson<{ fundingSource: { id: string } }>(
      "/api/billing/funding-sources",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/dashboard/billing/funding/${result.data.fundingSource.id}`);
  }

  return (
    <form className="max-w-2xl space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <h1 className="font-heading text-2xl font-bold">Add funding source</h1>

      {error ? <StatusMessage variant="error" message={error} /> : null}

      <AccessibleFormField id="type" label="Funding type" required>
        <select
          id="type"
          name="type"
          className={formInputClass}
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
        >
          {FUNDING_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </AccessibleFormField>

      <AccessibleFormField
        id="label"
        label="Label"
        required
        hint="A name you'll recognise, such as “My NDIS plan” or “Private card”."
        error={fieldErrors.label}
      >
        <input
          id="label"
          name="label"
          className={formInputClass}
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            if (fieldErrors.label) {
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.label;
                return next;
              });
            }
          }}
          required
          maxLength={200}
        />
      </AccessibleFormField>

      {type === "ndis_plan_managed" || type === "ndis_self_managed" ? (
        <AccessibleFormField
          id="ndisParticipantNumber"
          label="NDIS participant number"
          hint="Optional. Used on exports and provider records."
        >
          <input
            id="ndisParticipantNumber"
            name="ndisParticipantNumber"
            className={formInputClass}
            value={ndisParticipantNumber}
            onChange={(e) => setNdisParticipantNumber(e.target.value)}
            maxLength={50}
          />
        </AccessibleFormField>
      ) : null}

      {type === "ndis_plan_managed" ? (
        <>
          <AccessibleFormField
            id="planManagerName"
            label="Plan manager name"
            hint="Optional. Shown on plan-manager exports."
          >
            <input
              id="planManagerName"
              name="planManagerName"
              className={formInputClass}
              value={planManagerName}
              onChange={(e) => setPlanManagerName(e.target.value)}
            />
          </AccessibleFormField>
          <AccessibleFormField
            id="planManagerEmail"
            label="Plan manager email"
            hint="Used when you export invoices for plan-managed NDIS funding."
            error={fieldErrors.planManagerEmail}
          >
            <input
              id="planManagerEmail"
              name="planManagerEmail"
              type="email"
              className={formInputClass}
              value={planManagerEmail}
              onChange={(e) => {
                setPlanManagerEmail(e.target.value);
                if (fieldErrors.planManagerEmail) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.planManagerEmail;
                    return next;
                  });
                }
              }}
            />
          </AccessibleFormField>
        </>
      ) : null}

      <AccessibleFormField
        id="isDefault"
        label="Default funding source"
        hint="When checked, this funding source is pre-selected for new invoices."
      >
        <label className="flex min-h-11 items-center gap-2">
          <input
            id="isDefault"
            type="checkbox"
            name="isDefault"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          <span className="text-sm">Set as default funding source</span>
        </label>
      </AccessibleFormField>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" variant="default" size="default" loading={loading}>
          Save funding source
        </Button>
        <Link
          href="/dashboard/billing/funding"
          className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
