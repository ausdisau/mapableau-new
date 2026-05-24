import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createEvacuationPlan,
  listEvacuationPlans,
} from "@/lib/emergency/evacuation-service";
import { evacuationPlanSchema } from "@/lib/validation/emergency";

export async function GET() {
  const user = await requireApiPermission("emergency:read:self");
  if (user instanceof Response) return user;
  const plans = await listEvacuationPlans(user.id);
  return jsonOk({ plans });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("emergency:manage:self");
  if (user instanceof Response) return user;
  try {
    const parsed = evacuationPlanSchema.parse(await req.json());
    const plan = await createEvacuationPlan(user.id, parsed, user.id);
    return jsonOk({ plan }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Create failed", 500);
  }
}
