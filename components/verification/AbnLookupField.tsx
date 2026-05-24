"use client";

import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

type LookupResult = {
  abn: string;
  entityName: string | null;
  entityStatus: string;
  entityType: string | null;
  message: string | null;
};

export function AbnLookupField({
  organisationId,
  initialAbn,
  onSaved,
}: {
  organisationId: string;
  initialAbn?: string | null;
  onSaved?: () => void;
}) {
  const [abn, setAbn] = useState(initialAbn ?? "");
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function runLookup() {
    setLoading(true);
    setMessage("");
    setLookup(null);
    try {
      const res = await fetch("/api/verification/abn/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abn }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Lookup failed");
        return;
      }
      setLookup(data.lookup);
    } finally {
      setLoading(false);
    }
  }

  async function saveAbn() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(
        `/api/verification/organisations/${organisationId}/abn`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ abn }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not save ABN");
        return;
      }
      setMessage("ABN saved to your organisation profile.");
      onSaved?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h2 className="font-semibold">ABN lookup</h2>
      <p className="text-sm text-muted-foreground">
        Verify your Australian Business Number against the Australian Business Register.
      </p>
      <label htmlFor="abn-input" className="block text-sm font-medium">
        ABN
      </label>
      <input
        id="abn-input"
        className={formInputClass}
        value={abn}
        onChange={(e) => setAbn(e.target.value)}
        placeholder="11 digit ABN"
        inputMode="numeric"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="default" size="default" loading={loading} onClick={runLookup}>
          Look up ABN
        </Button>
        <Button type="button" variant="outline" size="default" loading={loading} onClick={saveAbn}>
          Save to organisation
        </Button>
      </div>
      {lookup ? (
        <dl className="text-sm space-y-1 rounded-lg bg-muted/50 p-3">
          <div className="flex gap-2 items-center">
            <dt className="font-medium">Status</dt>
            <dd>
              <StatusBadge status={lookup.entityStatus.toLowerCase()} />
            </dd>
          </div>
          {lookup.entityName ? (
            <div>
              <dt className="font-medium">Registered name</dt>
              <dd>{lookup.entityName}</dd>
            </div>
          ) : null}
          {lookup.message ? (
            <p className="text-muted-foreground">{lookup.message}</p>
          ) : null}
        </dl>
      ) : null}
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
    </section>
  );
}
