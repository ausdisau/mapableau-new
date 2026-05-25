import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import type { Prisma } from "@prisma/client";

import { submitHomeVisitRiskCheck } from "@/lib/moves/rehab-plan-service";
import { homeVisitRiskCheckSchema } from "@/lib/validation/moves";

type Params = { params: Promise<{ appointmentId: string }> };

export async function POST(req: Request, { params }: Params) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { appointmentId } = await params;
  try {
    const parsed = homeVisitRiskCheckSchema.parse(await req.json());
    const check = await submitHomeVisitRiskCheck({
      therapyAppointmentId: appointmentId,
      actorUserId: user.id,
      checklist: parsed as Prisma.InputJsonValue,
    });
    return jsonOk({ check });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "NOT_HOME_VISIT") {
      return jsonError("Risk check only applies to home visits", 400);
    }
    return jsonError("Risk check failed", 500);
  }
}
