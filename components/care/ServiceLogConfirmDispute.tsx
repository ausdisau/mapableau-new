"use client";

import { useState } from "react";

export function ServiceLogConfirmDispute({ serviceLogId }: { serviceLogId: string }) {
  const [message, setMessage] = useState<string | null>(null);

  async function post(action: "confirm" | "dispute") {
    const body =
      action === "confirm" ? { notes: "Confirmed" } : { reason: "Needs follow-up" };
    const res = await fetch(`/api/care/service-logs/${serviceLogId}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setMessage(res.ok ? `Service log ${action}ed` : "Unable to update service log");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button className="rounded-lg bg-primary px-3 py-2 text-primary-foreground" onClick={() => post("confirm")}>
        Confirm
      </button>
      <button className="rounded-lg border px-3 py-2" onClick={() => post("dispute")}>
        Dispute
      </button>
      {message ? <p className="w-full text-sm">{message}</p> : null}
    </div>
  );
}
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function ServiceLogConfirmDispute({
  serviceLogId,
}: {
  serviceLogId: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function post(path: "confirm" | "dispute") {
    setError(null);
    const response = await fetch(`/api/care/service-logs/${serviceLogId}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(path === "dispute" ? { reason } : {}),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Could not update service log");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="default" size="default" onClick={() => post("confirm")}>
          Confirm log
        </Button>
        <Button type="button" variant="outline" size="default" onClick={() => post("dispute")} disabled={!reason.trim()}>
          Dispute log
        </Button>
      </div>
      <textarea
        className={formInputClass}
        rows={3}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Reason for dispute"
      />
    </div>
  );
}
