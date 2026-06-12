"use client";

import { useCallback, useState } from "react";

import {
  getUserSuburb,
  type UserPosition,
  type UserSuburbResult,
} from "@/lib/geo";

export type GeolocationSuburbResult = {
  label: string;
  suburb: string;
  state: string;
  postcode: string;
  position: UserPosition;
};

function toFriendlyGeolocationError(error: unknown): string {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("permission denied") || message.includes("denied")) {
    return "Location permission denied";
  }
  if (message.includes("not supported")) {
    return "Geolocation is not supported in this browser";
  }
  if (message.includes("timeout") || message.includes("timed out")) {
    return "Could not get your location in time";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Could not get your location";
}

function toResult(data: UserSuburbResult): GeolocationSuburbResult {
  return {
    label: data.label,
    suburb: data.suburb,
    state: data.state,
    postcode: data.postcode,
    position: data.position,
  };
}

export function useGeolocationSuburb() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeolocationSuburbResult | null>(null);

  const detect = useCallback(async (): Promise<GeolocationSuburbResult | null> => {
    if (typeof window === "undefined") {
      setError("Geolocation is not supported in this browser");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getUserSuburb();
      const next = toResult(data);
      setResult(next);
      return next;
    } catch (err) {
      const friendly = toFriendlyGeolocationError(err);
      setError(friendly);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, result, detect };
}
