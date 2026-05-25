"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RecoveryActionPanel({
  recoveryCaseId,
  backupOptions,
  canManage,
}: {
  recoveryCaseId: string;
  backupOptions: Array<{ id: string; providerName: string; safeToOffer: boolean }>;
  canManage: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function post(path: string, body?: Record<string, unknown>) {
    setStatus("Working...");
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setStatus(res.ok ? "Updated." : "Could not update.");
    if (res.ok) router.refresh();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">Next actions</h2>
      {canManage ? (
        <button
          type="button"
          className="mt-3 min-h-11 rounded-md bg-blue-700 px-4 font-medium text-white"
          onClick={() =>
            post(`/api/service-recovery/cases/${recoveryCaseId}/find-backups`)
          }
        >
          Find safe backup options
        </button>
      ) : null}

      {backupOptions.length ? (
        <ul className="mt-4 space-y-2">
          {backupOptions.map((option) => (
            <li key={option.id} className="rounded-md border p-3">
              <p className="font-medium">{option.providerName}</p>
              <p className="text-sm text-slate-600">
                {option.safeToOffer
                  ? "Safe to offer for participant choice"
                  : "Not safe to offer"}
              </p>
              <button
                type="button"
                className="mt-2 min-h-11 rounded-md border border-slate-300 px-3 text-sm font-medium"
                onClick={() =>
                  post(
                    `/api/service-recovery/cases/${recoveryCaseId}/select-backup`,
                    { backupOptionId: option.id }
                  )
                }
              >
                Select this backup
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        className="mt-4 min-h-11 rounded-md border border-slate-300 px-4 font-medium"
        onClick={() =>
          post(`/api/service-recovery/cases/${recoveryCaseId}/escalate`, {
            reason: "Needs human support review",
          })
        }
      >
        Escalate to support
      </button>
      <p aria-live="polite" className="mt-2 text-sm text-slate-600">
        {status}
      </p>
    </div>
  );
}
