"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { TransportNextAction } from "@/types/transport";

const PARTICIPANT_ACTIONS = new Set(["cancel", "confirm", "dispute"]);

export function TransportTripActions({
  tripId,
  actions,
}: {
  tripId: string;
  actions: TransportNextAction[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const participantActions = actions.filter((a) => PARTICIPANT_ACTIONS.has(a.action));

  if (participantActions.length === 0) return null;

  async function runAction(action: TransportNextAction) {
    if (!action.href || action.method !== "POST") return;

    let body: string | undefined;
    if (action.action === "cancel") {
      const reason = window.prompt("Optional reason for cancelling this trip:");
      body = JSON.stringify({ reason: reason ?? undefined });
    } else if (action.action === "dispute") {
      const reason = window.prompt("Please describe why you are disputing this trip:");
      if (!reason || reason.trim().length < 3) {
        setError("A short description is required to dispute a trip.");
        return;
      }
      body = JSON.stringify({ reason: reason.trim() });
    } else if (action.action === "confirm") {
      body = JSON.stringify({ confirmed: true });
    }

    setLoading(action.action);
    setError(null);
    try {
      const res = await fetch(action.href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "That action could not be completed. Please try again."
        );
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="space-y-3" aria-labelledby={`trip-actions-${tripId}`}>
      <h2 id={`trip-actions-${tripId}`} className="font-semibold">
        Actions
      </h2>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <ul className="flex flex-wrap gap-2">
        {participantActions.map((action) => (
          <li key={action.action}>
            <Button
              type="button"
              variant={action.action === "cancel" ? "outline" : "default"}
              size="default"
              loading={loading === action.action}
              onClick={() => runAction(action)}
            >
              {action.label}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
