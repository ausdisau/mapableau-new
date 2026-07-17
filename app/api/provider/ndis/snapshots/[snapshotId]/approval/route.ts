import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import {
  getSnapshotApprovals,
  getSubmissionApproval,
} from "@/lib/ndis-gateway/security/claim-approval-service";
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

/** GET /api/provider/ndis/snapshots/[snapshotId]/approval */
export async function GET(_req: Request, { params }: Params) {
  const user = await requireAnyPermission([
    "provider:ndis:claim:view",
    "provider:ndia:claim",
    "provider:ndis:claim",
  ]);
  if (user instanceof Response) return user;

  const { snapshotId } = await params;
  const approvals = await getSnapshotApprovals(snapshotId, user);
  const valid = await getSubmissionApproval(snapshotId);

  if (!approvals.length && !valid) {
    return jsonNdisError("No approval found", 404);
  }

  return jsonNdisOk({
    validApproval: valid
      ? {
          id: valid.approval.id,
          claimSnapshotId: valid.approval.claimSnapshotId,
          organisationId: valid.approval.organisationId,
          decision: valid.approval.decision,
          payloadHash: valid.approval.payloadHash,
          approvedById: valid.approval.approvedById,
          approvedAt: valid.approval.approvedAt,
          expiresAt: valid.approval.expiresAt,
        }
      : null,
    history: approvals.map((a) => ({
      id: a.id,
      decision: a.decision,
      payloadHash: a.payloadHash,
      approvedById: a.approvedById,
      approvedAt: a.approvedAt,
      expiresAt: a.expiresAt,
      revokedAt: a.revokedAt,
      reason: a.reason,
    })),
  });
}
