"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AccessFitBadge } from "@/components/access-chat/AccessFitBadge";
import type { AccessSearchResult } from "@/types/access-chat";

type Props = {
  result: AccessSearchResult;
  onOpenMarker?: (placeId: string) => void;
  onRefine?: (suggestion: string) => void;
  shareAccessProfile?: boolean;
};

export function AccessResultCard({
  result,
  onOpenMarker,
  onRefine,
  shareAccessProfile,
}: Props) {
  const router = useRouter();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [transportError, setTransportError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function planTransport() {
    setTransportError(null);
    setBusy(true);
    try {
      const summaryRes = await fetch(
        `/api/access-search/place/${result.placeId}/summary`,
      );
      const summary = summaryRes.ok ? await summaryRes.json() : null;
      const lat = summary?.latitude;
      const lng = summary?.longitude;
      if (lat == null || lng == null) {
        setTransportError(
          "This place does not have map coordinates for transport planning yet.",
        );
        return;
      }

      const res = await fetch("/api/transport/accessible-trip-from-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: result.placeId,
          destination: { lat, lng },
          activeWarnings: result.evidence.activeAlerts,
          accessScore: result.accessSummary.overallScore,
          confidenceScore: result.fit.confidence,
          shareAccessProfile: Boolean(shareAccessProfile),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTransportError(data.error ?? "Could not start transport planning.");
        return;
      }
      router.push(data.planningUrl ?? "#transport-coming-soon");
    } catch {
      setTransportError("Could not start transport planning.");
    } finally {
      setBusy(false);
    }
  }

  async function savePlace() {
    setSaveState("saving");
    try {
      const res = await fetch("/api/access/places/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: result.placeId }),
      });
      if (res.status === 401) {
        setSaveState("error");
        return;
      }
      if (!res.ok) {
        setSaveState("error");
        return;
      }
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  const buttonClass =
    "min-h-11 rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#0C1833] hover:border-[#005B7F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F] disabled:opacity-60";

  return (
    <article
      className="rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm"
      aria-labelledby={`place-${result.placeId}-name`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            id={`place-${result.placeId}-name`}
            className="text-lg font-bold text-[#0C1833]"
          >
            {result.name}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {result.category.replace(/_/g, " ")}
            {result.address ? ` · ${result.address}` : ""}
            {result.distanceMeters != null
              ? ` · ${Math.round(result.distanceMeters)} m`
              : ""}
          </p>
        </div>
        <AccessFitBadge
          label={result.fit.label}
          confidence={result.fit.confidence}
        />
      </div>

      {result.fit.reasons.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-800">
          {result.fit.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}

      {result.fit.cautions.length > 0 ? (
        <div
          className="mt-3 rounded-lg border-2 border-amber-800 bg-amber-50 p-3 text-sm text-amber-950"
          role="note"
        >
          <p className="font-semibold">Cautions</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {result.fit.cautions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.evidence.activeAlerts?.length ? (
        <div
          className="mt-3 rounded-lg border-2 border-red-800 bg-red-50 p-3 text-sm text-red-950"
          role="alert"
        >
          <p className="font-semibold">Active alerts</p>
          <ul className="mt-1 list-disc pl-5">
            {result.evidence.activeAlerts.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.accessSummary.lastVerifiedAt ? (
        <p className="mt-2 text-sm text-slate-600">
          Last verification:{" "}
          {new Date(result.accessSummary.lastVerifiedAt).toLocaleDateString(
            "en-AU",
          )}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonClass}
          onClick={() => onOpenMarker?.(result.placeId)}
        >
          Open marker
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => void planTransport()}
          disabled={busy}
        >
          Plan accessible transport
        </button>
        <Link
          href={result.actions.addReportUrl ?? `/access/review/${result.placeId}`}
          className={`${buttonClass} inline-flex items-center`}
        >
          Add access report
        </Link>
        <button
          type="button"
          className={buttonClass}
          onClick={() => void savePlace()}
          disabled={saveState === "saving" || saveState === "saved"}
          aria-describedby={`save-${result.placeId}-status`}
        >
          {saveState === "saved" ? "Saved" : "Save place"}
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() =>
            onRefine?.(
              `Refine: focus on places like ${result.name} with stronger confirmation of my access needs.`,
            )
          }
        >
          Refine search
        </button>
      </div>

      <p
        id={`save-${result.placeId}-status`}
        className="mt-2 text-sm text-slate-600"
        role="status"
        aria-live="polite"
      >
        {saveState === "error"
          ? "Sign in to save places, or try again."
          : saveState === "saved"
            ? "Place saved to your list."
            : null}
        {transportError}
      </p>
    </article>
  );
}
