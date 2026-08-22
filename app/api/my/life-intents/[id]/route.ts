import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { personalAgencyFlags, personalAgencyDisabledResponse } from "@/lib/config/personal-agency";
import {
  getLifeIntentForPrincipal,
  updateLifeIntent,
  LifeIntentError,
} from "@/lib/personal-agency/life-intent-service";

const patchSchema = z.object({
  status: z
    .enum(["EXPLORING", "PLANNING", "ACTIVE", "PAUSED", "COMPLETED"])
    .optional(),
  originalExpression: z.string().min(1).max(4000).optional(),
  desiredOutcomes: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!personalAgencyFlags.lifeIntentsEnabled) {
    return personalAgencyDisabledResponse("MAPABLE_LIFE_INTENTS");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await ctx.params;

  try {
    const intent = await getLifeIntentForPrincipal(id, user.id);
    return jsonOk({ intent });
  } catch (err) {
    if (err instanceof LifeIntentError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!personalAgencyFlags.lifeIntentsEnabled) {
    return personalAgencyDisabledResponse("MAPABLE_LIFE_INTENTS");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await ctx.params;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const intent = await updateLifeIntent({
      id,
      principalId: user.id,
      ...parsed.data,
    });
    return jsonOk({ intent });
  } catch (err) {
    if (err instanceof LifeIntentError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
