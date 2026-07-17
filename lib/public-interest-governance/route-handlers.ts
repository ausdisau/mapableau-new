import type { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  requireApiPermission,
  requireApiSession,
} from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  addParticipantAppealEvidence,
  assignAdminAppealReviewer,
  assessAdminGovernedSystem,
  createAdminAppealRemedy,
  createAdminGovernedSystem,
  createSubmittedCommunityRecommendation,
  decideAdminAppeal,
  getParticipantAppeal,
  getParticipantDecision,
  getPublicRegisterSystem,
  listAdminAppeals,
  listAdminGovernedSystems,
  listParticipantAppeals,
  listParticipantDecisions,
  listPublicCommunityRecommendations,
  listPublicRegisterSystems,
  publishAdminRegisterEntry,
  respondAdminCommunityRecommendation,
  submitParticipantDecisionAppeal,
  suspendAdminGovernedSystem,
  withdrawParticipantAppeal,
} from "@/lib/public-interest-governance/governance-service";

type IdParam = { params: Promise<{ id: string }> };

const governedSystemTypeSchema = z.enum([
  "deterministic_rule",
  "ranking",
  "recommendation",
  "predictive_model",
  "generative_model",
  "optimisation",
  "matching",
  "moderation",
  "fraud_or_anomaly_detection",
  "identity_or_credential",
  "access_control",
  "workflow_automation",
  "reporting",
  "other",
]);

const decisionImpactSchema = z.enum([
  "informational",
  "low",
  "moderate",
  "high",
  "rights_affecting",
  "safety_relevant",
  "financial",
  "legally_significant",
  "prohibited_for_automation",
]);

const appealGroundSchema = z.enum([
  "factual_error",
  "process_unfair",
  "discrimination",
  "accessibility_barrier",
  "consent_misuse",
  "incorrect_evidence",
  "disproportionate_effect",
  "human_oversight_absent",
  "other",
]);

const remedyActionSchema = z.enum([
  "reverse_decision",
  "vary_decision",
  "republish_corrected",
  "restore_access",
  "notify_downstream",
  "apologise",
  "retrain_process",
  "other",
]);

const adminScopeSchema = z.object({
  tenantId: z.string().min(1).optional(),
  scope: z.enum(["tenant", "national"]).optional(),
});

const createSystemSchema = z.object({
  systemKey: z.string().min(3).max(160),
  displayName: z.string().min(1).max(200),
  systemType: governedSystemTypeSchema,
  tenantId: z.string().min(1).optional(),
  ownerUserId: z.string().min(1).optional(),
  ownerTeam: z.string().min(1).max(200),
  businessPurpose: z.string().min(1),
  affectedPeopleSummary: z.string().min(1),
  decisionRole: z.string().min(1),
  actionRiskCeiling: decisionImpactSchema,
  prohibitedUses: z.array(z.string().min(1)).default([]),
  knownLimitations: z.string().min(1),
  incidentContact: z.string().min(3).max(320),
  legacyAlgorithmId: z.string().min(1).optional(),
  scope: z.enum(["tenant", "national"]).optional(),
});

const appealSchema = z.object({
  advocateUserId: z.string().min(1).optional(),
  nonRetaliationAcknowledged: z.literal(true),
  lateSubmissionReason: z.string().max(2000).optional(),
  grounds: z
    .array(
      z.object({
        groundType: appealGroundSchema,
        narrative: z.string().min(1).max(5000),
      }),
    )
    .min(1),
  submissionBody: z.string().min(1).max(10000),
  accessibleFormat: z.string().max(1000).optional(),
});

const evidenceSchema = z.object({
  body: z.string().min(1).max(10000),
  accessibleFormat: z.string().max(1000).optional(),
});

const assessSchema = z.object({
  summary: z.string().min(1),
  rightsImpacts: z.unknown().default({}),
  residualRisks: z.unknown().default({}),
  evidenceRefs: z.unknown().optional(),
  approve: z.boolean().optional(),
});

