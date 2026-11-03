"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function DownloadConsentAuditButton() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadAudit() {
    setExporting(true);
    setError(null);
    const res = await fetch("/api/consent/micro?export=csv");
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Could not download audit");
      setExporting(false);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mapable-consent-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="default"
        className="min-h-11"
        disabled={exporting}
        onClick={() => void downloadAudit()}
      >
        {exporting ? "Preparing audit…" : "Download consent audit (CSV)"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Download a record of your consent grants and revokes for your own
        records. Does not include other participants’ data.
      </p>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
