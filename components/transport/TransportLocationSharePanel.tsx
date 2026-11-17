"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type LocationView = {
  location?: { lat: number; lng: number } | null;
  exact?: boolean;
  error?: string;
};

export function TransportLocationSharePanel({
  tripId,
  role,
  liveLocationEnabled,
}: {
  tripId: string;
  role: "participant" | "driver";
  liveLocationEnabled: boolean;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function readJson(res: Response) {
    return (await res.json()) as LocationView & {
      optedIn?: boolean;
      granted?: boolean;
      error?: string;
    };
  }

  async function grantConsent() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(
        `/api/transport/trips/${tripId}/location/consent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ granted: true }),
        }
      );
      const json = await readJson(res);
      setStatus(
        res.ok
          ? "Location sharing consent saved. The driver still has to opt in, and sharing stays off unless both are true."
          : json.error ?? "Could not save consent."
      );
    } catch {
      setStatus("Could not save consent.");
    } finally {
      setBusy(false);
    }
  }

  async function setOptIn(optedIn: boolean) {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(
        `/api/driver/transport/trips/${tripId}/location/opt-in`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optedIn }),
        }
      );
      const json = await readJson(res);
      setStatus(
        res.ok
          ? optedIn
            ? "Location sharing opted in for this trip. Location is only sent while the trip is in service and the participant has consented."
            : "Location sharing turned off for this trip."
          : json.error ?? "Could not update location sharing."
      );
    } catch {
      setStatus("Could not update location sharing.");
    } finally {
      setBusy(false);
    }
  }

  async function sendLocation() {
    setBusy(true);
    setStatus(null);
    if (!navigator.geolocation) {
      setStatus("This device cannot share location.");
      setBusy(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(
            `/api/driver/transport/trips/${tripId}/location`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              }),
            }
          );
          const json = await readJson(res);
          setStatus(
            res.ok
              ? "Location recorded for this trip. Coordinates are not shown in notifications."
              : json.error ?? "Could not record location."
          );
        } catch {
          setStatus("Could not record location.");
        } finally {
          setBusy(false);
        }
      },
      () => {
        setStatus("Location permission was denied on this device.");
        setBusy(false);
      }
    );
  }

  async function loadLocation() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/transport/trips/${tripId}/location`);
      const json = await readJson(res);
      if (!res.ok) {
        setStatus(json.error ?? "Location is not available.");
        return;
      }
      const location = json.location;
      if (!location) {
        setStatus("No driver location has been shared yet.");
        return;
      }
      setStatus(
        json.exact
          ? `Last shared location: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}.`
          : `Last shared location is available.`
      );
    } catch {
      setStatus("Could not load location.");
    } finally {
      setBusy(false);
    }
  }

  if (!liveLocationEnabled) {
    return (
      <section className="rounded-xl border border-border p-4" aria-labelledby="location-share-heading">
        <h2 id="location-share-heading" className="font-semibold">
          Driver location sharing
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Optional driver location sharing is turned off for this environment.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border p-4" aria-labelledby="location-share-heading">
      <h2 id="location-share-heading" className="font-semibold">
        Driver location sharing
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Optional and consent-based. Location is only recorded while the trip is
        in service. Notifications never include coordinates.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {role === "participant" ? (
          <Button
            type="button"
            className="min-h-11 min-w-11"
            disabled={busy}
            onClick={() => void grantConsent()}
          >
            Allow optional driver location
          </Button>
        ) : (
          <>
            <Button
              type="button"
              className="min-h-11 min-w-11"
              disabled={busy}
              onClick={() => void setOptIn(true)}
            >
              Opt in to share location
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 min-w-11"
              disabled={busy}
              onClick={() => void setOptIn(false)}
            >
              Stop sharing
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 min-w-11"
              disabled={busy}
              onClick={() => void sendLocation()}
            >
              Send current location
            </Button>
          </>
        )}
        <Button
          type="button"
          variant="outline"
          className="min-h-11 min-w-11"
          disabled={busy}
          onClick={() => void loadLocation()}
        >
          Show last shared location
        </Button>
      </div>
      <p className="mt-3 text-sm" role="status" aria-live="polite">
        {status ?? "Sharing stays off until the participant consents and the driver opts in."}
      </p>
    </section>
  );
}
