"use client";

import { useState } from "react";

export default function ProviderReportsPage() {
  const [organisationId, setOrganisationId] = useState("");
  const [reportJson, setReportJson] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function exportReport() {
    setError(null);
    const res = await fetch(
      `/api/academy/provider/reports?organisationId=${encodeURIComponent(organisationId)}`,
    );
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError((data as { error?: string } | null)?.error ?? "Export failed.");
      return;
    }
    setReportJson(JSON.stringify(data.report, null, 2));
  }

  return (
    <article className="space-y-4">
      <h1 className="font-heading text-3xl font-bold text-teal-950">Reports</h1>
      <p className="text-sm text-slate-600">
        Exports match visible learner records and create an audit event.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          className="rounded border px-3 py-2 text-sm"
          placeholder="Organisation ID"
          value={organisationId}
          onChange={(e) => setOrganisationId(e.target.value)}
        />
        <button
          type="button"
          onClick={exportReport}
          className="rounded bg-teal-800 px-4 py-2 text-sm text-white"
        >
          Export JSON
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {reportJson ? (
        <pre className="overflow-x-auto rounded bg-slate-100 p-3 text-xs">{reportJson}</pre>
      ) : null}
    </article>
  );
}
