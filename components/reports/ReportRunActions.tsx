"use client";

import { useState } from "react";

export function ReportRunActions({
  reportKey,
  canExport,
}: {
  reportKey: string;
  canExport?: boolean;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runReport() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/reports/${reportKey}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Run failed");
      setStatus(`Report run ${data.run?.id?.slice(0, 8) ?? "completed"}`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Run failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={runReport}
        disabled={loading}
        className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Running…" : "Run report"}
      </button>
      {canExport ? (
        <span className="text-sm text-muted-foreground">
          Export available after a completed run via API.
        </span>
      ) : null}
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
