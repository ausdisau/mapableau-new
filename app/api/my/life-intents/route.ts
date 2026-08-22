import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { personalAgencyFlags, personalAgencyDisabledResponse } from "@/lib/config/personal-agency";
import {
  createLifeIntent,
  listLifeIntentsForPrincipal,
  LifeIntentError,
} from "@/lib/personal-agency/life-intent-service";

const createSchema = z.object({
  originalExpression: z.string().min(1).max(4000),
  status: z
    .enum(["EXPLORING", "PLANNING", "ACTIVE", "PAUSED", "COMPLETED"])
    .optional(),
});

export async function GET() {
  if (!personalAgencyFlags.lifeIntentsEnabled) {
    return personalAgencyDisabledResponse("MAPABLE_LIFE_INTENTS");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const intents = await listLifeIntentsForPrincipal(user.id);
  return jsonOk({ intents });
}

export async function POST(req: Request) {
  if (!personalAgencyFlags.lifeIntentsEnabled) {
    return personalAgencyDisabledResponse("MAPABLE_LIFE_INTENTS");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const intent = await createLifeIntent({
      principalId: user.id,
      originalExpression: parsed.data.originalExpression,
      status: parsed.data.status,
    });
    return jsonOk({ id: intent.id, intent });
  } catch (err) {
    if (err instanceof LifeIntentError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
