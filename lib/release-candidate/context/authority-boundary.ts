export type AuthorityDomain = "consent" | "delegation" | "aura";

export interface AuthorityBoundary {
  domain: AuthorityDomain;
  authoritativeModules: readonly string[];
  invariant: string;
}

export const AUTHORITY_BOUNDARIES: readonly AuthorityBoundary[] = [
  {
    domain: "consent",
    authoritativeModules: [
      "@/lib/consent/consent-service",
      "@/lib/consent/require-consent",
    ],
    invariant:
      "Consent decisions must use existing consent services and purpose gates; RC1 adds no parallel consent ledger.",
  },
  {
    domain: "delegation",
    authoritativeModules: [
      "@/lib/delegation/authority",
      "@/lib/tenancy/federation/delegated-administration",
    ],
    invariant:
      "Delegate authority must be explicitly granted and verified through Wave 9-10 services; relationships alone are not authority.",
  },
  {
    domain: "aura",
    authoritativeModules: [
      "@/lib/aura/authority/evaluate",
      "@/lib/aura/approvals/binding",
    ],
    invariant:
      "AURA authority must be evaluated through existing authority and approval binding services; RC1 must not approve payments, claims, or emergency authority.",
  },
] as const;

export function getAuthorityBoundary(
  domain: AuthorityDomain,
): AuthorityBoundary {
  const boundary = AUTHORITY_BOUNDARIES.find((item) => item.domain === domain);
  if (!boundary) {
    throw new Error(`UNKNOWN_AUTHORITY_DOMAIN:${domain}`);
  }
  return boundary;
}
