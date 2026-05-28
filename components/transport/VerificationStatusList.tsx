"use client";

import { formInputClass } from "@/components/forms/AccessibleFormField";

export type VerificationRow = {
  kind: string;
  status: string;
  expiresAt: string | null;
  notes: string | null;
};

const STATUSES = [
  "not_provided",
  "pending_review",
  "verified",
  "expired",
  "rejected",
] as const;

export function VerificationStatusList({
  verifications,
  onPatch,
  loading,
}: {
  verifications: VerificationRow[];
  onPatch: (
    patches: Array<{
      kind: string;
      status: (typeof STATUSES)[number];
      expiresAt?: string | null;
      notes?: string | null;
    }>
  ) => Promise<void>;
  loading?: boolean;
}) {
  return (
    <ul className="space-y-4">
      {verifications.map((v) => (
        <li
          key={v.kind}
          className="rounded-lg border border-border p-3 space-y-2"
        >
          <p className="font-medium capitalize">{v.kind.replace(/_/g, " ")}</p>
          <label className="block text-sm">
            Status
            <select
              className={`${formInputClass} mt-1`}
              defaultValue={v.status}
              disabled={loading}
              onChange={async (e) => {
                await onPatch([
                  {
                    kind: v.kind,
                    status: e.target.value as (typeof STATUSES)[number],
                    expiresAt: v.expiresAt,
                    notes: v.notes,
                  },
                ]);
              }}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Expires (optional)
            <input
              type="datetime-local"
              className={`${formInputClass} mt-1`}
              defaultValue={
                v.expiresAt ? v.expiresAt.slice(0, 16) : ""
              }
              disabled={loading}
              onBlur={async (e) => {
                const val = e.target.value;
                await onPatch([
                  {
                    kind: v.kind,
                    status: v.status as (typeof STATUSES)[number],
                    expiresAt: val ? new Date(val).toISOString() : null,
                    notes: v.notes,
                  },
                ]);
              }}
            />
          </label>
        </li>
      ))}
    </ul>
  );
}
