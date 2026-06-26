"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { AccessTripWarningsPanel } from "@/components/transport/AccessTripWarningsPanel";
import { MobilityRequirementsForm } from "@/components/transport/MobilityRequirementsForm";
import { Button } from "@/components/ui/button";
import type { MobilityRequirements } from "@/lib/transport/mobility-schema";

export function NewTransportTripForm({ placeId }: { placeId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefillFromProfile, setPrefillFromProfile] = useState(true);
  const [mobility, setMobility] = useState<MobilityRequirements>({});
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [accessNotes, setAccessNotes] = useState("");
  const [accessWarnings, setAccessWarnings] = useState<string[]>([]);
  const [journeyConfidence, setJourneyConfidence] = useState<number | null>(
    null
  );
  const [placeName, setPlaceName] = useState<string | null>(null);

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

  useEffect(() => {
    if (!placeId) return;
    fetch(`/api/access/places/${placeId}/destination-profile`)
      .then((r) => r.json())
      .then((data) => {
        const profile = data.destinationProfile;
        if (!profile) return;
        setPlaceName(profile.destinationName);
        if (profile.dropoffAddress) setDropoffAddress(profile.dropoffAddress);
        if (profile.transportInstructions?.driverNotes) {
          setAccessNotes(profile.transportInstructions.driverNotes);
        }
        setAccessWarnings(profile.accessWarnings ?? []);
        if (profile.accessSummary?.confidenceScore != null) {
          setJourneyConfidence(profile.accessSummary.confidenceScore);
        }
      })
      .catch(() => {});
  }, [placeId]);

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
            pickupAddress: fd.get("pickupAddress"),
            pickupSuburb: fd.get("pickupSuburb") || undefined,
            dropoffAddress: fd.get("dropoffAddress"),
            dropoffSuburb: fd.get("dropoffSuburb") || undefined,
            scheduledStart,
            scheduledEnd,
            accessNotes: fd.get("accessNotes") || undefined,
            mobilityRequirements:
              Object.keys(mobility).length > 0 ? mobility : undefined,
            prefillFromProfile,
            destinationAccessPlaceId: placeId,
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

      {placeName ? (
        <p className="text-sm">
          Planning trip to <strong>{placeName}</strong> using community access
          data.
        </p>
      ) : null}

      <AccessTripWarningsPanel
        warnings={accessWarnings}
        journeyConfidence={journeyConfidence}
      />

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

      <AccessibleFormField id="pickupAddress" label="Pickup address" required>
        <input
          id="pickupAddress"
          name="pickupAddress"
          className={formInputClass}
          required
        />
      </AccessibleFormField>
      <AccessibleFormField id="pickupSuburb" label="Pickup suburb">
        <input id="pickupSuburb" name="pickupSuburb" className={formInputClass} />
      </AccessibleFormField>
      <AccessibleFormField id="dropoffAddress" label="Drop-off address" required>
        <input
          id="dropoffAddress"
          name="dropoffAddress"
          className={formInputClass}
          required
          value={dropoffAddress}
          onChange={(e) => setDropoffAddress(e.target.value)}
        />
      </AccessibleFormField>
      <AccessibleFormField id="dropoffSuburb" label="Drop-off suburb">
        <input id="dropoffSuburb" name="dropoffSuburb" className={formInputClass} />
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
        <textarea
          id="accessNotes"
          name="accessNotes"
          className={formInputClass}
          rows={3}
          value={accessNotes}
          onChange={(e) => setAccessNotes(e.target.value)}
        />
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
