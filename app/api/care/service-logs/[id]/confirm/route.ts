import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { confirmServiceLog } from "@/lib/care/care-service-log-service";
import { confirmServiceLogSchema } from "@/lib/validation/care";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const parsed = confirmServiceLogSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { id } = await params;
  const serviceLog = await confirmServiceLog({
    serviceLogId: id,
    participantId: user.id,
    notes: parsed.data.notes,
  });
  return jsonOk({ serviceLog });
}
import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { confirmServiceLog } from "@/lib/care/care-service-log-service";
import { confirmServiceLogSchema } from "@/lib/validation/care";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const { id } = await params;

  try {
    const parsed = confirmServiceLogSchema.parse(await req.json());
    const serviceLog = await confirmServiceLog({
      serviceLogId: id,
      participantId: user.id,
      feedback: parsed.feedback,
    });
    return jsonOk({ serviceLog });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    if (error instanceof Error && error.message === "SERVICE_LOG_NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    return jsonError("Confirm failed", 500);
  }
}
