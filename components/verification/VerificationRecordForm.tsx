"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const RECORD_TYPES = [
  "abn_or_nzbn",
  "ndis_registration_claim",
  "insurance",
  "worker_screening",
  "wwcc_blue_card",
  "police_check",
  "driver_licence",
  "vehicle_registration",
  "vehicle_insurance",
  "ahpra_registration",
  "professional_body_membership",
  "training_certificate",
];

export function VerificationRecordForm() {
  const router = useRouter();
  const [recordType, setRecordType] = useState("insurance");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  return (
    <form
      className="space-y-3 rounded-lg border bg-white p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus("Saving...");
        const res = await fetch("/api/verification/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recordType,
            expiryDate: expiryDate || undefined,
            notes,
            eligibilityGate:
              recordType === "insurance" || recordType === "abn_or_nzbn"
                ? "provider_booking_eligibility"
                : undefined,
          }),
        });
        setStatus(res.ok ? "Record saved for review." : "Could not save.");
        if (res.ok) router.refresh();
      }}
    >
      <h2 className="font-semibold">Add verification record</h2>
      <label htmlFor="recordType" className="block text-sm font-medium">
        Type
      </label>
      <select
        id="recordType"
        className="min-h-11 w-full rounded-md border px-3"
        value={recordType}
        onChange={(event) => setRecordType(event.target.value)}
      >
        {RECORD_TYPES.map((type) => (
          <option key={type} value={type}>
            {type.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      <label htmlFor="expiryDate" className="block text-sm font-medium">
        Expiry date
      </label>
      <input
        id="expiryDate"
        type="date"
        className="min-h-11 w-full rounded-md border px-3"
        value={expiryDate}
        onChange={(event) => setExpiryDate(event.target.value)}
      />

      <label htmlFor="notes" className="block text-sm font-medium">
        Notes
      </label>
      <textarea
        id="notes"
        rows={3}
        className="w-full rounded-md border px-3 py-2"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />

      <button
        type="submit"
        className="min-h-11 rounded-md bg-blue-700 px-4 font-medium text-white"
      >
        Save for review
      </button>
      <p aria-live="polite" className="text-sm text-slate-600">
        {status}
      </p>
    </form>
  );
}