const publishSchema = z.object({
  entryId: z.string().min(1).optional(),
  impact: decisionImpactSchema,
});

const suspendSchema = z.object({
  reason: z.string().min(1).max(5000),
});

const assignSchema = z.object({
  reviewerUserId: z.string().min(1),
  conflictChecked: z.literal(true),
  conflictFound: z.boolean().optional(),
});

const decideSchema = z.object({
  reviewId: z.string().min(1).optional(),
  finding: z.string().min(1).max(5000),
  outcome: z.enum(["uphold", "overturn", "vary", "remit"]),
  rationale: z.string().min(1).max(10000),
});

const remedySchema = z.object({
  actionType: remedyActionSchema,
  description: z.string().min(1).max(5000),
  downstreamRefs: z.unknown().optional(),
});

const communityRecommendationSchema = z.object({
  panelId: z.string().min(1).optional(),
  bodyId: z.string().min(1).optional(),
  title: z.string().min(1).max(200),
  recommendation: z.string().min(1).max(10000),
  bindingAuthority: z.boolean().optional(),
  minorityView: z.string().max(5000).optional(),
});

const communityResponseSchema = z.object({
  responseBody: z.string().min(1).max(10000),
});

function idempotencyKey(request: Request): string | null {
  return (
    request.headers.get("idempotency-key") ??
    request.headers.get("x-idempotency-key")
  );
}

function withWriteMeta<T extends Record<string, unknown>>(
  request: Request,
  data: T,
) {
  return { ...data, idempotencyKey: idempotencyKey(request) };
}

function safeError(error: unknown, fallback = "Request failed") {
  const message = error instanceof Error ? error.message : fallback;
  const status = message.includes("NOT_FOUND") ? 404 : 400;
  return jsonError(message, status);
}

function assertAdminScope(query: { tenantId?: string; scope?: string }) {
  return {
    tenantId: query.tenantId,
    nationalScope: query.scope === "national",
    valid: Boolean(query.tenantId || query.scope === "national"),
  };
}

export async function getPublicSystemsRoute(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "100");
  const systems = await listPublicRegisterSystems(
    Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 100,
  );
  return jsonOk({ systems });
}

export async function getPublicSystemRoute(
  _request: Request,
  { params }: IdParam,
) {
  const { id } = await params;
  const system = await getPublicRegisterSystem(id);
  if (!system) return jsonError("System not found", 404);
  return jsonOk({ system });
}

export async function getParticipantDecisionsRoute(request: Request) {
  const user = await requireApiPermission("governance:decision:read:self");
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const decisions = await listParticipantDecisions({
    participantUserId: user.id,
    tenantId: url.searchParams.get("tenantId") ?? undefined,
  });
  return jsonOk({ decisions });
}

export async function getParticipantDecisionRoute(
  _request: Request,
  { params }: IdParam,
) {
  const user = await requireApiPermission("governance:decision:read:self");
  if (user instanceof Response) return user;
  const { id } = await params;
  const decision = await getParticipantDecision({
    decisionId: id,
    participantUserId: user.id,
  });
  if (!decision) return jsonError("Decision not found", 404);
  return jsonOk({ decision });
}

export async function postParticipantAppealRoute(
  request: Request,
  { params }: IdParam,
) {
  const user = await requireApiPermission("governance:appeal:create");
  if (user instanceof Response) return user;
  const parsed = appealSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { id } = await params;
  try {
    const appeal = await submitParticipantDecisionAppeal({
      decisionId: id,
      participantUserId: user.id,
      ...parsed.data,
    });
    return jsonOk(withWriteMeta(request, { appeal }), 201);
  } catch (error) {
    return safeError(error, "Appeal submission failed");
  }
}

export async function getParticipantAppealsRoute(request: Request) {
  const user = await requireApiPermission("governance:appeal:read:self");
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const appeals = await listParticipantAppeals({
    participantUserId: user.id,
    tenantId: url.searchParams.get("tenantId") ?? undefined,
  });
  return jsonOk({ appeals });
}

