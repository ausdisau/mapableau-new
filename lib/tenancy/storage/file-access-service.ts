import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/lib/tenancy/context/tenant-context";

import { evaluatePrivateFileAccess } from "./private-file-policy";

export async function auditPrivateFileAccess(
  ctx: TenantContext,
  file: {
    id: string;
    organisationId: string | null;
    classification?: string | null;
  },
  action: "read" | "write" | "delete"
): Promise<{ allowed: boolean; reason: string }> {
  const decision = evaluatePrivateFileAccess(ctx, file);
  await prisma.auditEvent.create({
    data: {
      actorUserId: ctx.actor.userId ?? null,
      action: `private_file.${action}.${decision.allowed ? "allow" : "deny"}`,
      entityType: "PrivateFile",
      entityId: file.id,
      organisationId: file.organisationId ?? null,
      metadata: {
        reason: decision.reason,
        breakGlassSessionId: ctx.breakGlassSessionId ?? null,
      },
    },
  });
  return decision;
}
