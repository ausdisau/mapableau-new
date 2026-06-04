import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isNdisServiceDeliveryMechanismEnabled } from "@/lib/config/ndis-service-delivery";
import { assertOrgAccess } from "@/lib/ndis/claiming/claim-service";
import { activateDeliveryAuthorization } from "@/lib/ndis/service-delivery/authorization-service";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  action: z.enum(["activate", "suspend", "revoke"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("provider:ndis:claim");
  if (user instanceof Response) return user;
  if (!isNdisServiceDeliveryMechanismEnabled()) {
    return jsonError("NDIS service delivery mechanism is disabled", 503);
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await prisma.ndisServiceDeliveryAuthorization.findUnique({
    where: { id },
  });
  if (!existing) return jsonError("Authorization not found", 404);

  try {
    await assertOrgAccess(user, existing.providerOrgId);

    if (parsed.data.action === "activate") {
      const updated = await activateDeliveryAuthorization(id, user.id);
      return jsonOk({ authorization: updated });
    }

    const status =
      parsed.data.action === "suspend" ? "suspended" : ("revoked" as const);
    const updated = await prisma.ndisServiceDeliveryAuthorization.update({
      where: { id },
      data: { status },
    });
    return jsonOk({ authorization: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError(msg, 400);
  }
}
