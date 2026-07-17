import type { AccessSourceTrustLevel } from "@prisma/client";

export function canUseSourceForRouting(
  trustLevel: AccessSourceTrustLevel,
): boolean {
  return (
    trustLevel === "high" || trustLevel === "authoritative_domain_specific"
  );
}

export function canUseSourceForPublicStatus(
  trustLevel: AccessSourceTrustLevel,
): boolean {
  return trustLevel !== "untrusted";
}
