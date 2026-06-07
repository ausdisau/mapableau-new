"use client";

import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function NdiaRemittanceImportForm({
  organisationId,
}: {
  organisationId: string;
}) {
  const [fileName, setFileName] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onFileChange(file: File | null) {
    if (!file) return;
    setFileName(file.name);
    setCsvContent(await file.text());
  }

  async function importCsv() {
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/provider/ndia-remittance/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organisationId,
        fileName: fileName || "remittance.csv",
        csvContent,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Import failed");
      return;
    }
    const summary = data.import?.summaryJson as {
      matched?: number;
      unmatched?: number;
      rowCount?: number;
    };
    setResult(
      `Imported ${summary?.rowCount ?? 0} rows — ${summary?.matched ?? 0} matched, ${summary?.unmatched ?? 0} unmatched.`
    );
  }

  return (
    <section className="rounded-xl border border-border/60 p-4">
      <h2 className="font-semibold">Import NDIA remittance CSV</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload remittance advice from NDIA or myplace. Matched claims are marked paid
        automatically.
      </p>
      <div className="mt-4 space-y-3">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
          aria-label="Remittance CSV file"
        />
        <textarea
          className={`${formInputClass} min-h-24 font-mono text-xs`}
          value={csvContent}
          onChange={(e) => setCsvContent(e.target.value)}
          placeholder="Or paste CSV content (headers: externalClaimId, amount, paymentDate)"
        />
        <Button type="button" disabled={loading || !csvContent} onClick={() => void importCsv()}>
          {loading ? "Importing…" : "Import remittance"}
        </Button>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {result ? <p className="text-sm text-green-700">{result}</p> : null}
      </div>
    </section>
  );
}
