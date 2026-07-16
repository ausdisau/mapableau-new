import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import {
  physicalErrorResponse,
  resolvePhysicalPassport,
} from "@/lib/access-intelligence/physical/api-helpers";
import { planPhysicalVisit } from "@/lib/access-intelligence/physical/services/plan-visit";

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  passportId: z.string().optional(),
});

/**
 * Deterministic Concierge reply — works without an AI key.
 * Chat is optional; standard controls remain primary.
 */
export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid chat payload.",
          code: "VALIDATION_ERROR",
          recoveryHint: "Send a short message and optional passportId.",
        },
        { status: 400 },
      );
    }
    const passport = resolvePhysicalPassport(userId, parsed.data.passportId);
    const plan = planPhysicalVisit(passport, {
      destinationLabel: "Interview Room 3.12",
    });
    const steps =
      plan.route?.steps.map((s) => s.instruction).slice(0, 8) ??
      plan.rejectedRouteSummaries.map((r) => r.summary);
    const reply = [
      `Using passport “${passport.name}” for Harbour Civic Centre (fictional twin).`,
      `Fit status: ${plan.decision.status}.`,
      plan.decision.blockers.length
        ? `Blockers: ${plan.decision.blockers.join("; ")}`
        : "No required-feature blockers in the current twin state.",
      plan.decision.unknowns.length
        ? `Unknowns remain: ${plan.decision.unknowns.join("; ")}`
        : "No unknowns reported for matched features.",
      steps.length
        ? `Route steps:\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
        : "No eligible route under current conditions.",
      "Physical actions (lift call, door open) require separate Approval Cards — the Concierge never drives devices.",
      plan.fictionalNotice,
    ].join("\n\n");

    return Response.json({
      reply,
      decision: plan.decision,
      route: plan.route,
      capabilities: plan.availableCapabilities.filter((c) => c.enabled).slice(0, 6),
      mode: plan.mode,
      userMessageEcho: parsed.data.message.slice(0, 200),
      chatOptional: true,
    });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
