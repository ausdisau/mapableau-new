/**
 * In-memory Digital Twin service for MVP.
 * TODO: Replace with Prisma persistence (TwinPlace, TwinZone, TwinFeature, etc.)
 */

import { evaluatePlaceCompatibility } from "@/lib/digital-twin/compatibility";
import { createAuditEvent } from "@/lib/digital-twin/governance";
import {
  calculateTwinAssessment,
  recalculatePlaceScores,
} from "@/lib/digital-twin/scoring";
import {
  DEMO_ACCESS_PROFILES,
  DEMO_ASSESSMENTS,
  DEMO_EVIDENCE,
  DEMO_FEATURES,
  DEMO_ISSUES,
  DEMO_PATH_SEGMENTS,
  DEMO_PLACES,
  DEMO_ZONES,
  getAllDemoPlaceBundles,
  getDemoPlaceBundle,
  getDemoPlaceBySlug,
} from "@/lib/digital-twin/sample-data";
import type {
  AccessNeedProfile,
  ManualAccessNeeds,
  TwinAssessment,
  TwinCompatibilityResult,
  TwinEvidence,
  TwinIssue,
  TwinPlace,
  TwinPlaceBundle,
} from "@/lib/digital-twin/types";
import type { CreateTwinPlaceInput } from "@/lib/digital-twin/digital-twin-service.types";

// Mutable in-memory store (seeded from demo data)
let places: TwinPlace[] = [...DEMO_PLACES];
let zones = [...DEMO_ZONES];
let features = [...DEMO_FEATURES];
let pathSegments = [...DEMO_PATH_SEGMENTS];
let evidence: TwinEvidence[] = [...DEMO_EVIDENCE];
let assessments: TwinAssessment[] = [...DEMO_ASSESSMENTS];
let issues: TwinIssue[] = [...DEMO_ISSUES];
const pendingEvidence: TwinEvidence[] = [];
const pendingIssues: TwinIssue[] = [];

function bundleForPlace(place: TwinPlace): TwinPlaceBundle {
  const assessment =
    assessments.find((a) => a.placeId === place.id) ??
    calculateTwinAssessment(place, features, evidence);
  return {
    place,
    zones: zones.filter((z) => z.placeId === place.id),
    features: features.filter((f) => f.placeId === place.id),
    pathSegments: pathSegments.filter((p) => p.placeId === place.id),
    evidence: evidence.filter((e) => e.placeId === place.id),
    assessment,
    issues: issues.filter((i) => i.placeId === place.id),
  };
}

export function listPlaces(filters?: {
  placeType?: TwinPlace["placeType"];
  minTier?: TwinAssessment["tier"];
  hasAccessibleToilet?: boolean;
  stepFreeEntrance?: boolean;
  quietSpace?: boolean;
  transportConnection?: boolean;
}): TwinPlaceBundle[] {
  let result = places
    .filter((p) => p.status === "published")
    .map(bundleForPlace);

  if (filters?.placeType) {
    result = result.filter((b) => b.place.placeType === filters.placeType);
  }
  if (filters?.minTier) {
    const tierOrder = ["none", "bronze", "silver", "gold"];
    const minIdx = tierOrder.indexOf(filters.minTier);
    result = result.filter(
      (b) => tierOrder.indexOf(b.assessment.tier) >= minIdx
    );
  }
  if (filters?.hasAccessibleToilet) {
    result = result.filter((b) =>
      b.features.some(
        (f) =>
          f.featureType === "toilet" &&
          f.availability !== "unavailable" &&
          f.availability !== "unknown"
      )
    );
  }
  if (filters?.stepFreeEntrance) {
    result = result.filter((b) =>
      b.features.some(
        (f) =>
          f.featureType === "entrance" &&
          f.availability === "available" &&
          f.accessibilityLevel !== "fail"
      )
    );
  }
  if (filters?.quietSpace) {
    result = result.filter((b) =>
      b.features.some(
        (f) =>
          f.featureType === "acoustics" && f.availability === "available"
      )
    );
  }
  if (filters?.transportConnection) {
    result = result.filter((b) =>
      b.features.some((f) => f.featureType === "transport_connection")
    );
  }

  return result;
}

