"use client";

import { useCallback, useState } from "react";

import type {
  GeolocationErrorCode,
  GeolocationStatus,
  UserLocation,
} from "@/types/location";

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 60_000,
};

function mapGeolocationError(code: number): {
  status: GeolocationStatus;
  errorCode: GeolocationErrorCode;
  message: string;
} {
  switch (code) {
    case 1:
      return {
        status: "denied",
        errorCode: "PERMISSION_DENIED",
        message:
          "We could not access your location. You can enter a suburb or postcode instead.",
      };
    case 2:
      return {
        status: "unavailable",
        errorCode: "POSITION_UNAVAILABLE",
        message:
          "Your location could not be determined. Try entering a suburb or postcode instead.",
      };
    case 3:
      return {
        status: "timeout",
        errorCode: "TIMEOUT",
        message:
          "Finding your location took too long. Try again or enter a suburb or postcode.",
      };
    default:
      return {
        status: "error",
        errorCode: "UNKNOWN",
        message: "Something went wrong while finding your location.",
      };
  }
}

export function useUserGeolocation() {
  const isSupported =
    typeof navigator !== "undefined" && Boolean(navigator.geolocation);

  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>(
    isSupported ? "idle" : "unavailable",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    isSupported
      ? null
      : "Location is not supported in this browser. Enter a suburb or postcode instead.",
  );

  const requestLocation = useCallback(() => {
    if (!isSupported) {
      setStatus("unavailable");
      setErrorMessage(
        "Location is not supported in this browser. Enter a suburb or postcode instead.",
      );
      return;
    }

    setStatus("requesting");
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: "browser_geolocation",
          capturedAt: new Date().toISOString(),
        });
        setStatus("granted");
        setErrorMessage(null);
      },
      (err) => {
        const mapped = mapGeolocationError(err.code);
        setStatus(mapped.status);
        setErrorMessage(mapped.message);
        setLocation(null);
      },
      GEO_OPTIONS,
    );
  }, [isSupported]);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setStatus(isSupported ? "idle" : "unavailable");
    setErrorMessage(null);
  }, [isSupported]);

  return {
    location,
    status,
    errorMessage,
    requestLocation,
    clearLocation,
    isSupported,
    isActive: location != null && status === "granted",
    isRequesting: status === "requesting",
  };
}
