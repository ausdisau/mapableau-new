import { z } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";
import { approveClaimSnapshot } from "@/lib/ndis-gateway/security/claim-approval-service";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";

const bodySchema = z.object({
  reason: z.string().max(2000).optional(),
  expiresAt: z.string().datetime().optional(),
});

type Params = { params: Promise<{ snapshotId: string }> };

async function requireAnyPermission(
  permissions: Permission[]
): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (permissions.some((p) => hasPermission(user.primaryRole, p))) return user;
  return requireApiPermission(permissions[0]!);
}

/** POST /api/provider/ndis/snapshots/[snapshotId]/approve */
export async function POST(req: Request, { params }: Params) {
  const user = await requireAnyPermission([
    "provider:ndis:claim:approve",
    "provider:ndia:claim",
  ]);
  if (user instanceof Response) return user;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const { snapshotId } = await params;
    const approval = await approveClaimSnapshot({
      user,
      snapshotId,
      reason: parsed.data.reason,
      expiresAt: parsed.data.expiresAt
        ? new Date(parsed.data.expiresAt)
        : undefined,
    });
    return jsonNdisOk({
      approval: {
        id: approval.id,
        claimSnapshotId: approval.claimSnapshotId,
        organisationId: approval.organisationId,
        decision: approval.decision,
        payloadHash: approval.payloadHash,
        approvedById: approval.approvedById,
        approvedAt: approval.approvedAt,
        expiresAt: approval.expiresAt,
        reason: approval.reason,
      },
    });
  } catch (e) {
    if (e instanceof NdisGatewayError) {
      return jsonNdisError(e.plainLanguageMessage, 400);
    }
    throw e;
  }
}
