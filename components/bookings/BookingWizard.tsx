"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { fetchJson } from "@/lib/client/fetch-json";

const STEPS = [
  "Choose booking type",
  "Date and time",
  "Care or transport details",
  "Accessibility and consent",
  "Review and submit",
] as const;

const BOOKING_TYPE_LABELS: Record<
  "care" | "transport" | "care_transport",
  string
> = {
  care: "Care support",
  transport: "Accessible transport",
  care_transport: "Care and transport linked",
};

export function BookingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [bookingType, setBookingType] = useState<
    "care" | "transport" | "care_transport"
  >("care");
  const [requestedStart, setRequestedStart] = useState("");
  const [requestedEnd, setRequestedEnd] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [careLocation, setCareLocation] = useState("");
  const [participantNotes, setParticipantNotes] = useState("");
  const [shareAccessibility, setShareAccessibility] = useState(false);

  function validateStep(currentStep: number): boolean {
    const nextErrors: Record<string, string> = {};

    if (currentStep === 1 && !requestedStart.trim()) {
      nextErrors.start = "Start date and time is required.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setFieldErrors({});
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    if (!validateStep(1)) {
      setStep(1);
      return;
    }

    setLoading(true);
    setError("");
    const segments =
      bookingType === "care_transport"
        ? [
            {
              segmentType: "care",
              startTime: requestedStart,
              endTime: requestedEnd,
              sortOrder: 0,
            },
            {
              segmentType: "outbound_transport",
              startTime: requestedStart,
              pickupAddress,
              dropoffAddress: careLocation || dropoffAddress,
              bufferBeforeMinutes: 15,
              sortOrder: 1,
            },
          ]
        : undefined;

    const result = await fetchJson<{ booking: { id: string } }>("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingType,
        requestedStart,
        requestedEnd: requestedEnd || undefined,
        pickupAddress: pickupAddress || undefined,
        dropoffAddress: dropoffAddress || undefined,
        careLocation: careLocation || undefined,
        participantNotes,
        shareAccessibility,
        status: "requested",
        segments,
      }),
    });

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/dashboard/bookings/${result.data.booking.id}`);
  }

  const stepHeadingId = "booking-step-heading";

  return (
    <div className="max-w-2xl">
      <p className="sr-only" aria-live="polite">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      <nav aria-label="Booking steps">
        <ol className="mb-6 flex flex-wrap gap-2 text-sm">
          {STEPS.map((label, i) => (
            <li
              key={label}
              aria-current={i === step ? "step" : undefined}
              className={
                i === step
                  ? "font-semibold text-primary"
                  : "text-muted-foreground"
              }
            >
              Step {i + 1}: {label}
            </li>
          ))}
        </ol>
      </nav>

      <section aria-labelledby={stepHeadingId}>
        <h2 id={stepHeadingId} className="sr-only">
          {STEPS[step]}
        </h2>

        {step === 0 ? (
          <fieldset className="space-y-3">
            <legend className="font-semibold">What do you need?</legend>
            {(
              Object.entries(BOOKING_TYPE_LABELS) as [
                "care" | "transport" | "care_transport",
                string,
              ][]
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-4"
              >
                <input
                  type="radio"
                  name="bookingType"
                  checked={bookingType === value}
                  onChange={() => setBookingType(value)}
                />
                {label}
              </label>
            ))}
          </fieldset>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <AccessibleFormField
              id="start"
              label="Start date and time"
              required
              error={fieldErrors.start}
            >
              <input
                id="start"
                type="datetime-local"
                className={formInputClass}
                value={requestedStart}
                onChange={(e) => {
                  setRequestedStart(e.target.value);
                  if (fieldErrors.start) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.start;
                      return next;
                    });
                  }
                }}
                required
              />
            </AccessibleFormField>
            <AccessibleFormField id="end" label="End date and time">
              <input
                id="end"
                type="datetime-local"
                className={formInputClass}
                value={requestedEnd}
                onChange={(e) => setRequestedEnd(e.target.value)}
              />
            </AccessibleFormField>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            {(bookingType === "care" || bookingType === "care_transport") && (
              <AccessibleFormField id="careLocation" label="Care location">
                <input
                  id="careLocation"
                  className={formInputClass}
                  value={careLocation}
                  onChange={(e) => setCareLocation(e.target.value)}
                />
              </AccessibleFormField>
            )}
            {(bookingType === "transport" || bookingType === "care_transport") && (
              <>
                <AccessibleFormField id="pickup" label="Pickup address">
                  <input
                    id="pickup"
                    className={formInputClass}
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                  />
                </AccessibleFormField>
                <AccessibleFormField id="dropoff" label="Drop-off address">
                  <input
                    id="dropoff"
                    className={formInputClass}
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                  />
                </AccessibleFormField>
              </>
            )}
            <AccessibleFormField id="notes" label="Notes for providers">
              <textarea
                id="notes"
                className={formInputClass}
                rows={3}
                value={participantNotes}
                onChange={(e) => setParticipantNotes(e.target.value)}
              />
            </AccessibleFormField>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4 rounded-xl border border-border bg-card p-4">
            <p className="text-sm">
              Providers may need your accessibility information to deliver safe
              support. You can share a summary only if you have active consent or
              confirm below.
            </p>
            <AccessibleFormField
              id="shareAccessibility"
              label="Accessibility sharing consent"
              hint={
                <>
                  Read your{" "}
                  <Link
                    href="/dashboard/consent"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    consent settings
                  </Link>{" "}
                  before sharing accessibility information.
                </>
              }
            >
              <label className="flex min-h-11 items-start gap-3">
                <input
                  id="shareAccessibility"
                  type="checkbox"
                  checked={shareAccessibility}
                  onChange={(e) => setShareAccessibility(e.target.checked)}
                />
                <span className="text-sm">
                  I confirm sharing accessibility summary for this booking request
                </span>
              </label>
            </AccessibleFormField>
          </div>
        ) : null}

        {step === 4 ? (
          <dl className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
            <div>
              <dt className="font-medium">Type</dt>
              <dd>{BOOKING_TYPE_LABELS[bookingType]}</dd>
            </div>
            <div>
              <dt className="font-medium">Start</dt>
              <dd>
                {requestedStart
                  ? new Date(requestedStart).toLocaleString("en-AU")
                  : "Not set"}
              </dd>
            </div>
            {requestedEnd ? (
              <div>
                <dt className="font-medium">End</dt>
                <dd>{new Date(requestedEnd).toLocaleString("en-AU")}</dd>
              </div>
            ) : null}
            <div>
              <dt className="font-medium">Share accessibility</dt>
              <dd>{shareAccessibility ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="font-medium">Confirmation</dt>
              <dd>
                Nothing is booked until you submit this request. A provider must
                accept before support is confirmed.
              </dd>
            </div>
          </dl>
        ) : null}
      </section>

      {error ? (
        <StatusMessage variant="error" message={error} className="mt-4" />
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {step > 0 ? (
          <Button type="button" variant="outline" size="default" onClick={goBack}>
            Back
          </Button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <Button type="button" variant="default" size="default" onClick={goNext}>
            Next
          </Button>
        ) : (
          <Button
            type="button"
            variant="default"
            size="default"
            loading={loading}
            onClick={() => void submit()}
          >
            Submit booking request
          </Button>
        )}
      </div>
    </div>
  );
}
