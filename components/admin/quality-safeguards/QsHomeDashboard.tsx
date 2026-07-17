"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ImmediateSafetyStrip } from "./ImmediateSafetyStrip";

type Dashboard = {
  disclaimer: string;
  immediateSafety: Array<{
    id: string;
    label: string;
    urgency: string;
    urgencyDescription: string;
    summary: string;
    href: string;
    immediateSafetyConcern: boolean;
  }>;
  approachingDeadlines: Array<{
    id: string;
    ruleCode: string;
    resourceType: string;
    resourceId: string;
    dueAt: string;
    status: string;
    timezone: string;
  }>;
  inboxCounts: {
    newSignals: number;
    criticalOpen: number;
    dismissedWithReason: number;
    converted: number;
  };
  qualityPulse: Array<{
    id: string;
    label: string;
    value: number | string;
    denominatorExplanation: string;
    href?: string;
  }>;
  qualityPulseTable: Array<{
    metric: string;
    value: string;
    notes: string;
  }>;
};

export function QsHomeDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/quality-safeguards/dashboard");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Failed (${res.status})`);
        }
        const json = (await res.json()) as Dashboard;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-muted-foreground">Loading operations cockpit…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="text-destructive">
        {error}
      </p>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">{data.disclaimer}</p>

      <ImmediateSafetyStrip
        items={data.immediateSafety}
        deadlines={data.approachingDeadlines}
      />

      <section aria-labelledby="inbox-counts-heading" className="space-y-3">
        <h2 id="inbox-counts-heading" className="text-lg font-semibold">
          Safeguards inbox snapshot
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <li className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">New signals</p>
            <p className="text-2xl font-semibold">{data.inboxCounts.newSignals}</p>
          </li>
          <li className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Critical open</p>
            <p className="text-2xl font-semibold">
              {data.inboxCounts.criticalOpen}
            </p>
          </li>
          <li className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Converted to cases</p>
            <p className="text-2xl font-semibold">{data.inboxCounts.converted}</p>
          </li>
          <li className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Dismissed with reason</p>
            <p className="text-2xl font-semibold">
              {data.inboxCounts.dismissedWithReason}
            </p>
          </li>
        </ul>
        <Link
          href="/admin/ops/quality-safeguards/inbox"
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Open full inbox
        </Link>
      </section>

      <section aria-labelledby="quality-pulse-heading" className="space-y-3">
        <h2 id="quality-pulse-heading" className="text-lg font-semibold">
          Quality pulse
        </h2>
        <p className="text-sm text-muted-foreground">
          Trends for organisational learning — not league tables of people.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <caption className="sr-only">
              Quality pulse metrics with denominator explanations
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Metric
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Value
                </th>
                <th scope="col" className="py-2 font-medium">
                  Denominator / notes
                </th>
              </tr>
            </thead>
            <tbody>
              {data.qualityPulseTable.map((row) => (
                <tr key={row.metric} className="border-b border-border/60">
                  <td className="py-2 pr-3">{row.metric}</td>
                  <td className="py-2 pr-3 font-medium">{row.value}</td>
                  <td className="py-2 text-muted-foreground">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
