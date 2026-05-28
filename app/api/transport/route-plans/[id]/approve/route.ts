import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { closeDispatchQueueForEntity } from "@/lib/dispatch-console/dispatch-service";
import { selectRoutePlan } from "@/lib/route-optimisation/route-plan-service";

const bodySchema = z.object({
  candidateId: z.string(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("dispatch:manage");
  if (user instanceof Response) return user;

  const { id: routePlanId } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, 400);
  }

  try {
    const plan = await selectRoutePlan(
      routePlanId,
      parsed.data.candidateId,
      user.id
    );
    await closeDispatchQueueForEntity("RoutePlan", routePlanId);
    return jsonOk({ plan });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    throw e;
  }
}
