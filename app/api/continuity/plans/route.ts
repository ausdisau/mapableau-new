import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  approveRecoveryPlan,
  cancelRecoveryPlan,
  draftRecoveryPlan,
  simulateRecoveryPlan,
} from "@/lib/continuity/recovery/plan-service";

export const dynamic = "force-dynamic";

const stepSchema = z.object({
  kind: z.enum([
    "notify_participant",
    "notify_delegate",
    "notify_provider",
    "request_consent",
    "request_approval",
    "create_substitute_booking",
    "reschedule_existing",
    "reserve_capacity",
    "cancel_with_approval",
    "update_goal_preserving_note",
    "handoff_to_human",
    "wait_for_signal",
    "observe_outcome",
    "compensating_action",
    "no_op",
  ]),
  narrative: z.string().min(1),
  detailsJson: z.record(z.string(), z.unknown()).optional(),
  compensationJson: z.record(z.string(), z.unknown()).optional(),
});

const draftSchema = z.object({
  action: z.literal("draft").default("draft"),
  caseId: z.string(),
  selectedOptionId: z.string().optional(),
  narrative: z.string().optional(),
  steps: z.array(stepSchema).min(1),
});

const opSchema = z.object({
  action: z.enum(["simulate", "approve", "cancel"]),
  planId: z.string(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const raw = await req.json().catch(() => null);
  if (raw && raw.action && raw.action !== "draft") {
    const parsed = opSchema.safeParse(raw);
    if (!parsed.success) return jsonError("Invalid plan op payload", 400);
    try {
      if (parsed.data.action === "simulate") {
        const p = await simulateRecoveryPlan(parsed.data.planId);
        return jsonOk({ plan: p });
      }
      if (parsed.data.action === "approve") {
        const p = await approveRecoveryPlan(parsed.data.planId, user.id);
        return jsonOk({ plan: p });
      }
      if (parsed.data.action === "cancel") {
        const p = await cancelRecoveryPlan(parsed.data.planId, user.id);
        return jsonOk({ plan: p });
      }
    } catch (err) {
      return jsonError((err as Error).message ?? "PLAN_OP_ERROR", 400);
    }
  }
  const parsed = draftSchema.safeParse(raw);
  if (!parsed.success) return jsonError("Invalid draft plan payload", 400);
  try {
    const plan = await draftRecoveryPlan({
      caseId: parsed.data.caseId,
      selectedOptionId: parsed.data.selectedOptionId,
      narrative: parsed.data.narrative,
      steps: parsed.data.steps,
      createdById: user.id,
    });
    return jsonOk({ plan }, 201);
  } catch (err) {
    return jsonError((err as Error).message ?? "DRAFT_ERROR", 400);
  }
}
