"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mapableSectionCardClass } from "@/lib/brand/styles";

type Finding = {
  code: string;
  severity: string;
  audience: string;
  plainMessage?: string | null;
  technicalMessage: string;
  supportItemCode?: string | null;
};

export function ClaimValidationPanel({
  defaultInvoiceId,
  view = "provider",
}: {
  defaultInvoiceId?: string;
  view?: "participant" | "provider" | "admin";
}) {
  const invoiceFieldId = useId();
  const [invoiceId, setInvoiceId] = useState(defaultInvoiceId ?? "");
  const [summary, setSummary] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runCheck() {
    if (!invoiceId.trim()) return;
    setBusy(true);
    const res = await fetch(
      `/api/claim-validation/check-invoice/${encodeURIComponent(invoiceId.trim())}`,
      { method: "POST" }
    );
    const data = await res.json();
    if (!res.ok) {
      setSummary(data.error ?? "Validation failed");
      setFindings([]);
    } else {
      setSummary(data.summary);
      setDisclaimer(data.disclaimer ?? data.message);
      const providerFindings = (data.findings as Finding[]).filter(
        (f) => view === "participant" ? f.audience === "participant" || f.plainMessage : f.audience !== "admin" || view === "admin"
      );
      setFindings(
        view === "admin"
          ? (data.findings as Finding[])
          : providerFindings.filter((f) =>
              view === "participant" ? f.plainMessage : f.audience === "provider"
            )
      );
    }
    setBusy(false);
  }

  return (
    <Card className={mapableSectionCardClass}>
      <CardHeader>
        <CardTitle className="font-heading text-lg">
          Claim validation pre-check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground" role="note">
          Compares invoice lines to your catalogue. Does not submit claims to the
          NDIA or approve funding.
        </p>
        <div>
          <label htmlFor={invoiceFieldId} className="text-sm font-medium">
            Invoice ID
          </label>
          <input
            id={invoiceFieldId}
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <Button
          type="button"
          variant="default"
          size="default"
          onClick={() => void runCheck()}
          disabled={busy}
        >
          Run pre-check
        </Button>
        {disclaimer ? (
          <p className="text-xs text-muted-foreground">{disclaimer}</p>
        ) : null}
        {summary ? (
          <p className="text-sm font-medium" role="status" aria-live="polite">
            {summary}
          </p>
        ) : null}
        {findings.length > 0 ? (
          <ul className="space-y-2" aria-label="Validation findings">
            {findings.map((f, i) => (
              <li
                key={`${f.code}-${i}`}
                className={`rounded-md border p-3 text-sm ${
                  f.severity === "error"
                    ? "border-destructive/50"
                    : "border-amber-500/40"
                }`}
              >
                <span className="font-mono text-xs">{f.code}</span>
                <span className="ml-2 text-xs uppercase text-muted-foreground">
                  {f.severity}
                </span>
                <p className="mt-1">
                  {view === "participant"
                    ? f.plainMessage ?? f.technicalMessage
                    : f.technicalMessage}
                </p>
                {f.supportItemCode ? (
                  <p className="text-xs text-muted-foreground">
                    Item: {f.supportItemCode}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
