"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function MonthlyStatementGenerator({
  planId,
  defaultMonth,
}: {
  planId: string;
  defaultMonth: string;
}) {
  const [month, setMonth] = useState(defaultMonth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingExports, setRemainingExports] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/abilitypay/entitlements");
      if (res.ok) {
        const data = await res.json();
        setRemainingExports(data.remainingExports ?? null);
      }
    })();
  }, []);

  async function downloadStatement() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/abilitypay/exports/statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, month }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Export failed");
      }
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `abilitypay-statement-${month}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  async function downloadClaimPack() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/abilitypay/exports/claim-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Export failed");
      }
      const csv = await res.text();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `abilitypay-claim-pack-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports and exports</CardTitle>
        <CardDescription>
          Download a monthly statement or CSV claim pack for your records. These
          are not submitted to NDIA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {remainingExports !== null ? (
          <p className="text-sm text-muted-foreground">
            <strong>{remainingExports}</strong> export
            {remainingExports === 1 ? "" : "s"} remaining this month on your
            current plan.
          </p>
        ) : null}
        <div>
          <label htmlFor="statement-month" className="text-sm font-medium">
            Statement month
          </label>
          <input
            id="statement-month"
            type="month"
            className="mt-1 block min-h-11 w-full max-w-xs rounded-lg border border-input bg-background px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="default"
            size="default"
            className="min-h-11"
            disabled={loading}
            onClick={downloadStatement}
          >
            {loading ? "Preparing…" : "Download monthly statement"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="default"
            className="min-h-11"
            disabled={loading}
            onClick={downloadClaimPack}
          >
            Download CSV claim pack
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
