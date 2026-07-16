import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import {
  assertPathwayAllowsEvidenceType,
  contributionMustNotAffectConfidence,
  permittedEvidenceTypes,
  validateMapperDraft,
  type MapperPathwayLevel,
} from "@/lib/access-intelligence/mapper-kit";

export async function POST(request: Request) {
  if (!accessIntelligenceFlags.mapperFieldKit) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  const body = await request.json().catch(() => ({}));
  const level = (body.pathwayLevel ?? "new_contributor") as MapperPathwayLevel;
  const evidenceType = String(body.evidenceType ?? "community_observation");

  if (
    accessIntelligenceFlags.contributorPathway &&
    body.enforcePathway === true
  ) {
    try {
      assertPathwayAllowsEvidenceType(level, evidenceType);
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "Pathway denied" },
        { status: 403 },
      );
    }
  }

  const validation = validateMapperDraft(
    level,
    body.payload ?? {
      elementType: "entrance",
      observedVsEstimated: "observed",
      imageConsent: false,
    },
    evidenceType,
  );
  const confidence = contributionMustNotAffectConfidence({
    baseConfidence: Number(body.baseConfidence ?? 0.55),
    contributionPoints: Number(body.contributionPoints ?? 0),
    badges: Number(body.badges ?? 0),
  });
  return Response.json({
    ok: validation.ok,
    validation,
    permittedEvidenceTypes: permittedEvidenceTypes(level),
    confidence,
    contributorPathwayEnabled: accessIntelligenceFlags.contributorPathway,
    actorUserId: userId,
  });
}
