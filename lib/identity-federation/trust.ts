import { prisma } from "@/lib/prisma";

/**
 * Federation-side view over the credential trust registry. Federation code
 * looks up whether an external entity is trusted enough to talk to. It never
 * bypasses the credential-side trust registry — federation != participant
 * data access.
 */

export async function isEntityTrustedForRole(
  entityKey: string,
  role: "issuer" | "verifier" | "app"
): Promise<boolean> {
  const entity = await prisma.externalFederationEntity.findUnique({
    where: { entityKey },
  });
  if (!entity) return false;
  if (entity.status !== "approved") return false;
  if (entity.kind !== role) return false;
  const trust = await prisma.credentialTrustRegistryEntry.findFirst({
    where: {
      entityKey,
      status: "active",
    },
  });
  if (!trust) return false;
  if (role === "issuer") {
    return (
      trust.trustLevel === "allowed_issuer" || trust.trustLevel === "fully_trusted"
    );
  }
  if (role === "verifier") {
    return (
      trust.trustLevel === "allowed_verifier" ||
      trust.trustLevel === "fully_trusted"
    );
  }
  return trust.trustLevel !== "untrusted";
}
