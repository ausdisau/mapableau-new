import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  assertOrgAccess,
  validateClaimLineById,
} from "@/lib/ndis/claiming/claim-service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  claimLineId: z.string().cuid(),
});

export async function POST(req: Request) {
  const user = await requireApiPermission("provider:ndis:claim");
  if (user instanceof Response) return user;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const line = await prisma.ndisClaimLine.findUnique({
    where: { id: parsed.data.claimLineId },
  });
  if (!line) return jsonError("Claim line not found", 404);

  try {
    await assertOrgAccess(user, line.providerOrgId);
    const result = await validateClaimLineById(parsed.data.claimLineId, user.id);
    return jsonOk(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError(msg, 400);
  }
}
