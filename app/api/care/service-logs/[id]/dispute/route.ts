import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { disputeServiceLog } from "@/lib/care/care-service-log-service";
import { disputeServiceLogSchema } from "@/lib/validation/care";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const parsed = disputeServiceLogSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { id } = await params;
  const serviceLog = await disputeServiceLog({
    serviceLogId: id,
    participantId: user.id,
    reason: parsed.data.reason,
  });
  return jsonOk({ serviceLog });
}
import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { disputeServiceLog } from "@/lib/care/care-service-log-service";
import { disputeServiceLogSchema } from "@/lib/validation/care";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const { id } = await params;

  try {
    const parsed = disputeServiceLogSchema.parse(await req.json());
    const serviceLog = await disputeServiceLog({
      serviceLogId: id,
      participantId: user.id,
      reason: parsed.reason,
    });
    return jsonOk({ serviceLog });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    if (error instanceof Error && error.message === "SERVICE_LOG_NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    return jsonError("Dispute failed", 500);
  }
}
