"use client";

import type { UserLocation } from "@/types/location";
import {
  RADIUS_KM_OPTIONS,
  type GeolocationStatus,
  type RadiusKmOption,
} from "@/types/location";

import { ClearLocationButton } from "./ClearLocationButton";
import { FindMyLocationButton } from "./FindMyLocationButton";
import { UserLocationStatus } from "./UserLocationStatus";

export type ProviderFinderLocationControlsProps = {
  status: GeolocationStatus;
  isActive: boolean;
  isRequesting: boolean;
  isSupported: boolean;
  errorMessage: string | null;
  radiusKm: RadiusKmOption;
  onRadiusKmChange: (km: RadiusKmOption) => void;
  onRequestLocation: () => void;
  onClearLocation: () => void;
  locationFieldId?: string;
};

export function ProviderFinderLocationControls({
  status,
  isActive,
  isRequesting,
  isSupported,
  errorMessage,
  radiusKm,
  onRadiusKmChange,
  onRequestLocation,
  onClearLocation,
  locationFieldId = "pf-location",
}: ProviderFinderLocationControlsProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <FindMyLocationButton
          onClick={onRequestLocation}
          isRequesting={isRequesting}
          disabled={!isSupported}
        />
        {isActive ? <ClearLocationButton onClick={onClearLocation} /> : null}
      </div>

      {isActive ? (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="pf-radius-km" className="text-sm font-medium">
            Search radius
          </label>
          <select
            id="pf-radius-km"
            value={radiusKm}
            onChange={(e) =>
              onRadiusKmChange(Number(e.target.value) as RadiusKmOption)
            }
            className="min-h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {RADIUS_KM_OPTIONS.map((km) => (
              <option key={km} value={km}>
                {km} km
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <UserLocationStatus
        status={status}
        isActive={isActive}
        errorMessage={errorMessage}
        locationFieldId={locationFieldId}
      />
    </div>
  );
}

export type { UserLocation };
