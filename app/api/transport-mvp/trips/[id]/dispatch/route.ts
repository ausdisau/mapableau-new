import { ZodError } from "zod";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { assignDispatch } from "@/lib/transport-mvp/dispatch-service";
import { assignDispatchSchema } from "@/lib/validation/transport-mvp";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  const { id } = await params;
  const orgIds = await getUserOrganisationIds(user.id);

  const trip = await prisma.transportTrip.findUnique({ where: { id } });
  if (!trip || !orgIds.includes(trip.organisationId)) {
    return jsonError("Forbidden", 403);
  }

  try {
    const parsed = assignDispatchSchema.parse(await req.json());
    const result = await assignDispatch(
      id,
      parsed.driverId,
      parsed.vehicleId,
      user.id,
      { allowSuitabilityOverride: parsed.allowSuitabilityOverride }
    );
    return jsonOk(result);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message.startsWith("SUITABILITY:")) {
      return jsonError(e.message.replace("SUITABILITY:", "").trim(), 400);
    }
    if (e instanceof Error) return jsonError(e.message, 400);
    return jsonError("Dispatch failed", 500);
  }
}
