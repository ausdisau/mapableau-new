import { ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { getUserOrganisationIds } from "@/lib/disputes/access";
import {
  createDispute,
  listDisputesForUser,
} from "@/lib/disputes/dispute-service";
import { createDisputeSchema } from "@/lib/validation/disputes";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const orgIds = await getUserOrganisationIds(user.id);
  const disputes = await listDisputesForUser({
    userId: user.id,
    organisationIds: orgIds,
    isAdmin: isAdminRole(user.primaryRole),
  });

  return jsonOk({ disputes });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("dispute:create");
  if (user instanceof Response) return user;

  try {
    const body = createDisputeSchema.parse(await req.json());
    const dispute = await createDispute({
      ...body,
      participantId: user.id,
      createdById: user.id,
    });
    return jsonOk({ dispute }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error) {
      if (e.message === "DISPUTES_DISABLED") {
        return jsonError("Disputes are not available", 503);
      }
      if (e.message.endsWith("_ACCESS_DENIED")) {
        return jsonError("You cannot link this record", 403);
      }
    }
    return jsonError("Could not create dispute", 500);
  }
}