export async function getParticipantAppealRoute(
  _request: Request,
  { params }: IdParam,
) {
  const user = await requireApiPermission("governance:appeal:read:self");
  if (user instanceof Response) return user;
  const { id } = await params;
  const appeal = await getParticipantAppeal({
    appealId: id,
    participantUserId: user.id,
  });
  if (!appeal) return jsonError("Appeal not found", 404);
  return jsonOk({ appeal });
}

export async function postParticipantAppealEvidenceRoute(
  request: Request,
  { params }: IdParam,
) {
  const user = await requireApiPermission("governance:appeal:evidence:self");
  if (user instanceof Response) return user;
  const parsed = evidenceSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { id } = await params;
  try {
    const evidence = await addParticipantAppealEvidence({
      appealId: id,
      participantUserId: user.id,
      ...parsed.data,
    });
    return jsonOk(
      withWriteMeta(request, {
        evidence: {
          id: evidence.id,
          kind: evidence.kind,
          createdAt: evidence.createdAt,
        },
      }),
      201,
    );
  } catch (error) {
    return safeError(error, "Evidence submission failed");
  }
}

export async function postParticipantAppealWithdrawRoute(
  request: Request,
  { params }: IdParam,
) {
  const user = await requireApiPermission("governance:appeal:withdraw:self");
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const appeal = await withdrawParticipantAppeal({
      appealId: id,
      participantUserId: user.id,
    });
    return jsonOk(
      withWriteMeta(request, {
        appeal: { id: appeal.id, status: appeal.status },
      }),
    );
  } catch (error) {
    return safeError(error, "Appeal withdrawal failed");
  }
}

export async function getAdminSystemsRoute(request: Request) {
  const user = await requireApiPermission("governance:system:manage");
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const parsed = adminScopeSchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const scope = assertAdminScope(parsed.data);
  if (!scope.valid)
    return jsonError("tenantId or scope=national required", 400);
  const systems = await listAdminGovernedSystems(scope);
  return jsonOk({
    systems,
    scope: scope.nationalScope ? "national" : "tenant",
  });
}

export async function postAdminSystemsRoute(request: Request) {
  const user = await requireApiPermission("governance:system:manage");
  if (user instanceof Response) return user;
  const parsed = createSystemSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const scope = assertAdminScope(parsed.data);
  if (!scope.valid)
    return jsonError("tenantId or scope=national required", 400);
  try {
    const { scope: _scope, ...systemInput } = parsed.data;
    const system = await createAdminGovernedSystem({
      ...systemInput,
      prohibitedUses: parsed.data.prohibitedUses,
    });
    return jsonOk(withWriteMeta(request, { system }), 201);
  } catch (error) {
    return safeError(error, "System creation failed");
  }
}

export async function postAdminSystemAssessRoute(
  request: Request,
  { params }: IdParam,
) {
  const user = await requireApiPermission("governance:system:assess");
  if (user instanceof Response) return user;
  const parsed = assessSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { id } = await params;
  try {
    const assessment = await assessAdminGovernedSystem({
      systemId: id,
      assessorId: user.id,
      ...parsed.data,
      rightsImpacts: parsed.data.rightsImpacts as Prisma.InputJsonValue,
      residualRisks: parsed.data.residualRisks as Prisma.InputJsonValue,
      evidenceRefs: parsed.data.evidenceRefs as
        | Prisma.InputJsonValue
        | undefined,
    });
    return jsonOk(withWriteMeta(request, { assessment }), 201);
  } catch (error) {
    return safeError(error, "Assessment failed");
  }
}

export async function postAdminSystemPublishRoute(
  request: Request,
  { params }: IdParam,
) {
  const user = await requireApiPermission("governance:system:publish");
  if (user instanceof Response) return user;
  const parsed = publishSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { id } = await params;
  try {
    const publication = await publishAdminRegisterEntry({
      systemId: id,
      ...parsed.data,
    });
    return jsonOk(withWriteMeta(request, { publication }));
  } catch (error) {
    return safeError(error, "Publication failed");
  }
}

