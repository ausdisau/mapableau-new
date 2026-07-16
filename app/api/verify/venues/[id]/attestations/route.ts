import { z } from "zod";

import { resolveAccessIntelligenceUser } from "@/lib/access-intelligence/api-auth";
import { recordAuditEvent } from "@/lib/access-intelligence/audit";
import { requireVenueOperateAccess } from "@/lib/access-intelligence/auth/venue-access";
import { checkEntitlementForUser } from "@/lib/access-intelligence/entitlements-billing";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { PrismaAccessIntelligenceRepository } from "@/lib/access-intelligence/prisma-repository";
import {
  getAccessIntelligenceRepository,
} from "@/lib/access-intelligence/repositories";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  featureType: z.string().min(1),
  statement: z.string().min(1),
  elementId: z.string().optional(),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

/**
 * Venue attestation — remains labelled venue_attestation, never assessor_verified.
 * When ACCESS_INTELLIGENCE_USE_PRISMA=true, persists as AiAccessFeature claim.
 */
export async function POST(request: Request, ctx: Ctx) {
  const user = await resolveAccessIntelligenceUser();
  if (user instanceof Response) return user;
  const { id: placeId } = await ctx.params;

  const entitlement = await checkEntitlementForUser({
    userId: user.id,
    roles: user.roles,
    feature: "verify_evidence_upload",
  });
  if (!entitlement.allowed) {
    return Response.json(
      { error: entitlement.reason, code: "ENTITLEMENT_REQUIRED" },
      { status: 403 },
    );
  }

  try {
    await requireVenueOperateAccess({
      user,
      placeId,
      roleHeader: request.headers.get("x-access-role"),
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 403 });
    }
    throw error;
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const elementId = parsed.data.elementId ?? `${placeId}-attestation-element`;
  let persistedClaimId: string | undefined;

  const repo = getAccessIntelligenceRepository();
  if (repo instanceof PrismaAccessIntelligenceRepository) {
    const claim = await repo.upsertVenueAttestationClaim({
      placeId,
      elementId,
      featureType: parsed.data.featureType,
      value: parsed.data.value ?? parsed.data.statement,
      notes: parsed.data.statement,
    });
    persistedClaimId = claim.id;
  }

  const attestation = {
    id: persistedClaimId ?? `attest-${Date.now()}`,
    placeId,
    elementId,
    featureType: parsed.data.featureType,
    statement: parsed.data.statement,
    sourceType: "venue_attestation" as const,
    verificationState: "venue_attested" as const,
    createdAt: new Date().toISOString(),
    createdBy: user.id,
    note: "Venue attestation — not assessor verification.",
    persisted: Boolean(persistedClaimId),
  };

  const audit = recordAuditEvent({
    actorUserId: user.id,
    action: "venue_attestation",
    purpose: "venue_operations",
    recipient: placeId,
    outcome: "executed",
    metadata: {
      attestationId: attestation.id,
      featureType: attestation.featureType,
      verificationState: attestation.verificationState,
      persisted: attestation.persisted,
    },
  });

  return Response.json({ attestation, auditId: audit.id });
}
