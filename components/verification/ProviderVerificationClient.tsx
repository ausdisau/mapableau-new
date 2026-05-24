"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

export function ProviderVerificationClient({
  organisationId,
  caseId,
  caseStatus,
  abnCheckStatus,
  abnNotesJson,
}: {
  organisationId: string;
  caseId: string | null;
  caseStatus: string | null;
  abnCheckStatus: string | null;
  abnNotesJson: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  let notes: {
    entityName?: string | null;
    entityStatus?: string;
    nameMatch?: { matchReason?: string; matchScore?: number };
  } | null = null;
  if (abnNotesJson) {
    try {
      notes = JSON.parse(abnNotesJson);
    } catch {
      notes = null;
    }
  }

  async function createCase() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/provider-verification/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organisationId,
        runAbnCheck: true,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Verification case created and ABN check started.");
      router.refresh();
    } else {
      const data = await res.json();
      setMessage(data.error ?? "Could not create case");
    }
  }

  async function rerunAbn() {
    if (!caseId) return;
    setLoading(true);
    setMessage("");
    const res = await fetch(
      `/api/provider-verification/cases/${caseId}/run-abn-check`,
      { method: "POST" }
    );
    setLoading(false);
    if (res.ok) {
      setMessage("ABN check completed.");
      router.refresh();
    } else {
      const data = await res.json();
      setMessage(data.error ?? "ABN check failed");
    }
  }

  async function submitCase() {
    if (!caseId) return;
    setLoading(true);
    setMessage("");
    const res = await fetch(
      `/api/provider-verification/cases/${caseId}/submit`,
      { method: "POST" }
    );
    setLoading(false);
    if (res.ok) {
      setMessage("Case submitted for review.");
      router.refresh();
    } else {
      const data = await res.json();
      setMessage(data.error ?? "Submit failed — ensure ABN check passed");
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h2 className="font-semibold">Provider verification</h2>
      {caseId ? (
        <>
          <p className="text-sm text-muted-foreground">Case status: {caseStatus}</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">ABN check:</span>
            {abnCheckStatus ? (
              <StatusBadge status={abnCheckStatus} />
            ) : (
              <span>Not run</span>
            )}
          </div>
          {notes ? (
            <dl className="text-sm space-y-1 text-muted-foreground">
              {notes.entityName ? (
                <div>
                  <dt className="inline font-medium">ABR name: </dt>
                  <dd className="inline">{notes.entityName}</dd>
                </div>
              ) : null}
              {notes.nameMatch?.matchReason ? (
                <p>{notes.nameMatch.matchReason}</p>
              ) : null}
            </dl>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="default" loading={loading} onClick={rerunAbn}>
              Re-run ABN check
            </Button>
            {caseStatus === "draft" || caseStatus === "more_information_required" ? (
              <Button type="button" variant="default" size="default" loading={loading} onClick={submitCase}>
                Submit for review
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <Button type="button" variant="default" size="default" loading={loading} onClick={createCase}>
          Start verification (ABN check)
        </Button>
      )}
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
    </section>
  );
}
