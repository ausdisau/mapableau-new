"use client";

import dynamic from "next/dynamic";
import { useCallback, useId, useState } from "react";

import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { mapableSectionCardClass } from "@/lib/brand/styles";

const PaceTelemetryMap = dynamic(() => import("./PaceTelemetryMap"), {
  ssr: false,
});

type PacePreview = {
  shift: {
    id: string;
    status: string;
    startAt: string;
    endAt: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    participantName: string;
    organisationName: string;
  };
  pace: {
    authorized: boolean;
    status: string;
    warnings: string[];
    profile: {
      ndisNumber: string | null;
      remainingCategoryBudget: number;
      totalCategoryBudget: number;
    };
  };
  telemetry: {
    checkIn: {
      latitude: number;
      longitude: number;
      timestamp: string | null;
    } | null;
    checkOut: {
      latitude: number;
      longitude: number;
      timestamp: string;
      accuracyMeters: number;
      geofenceWithinRadius: boolean;
      geofenceDistanceMeters: number;
    } | null;
  };
  pricingPreview: {
    supportItemNumber: string;
    timeBand: string;
    intensity: string;
    quantityHours: number;
    unitPriceAUD: number;
    totalAmountAUD: number;
  } | null;
  notice: string;
};

function PaceBadge({
  authorized,
  status,
}: {
  authorized: boolean;
  status: string;
}) {
  const tone = authorized
    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
    : "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100";
  const label = authorized ? "PACE Endorsed" : "Unendorsed";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
        tone
      )}
    >
      <span className="sr-only">Status: </span>
      {label}
      <span className="sr-only"> ({status})</span>
    </span>
  );
}

function formatMoney(aud: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(aud);
}

