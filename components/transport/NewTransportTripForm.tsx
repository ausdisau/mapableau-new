"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { StreetAddressAutocomplete } from "@/components/addresses/StreetAddressAutocomplete";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { MobilityRequirementsForm } from "@/components/transport/MobilityRequirementsForm";
import { Button } from "@/components/ui/button";
import type { ResolvedStreetAddress } from "@/lib/addresses/resolve-street-address";
import type { MobilityRequirements } from "@/lib/transport/mobility-schema";

export function NewTransportTripForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefillFromProfile, setPrefillFromProfile] = useState(true);
  const [mobility, setMobility] = useState<MobilityRequirements>({});
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupSuburb, setPickupSuburb] = useState("");
  const [pickupLat, setPickupLat] = useState<number | undefined>();
  const [pickupLng, setPickupLng] = useState<number | undefined>();
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffSuburb, setDropoffSuburb] = useState("");
  const [dropoffLat, setDropoffLat] = useState<number | undefined>();
  const [dropoffLng, setDropoffLng] = useState<number | undefined>();

  useEffect(() => {
    if (!prefillFromProfile) return;
    fetch("/api/transport/mobility-prefill")
      .then((r) => r.json())
      .then((data) => {
        if (data.mobilityRequirements) {
          setMobility((prev) => ({
            ...data.mobilityRequirements,
            ...prev,
          }));
        }
        setProfileLoaded(data.fromProfile === true);
      })
      .catch(() => {});
  }, [prefillFromProfile]);

  function applyPickupResolved(address: ResolvedStreetAddress) {
    setPickupAddress(address.formattedAddress);
    if (address.suburb) setPickupSuburb(address.suburb);
    setPickupLat(address.lat);
    setPickupLng(address.lng);
  }

  function applyDropoffResolved(address: ResolvedStreetAddress) {
    setDropoffAddress(address.formattedAddress);
    if (address.suburb) setDropoffSuburb(address.suburb);
    setDropoffLat(address.lat);
    setDropoffLng(address.lng);
  }

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const scheduledStart = new Date(String(fd.get("scheduledStart"))).toISOString();
        const scheduledEndRaw = fd.get("scheduledEnd");
        const scheduledEnd =
          scheduledEndRaw && String(scheduledEndRaw)
            ? new Date(String(scheduledEndRaw)).toISOString()
            : undefined;

        const res = await fetch("/api/transport/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickupAddress,
            pickupSuburb: pickupSuburb || undefined,
            pickupLat,
            pickupLng,
            dropoffAddress,
            dropoffSuburb: dropoffSuburb || undefined,
            dropoffLat,
            dropoffLng,
            scheduledStart,
            scheduledEnd,
            accessNotes: fd.get("accessNotes") || undefined,
            mobilityRequirements:
              Object.keys(mobility).length > 0 ? mobility : undefined,
            prefillFromProfile,
          }),
        });
        setLoading(false);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(
            typeof data.error === "string"
              ? data.error
              : "Could not create the trip. Please check your details and try again."
          );
          return;
        }
        const tripId = data.trip?.id;
        if (tripId) {
          router.push(`/dashboard/transport/${tripId}`);
        } else {
          router.push("/dashboard/transport");
        }
      }}
    >
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <label className="flex items-start gap-2 text-sm">
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

      <MobilityRequirementsForm values={mobility} onChange={setMobility} />

      <StreetAddressAutocomplete
        id="pickupAddress"
        label="Pickup address"
        context="transport_request"
        value={pickupAddress}
        onChange={(next) => {
          setPickupAddress(next);
          setPickupLat(undefined);
          setPickupLng(undefined);
        }}
        onResolved={applyPickupResolved}
        required
      />
      <AccessibleFormField id="pickupSuburb" label="Pickup suburb">
        <input
          id="pickupSuburb"
          name="pickupSuburb"
          className={formInputClass}
          value={pickupSuburb}
          onChange={(e) => setPickupSuburb(e.target.value)}
        />
      </AccessibleFormField>
      <StreetAddressAutocomplete
        id="dropoffAddress"
        label="Drop-off address"
        context="transport_request"
        value={dropoffAddress}
        onChange={(next) => {
          setDropoffAddress(next);
          setDropoffLat(undefined);
          setDropoffLng(undefined);
        }}
        onResolved={applyDropoffResolved}
        required
      />
      <AccessibleFormField id="dropoffSuburb" label="Drop-off suburb">
        <input
          id="dropoffSuburb"
          name="dropoffSuburb"
          className={formInputClass}
          value={dropoffSuburb}
          onChange={(e) => setDropoffSuburb(e.target.value)}
        />
      </AccessibleFormField>
      <AccessibleFormField id="scheduledStart" label="Scheduled start" required>
        <input
          id="scheduledStart"
          name="scheduledStart"
          type="datetime-local"
          className={formInputClass}
          required
        />
      </AccessibleFormField>
      <AccessibleFormField id="scheduledEnd" label="Scheduled end (optional)">
        <input
          id="scheduledEnd"
          name="scheduledEnd"
          type="datetime-local"
          className={formInputClass}
        />
      </AccessibleFormField>
      <AccessibleFormField
        id="accessNotes"
        label="Access notes at pickup"
        hint="e.g. ramp, buzzer, support person meeting you"
      >
        <textarea id="accessNotes" name="accessNotes" className={formInputClass} rows={3} />
      </AccessibleFormField>

      <div className="flex gap-2">
        <Button type="submit" variant="default" size="default" loading={loading}>
          Request trip
        </Button>
        <Link
          href="/dashboard/transport"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