export async function postAdminSystemSuspendRoute(
  request: Request,
  { params }: IdParam,
) {
  const user = await requireApiPermission("governance:system:suspend");
  if (user instanceof Response) return user;
  const parsed = suspendSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { id } = await params;
  try {
    const system = await suspendAdminGovernedSystem({
      systemId: id,
      reason: parsed.data.reason,
    });
    return jsonOk(withWriteMeta(request, { system }));
  } catch (error) {
    return safeError(error, "Suspension failed");
  }
}

export async function getAdminAppealsRoute(request: Request) {
  const user = await requireApiPermission("governance:appeal:read");
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const parsed = adminScopeSchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const scope = assertAdminScope(parsed.data);
  if (!scope.valid)
    return jsonError("tenantId or scope=national required", 400);
  const appeals = await listAdminAppeals(scope);
  return jsonOk({
    appeals,
    scope: scope.nationalScope ? "national" : "tenant",
  });
}

export async function postAdminAppealAssignRoute(
  request: Request,
  { params }: IdParam,
) {
  const user = await requireApiPermission("governance:appeal:assign");
  if (user instanceof Response) return user;
  const parsed = assignSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { id } = await params;
  try {
    const review = await assignAdminAppealReviewer({
      appealId: id,
      ...parsed.data,
    });
    return jsonOk(withWriteMeta(request, { review }), 201);
  } catch (error) {
    return safeError(error, "Reviewer assignment failed");
  }
}

export async function postAdminAppealDecideRoute(
  request: Request,
  { params }: IdParam,
) {
  const user = await requireApiPermission("governance:appeal:decide");
  if (user instanceof Response) return user;
  const parsed = decideSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { id } = await params;
  try {
    const decision = await decideAdminAppeal({
      appealId: id,
      reviewerUserId: user.id,
      ...parsed.data,
    });
    return jsonOk(withWriteMeta(request, { decision }));
  } catch (error) {
    return safeError(error, "Appeal decision failed");
  }
}

export async function postAdminAppealRemedyRoute(
  request: Request,
  { params }: IdParam,
) {
  const user = await requireApiPermission("governance:appeal:remedy");
  if (user instanceof Response) return user;
  const parsed = remedySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { id } = await params;
  try {
    const remedy = await createAdminAppealRemedy({
      appealId: id,
      ...parsed.data,
      downstreamRefs: parsed.data.downstreamRefs as
        | Prisma.InputJsonValue
        | undefined,
    });
    return jsonOk(withWriteMeta(request, { remedy }), 201);
  } catch (error) {
    return safeError(error, "Remedy creation failed");
  }
}

export async function getCommunityGovernanceRoute() {
  const recommendations = await listPublicCommunityRecommendations();
  return jsonOk({ recommendations });
}

export async function postCommunityRecommendationRoute(request: Request) {
  const user = await requireApiPermission("governance:community:recommend");
  if (user instanceof Response) return user;
  const parsed = communityRecommendationSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const recommendation = await createSubmittedCommunityRecommendation(
      parsed.data,
    );
    return jsonOk(withWriteMeta(request, { recommendation }), 201);
  } catch (error) {
    return safeError(error, "Recommendation submission failed");
  }
}

export async function postAdminCommunityRespondRoute(
  request: Request,
  { params }: IdParam,
) {
  const user = await requireApiPermission("governance:community:respond");
  if (user instanceof Response) return user;
  const parsed = communityResponseSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { id } = await params;
  try {
    const response = await respondAdminCommunityRecommendation({
      recommendationId: id,
      responderId: user.id,
      responseBody: parsed.data.responseBody,
    });
    return jsonOk(withWriteMeta(request, { response }), 201);
  } catch (error) {
    return safeError(error, "Community response failed");
  }
}

export async function requireGovernanceSessionRoute() {
  const user = await requireApiSession();
  return user instanceof Response ? user : jsonOk({ ok: true });
}
