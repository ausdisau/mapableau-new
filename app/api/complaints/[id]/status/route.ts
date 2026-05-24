import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  getComplaintById,
  updateComplaintStatus,
} from "@/lib/complaints/complaint-service";
import { updateComplaintStatusSchema } from "@/lib/validation/disputes";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("complaint:manage:any");
  if (user instanceof Response) return user;

  const { id } = await params;
  const existing = await getComplaintById(id);
  if (!existing) return jsonError("Not found", 404);

  try {
    const body = updateComplaintStatusSchema.parse(await req.json());
    const complaint = await updateComplaintStatus({
      complaintId: id,
      status: body.status,
      actorUserId: user.id,
      resolutionSummary: body.resolutionSummary,
    });
    return jsonOk({ complaint });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not update status", 500);
  }
}
