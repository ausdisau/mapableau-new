import { getUberClient } from "@/lib/uber/client";
import type {
  UberCreateGuestTripRequest,
  UberGuest,
  UberListTripsParams,
  UberTripEstimatesRequest,
} from "@/lib/uber/types";

/** Fare/product estimates for a guest trip (POST /v1/guests/trips/estimates). */
export async function getUberGuestTripEstimates(
  input: UberTripEstimatesRequest
) {
  return getUberClient().getTripEstimates(input);
}

/** Create a guest trip on behalf of a rider (POST /v1/guests/trips). */
export async function createUberGuestTrip(input: UberCreateGuestTripRequest) {
  return getUberClient().createGuestTrip(input);
}

export async function getUberGuestTrip(
  requestId: string,
  includeEditableFields = false
) {
  return getUberClient().getGuestTrip(requestId, includeEditableFields);
}

export async function listUberGuestTrips(params?: UberListTripsParams) {
  return getUberClient().listGuestTrips(params ?? {});
}

export async function cancelUberGuestTrip(requestId: string) {
  return getUberClient().cancelGuestTrip(requestId);
}

export function buildUberGuestFromProfile(input: {
  name: string;
  email: string;
  phone: string | null;
}): UberGuest {
  const trimmedName = input.name.trim() || "Guest";
  const parts = trimmedName.split(/\s+/);
  const first_name = parts[0] ?? "Guest";
  const last_name = parts.length > 1 ? parts.slice(1).join(" ") : undefined;

  if (!input.phone?.trim()) {
    throw new Error("UBER_GUEST_PHONE_REQUIRED");
  }

  return {
    first_name,
    last_name,
    email: input.email,
    phone_number: normalizeE164Phone(input.phone),
    locale: "en-AU",
  };
}

/** Best-effort E.164 for AU numbers; pass through if already international. */
export function normalizeE164Phone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("61")) return `+${digits}`;
  if (digits.startsWith("0")) return `+61${digits.slice(1)}`;
  return `+${digits}`;
}
