import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { ContinuityFeatureDisabledError } from "@/lib/continuity-os/mission-extension-service";
import { reportServiceFailure } from "@/lib/continuity-os/recovery-case-service";

const schema = z.object({
  missionId: z.string().min(1),
  source: z.string().min(1),
  sourceType: z.enum([
    "participant",
    "supporter",
    "worker",
    "provider",
    "transport",
    "venue",
    "equipment",
    "accessibility_ops",
    "journey_guardian",
    "civic",
    "receipt",
    "handoff",
    "navigator",
    "system",
  ]),
  service: z.string().min(1),
  observedAt: z.string().datetime(),
  evidence: z.string().optional(),
  confidence: z.enum(["low", "medium", "high"]),
  urgency: z.enum(["low", "normal", "high", "critical"]),
  publicOrPrivate: z.enum(["public", "private"]).default("private"),
  affectedDependencyId: z.string().optional(),
  verificationRequirement: z.string().min(1),
  rawSummary: z.string().min(1),
  forged: z.boolean().optional(),
  stale: z.boolean().optional(),
  essentialService: z.boolean().optional(),
  hardRequirements: z.array(z.string()).optional(),
  claimedReplacementFeatures: z.array(z.string()).optional(),
  partnerConfirmedAvailable: z.boolean().optional(),
  knownAdditionalCost: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await reportServiceFailure({
      participantId: user.id,
      actorUserId: user.id,
      missionId: parsed.data.missionId,
      forged: parsed.data.forged,
      stale: parsed.data.stale,
      essentialService: parsed.data.essentialService,
      hardRequirements: parsed.data.hardRequirements,
      claimedReplacementFeatures: parsed.data.claimedReplacementFeatures,
      partnerConfirmedAvailable: parsed.data.partnerConfirmedAvailable,
      knownAdditionalCost: parsed.data.knownAdditionalCost,
      signal: {
        source: parsed.data.source,
        sourceType: parsed.data.sourceType,
        service: parsed.data.service,
        missionId: parsed.data.missionId,
        observedAt: parsed.data.observedAt,
        receivedAt: new Date().toISOString(),
        evidence: parsed.data.evidence,
        confidence: parsed.data.confidence,
        urgency: parsed.data.urgency,
        publicOrPrivate: parsed.data.publicOrPrivate,
        affectedDependencyId: parsed.data.affectedDependencyId,
        verificationRequirement: parsed.data.verificationRequirement,
        rawSummary: parsed.data.rawSummary,
      },
    });
    return jsonOk(result, 201);
  } catch (e) {
    if (e instanceof ContinuityFeatureDisabledError) {
      return jsonError(e.message, 404);
    }
    if (e instanceof Error && /not found|stopped/i.test(e.message)) {
      return jsonError(e.message, 400);
    }
    throw e;
  }
}
