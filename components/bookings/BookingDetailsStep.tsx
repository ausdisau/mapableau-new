"use client";

import { AccessibleFormField, formInputClass } from "@/components/forms/AccessibleFormField";

export function BookingDetailsStep({
  bookingType,
  requestedStart,
  requestedEnd,
  pickupAddress,
  dropoffAddress,
  careLocation,
  participantNotes,
  preferredCommunicationMethod,
  onChange,
}: {
  bookingType: string;
  requestedStart: string;
  requestedEnd: string;
  pickupAddress: string;
  dropoffAddress: string;
  careLocation: string;
  participantNotes: string;
  preferredCommunicationMethod: string;
  onChange: (field: string, value: string) => void;
}) {
  const showTransport =
    bookingType === "transport" || bookingType === "care_transport";
  const showCare =
    bookingType === "care" || bookingType === "care_transport";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">When and where</h2>
      <AccessibleFormField label="Date and start time" id="requestedStart" required>
        <input
          id="requestedStart"
          type="datetime-local"
          className={formInputClass}
          value={requestedStart}
          onChange={(e) => onChange("requestedStart", e.target.value)}
          required
        />
      </AccessibleFormField>
      <AccessibleFormField label="End time" id="requestedEnd">
        <input
          id="requestedEnd"
          type="datetime-local"
          className={formInputClass}
          value={requestedEnd}
          onChange={(e) => onChange("requestedEnd", e.target.value)}
        />
      </AccessibleFormField>
      {showTransport && (
        <>
          <AccessibleFormField label="Pickup address" id="pickupAddress">
            <input
              id="pickupAddress"
              className={formInputClass}
              value={pickupAddress}
              onChange={(e) => onChange("pickupAddress", e.target.value)}
            />
          </AccessibleFormField>
          <AccessibleFormField label="Drop-off address" id="dropoffAddress">
            <input
              id="dropoffAddress"
              className={formInputClass}
              value={dropoffAddress}
              onChange={(e) => onChange("dropoffAddress", e.target.value)}
            />
          </AccessibleFormField>
        </>
      )}
      {showCare && (
        <AccessibleFormField label="Care location" id="careLocation">
          <input
            id="careLocation"
            className={formInputClass}
            value={careLocation}
            onChange={(e) => onChange("careLocation", e.target.value)}
          />
        </AccessibleFormField>
      )}
      <AccessibleFormField label="Support notes" id="participantNotes">
        <textarea
          id="participantNotes"
          className={formInputClass}
          rows={3}
          value={participantNotes}
          onChange={(e) => onChange("participantNotes", e.target.value)}
        />
      </AccessibleFormField>
      <AccessibleFormField
        label="Preferred way to be contacted"
        id="preferredCommunicationMethod"
      >
        <select
          id="preferredCommunicationMethod"
          className={formInputClass}
          value={preferredCommunicationMethod}
          onChange={(e) =>
            onChange("preferredCommunicationMethod", e.target.value)
          }
        >
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="sms">SMS</option>
        </select>
      </AccessibleFormField>
    </div>
  );
}
