import { describeAdidOidcFederationAdapter } from "@/lib/identity/adapters/adid-oidc-federation-adapter";
import { describeGoogleIdentityMfaAdapter } from "@/lib/identity/adapters/google-identity-mfa-adapter";
import { describeMapAbleNextAuthAdapter } from "@/lib/identity/adapters/mapable-nextauth-adapter";
import type { IdentityAdapterDescriptor } from "@/lib/identity/adapters/types";
import { describeWebAuthnYubiKeyAdapter } from "@/lib/identity/adapters/webauthn-yubikey-adapter";

export {
  assertAdidFederationAllowed,
  describeAdidOidcFederationAdapter,
} from "@/lib/identity/adapters/adid-oidc-federation-adapter";
export {
  assertGoogleIdentityMfaAllowed,
  describeGoogleIdentityMfaAdapter,
} from "@/lib/identity/adapters/google-identity-mfa-adapter";
export {
  describeMapAbleNextAuthAdapter,
  resolveNextAuthSubject,
} from "@/lib/identity/adapters/mapable-nextauth-adapter";
export type {
  AdapterCapabilityStatus,
  IdentityAdapterDescriptor,
  VerifiedAuthSubject,
} from "@/lib/identity/adapters/types";
export {
  assertWebAuthnMutationsAllowed,
  describeWebAuthnYubiKeyAdapter,
} from "@/lib/identity/adapters/webauthn-yubikey-adapter";

export function listIdentityAdapters(): IdentityAdapterDescriptor[] {
  return [
    describeMapAbleNextAuthAdapter(),
    describeWebAuthnYubiKeyAdapter(),
    describeGoogleIdentityMfaAdapter(),
    describeAdidOidcFederationAdapter(),
  ];
}
