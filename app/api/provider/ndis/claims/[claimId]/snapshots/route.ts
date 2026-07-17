import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { listSnapshotsForClaim } from "@/lib/ndis-gateway/security/claim-snapshot-service";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ claimId: string }> };

async function requireAnyPermission(
  permissions: Permission[]
): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (permissions.some((p) => hasPermission(user.primaryRole, p))) return user;
  return requireApiPermission(permissions[0]!);
}

/** GET /api/provider/ndis/claims/[claimId]/snapshots */
export async function GET(_req: Request, { params }: Params) {
  const user = await requireAnyPermission([
    "provider:ndis:claim:view",
    "provider:ndia:claim",
    "provider:ndis:claim",
  ]);
  if (user instanceof Response) return user;

  const { claimId } = await params;
  const claim = await prisma.ndiaProviderClaim.findUnique({
    where: { id: claimId },
  });
  if (!claim) return jsonNdisError("Claim not found", 404);

  const snapshots = await listSnapshotsForClaim({
    user,
    organisationId: claim.organisationId,
    sourceType: "ndia_provider_claim",
    sourceId: claim.id,
  });

  return jsonNdisOk({ snapshots });
}
