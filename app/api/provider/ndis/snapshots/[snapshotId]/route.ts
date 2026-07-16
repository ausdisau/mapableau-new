import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";
import { getClaimSnapshotSafe } from "@/lib/ndis-gateway/security/claim-snapshot-service";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";

type Params = { params: Promise<{ snapshotId: string }> };

async function requireAnyPermission(
  permissions: Permission[]
): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (permissions.some((p) => hasPermission(user.primaryRole, p))) return user;
  return requireApiPermission(permissions[0]!);
}

/** GET /api/provider/ndis/snapshots/[snapshotId] — masked detail only */
export async function GET(_req: Request, { params }: Params) {
  const user = await requireAnyPermission([
    "provider:ndis:claim:view",
    "provider:ndia:claim",
    "provider:ndis:claim",
  ]);
  if (user instanceof Response) return user;

  try {
    const { snapshotId } = await params;
    const snapshot = await getClaimSnapshotSafe(snapshotId, user);
    return jsonNdisOk({ snapshot });
  } catch (e) {
    if (e instanceof NdisGatewayError) {
      return jsonNdisError(e.plainLanguageMessage, 404);
    }
    throw e;
  }
}