export function PaceTelemetryClaimingPanel() {
  const headingId = useId();
  const dialogTitleId = useId();
  const [shiftId, setShiftId] = useState("");
  const [preview, setPreview] = useState<PacePreview | null>(null);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadPreview = useCallback(async () => {
    if (!shiftId.trim()) {
      setError("Enter a completed shift ID");
      return;
    }
    setLoading(true);
    setError("");
    setStatusMessage("");
    try {
      const res = await fetch(
        `/api/care/shifts/${encodeURIComponent(shiftId.trim())}/pace-preview`
      );
      const data = await res.json();
      if (!res.ok) {
        setPreview(null);
        setError(data.error ?? "Could not load PACE preview");
        return;
      }
      setPreview(data as PacePreview);
      setStatusMessage("PACE telemetry preview loaded.");
    } catch {
      setError("Network error loading preview");
    } finally {
      setLoading(false);
    }
  }, [shiftId]);

  const submitClaim = useCallback(async () => {
    if (!preview) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/ndis/claims/pace-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedShiftId: preview.shift.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not generate PACE claim draft");
        setConfirmOpen(false);
        return;
      }
      setStatusMessage(
        `DRAFT_ONLY claim ${data.claimId} generated. Not submitted to NDIA.`
      );
      setConfirmOpen(false);
    } catch {
      setError("Network error submitting claim draft");
    } finally {
      setSubmitting(false);
    }
  }, [preview]);

  return (
    <section
      aria-labelledby={headingId}
      className={cn(mapableSectionCardClass, "space-y-4 p-4 sm:p-6")}
    >
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={headingId} className="font-heading text-xl font-bold">
            PACE Telemetry Claiming
          </h2>
          {preview ? (
            <PaceBadge
              authorized={preview.pace.authorized}
              status={preview.pace.status}
            />
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground" role="note">
          Scaffold / DRAFT_ONLY — not live NDIA PACE submission. Enable with{" "}
          <code className="text-xs">MAPABLE_PACE_TELEMETRY_CLAIMING_ENABLED=true</code>
          .
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label htmlFor="pace-shift-id" className="block text-sm font-medium">
            Completed shift ID
          </label>
          <input
            id="pace-shift-id"
            className="w-full min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={shiftId}
            onChange={(e) => setShiftId(e.target.value)}
            autoComplete="off"
          />
        </div>
        <Button
          type="button"
          variant="default"
          size="default"
          loading={loading}
          disabled={loading}
          onClick={() => void loadPreview()}
        >
          Load preview
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>
      {statusMessage ? (
        <p className="text-sm text-[#005B7F]" aria-hidden="true">
          {statusMessage}
        </p>
      ) : null}

      {preview ? (
        <div className="space-y-4">
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-base">
                {preview.shift.participantName}
              </CardTitle>
              <CardDescription>
                Shift {preview.shift.id} · {preview.shift.status.replace(/_/g, " ")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                NDIS number:{" "}
                {preview.pace.profile.ndisNumber ?? "Not on file"}
              </p>
              <p>
                Category budget remaining:{" "}
                {formatMoney(preview.pace.profile.remainingCategoryBudget)} /{" "}
                {formatMoney(preview.pace.profile.totalCategoryBudget)}
              </p>
              {preview.pace.warnings.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5 text-amber-800 dark:text-amber-200">
                  {preview.pace.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Shift telemetry map</h3>
            <PaceTelemetryMap
              checkIn={
                preview.telemetry.checkIn
                  ? {
                      latitude: preview.telemetry.checkIn.latitude,
                      longitude: preview.telemetry.checkIn.longitude,
                      label: "Worker check-in",
                    }
                  : null
              }
              checkOut={
                preview.telemetry.checkOut
                  ? {
                      latitude: preview.telemetry.checkOut.latitude,
                      longitude: preview.telemetry.checkOut.longitude,
                      label: "Worker check-out",
                    }
                  : null
              }
            />
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                Check-in:{" "}
                {preview.telemetry.checkIn
                  ? `${preview.telemetry.checkIn.latitude.toFixed(5)}, ${preview.telemetry.checkIn.longitude.toFixed(5)}`
                  : "Not recorded"}
              </li>
              <li>
                Check-out:{" "}
                {preview.telemetry.checkOut
                  ? `${preview.telemetry.checkOut.latitude.toFixed(5)}, ${preview.telemetry.checkOut.longitude.toFixed(5)} (${preview.telemetry.checkOut.geofenceWithinRadius ? "within" : "outside"} geofence)`
                  : "Not recorded"}
              </li>
            </ul>
          </div>

          {preview.pricingPreview ? (
            <Card variant="elevated" className="border-[#005B7F]/20">
              <CardHeader>
                <CardTitle className="text-base">
                  Auto-generated line item preview
                </CardTitle>
                <CardDescription>
                  {preview.pricingPreview.supportItemNumber} ·{" "}
                  {preview.pricingPreview.timeBand.replace(/_/g, " ")} ·{" "}
                  {preview.pricingPreview.intensity}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Hours</p>
                  <p className="text-lg font-semibold">
                    {preview.pricingPreview.quantityHours}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unit price</p>
                  <p className="text-lg font-semibold">
                    {formatMoney(preview.pricingPreview.unitPriceAUD)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold text-[#005B7F]">
                    {formatMoney(preview.pricingPreview.totalAmountAUD)}
                  </p>
                </div>
                <div className="sm:col-span-3">
                  <Button
                    type="button"
                    variant="default"
                    size="default"
                    disabled={!preview.telemetry.checkOut}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Submit Instant PACE Claim
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete check-in and check-out with GPS to generate a line item
              preview.
            </p>
          )}
        </div>
      ) : null}

      {confirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md space-y-4 rounded-2xl border bg-background p-6 shadow-lg">
            <h3 id={dialogTitleId} className="text-lg font-semibold">
              Confirm DRAFT_ONLY PACE claim
            </h3>
            <p className="text-sm text-muted-foreground">
              This generates an immutable draft claim payload linked to shift
              telemetry hashes. It does <strong>not</strong> submit to NDIA PACE.
              Human review is required.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="default"
                size="default"
                loading={submitting}
                disabled={submitting}
                onClick={() => void submitClaim()}
              >
                Generate draft claim
              </Button>
              <Button
                type="button"
                variant="outline"
                size="default"
                disabled={submitting}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
