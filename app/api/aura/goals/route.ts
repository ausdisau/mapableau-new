import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { auraConfig } from "@/lib/aura/config";
import {
  isProhibitedAutoGoal,
} from "@/lib/aura/goals/clarification";

const createGoalSchema = z.object({
  title: z.string().min(3).max(200),
  summary: z.string().min(3).max(2000),
  source: z.enum([
    "participant",
    "delegate",
    "provider_referral",
    "system_suggested",
  ]),
  organisationId: z.string().optional().nullable(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const raw = await req.json().catch(() => null);
  const parsed = createGoalSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError("Invalid goal payload", 400);
  }
  if (parsed.data.source === "system_suggested") {
    return jsonError(
      "AURA cannot create goals for participants without an explicit invitation.",
      403
    );
  }
  if (isProhibitedAutoGoal(parsed.data.title) || isProhibitedAutoGoal(parsed.data.summary)) {
    return jsonError(
      "This topic is not permitted as an AURA goal — a human process handles it.",
      403
    );
  }
  if (!auraConfig.enabled) {
    return jsonOk({
      status: "queued",
      note: "AURA is not enabled — goal captured as a request only.",
    });
  }
  return jsonOk({ status: "draft_captured" });
}
