"use client";

import { useCallback, useEffect, useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

type OrgNdis = {
  id: string;
  name: string;
  ndisRegistrationClaimed: boolean;
  ndisRegistrationNumber: string | null;
  verificationStatus: string;
};

export function ProviderNdisRegistrationForm({
  organisationId,
}: {
  organisationId?: string;
}) {
  const [org, setOrg] = useState<OrgNdis | null>(null);
  const [number, setNumber] = useState("");
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = organisationId ? `?organisationId=${organisationId}` : "";
    const res = await fetch(`/api/provider/organisation/ndis-registration${qs}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to load NDIS registration");
      setLoading(false);
      return;
    }
    const o = data.organisation as OrgNdis;
    setOrg(o);
    setNumber(o.ndisRegistrationNumber ?? "");
    setClaimed(o.ndisRegistrationClaimed);
    setLoading(false);
  }, [organisationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!org) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    const res = await fetch("/api/provider/organisation/ndis-registration", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organisationId: org.id,
        ndisRegistrationClaimed: claimed,
        ndisRegistrationNumber: number,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    setOrg(data.organisation);
    setMessage(
      claimed
        ? "NDIS registration submitted for admin review."
        : "NDIS registration details saved."
    );
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading NDIS registration…</p>;
  }

  if (error && !org) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (!org) return null;

  return (
    <section
      className="rounded-xl border border-border/60 p-4"
      aria-labelledby="ndis-registration-heading"
    >
      <h2 id="ndis-registration-heading" className="font-semibold">
        NDIS provider registration
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Required before NDIA claims or portal CSV export. Your registration number is
        verified by MapAble before claiming is enabled.
      </p>

      <div className="mt-4 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={claimed}
            onChange={(e) => setClaimed(e.target.checked)}
          />
          We are a registered NDIS provider
        </label>

        <div>
          <label htmlFor="ndis-reg-number" className="text-sm font-medium">
            NDIS registration number (9 digits)
          </label>
          <input
            id="ndis-reg-number"
            className={`${formInputClass} mt-1`}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="405000000"
            disabled={!claimed}
            inputMode="numeric"
            pattern="[0-9]{9,10}"
          />
        </div>

        {org.verificationStatus === "verified" && org.ndisRegistrationClaimed ? (
          <p className="text-sm text-green-700">Registration verified by MapAble.</p>
        ) : org.ndisRegistrationClaimed ? (
          <p className="text-sm text-amber-700">Pending admin verification.</p>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}

        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save registration"}
        </Button>
      </div>
    </section>
  );
}
