"use client";

import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

type Summary = {
  credentials: { field: string; status: string; required: boolean; passed: boolean }[];
  contractorAbn: {
    status: string;
    abn: string;
    entityName: string | null;
    message: string | null;
  };
  recommendation: string;
};

export function WorkerVerificationPanel({
  workerId,
  initialContractorAbn,
}: {
  workerId: string;
  initialContractorAbn?: string | null;
}) {
  const [contractorAbn, setContractorAbn] = useState(initialContractorAbn ?? "");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function saveContractorAbn() {
    setLoading(true);
    const res = await fetch(`/api/workers/${workerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractorAbn: contractorAbn || null }),
    });
    setLoading(false);
    if (res.ok) setMessage("Contractor ABN saved.");
    else setMessage("Could not save contractor ABN.");
  }

  async function runChecks() {
    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/workers/${workerId}/verification/run`, {
      method: "POST",
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setSummary(data.summary);
      setMessage(`Recommendation: ${data.summary.recommendation}`);
    } else {
      setMessage(data.error ?? "Verification run failed");
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h2 className="font-semibold">Worker verification checks</h2>
      <p className="text-sm text-muted-foreground">
        Credential status and optional sole-trader ABN lookup. Final approval remains manual.
      </p>
      <label htmlFor="contractor-abn" className="block text-sm font-medium">
        Contractor ABN (optional)
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="contractor-abn"
          className={formInputClass}
          value={contractorAbn}
          onChange={(e) => setContractorAbn(e.target.value)}
          placeholder="Sole trader ABN"
        />
        <Button type="button" variant="outline" size="sm" loading={loading} onClick={saveContractorAbn}>
          Save ABN
        </Button>
      </div>
      <Button type="button" variant="default" size="default" loading={loading} onClick={runChecks}>
        Run verification checks
      </Button>
      {summary ? (
        <div className="space-y-2 text-sm">
          <p>
            Recommendation:{" "}
            <StatusBadge status={summary.recommendation} />
          </p>
          <ul className="list-disc pl-5 space-y-1">
            {summary.credentials.map((c) => (
              <li key={c.field}>
                {c.field}: {c.status}
                {c.required ? " (required)" : ""}
              </li>
            ))}
          </ul>
          {summary.contractorAbn.status !== "skipped" ? (
            <p>
              Contractor ABN: {summary.contractorAbn.status}
              {summary.contractorAbn.entityName
                ? ` — ${summary.contractorAbn.entityName}`
                : ""}
            </p>
          ) : null}
        </div>
      ) : null}
      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </section>
  );
}
