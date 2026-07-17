import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  createStandingInstruction,
  revokeStandingInstruction,
} from "@/lib/continuity/profile/standing-instruction-service";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  action: z.literal("create").default("create"),
  profileId: z.string(),
  scope: z.enum([
    "care",
    "transport",
    "appointment_non_clinical",
    "employment",
    "housing",
    "finance_recovery",
    "provider_failure",
    "civic_disruption",
    "general",
  ]),
  title: z.string().min(1),
  instructions: z.object({
    allowedActionSlugs: z.array(z.string()),
    prohibitedActionSlugs: z.array(z.string()).optional(),
    narrative: z.string().optional(),
    requiresParticipantConfirmationAtExecution: z.boolean().optional(),
    requiresDelegateConfirmationAtExecution: z.boolean().optional(),
    maxAutoApprovalRiskTier: z.enum(["low_readonly", "medium_reversible", "high_irreversible"]).optional(),
  }),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
  authorSource: z.enum([
    "participant_self",
    "authorised_delegate",
    "coordinator_confirmed_with_participant",
  ]),
});

const revokeSchema = z.object({
  action: z.literal("revoke"),
  instructionId: z.string(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const raw = await req.json().catch(() => null);
  if (raw && raw.action === "revoke") {
    const parsed = revokeSchema.safeParse(raw);
    if (!parsed.success) return jsonError("Invalid revoke payload", 400);
    try {
      const inst = await revokeStandingInstruction(parsed.data.instructionId, user.id);
      return jsonOk({ instruction: inst });
    } catch (err) {
      return jsonError((err as Error).message ?? "REVOKE_ERROR", 400);
    }
  }
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return jsonError("Invalid standing instruction payload", 400);
  try {
    const inst = await createStandingInstruction({
      profileId: parsed.data.profileId,
      scope: parsed.data.scope,
      title: parsed.data.title,
      instructions: parsed.data.instructions,
      effectiveFrom: parsed.data.effectiveFrom ? new Date(parsed.data.effectiveFrom) : undefined,
      effectiveTo: parsed.data.effectiveTo ? new Date(parsed.data.effectiveTo) : undefined,
      createdById: user.id,
      authorSource: parsed.data.authorSource,
    });
    return jsonOk({ instruction: inst }, 201);
  } catch (err) {
    return jsonError((err as Error).message ?? "CREATE_ERROR", 400);
  }
}
