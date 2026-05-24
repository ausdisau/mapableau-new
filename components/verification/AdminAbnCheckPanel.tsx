"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

export function AdminAbnCheckPanel({
  organisationId,
  caseId,
  checkStatus,
  notesJson,
}: {
  organisationId: string;
  caseId: string | null;
  checkStatus: string | null;
  notesJson: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  let notes: Record<string, unknown> | null = null;
  if (notesJson) {
    try {
      notes = JSON.parse(notesJson);
    } catch {
      notes = null;
    }
  }

  async function runCheck() {
    setLoading(true);
    setMessage("");
    let activeCaseId = caseId;
    if (!activeCaseId) {
      const createRes = await fetch("/api/provider-verification/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisationId, runAbnCheck: false }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        setMessage(createData.error ?? "Could not create case");
        setLoading(false);
        return;
      }
      activeCaseId = createData.case?.id;
    }
    if (!activeCaseId) {
      setLoading(false);
      return;
    }
    const res = await fetch(
      `/api/provider-verification/cases/${activeCaseId}/run-abn-check`,
      { method: "POST" }
    );
    setLoading(false);
    if (res.ok) {
      setMessage("ABN check completed.");
      router.refresh();
    } else {
      const data = await res.json();
      setMessage(data.error ?? "Check failed");
    }
  }

  return (
    <section className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
      <h3 className="font-semibold text-sm">Automated ABN check</h3>
      <div className="flex items-center gap-2 text-sm">
        <span>Result:</span>
        {checkStatus ? <StatusBadge status={checkStatus} /> : <span>Not run</span>}
      </div>
      {notes && typeof notes === "object" ? (
        <pre className="text-xs overflow-auto max-h-40 rounded bg-background p-2">
          {JSON.stringify(notes, null, 2)}
        </pre>
      ) : null}
      <Button type="button" size="sm" variant="outline" loading={loading} onClick={runCheck}>
        Run ABN check
      </Button>
      {caseId ? (
        <p className="text-xs text-muted-foreground">Case ID: {caseId}</p>
      ) : null}
      {message ? <p className="text-sm">{message}</p> : null}
    </section>
  );
}
