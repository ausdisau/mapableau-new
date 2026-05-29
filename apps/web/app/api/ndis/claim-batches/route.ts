import { NdisPaymentRoute } from "@prisma/client";
import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  assertOrgAccess,
  createClaimBatch,
} from "@/lib/ndis/claiming/claim-service";

const bodySchema = z.object({
  providerOrgId: z.string().cuid(),
  paymentRoute: z.nativeEnum(NdisPaymentRoute),
  claimLineIds: z.array(z.string().cuid()).min(1),
  batchReference: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiPermission("provider:ndis:claim");
  if (user instanceof Response) return user;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await assertOrgAccess(user, parsed.data.providerOrgId);
    const result = await createClaimBatch({
      ...parsed.data,
      createdById: user.id,
    });
    if (!result.ok) {
      return jsonOk({ ok: false, validation: result.validation }, 422);
    }
    return jsonOk(result, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError(msg, 400);
  }
}
