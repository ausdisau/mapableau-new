import { mapableIdConfig } from "@/lib/config/mapable-id";
import type { IdentityAdapterDescriptor } from "@/lib/identity/adapters/types";

/**
 * Typed boundary for server-verified WebAuthn / YubiKey operations.
 * Enrolment mutations stay disabled in v0.3; use existing /api/passkeys routes
 * after threat-model and accessible recovery sign-off.
 */
export function describeWebAuthnYubiKeyAdapter(): IdentityAdapterDescriptor {
  return {
    id: "webauthn-yubikey",
    label: "WebAuthn / FIDO2 / YubiKey",
    status: mapableIdConfig.webauthnEnrolmentMutationsEnabled
      ? "active"
      : "disabled",
    reason: mapableIdConfig.webauthnEnrolmentMutationsEnabled
      ? undefined
      : "Enrolment mutations disabled until recovery and threat-model gates pass",
  };
}

export function assertWebAuthnMutationsAllowed(): never {
  throw new Error(
    "WebAuthn/YubiKey enrolment mutations are disabled for MapAbleID v0.3",
  );
}
