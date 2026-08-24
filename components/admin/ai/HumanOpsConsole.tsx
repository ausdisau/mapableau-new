"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { HUMAN_OPS_A11Y } from "@/lib/ai/platform/human-operations";

type QueueRow = {
  id: string;
  reviewId: string;
  category: string;
  priority: string;
  status: string;
  participantId: string;
  missionId: string | null;
  assignedTo: string | null;
  createdAt: string;
  dueAt: string | null;
  href: string;
  safeguarding: boolean;
};

export function HumanOpsConsole() {
  const queueId = useId();
  const statusId = useId();
  const [items, setItems] = useState<QueueRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    try {
      const res = await fetch(`/api/ai/human-ops/queue?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load queue");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <a href={`#${queueId}`} className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:bg-background focus:p-2">
        {HUMAN_OPS_A11Y.skipToQueue}
      </a>

      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">
          Human Operations Console
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Authorised operators resolve cases needing human judgement without
          bypassing participant authority. Safeguarding remains human-only.
          Resolutions prepare next steps — they do not silently execute actions.
        </p>
        <p className="text-sm text-muted-foreground" id={`${queueId}-hints`}>
          Keyboard: {HUMAN_OPS_A11Y.keyboardHints.join(" · ")}
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[12rem] flex-col gap-1 text-sm" htmlFor={statusId}>
          <span className="font-medium">Status filter</span>
          <select
            id={statusId}
            className={formInputClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All open-relevant</option>
            <option value="queued">Queued</option>
            <option value="assigned">Assigned</option>
            <option value="awaiting_information">Awaiting information</option>
            <option value="in_review">In review</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
        <Button type="button" onClick={() => void load()}>
          Refresh queue
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <p className="text-sm" role="status" aria-live="polite">
        {loading ? "Loading queue…" : `${total} review item${total === 1 ? "" : "s"} visible for your role and tenants.`}
      </p>

      <div
        id={queueId}
        tabIndex={-1}
        role="region"
        aria-label={HUMAN_OPS_A11Y.reviewLandmark}
        className="overflow-x-auto rounded border"
      >
        <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
          <caption className="sr-only">{HUMAN_OPS_A11Y.queueTableCaption}</caption>
          <thead className="bg-muted/40">
            <tr>
              <th scope="col" className="p-3 font-semibold">Category</th>
              <th scope="col" className="p-3 font-semibold">Priority</th>
              <th scope="col" className="p-3 font-semibold">Status</th>
              <th scope="col" className="p-3 font-semibold">Participant</th>
              <th scope="col" className="p-3 font-semibold">Mission</th>
              <th scope="col" className="p-3 font-semibold">Assignee</th>
              <th scope="col" className="p-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-muted-foreground">
                  No review items in your accessible queues.
                </td>
              </tr>
            ) : null}
            {items.map((row) => (
              <tr key={row.reviewId} className="border-t">
                <td className="p-3">
                  <Link
                    href={row.href}
                    className="font-medium text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {row.category}
                    {row.safeguarding ? " (restricted)" : ""}
                  </Link>
                </td>
                <td className="p-3">
                  <StatusBadge status={row.priority} />
                </td>
                <td className="p-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="p-3 font-mono text-xs">{row.participantId}</td>
                <td className="p-3 font-mono text-xs">{row.missionId ?? "—"}</td>
                <td className="p-3">{row.assignedTo ?? "Unassigned"}</td>
                <td className="p-3">{new Date(row.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
