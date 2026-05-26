"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

const REFERRAL_TYPES = [
  { value: "internal_care", label: "Care on MapAble" },
  { value: "internal_transport", label: "Transport" },
  { value: "internal_employment", label: "Employment support" },
  { value: "internal_provider", label: "Find a provider" },
  { value: "external", label: "External organisation" },
] as const;

export function ReferralForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const referralType = fd.get("referralType") as string;
        const destinationJson: Record<string, unknown> = {};
        if (referralType === "internal_care") {
          destinationJson.requestType = fd.get("careRequestType") || "other";
          destinationJson.title = fd.get("careTitle") || undefined;
          destinationJson.description = fd.get("summary");
        }
        if (referralType === "internal_provider") {
          destinationJson.q = fd.get("providerQuery") || "";
          destinationJson.suburb = fd.get("suburb") || "";
        }
        if (referralType === "external") {
          destinationJson.organisationName = fd.get("externalOrg") || "";
          destinationJson.contact = fd.get("externalContact") || "";
        }

        const res = await fetch("/api/care-support/referrals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            referralType,
            summary: fd.get("summary"),
            priority: fd.get("priority") || "normal",
            destinationJson,
          }),
        });
        setLoading(false);
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? "Could not create referral");
          return;
        }
        const d = await res.json();
        const id = d.referral?.id;
        if (id) {
          await fetch(`/api/care-support/referrals/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "submitted" }),
          });
        }
        router.push("/care/support/referrals");
      }}
    >
      {error ? (
        <div role="alert" className="rounded-lg border border-destructive p-3 text-sm">
          {error}
        </div>
      ) : null}

      <label htmlFor="referralType" className="text-sm font-medium">
        Referral type
      </label>
      <select id="referralType" name="referralType" className={formInputClass} required>
        {REFERRAL_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <label htmlFor="priority" className="text-sm font-medium">
        Priority
      </label>
      <select id="priority" name="priority" className={formInputClass} defaultValue="normal">
        <option value="low">Low</option>
        <option value="normal">Normal</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>

      <label htmlFor="summary" className="text-sm font-medium">
        Summary
      </label>
      <textarea id="summary" name="summary" rows={4} className={formInputClass} required />

      <label htmlFor="careRequestType" className="text-sm font-medium">
        Care request type (if care referral)
      </label>
      <input id="careRequestType" name="careRequestType" className={formInputClass} />

      <label htmlFor="careTitle" className="text-sm font-medium">
        Suggested care title
      </label>
      <input id="careTitle" name="careTitle" className={formInputClass} />

      <label htmlFor="providerQuery" className="text-sm font-medium">
        Provider search (if finding provider)
      </label>
      <input id="providerQuery" name="providerQuery" className={formInputClass} />

      <label htmlFor="suburb" className="text-sm font-medium">
        Suburb
      </label>
      <input id="suburb" name="suburb" className={formInputClass} />

      <label htmlFor="externalOrg" className="text-sm font-medium">
        External organisation name
      </label>
      <input id="externalOrg" name="externalOrg" className={formInputClass} />

      <label htmlFor="externalContact" className="text-sm font-medium">
        External contact
      </label>
      <input id="externalContact" name="externalContact" className={formInputClass} />

      <Button type="submit" variant="default" size="default" disabled={loading}>
        {loading ? "Submitting…" : "Submit referral"}
      </Button>
    </form>
  );
}
