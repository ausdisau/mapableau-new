import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isPublicApiV2Enabled } from "@/lib/api-versioning/version-middleware";
import { y3NationalTrustConfig } from "@/lib/config/y3-national-trust";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  if (!y3NationalTrustConfig.publicApiV2PartnerEnabled) {
    return jsonError("Public API v2 disabled", 403);
  }

  const enabled = await isPublicApiV2Enabled();
  if (!enabled) return jsonError("API v2 not available", 403);

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const orgId = req.headers.get("x-organisation-id");
  const shifts = await prisma.careShift.findMany({
    where: orgId ? { organisationId: orgId } : {},
    orderBy: { startAt: "desc" },
    take: 50,
    select: {
      id: true,
      participantId: true,
      organisationId: true,
      workerProfileId: true,
      startAt: true,
      endAt: true,
      status: true,
      location: true,
    },
  });

  const response = jsonOk({
    version: "v2",
    shifts: shifts.map((s) => ({
      ...s,
      apiVersion: "v2",
      meta: { tenantScoped: Boolean(orgId) },
    })),
  });

  response.headers.set("X-MapAble-Api-Version", "v2");
  return response;
}
