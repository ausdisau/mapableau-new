"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { AccessibleOsmMap } from "@/components/transport/AccessibleOsmMap";
import { ConsentScopeDrawer } from "@/components/transport/ConsentScopeDrawer";
import { FunctionalAccessSelector } from "@/components/transport/FunctionalAccessSelector";
import { HumanGateConfirmationCard } from "@/components/transport/HumanGateConfirmationCard";
import { LiveTripTelemetryBar } from "@/components/transport/LiveTripTelemetryBar";
import { SafePickupZoneOverlay } from "@/components/transport/SafePickupZoneOverlay";
import { useTransportSocket } from "@/lib/realtime/use-transport-socket";
import type { MobilityRequirements } from "@/lib/transport/mobility-schema";

type ViewMode = "split" | "list";

const DEMO_EVIDENCE = [
  {
    label: "Suggested safe pickup (illustrative)",
    kerbGradient: "1:14 Compliant",
    checkedAt: "Oct 2026",
    source: "MapAble Assessor",
    vehicleClearance: "Rear Hoist · Max 850mm W × 1350mm L",
  },
];

/**
 * Participant booking workspace — list-first split layout with human gate.
 * Writes only through existing POST /api/transport/trips.
 */
export function TransportBookingWorkspace() {
  const router = useRouter();
  const socket = useTransportSocket();

  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobility, setMobility] = useState<MobilityRequirements>({});
  const [prefillFromProfile, setPrefillFromProfile] = useState(true);
  const [consentIds, setConsentIds] = useState<string[]>([]);
  const [humanGateConfirmed, setHumanGateConfirmed] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupSuburb, setPickupSuburb] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffSuburb, setDropoffSuburb] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [accessNotes, setAccessNotes] = useState("");

  useEffect(() => {
    if (!prefillFromProfile) return;
    let cancelled = false;
    fetch("/api/transport/mobility-prefill")
      .then((r) => r.json())
      .then((data: {
        mobilityRequirements?: MobilityRequirements;
        fromProfile?: boolean;
      }) => {
        if (cancelled) return;
        if (data.mobilityRequirements) {
          setMobility((prev) => ({
            ...data.mobilityRequirements,
            ...prev,
          }));
        }
        setProfileLoaded(data.fromProfile === true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [prefillFromProfile]);

  // Human gate must re-confirm after any field that shapes the submitted payload changes.
  useEffect(() => {
    setHumanGateConfirmed(false);
  }, [
    pickupAddress,
    pickupSuburb,
    dropoffAddress,
    dropoffSuburb,
    scheduledStart,
    scheduledEnd,
    accessNotes,
    mobility,
    consentIds,
    prefillFromProfile,
  ]);

  const summaryLines = useMemo(() => {
    const lines: string[] = [];
    if (pickupSuburb || pickupAddress) {
      lines.push(`Pickup: ${pickupSuburb || pickupAddress}`);
    }
    if (dropoffSuburb || dropoffAddress) {
      lines.push(`Drop-off: ${dropoffSuburb || dropoffAddress}`);
    }
    lines.push(...buildMobilitySummaryLines(mobility));
    if (consentIds.length) {
      lines.push(`Consent scopes: ${consentIds.length} selected`);
    }
    return lines;
  }, [
    pickupSuburb,
    pickupAddress,
    dropoffSuburb,
    dropoffAddress,
    mobility,
    consentIds.length,
  ]);

  function goToStep(next: number) {
    if (next > 1) {
      const journeyError = validateTransportJourneyFields({
        pickupAddress,
        dropoffAddress,
        scheduledStart,
      });
      if (journeyError) {
        setError(journeyError);
        setStep(1);
        return;
      }
    }
    setError(null);
    setStep(next);
  }

  async function submitTrip() {
    const journeyError = validateTransportJourneyFields({
      pickupAddress,
      dropoffAddress,
      scheduledStart,
    });
    if (journeyError) {
      setError(journeyError);
      setStep(1);
      return;
    }
    if (!humanGateConfirmed) {
      setError("Confirm the human gate before submitting your request.");
      setStep(4);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const startIso = new Date(scheduledStart).toISOString();
      const endIso =
        scheduledEnd && scheduledEnd.trim()
          ? new Date(scheduledEnd).toISOString()
          : undefined;
      const res = await fetch("/api/transport/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupAddress,
          pickupSuburb: pickupSuburb || undefined,
          dropoffAddress,
          dropoffSuburb: dropoffSuburb || undefined,
          scheduledStart: startIso,
          scheduledEnd: endIso,
          accessNotes: accessNotes || undefined,
          mobilityRequirements:
            Object.keys(mobility).length > 0 ? mobility : undefined,
          prefillFromProfile,
          consentScopes: consentIds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Could not create the trip. Please check your details and try again."
        );
        setLoading(false);
        return;
      }
      const tripId = data.trip?.id;
      router.push(
        tripId ? `/dashboard/transport/${tripId}` : "/dashboard/transport"
      );
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const showMap = shouldShowBookingMap(viewMode);

  return (
    <div className="transport-booking space-y-4">
      <a
        href="#transport-booking-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to main content
      </a>

      <div className="tb-pilot-banner" role="status">
        Controlled Pilot · Greater Sydney &amp; Regional Spokes · Human-Gated
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <fieldset className="flex flex-wrap gap-3 text-sm">
          <legend className="sr-only">Layout view</legend>
          {(
            [
              ["split", "Split (list + map)"],
              ["list", "List only"],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className="inline-flex min-h-[48px] items-center gap-2">
              <input
                type="radio"
                name="tb-view"
                value={id}
                checked={viewMode === id}
                onChange={() => setViewMode(id)}
              />
              {label}
            </label>
          ))}
        </fieldset>
      </div>

      <div
        id="transport-booking-main"
        className={
          showMap
            ? "grid gap-4 lg:grid-cols-[minmax(0,45%)_minmax(0,55%)]"
            : "grid gap-4"
        }
      >
        <section className="space-y-4" aria-label="Accessible booking steps">
          <nav aria-label="Booking steps" className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                className={`tb-btn-secondary text-sm ${
                  step === n ? "ring-2 ring-[var(--tb-brand-teal)]" : ""
                }`}
                onClick={() => goToStep(n)}
                aria-current={step === n ? "step" : undefined}
              >
                <span className="tb-step-number">
                  {String(n).padStart(2, "0")}
                </span>
              </button>
            ))}
          </nav>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {step === 1 ? (
            <div className="tb-surface space-y-3 p-4">
              <h2 className="font-heading text-lg font-semibold">
                <span className="tb-step-number">01</span>
                {" · "}Journey &amp; safe kerbside
              </h2>
              <AccessibleFormField id="pickupAddress" label="Pickup address" required>
                <input
                  id="pickupAddress"
                  className={formInputClass}
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                />
              </AccessibleFormField>
              <AccessibleFormField id="pickupSuburb" label="Pickup suburb">
                <input
                  id="pickupSuburb"
                  className={formInputClass}
                  value={pickupSuburb}
                  onChange={(e) => setPickupSuburb(e.target.value)}
                />
              </AccessibleFormField>
              <AccessibleFormField id="dropoffAddress" label="Drop-off address" required>
                <input
                  id="dropoffAddress"
                  className={formInputClass}
                  required
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                />
              </AccessibleFormField>
              <AccessibleFormField id="dropoffSuburb" label="Drop-off suburb">
                <input
                  id="dropoffSuburb"
                  className={formInputClass}
                  value={dropoffSuburb}
                  onChange={(e) => setDropoffSuburb(e.target.value)}
                />
              </AccessibleFormField>
              <AccessibleFormField id="scheduledStart" label="Scheduled start" required>
                <input
                  id="scheduledStart"
                  type="datetime-local"
                  className={formInputClass}
                  required
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                />
              </AccessibleFormField>
              <AccessibleFormField id="scheduledEnd" label="Scheduled end (optional)">
                <input
                  id="scheduledEnd"
                  type="datetime-local"
                  className={formInputClass}
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
                />
              </AccessibleFormField>
              <SafePickupZoneOverlay zones={DEMO_EVIDENCE} />
              <button
                type="button"
                className="tb-btn-primary"
                onClick={() => goToStep(2)}
                disabled={!pickupAddress || !dropoffAddress || !scheduledStart}
              >
                Continue to access needs
              </button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="tb-surface space-y-3 p-4">
              <h2 className="font-heading text-lg font-semibold">
                <span className="tb-step-number">02</span>
                {" · "}Functional access profile
              </h2>
              <label className="flex min-h-[48px] items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefillFromProfile}
                  onChange={(e) => setPrefillFromProfile(e.target.checked)}
                />
                <span>
                  Use my accessibility profile to prefill mobility needs
                  {profileLoaded ? " (profile found)" : ""}
                </span>
              </label>
              <FunctionalAccessSelector values={mobility} onChange={setMobility} />
              <div className="flex flex-wrap gap-2">
                <button type="button" className="tb-btn-secondary" onClick={() => goToStep(1)}>
                  Back
                </button>
                <button type="button" className="tb-btn-primary" onClick={() => goToStep(3)}>
                  Continue to consent
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="tb-surface space-y-3 p-4">
              <h2 className="font-heading text-lg font-semibold">
                <span className="tb-step-number">03</span>
                {" · "}Consent &amp; driver notes
              </h2>
              <AccessibleFormField
                id="accessNotes"
                label="Access notes at pickup"
                hint="e.g. ramp, buzzer, support person — never clinical diagnoses"
              >
                <textarea
                  id="accessNotes"
                  className={formInputClass}
                  rows={3}
                  value={accessNotes}
                  onChange={(e) => setAccessNotes(e.target.value)}
                />
              </AccessibleFormField>
              <ConsentScopeDrawer
                checkedIds={consentIds}
                onChange={setConsentIds}
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" className="tb-btn-secondary" onClick={() => goToStep(2)}>
                  Back
                </button>
                <button type="button" className="tb-btn-primary" onClick={() => goToStep(4)}>
                  Continue to confirm
                </button>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-3">
              <HumanGateConfirmationCard
                confirmed={humanGateConfirmed}
                onConfirmedChange={setHumanGateConfirmed}
                summaryLines={summaryLines}
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" className="tb-btn-secondary" onClick={() => goToStep(3)}>
                  Back
                </button>
                <button
                  type="button"
                  className="tb-btn-primary"
                  disabled={!humanGateConfirmed || loading}
                  onClick={() => void submitTrip()}
                >
                  {loading ? "Submitting…" : "Confirm transport request"}
                </button>
                <Link href="/dashboard/transport" className="tb-btn-secondary">
                  Cancel
                </Link>
              </div>
            </div>
          ) : null}
        </section>

        {showMap ? (
          <aside className="space-y-3" aria-label="Map and live status">
            <AccessibleOsmMap points={[]} enabled />
            <LiveTripTelemetryBar
              liveEnabled={socket.liveTrackingEnabled}
              connectionState={socket.connectionState}
              onNotifyRampReady={() => {
                void socket.sendBoardingAlert();
              }}
            />
          </aside>
        ) : (
          <LiveTripTelemetryBar
            liveEnabled={socket.liveTrackingEnabled}
            connectionState={socket.connectionState}
          />
        )}
      </div>

      <footer className="tb-ink-secondary border-t border-[var(--tb-border-subtle)] pt-4 text-sm">
        Important: MapAble is not an emergency service. In immediate danger call{" "}
        <strong className="text-[var(--tb-ink-primary)]">000</strong>. Quotes are
        not NDIS funding approvals. Route estimates are advisory only.
      </footer>
    </div>
  );
}

/** List-only mode hides the map pane; list content stays complete. */
export function shouldShowBookingMap(viewMode: ViewMode): boolean {
  return viewMode === "split";
}

/** Human gate must be confirmed before submit (no silent auto-assign). */
export function canSubmitTransportRequest(humanGateConfirmed: boolean): boolean {
  return humanGateConfirmed === true;
}

/** Required journey fields before leaving step 1 or submitting. */
export function validateTransportJourneyFields(fields: {
  pickupAddress: string;
  dropoffAddress: string;
  scheduledStart: string;
}): string | null {
  if (!fields.pickupAddress.trim()) return "Enter a pickup address.";
  if (!fields.dropoffAddress.trim()) return "Enter a drop-off address.";
  if (!fields.scheduledStart.trim()) return "Choose a scheduled start time.";
  if (Number.isNaN(new Date(fields.scheduledStart).getTime())) {
    return "Scheduled start time is invalid.";
  }
  return null;
}

/** Human-readable mobility lines for the confirmation gate. */
export function buildMobilitySummaryLines(
  mobility: MobilityRequirements
): string[] {
  const lines: string[] = [];
  if (mobility.requiresWheelchairAccessible) {
    lines.push("Wheelchair-accessible vehicle required");
  }
  if (mobility.requiresHoist) lines.push("Rear hoist required");
  if (mobility.requiresRamp) lines.push("Ramp required");
  if (mobility.requiresLift) lines.push("Lift required");
  if (mobility.driverAssistanceRequired || mobility.needsDriverAssistanceToDoor) {
    lines.push("Driver assistance required");
  }
  if (mobility.assistanceAnimalPresent) lines.push("Assistance animal present");
  if (mobility.needsExtraBoardingTime) lines.push("Extra boarding time needed");
  return lines;
}
