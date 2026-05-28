"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { Button } from "@/components/ui/button";
import { isLaunchAutoCheckSupported } from "@/lib/launch-readiness/launch-auto-checks";
import type { LaunchAutoCheckResult } from "@/lib/launch-readiness/launch-auto-checks";
import type { LaunchReadinessStatus } from "@prisma/client";

type LaunchItemRow = {
  id: string;
  code: string;
  category: string;
  title: string;
  description: string | null;
  status: LaunchReadinessStatus;
  notes: string | null;
  evidenceDocumentId: string | null;
  runbookPath: string;
  platformGapCode: string;
  gapSeverity: string;
};

type LaunchSummary = {
  total: number;
  ready: number;
  percent: number;
  productionReady: boolean;
  checklistComplete: boolean;
  expectedChecklistTotal: number;
  items: LaunchItemRow[];
  nextBlockers: {
    code: string;
    title: string;
    status: string;
    gapSeverity: string;
    runbookPath: string;
  }[];
};

const STATUS_OPTIONS: LaunchReadinessStatus[] = [
  "not_started",
  "in_progress",
  "blocked",
  "ready",
  "waived",
];

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

export function LaunchReadinessDashboard({
  initialSummary,
}: {
  initialSummary: LaunchSummary;
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [checkCode, setCheckCode] = useState<string | null>(null);
  const [autoResult, setAutoResult] = useState<LaunchAutoCheckResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/launch-readiness");
    if (!res.ok) return;
    const data = await res.json();
    if (data) setSummary(data);
  }, []);

  const updateStatus = useCallback(
    async (code: string, status: LaunchReadinessStatus) => {
      setSavingCode(code);
      setError(null);
      try {
        const res = await fetch("/api/admin/launch-readiness", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            status,
            notes: notesDraft[code] ?? null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error ?? "Update failed");
          return;
        }
        await refresh();
      } finally {
        setSavingCode(null);
      }
    },
    [notesDraft, refresh]
  );

  const runAutoCheck = useCallback(async (code: string, apply: boolean) => {
    setCheckCode(code);
    setError(null);
    setAutoResult(null);
    try {
      const res = await fetch("/api/admin/launch-readiness/auto-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, apply }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Auto-check failed");
        return;
      }
      setAutoResult(data.result ?? null);
      if (apply) await refresh();
    } finally {
      setCheckCode(null);
    }
  }, [refresh]);

  const itemsByCategory = useMemo(() => {
    const acc: Record<string, LaunchItemRow[]> = {};
    for (const item of summary.items) {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
    }
    return acc;
  }, [summary.items]);

  const categoryOrder = useMemo(
    () => Object.keys(itemsByCategory),
    [itemsByCategory]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <AdminMetricCard
          label="Ready / waived"
          value={`${summary.ready} / ${summary.total}`}
          hint={`${summary.percent}% complete`}
        />
        <AdminMetricCard
          label="Production gate"
          value={summary.productionReady ? "Open" : "Blocked"}
          hint={
            summary.productionReady
              ? "All items ready or waived"
              : "Complete remaining checklist items"
          }
        />
        <AdminMetricCard
          label="Catalog"
          value={
            summary.checklistComplete
              ? "Full (22)"
              : `Partial (${summary.total})`
          }
          hint={`Expected ${summary.expectedChecklistTotal} items`}
        />
      </div>

      {!summary.productionReady && summary.nextBlockers.length > 0 ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">
          <p className="font-semibold">Next launch blockers</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {summary.nextBlockers.map((b) => (
              <li key={b.code}>
                <span className="font-medium">{b.title}</span> (
                {formatStatus(b.status)}, {b.gapSeverity})
                {" — "}
                <Link
                  href={b.runbookPath}
                  className="underline underline-offset-2"
                >
                  Runbook
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {autoResult ? (
        <p className="rounded-lg border bg-muted/40 p-3 text-sm">
          Auto-check ({autoResult.code}): {autoResult.summary}
          {autoResult.details?.length ? (
            <span className="mt-1 block text-muted-foreground">
              {autoResult.details.join(" · ")}
            </span>
          ) : null}
        </p>
      ) : null}

      <div className="space-y-8">
        {categoryOrder.map((category) => (
          <section key={category} aria-labelledby={`launch-cat-${category}`}>
            <h2
              id={`launch-cat-${category}`}
              className="font-heading text-lg font-semibold capitalize"
            >
              {category.replace(/_/g, " ")}
            </h2>
            <ul className="mt-3 space-y-3">
              {itemsByCategory[category].map((item) => (
                <li key={item.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <strong>{item.title}</strong>
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({formatStatus(item.status)})
                      </span>
                      {item.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.code} · gap {item.platformGapCode}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={item.runbookPath}
                        className="text-sm text-primary underline-offset-2 hover:underline"
                      >
                        Runbook
                      </Link>
                      <Link
                        href="/admin/platform-gaps"
                        className="text-sm text-primary underline-offset-2 hover:underline"
                      >
                        Gaps
                      </Link>
                    </div>
                  </div>

                  <label className="mt-3 block text-xs font-medium">
                    Notes / evidence summary
                    <textarea
                      className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
                      rows={2}
                      value={notesDraft[item.code] ?? item.notes ?? ""}
                      onChange={(e) =>
                        setNotesDraft((prev) => ({
                          ...prev,
                          [item.code]: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <Button
                        key={status}
                        type="button"
                        size="sm"
                        variant={
                          item.status === status ? "default" : "outline"
                        }
                        disabled={savingCode === item.code}
                        onClick={() => updateStatus(item.code, status)}
                      >
                        {formatStatus(status)}
                      </Button>
                    ))}
                    {isLaunchAutoCheckSupported(item.code) ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={checkCode === item.code}
                          onClick={() => runAutoCheck(item.code, false)}
                        >
                          Run check
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={checkCode === item.code}
                          onClick={() => runAutoCheck(item.code, true)}
                        >
                          Apply suggestion
                        </Button>
                      </>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
