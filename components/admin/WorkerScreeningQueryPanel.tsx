"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";

type Jurisdiction = "NSW" | "VIC" | "QLD" | "SA" | "WA" | "TAS" | "ACT" | "NT";

type QueryReport = {
  checkedAt: string;
  pathway: {
    jurisdiction: Jurisdiction;
    unitName: string;
    officialUrl: string;
    nationalDatabaseUrl: string;
    notes: string[];
  } | null;
  providerHealth: {
    providerId: string;
    jurisdiction?: Jurisdiction;
    configured: boolean;
    liveTransportEnabled: boolean;
    capabilities: string[];
    notes: string[];
  } | null;
  assessment: {
    status:
      | "clearance"
      | "pending"
      | "interim_bar"
      | "exclusion"
      | "suspension"
      | "no_valid_clearance"
      | "unable_to_verify";
    canTreatAsCleared: boolean;
    requiresHumanReview: boolean;
    reasonCodes: string[];
    evidence: Array<{
      status: string;
      source: string;
      checkedAt: string;
      expiresAt?: string | null;
      sourceReference?: string;
      notes: string[];
    }>;
  };
  notes: string[];
};

type Props = {
  pathways: Array<{
    jurisdiction: Jurisdiction;
    unitName: string;
    officialUrl: string;
    nationalDatabaseUrl: string;
    notes: string[];
  }>;
};

function statusLabel(status: QueryReport["assessment"]["status"]) {
  return status.replaceAll("_", " ");
}

export function WorkerScreeningQueryPanel({ pathways }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<QueryReport | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(
      [
        "workerName",
        "screeningId",
        "dateOfBirth",
        "jurisdiction",
        "employerProviderName",
        "employerAbn",
      ]
        .map((key) => [key, String(form.get(key) ?? "").trim()] as const)
        .filter(([, value]) => value.length > 0),
    );

    try {
      const response = await fetch("/api/admin/workforce/screening/query", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        report?: QueryReport;
        error?: string;
        issues?: string[];
      };

      if (!response.ok || !data.ok || !data.report) {
        setError(
          data.issues?.join(" ") || data.error || "Worker screening query failed.",
        );
        return;
      }

      setReport(data.report);
    } catch {
      setError("Could not reach the worker screening query service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section
        className="rounded-lg border bg-card p-6"
        aria-labelledby="worker-screening-query-heading"
      >
        <h2 id="worker-screening-query-heading" className="text-lg font-semibold">
          Query worker screening status
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Enter as little or as much information as you have. MapAble only treats a
          worker as cleared when current authoritative screening evidence supports
          that conclusion. Provider registration and absence of public enforcement
          records are not substitutes for worker clearance.
        </p>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={(event) => void submit(event)}>
          <label className="grid gap-1 text-sm font-medium">
            Worker name
            <input
              name="workerName"
              autoComplete="off"
              className="min-h-11 rounded-md border bg-background px-3 py-2 font-normal"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Worker screening ID or application ID
            <input
              name="screeningId"
              autoComplete="off"
              className="min-h-11 rounded-md border bg-background px-3 py-2 font-normal"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Date of birth
            <input
              name="dateOfBirth"
              type="date"
              className="min-h-11 rounded-md border bg-background px-3 py-2 font-normal"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Screening jurisdiction
            <select
              name="jurisdiction"
              className="min-h-11 rounded-md border bg-background px-3 py-2 font-normal"
              defaultValue=""
            >
              <option value="">Unknown / not supplied</option>
              {pathways.map((pathway) => (
                <option key={pathway.jurisdiction} value={pathway.jurisdiction}>
                  {pathway.jurisdiction} — {pathway.unitName}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Employer or provider name
            <input
              name="employerProviderName"
              autoComplete="organization"
              className="min-h-11 rounded-md border bg-background px-3 py-2 font-normal"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Employer ABN
            <input
              name="employerAbn"
              inputMode="numeric"
              pattern="[0-9]{11}"
              aria-describedby="worker-screening-abn-help"
              className="min-h-11 rounded-md border bg-background px-3 py-2 font-normal"
            />
            <span id="worker-screening-abn-help" className="text-xs font-normal text-muted-foreground">
              11 digits, without spaces.
            </span>
          </label>

          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Checking…" : "Check available evidence"}
            </Button>
            <p className="text-xs text-muted-foreground">
              No query is a public worker-clearance lookup. Authorised portal/API access is required for authoritative status.
            </p>
          </div>
        </form>

        {error ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      {report ? (
        <section
          className="rounded-lg border bg-card p-6"
          aria-labelledby="worker-screening-result-heading"
          aria-live="polite"
        >
          <h2 id="worker-screening-result-heading" className="text-lg font-semibold">
            Screening result
          </h2>

          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium">Status</dt>
              <dd className="capitalize">{statusLabel(report.assessment.status)}</dd>
            </div>
            <div>
              <dt className="font-medium">May MapAble treat this as cleared?</dt>
              <dd>{report.assessment.canTreatAsCleared ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="font-medium">Human review required</dt>
              <dd>{report.assessment.requiresHumanReview ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="font-medium">Checked</dt>
              <dd>{new Date(report.checkedAt).toLocaleString("en-AU")}</dd>
            </div>
          </dl>

          {report.assessment.reasonCodes.length > 0 ? (
            <div className="mt-5">
              <h3 className="font-medium">Reason codes</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {report.assessment.reasonCodes.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {report.notes.length > 0 ? (
            <div className="mt-5">
              <h3 className="font-medium">Notes</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {report.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {report.pathway ? (
            <div className="mt-5 rounded-md border p-4">
              <h3 className="font-medium">Authoritative verification pathway</h3>
              <p className="mt-1 text-sm">{report.pathway.unitName}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <a
                  href={report.pathway.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  State/Territory screening unit
                </a>
                <a
                  href={report.pathway.nationalDatabaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  NDIS Worker Screening Database guidance
                </a>
              </div>
            </div>
          ) : null}

          {report.providerHealth ? (
            <div className="mt-5 text-sm">
              <h3 className="font-medium">Connector status</h3>
              <p className="mt-1 text-muted-foreground">
                {report.providerHealth.providerId}: {report.providerHealth.liveTransportEnabled ? "live transport enabled" : "live transport not enabled"}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
