"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type QueueItem = {
  id: string;
  queueType: string;
  priority: string;
  title: string;
  plainLanguageSummary: string | null;
  entityType: string | null;
  entityId: string | null;
  organisationId: string | null;
  createdAt: string;
};

type Category = "all" | "care" | "transport" | "incident";

function actionLink(item: QueueItem): { href: string; label: string } | null {
  if (!item.entityId) return null;
  switch (item.queueType) {
    case "care_allocation":
      return {
        href: `/provider/care/allocations`,
        label: "Review allocation",
      };
    case "care_shift":
      return {
        href: `/provider/care/roster`,
        label: "View roster",
      };
    case "transport_dispatch":
      return {
        href: `/provider/transport/dispatch`,
        label: "Open dispatch board",
      };
    case "transport_plan_review":
    case "transport_optimisation_review":
      return {
        href: `/provider/transport/dispatch`,
        label: "Review transport plan",
      };
    case "transport_booking":
      return {
        href: `/dashboard/transport`,
        label: "View transport",
      };
    case "incident":
      return {
        href: `/admin/incidents`,
        label: "Triage incident",
      };
    default:
      return null;
  }
}

function formatAge(createdAt: string) {
  const ms = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function DispatchConsole() {
  const [category, setCategory] = useState<Category>("all");
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params =
        category === "all" ? "" : `?category=${encodeURIComponent(category)}`;
      const res = await fetch(`/api/admin/dispatch${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load dispatch queues");
        return;
      }
      setQueues(data.queues ?? []);
    } catch {
      setError("Could not load dispatch queues");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void load();
  }, [load]);

  async function syncQueues() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sync failed");
        return;
      }
      setQueues(data.queues ?? []);
    } catch {
      setError("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const tabs: { id: Category; label: string }[] = [
    { id: "all", label: "All" },
    { id: "care", label: "Care" },
    { id: "transport", label: "Transport" },
    { id: "incident", label: "Incidents" },
  ];

  return (
    <div className="space-y-6">
      <div
        className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        role="status"
      >
        Recommendations only — human dispatch required. Automated planning never
        assigns workers, drivers, or vehicles without your confirmation.
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            variant={category === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={syncing}
          onClick={() => void syncQueues()}
        >
          {syncing ? "Syncing…" : "Sync queues"}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading queues…</p>
      ) : (
        <table className="w-full text-sm">
          <caption className="sr-only">Open dispatch queue items</caption>
          <thead>
            <tr className="text-left">
              <th scope="col" className="pb-2">
                Priority
              </th>
              <th scope="col" className="pb-2">
                Type
              </th>
              <th scope="col" className="pb-2">
                Summary
              </th>
              <th scope="col" className="pb-2">
                Age
              </th>
              <th scope="col" className="pb-2">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {queues.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-muted-foreground">
                  No open queue items. Try syncing or check filters.
                </td>
              </tr>
            ) : (
              queues.map((q) => {
                const link = actionLink(q);
                return (
                  <tr key={q.id} className="border-t">
                    <td className="py-2 capitalize">{q.priority}</td>
                    <td className="py-2">
                      {q.queueType.replace(/_/g, " ")}
                    </td>
                    <td className="py-2">
                      {q.plainLanguageSummary ?? q.title}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {formatAge(q.createdAt)}
                    </td>
                    <td className="py-2">
                      {link ? (
                        <Link
                          href={link.href}
                          className="text-primary underline"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
