import { safeAuthCallbackPath } from "@/lib/auth/auth-flow";
import { isMapAbleJurisdiction } from "@/lib/config/nz-schemes";

export const registrationCookie = "mapable-adid-registration";
const defaultDestination = "/register/assessment";

export function registrationDestination(
  callback: unknown,
  inviteToken?: unknown,
) {
  if (
    typeof inviteToken === "string" &&
    /^[A-Za-z0-9_-]{43}$/.test(inviteToken)
  )
    return "/invite/worker/" + inviteToken;
  return typeof callback === "string" && callback.length <= 1000
    ? safeAuthCallbackPath(callback, defaultDestination)
    : defaultDestination;
}

// This first-party cookie carries onboarding preferences only. It never grants a role.
export function readRegistrationCookie(raw?: string) {
  if (!raw || raw.length > 3500) return null;
  try {
    const value = JSON.parse(raw);
    if (
      !value ||
      typeof value !== "object" ||
      !isMapAbleJurisdiction(value.region)
    )
      return null;
    return {
      region: value.region,
      destination: registrationDestination(value.destination),
    };
  } catch {
    return null;
  }
}
