"use client";

import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

type VerificationRecord = {
  kind: string;
  status: string;
  expiresAt: string | null;
  notes: string | null;
};

const VERIFICATION_STATUSES = [
  "not_provided",
  "pending_review",
  "verified",
  "expired",
  "rejected",
] as const;

export function TransportVerificationEditor({
  organisationId,
  resourceType,
  resourceId,
  requiredKinds,
  verifications,
  onSaved,
}: {
  organisationId: string;
  resourceType: "drivers" | "vehicles";
  resourceId: string;
  requiredKinds: string[];
  verifications: VerificationRecord[];
  onSaved: () => void;
}) {
  const [rows, setRows] = useState(() =>
    requiredKinds.map((kind) => {
      const existing = verifications.find((v) => v.kind === kind);
      return {
        kind,
        status: existing?.status ?? "not_provided",
        expiresAt: existing?.expiresAt?.slice(0, 10) ?? "",
        notes: existing?.notes ?? "",
      };
    })
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/provider/transport/${resourceType}/${resourceId}/verifications?organisationId=${organisationId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verifications: rows.map((row) => ({
            kind: row.kind,
            status: row.status,
            expiresAt: row.expiresAt
              ? new Date(`${row.expiresAt}T12:00:00Z`).toISOString()
              : null,
            notes: row.notes || null,
          })),
        }),
      }
    );
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not save verifications");
      return;
    }
    onSaved();
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Verification records</h3>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <ul className="space-y-3">
        {rows.map((row, index) => (
          <li
            key={row.kind}
            className="rounded-lg border border-border p-3 text-sm space-y-2"
          >
            <p className="font-medium capitalize">{row.kind.replace(/_/g, " ")}</p>
            <label className="block">
              <span className="text-muted-foreground">Status</span>
              <select
                className={formInputClass}
                value={row.status}
                onChange={(e) => {
                  const next = [...rows];
                  next[index] = { ...row, status: e.target.value };
                  setRows(next);
                }}
              >
                {VERIFICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-muted-foreground">Expires</span>
              <input
                type="date"
                className={formInputClass}
                value={row.expiresAt}
                onChange={(e) => {
                  const next = [...rows];
                  next[index] = { ...row, expiresAt: e.target.value };
                  setRows(next);
                }}
              />
            </label>
            <label className="block">
              <span className="text-muted-foreground">Notes</span>
              <input
                type="text"
                className={formInputClass}
                value={row.notes}
                onChange={(e) => {
                  const next = [...rows];
                  next[index] = { ...row, notes: e.target.value };
                  setRows(next);
                }}
              />
            </label>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="default"
        size="default"
        loading={loading}
        onClick={() => save()}
      >
        Save verifications
      </Button>
    </div>
  );
}
