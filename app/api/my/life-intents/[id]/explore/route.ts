import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { personalAgencyFlags, personalAgencyDisabledResponse } from "@/lib/config/personal-agency";
import {
  getLifeIntentForPrincipal,
  recordLifeIntentExplorationSaved,
  LifeIntentError,
} from "@/lib/personal-agency/life-intent-service";

const bodySchema = z.object({
  label: z.string().min(1).max(500),
});

export async function POST(
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
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await getLifeIntentForPrincipal(id, user.id);
    await recordLifeIntentExplorationSaved({
      principalId: user.id,
      intentId: id,
      label: parsed.data.label,
    });
    return jsonOk({ saved: true });
  } catch (err) {
    if (err instanceof LifeIntentError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
