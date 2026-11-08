import { mapableIdConfig } from "@/lib/config/mapable-id";
import type { IdentityAdapterDescriptor } from "@/lib/identity/adapters/types";

/**
 * Future AD.iD OAuth/OIDC federation.
 * US East AD.iD Neon must not become a live issuer without Australian
 * residency, APP 8, and cutover approval.
 */
export function describeAdidOidcFederationAdapter(): IdentityAdapterDescriptor {
  return {
    id: "adid-oidc-federation",
    label: "AD.iD OAuth / OIDC federation",
    status: mapableIdConfig.adidFederationEnabled ? "active" : "disabled",
    reason:
      "Federation disabled; retain NextAuth as sole issuer; no cross-border cutover",
  };
}

export function assertAdidFederationAllowed(): never {
  throw new Error(
    "AD.iD OIDC federation is disabled until residency and issuer cutover approval",
  );
}
