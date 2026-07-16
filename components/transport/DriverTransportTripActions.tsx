"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { TransportTripStatus } from "@prisma/client";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { AV_DRIVER_TRIP_TRANSITIONS } from "@/lib/av-framework/trip-transitions";
import { transportTripStatusLabel } from "@/lib/transport/transport-status-labels";
import type { TransportNextAction, TransportTripApiResponse } from "@/types/transport";

const EVIDENCE_TYPES = [
  { value: "service_completed", label: "Service completed" },
  { value: "handover_notes", label: "Handover notes" },
  { value: "delay_explanation", label: "Delay explanation" },
  { value: "other", label: "Other" },
];

function driverNextStatuses(current: TransportTripStatus): TransportTripStatus[] {
  return AV_DRIVER_TRIP_TRANSITIONS[current] ?? [];
}

export function DriverTransportTripActions({
  trip,
  nextActions,
}: {
  trip: TransportTripApiResponse["trip"];
  nextActions: TransportNextAction[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidenceType, setEvidenceType] = useState("service_completed");
  const [evidenceNotes, setEvidenceNotes] = useState("");

  const statusAction = nextActions.find((a) => a.action === "update_status");
  const evidenceAction = nextActions.find((a) => a.action === "submit_evidence");
  const nextStatuses = driverNextStatuses(trip.status);

  async function updateStatus(status: TransportTripStatus) {
    if (!statusAction?.href) return;
    if (
      status === "trip_completed" &&
      !confirm("Mark this trip as completed?")
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(statusAction.href, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Status update failed");
      return;
    }
    router.refresh();
  }

  async function submitEvidence() {
    if (!evidenceAction?.href) return;
    setLoading(true);
    setError(null);
    const res = await fetch(evidenceAction.href, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evidenceType,
        notes: evidenceNotes.trim() || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Evidence submission failed");
      return;
    }
    setEvidenceNotes("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {nextStatuses.length > 0 && statusAction ? (
        <div className="space-y-3" role="group" aria-label="Update trip status">
          <h3 className="font-semibold">Update status</h3>
          {nextStatuses.map((status) => (
            <Button
              key={status}
              type="button"
              variant="default"
              size="default"
              className="w-full"
              loading={loading}
              onClick={() => updateStatus(status)}
            >
              {transportTripStatusLabel(status)}
            </Button>
          ))}
        </div>
      ) : null}

      {evidenceAction ? (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <h3 className="font-semibold">Submit evidence</h3>
          <label className="block text-sm">
            Evidence type
            <select
              className={formInputClass}
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value)}
            >
              {EVIDENCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Notes
            <textarea
              className={formInputClass}
              rows={3}
              value={evidenceNotes}
              onChange={(e) => setEvidenceNotes(e.target.value)}
              placeholder="Optional notes about the completed trip"
            />
          </label>
          <Button
            type="button"
            variant="default"
            size="default"
            loading={loading}
            onClick={() => submitEvidence()}
          >
            Submit evidence
          </Button>
        </div>
      ) : null}
    </div>
  );
}
