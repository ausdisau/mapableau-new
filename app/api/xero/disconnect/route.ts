import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, jsonError, zodErrorResponse } from "@/lib/api/response";
import { disconnectXero } from "@/lib/xero/xero-oauth-service";
import { xeroDisconnectSchema } from "@/types/xero";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await requireApiPermission("xero:manage");
  if (user instanceof Response) return user;

  try {
    const body = xeroDisconnectSchema.parse(await req.json());
    const member = await prisma.organisationMember.findFirst({
      where: { userId: user.id, organisationId: body.organisationId },
    });
    if (!member) return jsonError("Forbidden", 403);

    await disconnectXero(body.organisationId, user.id);
    return jsonOk({
      disconnected: true,
      mfaNote: "Step-up MFA required in production for disconnect",
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    throw e;
  }
}
