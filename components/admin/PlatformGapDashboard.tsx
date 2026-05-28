"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";

import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { Button } from "@/components/ui/button";
import type {
  PlatformGapAnalysisSummary,
  PlatformGapCategory,
  PlatformGapResolutionStatus,
  PlatformGapRow,
  PlatformGapSeverity,
} from "@/lib/platform-gaps/types";

const CATEGORIES: { id: PlatformGapCategory | "all"; label: string }[] = [
  { id: "all", label: "All categories" },
  { id: "product", label: "Product" },
  { id: "integration", label: "Integration" },
  { id: "tenancy_auth", label: "Tenancy & auth" },
  { id: "launch_ops", label: "Launch & ops" },
  { id: "compliance_ndis", label: "Compliance & NDIS" },
];

const SEVERITIES: { id: PlatformGapSeverity | "all"; label: string }[] = [
  { id: "all", label: "All severities" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
  { id: "informational", label: "Informational" },
];

const EFFECTIVE_FILTERS: {
  id: PlatformGapResolutionStatus | "all" | "openish";
  label: string;
}[] = [
  { id: "all", label: "All statuses" },
  { id: "openish", label: "Open / in progress" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In progress" },
  { id: "mitigated", label: "Mitigated" },
  { id: "accepted_risk", label: "Accepted risk" },
  { id: "closed", label: "Closed" },
];

const RESOLUTION_OPTIONS: PlatformGapResolutionStatus[] = [
  "open",
  "in_progress",
  "mitigated",
  "accepted_risk",
  "closed",
];

function formatLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function isOpenish(status: PlatformGapResolutionStatus): boolean {
  return status === "open" || status === "in_progress";
}

export function PlatformGapDashboard({
  initialSummary,
}: {
  initialSummary: PlatformGapAnalysisSummary;
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [category, setCategory] = useState<PlatformGapCategory | "all">("all");
  const [severity, setSeverity] = useState<PlatformGapSeverity | "all">("all");
  const [effectiveFilter, setEffectiveFilter] = useState<
    PlatformGapResolutionStatus | "all" | "openish"
  >("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PlatformGapRow | null>(null);
  const [overrideStatus, setOverrideStatus] =
    useState<PlatformGapResolutionStatus>("open");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const filteredGaps = useMemo(() => {
    const q = search.trim().toLowerCase();
    return summary.gaps.filter((gap) => {
      if (category !== "all" && gap.category !== category) return false;
      if (severity !== "all" && gap.severity !== severity) return false;
      if (effectiveFilter === "openish" && !isOpenish(gap.effectiveStatus)) {
        return false;
      }
      if (
        effectiveFilter !== "all" &&
        effectiveFilter !== "openish" &&
        gap.effectiveStatus !== effectiveFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        gap.title.toLowerCase().includes(q) ||
        gap.code.toLowerCase().includes(q) ||
        gap.description.toLowerCase().includes(q) ||
        gap.detectedSummary.toLowerCase().includes(q)
      );
    });
  }, [summary.gaps, category, severity, effectiveFilter, search]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/platform-gaps");
    if (!res.ok) return;
    const data = await res.json();
    if (data) setSummary(data);
  }, []);

  const openOverride = useCallback((gap: PlatformGapRow) => {
    setSelected(gap);
    setOverrideStatus(gap.overrideStatus ?? gap.effectiveStatus);
    setOverrideNotes(gap.overrideNotes ?? "");
    setError(null);
    dialogRef.current?.showModal();
  }, []);

  const closeOverride = useCallback(() => {
    dialogRef.current?.close();
    setSelected(null);
    setError(null);
  }, []);

  const saveOverride = useCallback(async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/platform-gaps", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: selected.code,
          status: overrideStatus,
          notes: overrideNotes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? data?.message ?? "Failed to save override");
        return;
      }
      closeOverride();
      await refresh();
    } catch {
      setError("Failed to save override");
    } finally {
      setSaving(false);
    }
  }, [selected, overrideStatus, overrideNotes, closeOverride, refresh]);

  const mitigatedOrClosed = summary.gaps.filter(
    (g) =>
      g.effectiveStatus === "mitigated" ||
      g.effectiveStatus === "accepted_risk" ||
      g.effectiveStatus === "closed"
  ).length;
  const mitigatedPct =
    summary.total > 0
      ? Math.round((mitigatedOrClosed / summary.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          title="Total gaps"
          value={summary.total}
          description={`Last evaluated ${new Date(summary.lastEvaluatedAt).toLocaleString()}`}
        />
        <AdminMetricCard
          title="Open / in progress"
          value={summary.openCount}
          description={`${mitigatedPct}% mitigated, accepted, or closed`}
        />
        <AdminMetricCard
          title="Critical + high"
          value={
            (summary.bySeverity.critical ?? 0) + (summary.bySeverity.high ?? 0)
          }
        />
        <AdminMetricCard
          title="Integrations"
          value={`${summary.byCategory.integration.open}/${summary.byCategory.integration.total} open`}
          href="/admin/integrations"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Category</span>
          <select
            className="min-h-10 rounded-lg border border-border bg-background px-3"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as PlatformGapCategory | "all")
            }
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Severity</span>
          <select
            className="min-h-10 rounded-lg border border-border bg-background px-3"
            value={severity}
            onChange={(e) =>
              setSeverity(e.target.value as PlatformGapSeverity | "all")
            }
          >
            {SEVERITIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Effective status</span>
          <select
            className="min-h-10 rounded-lg border border-border bg-background px-3"
            value={effectiveFilter}
            onChange={(e) =>
              setEffectiveFilter(
                e.target.value as PlatformGapResolutionStatus | "all" | "openish"
              )
            }
          >
            {EFFECTIVE_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Search</span>
          <input
            type="search"
            className="min-h-10 rounded-lg border border-border bg-background px-3"
            placeholder="Title, code, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <Button type="button" variant="outline" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredGaps.length} of {summary.total} gaps
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <caption className="sr-only">Platform gaps with detected and effective status</caption>
          <thead className="bg-muted/50 text-left">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Gap
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Category
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Severity
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Detected
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Effective
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Evidence
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredGaps.map((gap) => (
              <tr key={gap.code} className="border-t align-top">
                <td className="px-4 py-3">
                  <span className="font-medium">{gap.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {gap.code}
                  </span>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {gap.detectedSummary}
                  </p>
                  {gap.overrideNotes ? (
                    <p className="mt-1 text-xs italic text-muted-foreground">
                      Note: {gap.overrideNotes}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">{formatLabel(gap.category)}</td>
                <td className="px-4 py-3">{formatLabel(gap.severity)}</td>
                <td className="px-4 py-3">
                  <span>{formatLabel(gap.detectedStatus)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">
                    {formatLabel(gap.effectiveStatus)}
                  </span>
                  {gap.overrideStatus ? (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Override: {formatLabel(gap.overrideStatus)}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <ul className="space-y-1">
                    {gap.evidenceLinks.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openOverride(gap)}
                  >
                    Override
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dialog
        ref={dialogRef}
        className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg backdrop:bg-black/40"
        onClose={closeOverride}
      >
        {selected ? (
          <form
            method="dialog"
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void saveOverride();
            }}
          >
            <h2 className="font-heading text-lg font-bold">Override gap status</h2>
            <p className="text-sm text-muted-foreground">{selected.title}</p>
            <p className="text-xs text-muted-foreground">
              Detected: {formatLabel(selected.detectedStatus)} —{" "}
              {selected.detectedSummary}
            </p>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Resolution status</span>
              <select
                className="min-h-10 rounded-lg border border-border bg-background px-3"
                value={overrideStatus}
                onChange={(e) =>
                  setOverrideStatus(e.target.value as PlatformGapResolutionStatus)
                }
              >
                {RESOLUTION_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {formatLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Notes (optional)</span>
              <textarea
                className="min-h-[5rem] rounded-lg border border-border bg-background px-3 py-2"
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
                placeholder="Triage context, owner, or accepted-risk rationale"
              />
            </label>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeOverride}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save override"}
              </Button>
            </div>
          </form>
        ) : null}
      </dialog>
    </div>
  );
}
