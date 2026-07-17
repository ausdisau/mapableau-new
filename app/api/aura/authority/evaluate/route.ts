import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  evaluateAuthority,
  type EvaluationAction,
  type EvaluationContext,
  type EvaluationEnvelope,
} from "@/lib/aura/authority/evaluate";

/**
 * POST /api/aura/authority/evaluate — trusted callers pass a pre-hydrated
 * envelope + action snapshot and this endpoint returns the AURA verdict.
 * The endpoint is stateless and does not mutate anything.
 */

const schema = z.object({
  envelope: z.any().optional().nullable(),
  action: z.any(),
  context: z.any(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return jsonError("Invalid payload", 400);
  }
  const verdict = evaluateAuthority(
    (parsed.data.envelope ?? null) as EvaluationEnvelope | null,
    parsed.data.action as EvaluationAction,
    parsed.data.context as EvaluationContext
  );
  return jsonOk({ verdict });
}
