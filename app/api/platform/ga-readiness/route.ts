import { ZodError, z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { recordExecutiveGaDecision } from "@/lib/production-readiness/executive-decision";
import { upsertGaAssessment } from "@/lib/production-readiness/ga-assessment";

const scorecardSchema = z.object({
  assurance: z.object({
    ready: z.boolean(),
    score: z.number().min(0).max(100),
    blockers: z.array(z.string()).default([]),
  }),
  operationalHealth: z.object({
    availability: z.number().nullable(),
    errorBudgetBurn: z.number().nullable(),
  }),
  entitlementsConfigured: z.boolean(),
  policiesConfigured: z.boolean(),
  incidentsOpen: z.number().min(0),
  outstandingSecurityFindings: z.number().min(0),
  outstandingComplaints: z.number().min(0),
});

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("assess"),
    organisationId: z.string().min(1),
    scorecard: scorecardSchema,
    aiAssistanceSummary: z.string().max(2000).optional(),
  }),
  z.object({
    action: z.literal("executive-decision"),
    assessmentId: z.string().min(1),
    decision: z.enum(["approved", "withdrawn"]),
    decisionText: z.string().min(40).max(2000),
  }),
]);

export async function GET() {
  const user = await requireApiPermission("platform:ga:read");
  if (user instanceof Response) return user;
  const assessments = await prisma.generalAvailabilityAssessment.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: { organisation: { select: { id: true, name: true } } },
  });
  return jsonOk({
    assessments,
    disclaimer:
      "GA assessments are advisory until a named executive approves. AI cannot approve GA.",
  });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("platform:ga:decide");
  if (user instanceof Response) return user;
  try {
    const input = actionSchema.parse(await req.json());
    if (input.action === "assess") {
      const r = await upsertGaAssessment({
        organisationId: input.organisationId,
        scorecard: input.scorecard,
        aiAssistanceSummary: input.aiAssistanceSummary,
      });
      return jsonOk({ assessment: r }, 201);
    }
    const r = await recordExecutiveGaDecision({
      assessmentId: input.assessmentId,
      executiveUserId: user.id,
      decision: input.decision,
      decisionText: input.decisionText,
    });
    return jsonOk({ assessment: r });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError((e as Error).message ?? "Action failed", 400);
  }
}
