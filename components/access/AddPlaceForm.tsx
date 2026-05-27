"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { AccessAddressAutocomplete } from "@/components/access/AccessAddressAutocomplete";
import { AccessLocationPicker } from "@/components/access/AccessLocationPicker";
import type { AccessGeoPlaceDetails } from "@/types/access-geo";

export function AddPlaceForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [addressText, setAddressText] = useState("");
  const [suburb, setSuburb] = useState("");
  const [stateOrRegion, setStateOrRegion] = useState("");
  const [latitude, setLatitude] = useState(-33.8688);
  const [longitude, setLongitude] = useState(151.2093);

  const onPlaceResolved = useCallback((place: AccessGeoPlaceDetails) => {
    setAddressText(place.addressText);
    setSuburb(place.suburb ?? "");
    setStateOrRegion(place.stateOrRegion ?? "");
    setLatitude(place.latitude);
    setLongitude(place.longitude);
  }, []);

  const onMapChange = useCallback(
    async (coords: { latitude: number; longitude: number }) => {
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);

      const res = await fetch("/api/access/geo/reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coords),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { place: AccessGeoPlaceDetails };
      onPlaceResolved(data.place);
    },
    [onPlaceResolved]
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/access/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          category: fd.get("category") || "other",
          addressText: addressText || fd.get("addressText"),
          suburb: suburb || fd.get("suburb"),
          stateOrRegion: stateOrRegion || fd.get("stateOrRegion"),
          country: "AU",
          latitude,
          longitude,
          description: fd.get("description"),
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? "Could not submit place");
        return;
      }
      const j = await res.json();
      router.push(`/access/places/${j.place.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="max-w-lg space-y-4" onSubmit={onSubmit}>
      <p className="text-sm text-muted-foreground">
        Suggested places are moderated before appearing as verified listings.
        Search for an Australian address, then fine-tune the pin on the map if
        needed.
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium">Place name</span>
        <input name="name" required className="mt-1 min-h-11 w-full rounded-lg border px-3" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Category</span>
        <select name="category" className="mt-1 min-h-11 w-full rounded-lg border px-3">
          <option value="cafe_restaurant">Café / restaurant</option>
          <option value="shop">Shop</option>
          <option value="park">Park</option>
          <option value="other">Other</option>
        </select>
      </label>

      <AccessAddressAutocomplete
        value={addressText}
        onChange={setAddressText}
        onPlaceResolved={onPlaceResolved}
        disabled={submitting}
        bias={{ latitude, longitude }}
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Suburb</span>
          <input
            name="suburb"
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border px-3"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">State</span>
          <input
            name="stateOrRegion"
            value={stateOrRegion}
            onChange={(e) => setStateOrRegion(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border px-3"
          />
        </label>
      </div>

      <AccessLocationPicker
        latitude={latitude}
        longitude={longitude}
        onChange={onMapChange}
        disabled={submitting}
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Latitude</span>
          <input
            name="latitude"
            type="number"
            step="any"
            required
            value={latitude}
            onChange={(e) => setLatitude(Number(e.target.value))}
            className="mt-1 min-h-11 w-full rounded-lg border px-3"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Longitude</span>
          <input
            name="longitude"
            type="number"
            step="any"
            required
            value={longitude}
            onChange={(e) => setLongitude(Number(e.target.value))}
            className="mt-1 min-h-11 w-full rounded-lg border px-3"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Notes (optional)</span>
        <textarea name="description" rows={4} className="mt-1 w-full rounded-lg border px-3" />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Suggest place"}
      </button>
    </form>
  );
}
