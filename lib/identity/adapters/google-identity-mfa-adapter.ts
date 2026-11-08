import { mapableIdConfig } from "@/lib/config/mapable-id";
import type { IdentityAdapterDescriptor } from "@/lib/identity/adapters/types";

/** Optional Google Identity Platform MFA — disabled by default. */
export function describeGoogleIdentityMfaAdapter(): IdentityAdapterDescriptor {
  return {
    id: "google-identity-mfa",
    label: "Google Identity Platform MFA",
    status: mapableIdConfig.googleIdentityMfaEnabled
      ? "active"
      : "disabled",
    reason: "Not enabled; Twilio Verify and passkeys remain the supported MFA paths",
  };
}

export function assertGoogleIdentityMfaAllowed(): never {
  throw new Error("Google Identity Platform MFA is disabled for MapAbleID v0.3");
}
