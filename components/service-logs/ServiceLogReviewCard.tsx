"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ServiceLogReviewCard({
  serviceLog,
  canAct,
}: {
  serviceLog: {
    id: string;
    status: string;
    serviceSummary: string;
    serviceDate: string;
    durationMinutes: number | null;
  };
  canAct: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [disputeReason, setDisputeReason] = useState("");

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <p className="text-sm text-slate-600 capitalize">
        Status: {serviceLog.status.replace(/_/g, " ")}
      </p>
      <p className="font-medium">{serviceLog.serviceSummary}</p>
      <p className="text-sm text-slate-600">
        {new Date(serviceLog.serviceDate).toLocaleDateString("en-AU")}
        {serviceLog.durationMinutes
          ? ` — ${serviceLog.durationMinutes} minutes`
          : ""}
      </p>

      {canAct ? (
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            className="min-h-11 px-4 rounded-md bg-blue-700 text-white font-medium"
            onClick={async () => {
              setStatus("Approving…");
              await fetch(`/api/service-logs/${serviceLog.id}/approve`, {
                method: "POST",
              });
              setStatus("Approved.");
              router.refresh();
            }}
          >
            Approve service log
          </button>
          <textarea
            placeholder="Dispute reason"
            rows={2}
            className="border rounded-md px-3 py-2"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
          />
          <button
            type="button"
            className="min-h-11 px-4 rounded-md border border-slate-300 font-medium"
            onClick={async () => {
              await fetch(`/api/service-logs/${serviceLog.id}/dispute`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: disputeReason }),
              });
              router.refresh();
            }}
          >
            Dispute
          </button>
        </div>
      ) : null}
      <p aria-live="polite" className="text-sm text-slate-600">
        {status}
      </p>
    </div>
  );
}
