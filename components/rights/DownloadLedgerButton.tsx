"use client";

import { useState } from "react";

export function DownloadLedgerButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rights/ledger", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to generate ledger manifest");
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `rights-ledger-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not download ledger manifest. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
      >
        {loading ? "Generating…" : "Download ledger manifest"}
      </button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
