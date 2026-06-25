import { approveVenueClaim } from "@/lib/venue-access/venue-claim-service";
import { getApiUser, apiUnauthorized, apiForbidden } from "@/lib/auth/guards";
import { isAccessModerator } from "@/lib/access-community/access-role-policy";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const claimActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().max(2000).optional(),
});

export async function GET() {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!(await isAccessModerator(user))) return apiForbidden();

  const claims = await prisma.accessVenueClaim.findMany({
    where: { status: { in: ["submitted", "needs_evidence"] } },
    include: {
      place: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return jsonOk({ claims });
}

export async function PATCH(req: Request) {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!(await isAccessModerator(user))) return apiForbidden();

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = claimActionSchema
    .extend({ claimId: z.string() })
    .safeParse(body);
  if (!parsed.success) return jsonError("Invalid request", 400);

  if (parsed.data.action === "approve") {
    const claim = await approveVenueClaim(parsed.data.claimId, user.id);
    return jsonOk({ claim });
  }

  const claim = await prisma.accessVenueClaim.update({
    where: { id: parsed.data.claimId },
    data: { status: "rejected" },
  });
  return jsonOk({ claim });
}
