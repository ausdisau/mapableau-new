import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  canAccessDispute,
  canRespondToDispute,
} from "@/lib/disputes/access";
import {
  addProviderDisputeResponse,
  getDisputeById,
} from "@/lib/disputes/dispute-service";
import { disputeResponseSchema } from "@/lib/validation/disputes";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  const dispute = await getDisputeById(id);
  if (!dispute) return jsonError("Not found", 404);

  if (!(await canAccessDispute(user, dispute))) {
    return jsonError("Forbidden", 403);
  }
  if (!(await canRespondToDispute(user, dispute))) {
    return jsonError("You cannot respond to this dispute", 403);
  }

  try {
    const { body } = disputeResponseSchema.parse(await req.json());
    const updated = await addProviderDisputeResponse({
      disputeId: id,
      responderId: user.id,
      body,
    });
    return jsonOk({ dispute: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not save response", 500);
  }
}
