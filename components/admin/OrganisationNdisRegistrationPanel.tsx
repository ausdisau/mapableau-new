"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function OrganisationNdisRegistrationPanel({
  organisationId,
  ndisRegistrationClaimed,
  ndisRegistrationNumber,
}: {
  organisationId: string;
  ndisRegistrationClaimed: boolean;
  ndisRegistrationNumber: string | null;
}) {
  const router = useRouter();
  const [number, setNumber] = useState(ndisRegistrationNumber ?? "");
  const [claimed, setClaimed] = useState(ndisRegistrationClaimed);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function verify(verified: boolean) {
    setSaving(true);
    setMessage("");
    const res = await fetch(
      `/api/admin/organisations/${organisationId}/ndis-registration`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verified,
          ndisRegistrationNumber: number,
        }),
      }
    );
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Update failed");
      return;
    }
    setMessage(verified ? "NDIS registration verified." : "NDIS registration cleared.");
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-semibold">NDIS registration</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Verify provider NDIS registration before enabling live claiming.
      </p>
      <div className="mt-4 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={claimed}
            onChange={(e) => setClaimed(e.target.checked)}
          />
          Registered NDIS provider
        </label>
        <input
          className={formInputClass}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="405000000"
          aria-label="NDIS registration number"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            disabled={saving}
            onClick={() => void verify(true)}
          >
            Verify registration
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={saving}
            onClick={() => void verify(false)}
          >
            Clear registration
          </Button>
        </div>
        {message ? <p className="text-sm">{message}</p> : null}
      </div>
    </section>
  );
}
