"use client";

import React from "react";

import type { GeolocationStatus } from "@/types/location";

type UserLocationStatusProps = {
  status: GeolocationStatus;
  isActive: boolean;
  errorMessage: string | null;
  locationFieldId?: string;
};

export function UserLocationStatus({
  status,
  isActive,
  errorMessage,
  locationFieldId = "pf-location",
}: UserLocationStatusProps) {
  let message: string | null = null;
  let role: "status" | "alert" = "status";

  if (isActive) {
    message = "Showing providers near your current location.";
  } else if (errorMessage) {
    message = errorMessage;
    role = "alert";
  } else if (status === "requesting") {
    message = "Requesting permission to use your location…";
  } else if (status === "unavailable") {
    message =
      "Location is not available in this browser. Enter a suburb or postcode instead.";
    role = "alert";
  }

  if (!message) {
    return (
      <p className="text-xs text-muted-foreground">
        Use your current location to show nearby providers. Your location is used
        for this search only.
      </p>
    );
  }

  return (
    <div>
      <p
        className={
          role === "alert"
            ? "text-sm text-destructive"
            : "text-sm text-muted-foreground"
        }
        role={role}
        aria-live="polite"
        aria-atomic="true"
      >
        {message}
      </p>
      {role === "alert" && locationFieldId ? (
        <p className="mt-1 text-xs text-muted-foreground">
          <a
            href={`#${locationFieldId}`}
            className="underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Go to suburb or postcode search
          </a>
        </p>
      ) : null}
    </div>
  );
}
