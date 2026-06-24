"use client";

import { useCallback, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mapableSectionCardClass } from "@/lib/brand/styles";
import { NDIS_DISCLAIMER } from "@/types/ndis-pricing";

export function PriceCatalogueImportForm() {
  const fileId = useId();
  const catalogueId = useId();
  const versionId = useId();
  const [fileName, setFileName] = useState("");
  const [catalogueName, setCatalogueName] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<Array<{ row: number; message: string }>>(
    []
  );
  const [busy, setBusy] = useState(false);

  const onFile = useCallback(async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    return text;
  }, []);

  async function submit(apply: boolean) {
    const input = document.getElementById(fileId) as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      setStatus("Choose a CSV file exported from your price guide.");
      return;
    }
    setBusy(true);
    setStatus(null);
    setErrors([]);
    try {
      const csvText = await onFile(file);
      const url = apply
        ? "/api/admin/ndis-pricing/import?action=apply"
        : "/api/admin/ndis-pricing/import";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvText,
          fileName: file.name,
          catalogueName: catalogueName || undefined,
          versionLabel: versionLabel || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Import failed");
        return;
      }
      setErrors(data.validationErrors ?? []);
      setStatus(
        apply
          ? `Applied catalogue version ${data.applied?.version?.version ?? ""} (${data.job?.rowCount ?? 0} rows).`
          : `Uploaded job ${data.job?.id?.slice(0, 8)}… — ${data.validationErrors?.length ?? 0} validation issue(s).`
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={mapableSectionCardClass}>
      <CardHeader>
        <CardTitle className="font-heading text-lg">
          Import price catalogue (CSV)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground" role="note">
          {NDIS_DISCLAIMER} Upload a CSV you exported manually — MapAble does not
          scrape NDIS websites.
        </p>
        <div>
          <label htmlFor={fileId} className="text-sm font-medium">
            Catalogue file (CSV)
          </label>
          <input
            id={fileId}
            type="file"
            accept=".csv,text/csv"
            className="mt-1 block w-full text-sm"
            aria-describedby={`${fileId}-hint`}
          />
          <p id={`${fileId}-hint`} className="mt-1 text-xs text-muted-foreground">
            Expected columns include code, name, price limit, unit, category. XLSX:
            save as CSV first.
            {fileName ? ` Selected: ${fileName}` : ""}
          </p>
        </div>
        <div>
          <label htmlFor={catalogueId} className="text-sm font-medium">
            Catalogue name (optional)
          </label>
          <input
            id={catalogueId}
            type="text"
            value={catalogueName}
            onChange={(e) => setCatalogueName(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="NDIS Price Guide 2025-26"
          />
        </div>
        <div>
          <label htmlFor={versionId} className="text-sm font-medium">
            Version label (optional)
          </label>
          <input
            id={versionId}
            type="text"
            value={versionLabel}
            onChange={(e) => setVersionLabel(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="2025-07-01"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="default"
            size="default"
            disabled={busy}
            onClick={() => void submit(false)}
            aria-busy={busy}
          >
            Validate upload
          </Button>
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={busy}
            onClick={() => void submit(true)}
            aria-busy={busy}
          >
            Validate and apply version
          </Button>
        </div>
        {status ? (
          <p className="text-sm" role="status" aria-live="polite">
            {status}
          </p>
        ) : null}
        {errors.length > 0 ? (
          <ul className="list-disc pl-5 text-sm text-amber-800 dark:text-amber-200">
            {errors.map((e) => (
              <li key={`${e.row}-${e.message}`}>
                Row {e.row}: {e.message}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
