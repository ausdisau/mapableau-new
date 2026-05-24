import { ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { createComplaint } from "@/lib/complaints/complaint-service";
import { prisma } from "@/lib/prisma";
import { createComplaintSchema } from "@/lib/validation/disputes";
import { getUserOrganisationIds } from "@/lib/disputes/access";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const orgIds = await getUserOrganisationIds(user.id);
  const where = isAdminRole(user.primaryRole)
    ? {}
    : {
        OR: [
          { participantId: user.id },
          { createdById: user.id },
          ...(orgIds.length
            ? [{ organisationId: { in: orgIds } }]
            : []),
        ],
      };

  const complaints = await prisma.complaint.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return jsonOk({ complaints });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("complaint:create");
  if (user instanceof Response) return user;

  try {
    const body = createComplaintSchema.parse(await req.json());
    const complaint = await createComplaint({
      ...body,
      participantId: user.id,
      createdById: user.id,
    });
    return jsonOk({ complaint }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error) {
      if (e.message === "COMPLAINTS_DISABLED") {
        return jsonError("Complaints are not available", 503);
      }
      if (e.message === "BOOKING_ACCESS_DENIED") {
        return jsonError("You cannot link this booking", 403);
      }
    }
    return jsonError("Could not create complaint", 500);
  }
}