export function getPlaceById(id: string): TwinPlaceBundle | undefined {
  const place = places.find((p) => p.id === id);
  if (!place) return undefined;
  return bundleForPlace(place);
}

export function getPlaceBySlug(slug: string): TwinPlaceBundle | undefined {
  const place = places.find((p) => p.slug === slug);
  if (!place) return undefined;
  return bundleForPlace(place);
}

export function createPlace(input: CreateTwinPlaceInput): TwinPlace {
  const now = new Date().toISOString();
  const place: TwinPlace = {
    id: `twin-place-${Date.now()}`,
    name: input.name,
    slug: input.slug,
    placeType: input.placeType,
    description: input.description ?? "",
    address: input.address,
    region: input.region,
    geo: input.geo,
    privacy: input.privacy ?? "public",
    status: "draft",
    lastVerifiedAt: now,
    confidenceScore: 0,
    overallAccessibilityScore: 0,
    accessSummaryPlainLanguage: "New place — assessment pending.",
    warnings: [],
    createdAt: now,
    updatedAt: now,
    isDemoData: false,
  };
  places.push(place);
  createAuditEvent({
    eventType: "place_created",
    entityType: "TwinPlace",
    entityId: place.id,
  });
  return place;
}

export function patchPlace(
  id: string,
  patch: Partial<Pick<TwinPlace, "name" | "description" | "status" | "privacy">>
): TwinPlace | undefined {
  const idx = places.findIndex((p) => p.id === id);
  if (idx < 0) return undefined;
  places[idx] = {
    ...places[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  if (patch.status === "published") {
    createAuditEvent({
      eventType: "place_published",
      entityType: "TwinPlace",
      entityId: id,
    });
  }
  return places[idx];
}

export function getAssessment(placeId: string): TwinAssessment | undefined {
  const place = places.find((p) => p.id === placeId);
  if (!place) return undefined;
  return (
    assessments.find((a) => a.placeId === placeId) ??
    calculateTwinAssessment(place, features, evidence)
  );
}

export function recalculateAssessment(placeId: string): TwinAssessment | undefined {
  const place = places.find((p) => p.id === placeId);
  if (!place) return undefined;

  const assessment = calculateTwinAssessment(place, features, evidence);
  const idx = assessments.findIndex((a) => a.placeId === placeId);
  if (idx >= 0) assessments[idx] = assessment;
  else assessments.push(assessment);

  const scores = recalculatePlaceScores(place, features, evidence);
  const pIdx = places.findIndex((p) => p.id === placeId);
  places[pIdx] = { ...places[pIdx], ...scores, updatedAt: new Date().toISOString() };

  createAuditEvent({
    eventType: "assessment_recalculated",
    entityType: "TwinAssessment",
    entityId: assessment.id,
  });

  return assessment;
}

export function submitIssue(input: {
  placeId: string;
  featureId?: string;
  issueType: TwinIssue["issueType"];
  severity: TwinIssue["severity"];
  summary: string;
}): TwinIssue {
  const now = new Date().toISOString();
  const issue: TwinIssue = {
    id: `issue-${Date.now()}`,
    placeId: input.placeId,
    featureId: input.featureId,
    issueType: input.issueType,
    severity: input.severity,
    status: "pending_review",
    summary: input.summary,
    createdAt: now,
    updatedAt: now,
  };
  pendingIssues.push(issue);
  createAuditEvent({
    eventType: "issue_reported",
    entityType: "TwinIssue",
    entityId: issue.id,
    metadata: { severity: input.severity },
  });
  return issue;
}

export function submitEvidence(input: {
  placeId: string;
  featureId?: string;
  evidenceType: TwinEvidence["evidenceType"];
  title: string;
  summary: string;
  confidence: TwinEvidence["confidence"];
}): TwinEvidence {
  const item: TwinEvidence = {
    id: `evidence-${Date.now()}`,
    placeId: input.placeId,
    featureId: input.featureId,
    evidenceType: input.evidenceType,
    title: input.title,
    summary: input.summary,
    sourceActorType: "user",
    capturedAt: new Date().toISOString(),
    confidence: input.confidence,
    status: "pending_review",
  };
  pendingEvidence.push(item);
  createAuditEvent({
    eventType: "evidence_submitted",
    entityType: "TwinEvidence",
    entityId: item.id,
  });
  return item;
}

export function runCompatibilityCheck(input: {
  placeId: string;
  profileId?: string;
  manualNeeds?: ManualAccessNeeds;
}): TwinCompatibilityResult | undefined {
  const bundle = getPlaceById(input.placeId);
  if (!bundle) return undefined;

  let profile: AccessNeedProfile | ManualAccessNeeds;
  if (input.profileId) {
    const demo = DEMO_ACCESS_PROFILES.find((p) => p.id === input.profileId);
    if (!demo) return undefined;
    profile = demo;
  } else if (input.manualNeeds) {
    profile = input.manualNeeds;
  } else {
    return undefined;
  }

  const result = evaluatePlaceCompatibility(
    bundle.place,
    features,
    pathSegments,
    profile,
    input.profileId ?? "manual"
  );

  createAuditEvent({
    eventType: "compatibility_checked_no_persist",
    entityType: "TwinCompatibilityResult",
    entityId: bundle.place.id,
    metadata: { profileId: result.profileId, score: result.compatibilityScore },
  });

  return result;
}

export function getAdminSnapshot() {
  return {
    totalPlaces: places.length,
    publishedPlaces: places.filter((p) => p.status === "published").length,
    placesUnderReview: places.filter((p) => p.status === "under_review").length,
    pendingEvidence: pendingEvidence.length,
    openIssues: [...issues, ...pendingIssues].filter(
      (i) => i.status === "open" || i.status === "acknowledged" || i.status === "pending_review"
    ).length,
    averageConfidence:
      places.length > 0
        ? Math.round(places.reduce((s, p) => s + p.confidenceScore, 0) / places.length)
        : 0,
    averageAccessibilityScore:
      places.length > 0
        ? Math.round(places.reduce((s, p) => s + p.overallAccessibilityScore, 0) / places.length)
        : 0,
    placesNeedingReview: places.filter((p) => p.status === "under_review" || p.confidenceScore < 70),
    openHighSeverityIssues: [...issues, ...pendingIssues].filter(
      (i) =>
        (i.severity === "high" || i.severity === "urgent") &&
        i.status !== "resolved" &&
        i.status !== "closed"
    ),
    lowConfidencePlaces: places.filter((p) => p.confidenceScore < 75),
    upcomingReassessments: assessments.filter(
      (a) => a.nextReviewDue && new Date(a.nextReviewDue) < new Date(Date.now() + 90 * 86400000)
    ),
    pendingEvidenceSubmissions: pendingEvidence,
  };
}

export function getStoreSnapshot() {
  return { places, zones, features, pathSegments, evidence, assessments, issues };
}

/** Reset store to demo seed — for tests only. */
export function resetStoreForTests(): void {
  places = [...DEMO_PLACES];
  zones = [...DEMO_ZONES];
  features = [...DEMO_FEATURES];
  pathSegments = [...DEMO_PATH_SEGMENTS];
  evidence = [...DEMO_EVIDENCE];
  assessments = [...DEMO_ASSESSMENTS];
  issues = [...DEMO_ISSUES];
  pendingEvidence.length = 0;
  pendingIssues.length = 0;
}

export { getAllDemoPlaceBundles, getDemoPlaceBundle, getDemoPlaceBySlug };
