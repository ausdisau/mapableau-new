"use client";

import { useState } from "react";

import {
  AccessibilityRequirementsStep,
  type AccessibilityFormState,
} from "@/components/bookings/AccessibilityRequirementsStep";
import { BookingConfirmation } from "@/components/bookings/BookingConfirmation";
import { BookingDetailsStep } from "@/components/bookings/BookingDetailsStep";
import { BookingReviewStep } from "@/components/bookings/BookingReviewStep";
import { BookingTypeSelector } from "@/components/bookings/BookingTypeSelector";
import { ProviderSearchStep } from "@/components/bookings/ProviderSearchStep";
import { Button } from "@/components/ui/button";

const STEPS = [
  "Choose booking type",
  "Choose provider",
  "Date and details",
  "Accessibility",
  "Review and submit",
];

export function BookingWizard() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<{
    bookingId: string;
    conversationId?: string | null;
  } | null>(null);

  const [bookingType, setBookingType] = useState<
    "care" | "transport" | "care_transport"
  >("care");
  const [providerId, setProviderId] = useState<string | undefined>();
  const [providerName, setProviderName] = useState<string | undefined>();
  const [requestedStart, setRequestedStart] = useState("");
  const [requestedEnd, setRequestedEnd] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [careLocation, setCareLocation] = useState("");
  const [participantNotes, setParticipantNotes] = useState("");
  const [preferredCommunicationMethod, setPreferredCommunicationMethod] =
    useState("email");
  const [accessibility, setAccessibility] = useState<AccessibilityFormState>({
    wheelchairAccess: false,
    hoistOrTransfer: false,
    communicationSupport: false,
    sensoryPreferences: "",
    assistanceAnimal: false,
    otherNotes: "",
  });
  const [shareAccessibility, setShareAccessibility] = useState(false);
  const [consent, setConsent] = useState(false);

  function detailsChange(field: string, value: string) {
    if (field === "requestedStart") setRequestedStart(value);
    if (field === "requestedEnd") setRequestedEnd(value);
    if (field === "pickupAddress") setPickupAddress(value);
    if (field === "dropoffAddress") setDropoffAddress(value);
    if (field === "careLocation") setCareLocation(value);
    if (field === "participantNotes") setParticipantNotes(value);
    if (field === "preferredCommunicationMethod") {
      setPreferredCommunicationMethod(value);
    }
  }

  async function submit() {
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
              sortOrder: 1,
            },
          ]
        : undefined;

    const summaryParts = [
      accessibility.wheelchairAccess && "Wheelchair access",
      accessibility.hoistOrTransfer && "Hoist/transfer",
      accessibility.communicationSupport && "Communication support",
      accessibility.assistanceAnimal && "Assistance animal",
      accessibility.sensoryPreferences,
      accessibility.otherNotes,
    ].filter(Boolean);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType,
          assignedOrganisationId: providerId,
          requestedStart: new Date(requestedStart).toISOString(),
          requestedEnd: requestedEnd
            ? new Date(requestedEnd).toISOString()
            : undefined,
          pickupAddress: pickupAddress || undefined,
          dropoffAddress: dropoffAddress || undefined,
          careLocation: careLocation || undefined,
          participantNotes,
          preferredCommunicationMethod,
          accessibilitySummary: summaryParts.join("; ") || undefined,
          accessibilityRequirements: accessibility,
          shareAccessibility,
          segments,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not submit booking");
        return;
      }
      const booking = data.booking;
      setSubmitted({
        bookingId: booking.id,
        conversationId: booking.conversationId,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <BookingConfirmation
        bookingId={submitted.bookingId}
        conversationId={submitted.conversationId}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <nav aria-label="Booking steps">
        <ol className="flex flex-wrap gap-2 text-sm">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={
                i === step ? "font-semibold text-primary" : "text-muted-foreground"
              }
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>
      </nav>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-700 bg-red-50 p-3 text-red-900"
        >
          <p className="font-medium">Please fix the following:</p>
          <p>{error}</p>
        </div>
      )}

      {step === 0 && (
        <BookingTypeSelector value={bookingType} onChange={setBookingType} />
      )}
      {step === 1 && (
        <ProviderSearchStep
          selectedId={providerId}
          onSelect={(id) => {
            setProviderId(id);
            setProviderName(id);
          }}
        />
      )}
      {step === 2 && (
        <BookingDetailsStep
          bookingType={bookingType}
          requestedStart={requestedStart}
          requestedEnd={requestedEnd}
          pickupAddress={pickupAddress}
          dropoffAddress={dropoffAddress}
          careLocation={careLocation}
          participantNotes={participantNotes}
          preferredCommunicationMethod={preferredCommunicationMethod}
          onChange={detailsChange}
        />
      )}
      {step === 3 && (
        <AccessibilityRequirementsStep
          value={accessibility}
          onChange={setAccessibility}
          shareAccessibility={shareAccessibility}
          onShareChange={setShareAccessibility}
        />
      )}
      {step === 4 && (
        <BookingReviewStep
          bookingType={bookingType}
          providerName={providerName}
          requestedStart={requestedStart}
          requestedEnd={requestedEnd}
          accessibility={accessibility}
          consent={consent}
          onConsentChange={setConsent}
        />
      )}

      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={step === 0 || loading}
          onClick={() => setStep((s) => s - 1)}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 && !providerId}
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={submit}
            disabled={loading || !consent || !requestedStart}
          >
            {loading ? "Submitting…" : "Submit booking"}
          </Button>
        )}
      </div>
    </div>
  );
}
