"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Signal = {
  id: string;
  summary: string;
  sourceType: string;
  urgency: string;
  status: string;
  immediateSafetyConcern: boolean;
  serviceVertical: string;
  observedAt: string;
  receivedAt: string;
  isAnonymous: boolean;
  dismissReason?: string | null;
};

function urgencyLabel(urgency: string): string {
  switch (urgency) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "moderate":
      return "Moderate";
    case "low":
      return "Low";
    default:
      return "Unassessed";
  }
}

export function SafeguardsInbox() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("signal");

  const [items, setItems] = useState<Signal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  const load = useCallback(async (sync = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/quality-safeguards/signals${sync ? "?sync=true" : ""}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      const json = (await res.json()) as { items: Signal[] };
      setItems(json.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  async function triage(
    id: string,
    action: "triage" | "dismiss_with_reason" | "convert_to_case" | "request_more_info",
    reason?: string
  ) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/quality-safeguards/signals/${id}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason,
          notes:
            action === "triage"
              ? "Marked triaged from Safeguards Inbox"
              : undefined,
          convertedResourceType:
            action === "convert_to_case" ? "pending_case" : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Triage failed (${res.status})`);
      }
      setAnnounce(`Signal ${id.slice(0, 8)} updated: ${action.replaceAll("_", " ")}`);
      await load(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Triage failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          onClick={() => void load(true)}
        >
          Refresh and sync feeders
        </button>
        <p className="text-sm text-muted-foreground">
          Signals are never silently discarded. Dismissals require a reason.
        </p>
      </div>

      <div className="sr-only" aria-live="polite">
        {announce}
      </div>

      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-muted-foreground">Loading safeguards inbox…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No signals in the current scope.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <caption className="sr-only">
              Unified safeguards signal inbox
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Summary
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Source
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Urgency
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Status
                </th>
                <th scope="col" className="py-2 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const focused = focusId === item.id;
                return (
                  <tr
                    key={item.id}
                    id={`signal-${item.id}`}
                    className={
                      focused
                        ? "border-b border-border bg-muted/50"
                        : "border-b border-border/60"
                    }
                  >
                    <td className="py-3 pr-3 align-top">
                      <p className="font-medium">{item.summary}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.serviceVertical}
                        {item.immediateSafetyConcern
                          ? " · Immediate safety concern"
                          : ""}
                        {item.isAnonymous ? " · Anonymous" : ""}
                      </p>
                      {item.dismissReason ? (
                        <p className="mt-1 text-xs">
                          Dismiss reason: {item.dismissReason}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 align-top">
                      {item.sourceType.replaceAll("_", " ")}
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <span className="font-medium">
                        {urgencyLabel(item.urgency)}
                      </span>
                    </td>
                    <td className="py-3 pr-3 align-top">
                      {item.status.replaceAll("_", " ")}
                    </td>
                    <td className="py-3 align-top">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-sm"
                          disabled={busyId === item.id || item.status !== "new"}
                          onClick={() => void triage(item.id, "triage")}
                        >
                          Mark triaged
                        </button>
                        <button
                          type="button"
                          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-sm"
                          disabled={
                            busyId === item.id ||
                            item.status === "converted_to_case" ||
                            item.status === "dismissed_with_reason"
                          }
                          onClick={() =>
                            void triage(item.id, "convert_to_case")
                          }
                        >
                          Convert to case
                        </button>
                        <button
                          type="button"
                          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-sm"
                          disabled={
                            busyId === item.id ||
                            item.status === "dismissed_with_reason"
                          }
                          onClick={() => {
                            const reason = window.prompt(
                              "Reason for dismissal (required — never silent discard):"
                            );
                            if (!reason?.trim()) return;
                            void triage(item.id, "dismiss_with_reason", reason);
                          }}
                        >
                          Dismiss with reason
                        </button>
                        <button
                          type="button"
                          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-sm"
                          disabled={busyId === item.id}
                          onClick={() =>
                            void triage(item.id, "request_more_info")
                          }
                        >
                          Request more info
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
