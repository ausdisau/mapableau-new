import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { recordOutcome } from "@/lib/continuity/outcomes/outcome-service";

export const dynamic = "force-dynamic";

const schema = z.object({
  caseId: z.string(),
  signal: z.enum([
    "goal_preserved",
    "goal_partially_preserved",
    "goal_missed",
    "participant_declined_all_options",
    "no_safe_option_available",
    "human_escalated",
    "unknown",
  ]),
  narrative: z.string().optional(),
  detailsJson: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return jsonError("Invalid outcome payload", 400);
  try {
    const outcome = await recordOutcome({
      ...parsed.data,
      observedById: user.id,
    });
    return jsonOk({ outcome }, 201);
  } catch (err) {
    return jsonError((err as Error).message ?? "OUTCOME_ERROR", 400);
  }
}
