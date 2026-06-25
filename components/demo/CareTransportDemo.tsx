"use client";

import { useMemo, useState } from "react";

import { GovernanceStatusCard } from "@/components/governance/GovernanceStatusCard";
import { AttestationBadge } from "@/components/governance/AttestationBadge";
import { AccessibleFormField } from "@/components/forms/AccessibleFormField";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { ToggleGroup } from "@/components/ui/toggle-group";
import {
  buildBookingBundle,
  type AccessNeed,
  type CareSupportType,
} from "@/lib/demo/care-transport-summary";
import { evaluateNdisRules } from "@/lib/ndis-rule-engine/evaluate";
import { defaultNdisRules } from "@/lib/ndis-rule-engine/rules";
import { trackProductEvent } from "@/lib/analytics/product-analytics";
import type { GovernanceStatus } from "@/lib/governance/types";

const supportOptions: { value: CareSupportType; label: string }[] = [
  { value: "personal_care", label: "Personal care" },
  { value: "community_access", label: "Community access" },
  { value: "therapy_support", label: "Therapy appointment support" },
  { value: "work_education_support", label: "Work or education support" },
];

const accessNeedOptions: { value: AccessNeed; label: string }[] = [
  { value: "wheelchair_ramp", label: "Wheelchair ramp" },
  { value: "power_chair_space", label: "Power chair space" },
  { value: "support_worker_travels", label: "Support worker travels with me" },
  { value: "low_sensory", label: "Low sensory option" },
  { value: "assistance_animal", label: "Assistance animal" },
  { value: "communication_support", label: "Auslan or communication support" },
];

export function CareTransportDemo() {
  const [step, setStep] = useState(1);
  const [supportType, setSupportType] = useState<CareSupportType>("personal_care");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [accessNeeds, setAccessNeeds] = useState<AccessNeed[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [governanceStatus, setGovernanceStatus] = useState<GovernanceStatus>("ready_to_review");

  const bundle = useMemo(() => {
    if (!date || !time) return null;
    const start = new Date(`${date}T${time}`);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return buildBookingBundle({
      care: { supportType, scheduledStart: start, scheduledEnd: end },
      trip: {
        pickupAddress: pickup,
        destinationAddress: destination,
        scheduledPickup: start,
      },
      accessNeeds,
      fundingSource: "ndis",
    });
  }, [accessNeeds, date, destination, pickup, supportType, time]);

  function toggleAccessNeed(need: AccessNeed) {
    setAccessNeeds((current) =>
      current.includes(need) ? current.filter((n) => n !== need) : [...current, need],
    );
  }

  function runGovernanceChecks() {
    const ndis = evaluateNdisRules(
      {
        serviceRequest: {
          serviceType: supportType,
          requiresWheelchairVehicle: accessNeeds.includes("wheelchair_ramp"),
          isPersonalCare: supportType === "personal_care",
          involvesChild: false,
        },
        participantConsent: { shareSensitiveAccessNeeds: false },
      },
      defaultNdisRules,
    );
    if (ndis.outcome === "blocked") {
      setGovernanceStatus("blocked_by_rule");
    } else if (!confirmed || ndis.outcome === "reviewRequired") {
      setGovernanceStatus(confirmed ? "human_review_required" : "participant_confirmation_required");
    } else if (confirmed) {
      setGovernanceStatus("attestation_recorded");
    } else {
      setGovernanceStatus("ready_to_review");
    }
  }

  function onConfirm() {
    setConfirmed(true);
    runGovernanceChecks();
    setStep(5);
    trackProductEvent("care_transport_demo_completed", { step: "confirmed" });
  }

  return (
    <div className="space-y-8">
      <Alert variant="info" title="Demo only">
        This flow is a demonstration. No booking, NDIS claim, or provider match is created.
      </Alert>

      {step === 1 ? (
        <section>
          <SectionHeader title="Choose support type" as="h2" />
          <ToggleGroup
            label="Support type"
            name="support-type"
            value={supportType}
            onChange={setSupportType}
            options={supportOptions}
          />
          <Button variant="default" size="default" className="mt-6" onClick={() => setStep(2)}>
            Continue
          </Button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4">
          <SectionHeader title="Choose date and time" as="h2" />
          <AccessibleFormField id="care-date" label="Date" required>
            <input
              id="care-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-[var(--touch-target-min)] rounded-lg border border-input px-3"
            />
          </AccessibleFormField>
          <AccessibleFormField id="care-time" label="Start time" required>
            <input
              id="care-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full min-h-[var(--touch-target-min)] rounded-lg border border-input px-3"
            />
          </AccessibleFormField>
          <div className="flex gap-3">
            <Button variant="outline" size="default" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button variant="default" size="default" onClick={() => setStep(3)} disabled={!date || !time}>
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4">
          <SectionHeader title="Pickup and destination" as="h2" />
          <AccessibleFormField id="pickup" label="Pickup address" required>
            <input
              id="pickup"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="w-full min-h-[var(--touch-target-min)] rounded-lg border border-input px-3"
            />
          </AccessibleFormField>
          <AccessibleFormField id="destination" label="Destination" required>
            <input
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full min-h-[var(--touch-target-min)] rounded-lg border border-input px-3"
            />
          </AccessibleFormField>
          <div className="flex gap-3">
            <Button variant="outline" size="default" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button variant="default" size="default" onClick={() => setStep(4)} disabled={!pickup || !destination}>
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-4">
          <SectionHeader title="Access needs for transport" as="h2" />
          <fieldset>
            <legend className="text-sm font-medium">Select all that apply</legend>
            <div className="mt-3 space-y-2">
              {accessNeedOptions.map((option) => (
                <label key={option.value} className="flex min-h-[var(--touch-target-min)] items-center gap-3">
                  <input
                    type="checkbox"
                    checked={accessNeeds.includes(option.value)}
                    onChange={() => toggleAccessNeed(option.value)}
                    className="h-5 w-5"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-3">
            <Button variant="outline" size="default" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button
              variant="default"
              size="default"
              onClick={() => {
                runGovernanceChecks();
                setStep(5);
              }}
            >
              Review summary
            </Button>
          </div>
        </section>
      ) : null}

      {step === 5 && bundle ? (
        <section className="space-y-4">
          <SectionHeader title="Bundled summary" as="h2" description="Edit any step using the back button before confirming." />
          <GovernanceStatusCard status={governanceStatus} />
          <div className="rounded-xl border border-border p-4 text-sm space-y-2">
            <p>
              <strong>Care shift:</strong> {supportType.replaceAll("_", " ")} from{" "}
              {bundle.care.scheduledStart.toLocaleString()}
            </p>
            <p>
              <strong>Transport pickup window:</strong>{" "}
              {bundle.pickupWindowStart.toLocaleTimeString()} –{" "}
              {bundle.pickupWindowEnd.toLocaleTimeString()} ({bundle.bufferMinutes} min buffer)
            </p>
            <p>
              <strong>Route:</strong> {pickup} → {destination}
            </p>
            <p>
              <strong>Claim category (placeholder):</strong> {bundle.claimCategoryPlaceholder}
            </p>
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-5 w-5"
            />
            <span>I confirm this summary is correct for this demo.</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="default" onClick={() => setStep(4)}>
              Edit access needs
            </Button>
            <Button variant="default" size="default" onClick={onConfirm} disabled={!confirmed}>
              Confirm demo preferences
            </Button>
            {governanceStatus === "attestation_recorded" ? (
              <AttestationBadge status="recorded" />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
