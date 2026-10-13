import type { TwinAssessment, TwinEvidence, TwinFeature, TwinIssue, TwinPlace } from "@/lib/digital-twin/types";
import { INTELLIGENCE_MIN_AGGREGATION } from "@/lib/digital-twin/constants";

export interface RegionSummary {
  region: string;
  placeCount: number;
  averageConfidence: number;
  averageAccessibilityScore: number;
}

export interface BarrierSummary {
  barrierType: string;
  count: number;
}

export interface IntelligenceReport {
  regionsWithLowConfidence: RegionSummary[];
  commonBarriers: BarrierSummary[];
  accessibleToiletInfoPercent: number;
  placesNeedingUpdatedAssessment: number;
  transportConnectionGaps: number;
  topImprovementOpportunities: string[];
  ethicsNotice: string;
}

function groupByRegion(places: TwinPlace[]): Map<string, TwinPlace[]> {
  const map = new Map<string, TwinPlace[]>();
  for (const p of places) {
    const list = map.get(p.region) ?? [];
    list.push(p);
    map.set(p.region, list);
  }
  return map;
}

export function summarizeAccessByRegion(places: TwinPlace[]): RegionSummary[] {
  const grouped = groupByRegion(places);
  const summaries: RegionSummary[] = [];
  for (const [region, regionPlaces] of grouped) {
    if (regionPlaces.length < INTELLIGENCE_MIN_AGGREGATION && places.length >= INTELLIGENCE_MIN_AGGREGATION) {
      continue;
    }
    summaries.push({
      region,
      placeCount: regionPlaces.length,
      averageConfidence:
        regionPlaces.reduce((s, p) => s + p.confidenceScore, 0) / regionPlaces.length,
      averageAccessibilityScore:
        regionPlaces.reduce((s, p) => s + p.overallAccessibilityScore, 0) / regionPlaces.length,
    });
  }
  return summaries.sort((a, b) => a.averageConfidence - b.averageConfidence);
}

export function summarizeCommonBarriers(
  features: TwinFeature[],
  issues: TwinIssue[]
): BarrierSummary[] {
  const counts = new Map<string, number>();
  for (const issue of issues) {
    if (issue.status === "open" || issue.status === "acknowledged") {
      counts.set(issue.issueType, (counts.get(issue.issueType) ?? 0) + 1);
    }
  }
  for (const f of features) {
    if (f.availability === "unavailable" || f.accessibilityLevel === "fail") {
      counts.set(f.featureType, (counts.get(f.featureType) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([barrierType, count]) => ({ barrierType, count }))
    .sort((a, b) => b.count - a.count);
}

export function summarizeConfidenceGaps(
  places: TwinPlace[],
  evidence: TwinEvidence[]
): { placeId: string; name: string; confidenceScore: number; evidenceCount: number }[] {
  return places
    .map((p) => ({
      placeId: p.id,
      name: p.name,
      confidenceScore: p.confidenceScore,
      evidenceCount: evidence.filter((e) => e.placeId === p.id).length,
    }))
    .filter((p) => p.confidenceScore < 75 || p.evidenceCount < 3)
    .sort((a, b) => a.confidenceScore - b.confidenceScore);
}

export function summarizeTransportAccessGaps(
  places: TwinPlace[],
  features: TwinFeature[]
): number {
  return places.filter((p) => {
    const transportFeatures = features.filter(
      (f) =>
        f.placeId === p.id &&
        (f.featureType === "transport_connection" || f.featureType === "lift")
    );
    return transportFeatures.some(
      (f) => f.availability === "unknown" || f.availability === "unavailable"
    );
  }).length;
}

export function summarizeAssessmentPipeline(assessments: TwinAssessment[]): {
  total: number;
  dueForReview: number;
  byTier: Record<string, number>;
} {
  const now = Date.now();
  const byTier: Record<string, number> = {};
  let dueForReview = 0;
  for (const a of assessments) {
    byTier[a.tier] = (byTier[a.tier] ?? 0) + 1;
    if (a.nextReviewDue && new Date(a.nextReviewDue).getTime() < now) {
      dueForReview += 1;
    }
  }
  return { total: assessments.length, dueForReview, byTier };
}

export function buildIntelligenceReport(input: {
  places: TwinPlace[];
  features: TwinFeature[];
  evidence: TwinEvidence[];
  issues: TwinIssue[];
  assessments: TwinAssessment[];
}): IntelligenceReport {
  const regions = summarizeAccessByRegion(input.places);
  const barriers = summarizeCommonBarriers(input.features, input.issues);
  const toiletPlaces = input.places.filter((p) => {
    const toilet = input.features.find(
      (f) => f.placeId === p.id && f.featureType === "toilet"
    );
    return toilet && toilet.availability !== "unknown";
  });
  const pipeline = summarizeAssessmentPipeline(input.assessments);

  return {
    regionsWithLowConfidence: regions.filter((r) => r.averageConfidence < 80),
    commonBarriers: barriers.slice(0, 5),
    accessibleToiletInfoPercent:
      input.places.length > 0
        ? Math.round((toiletPlaces.length / input.places.length) * 100)
        : 0,
    placesNeedingUpdatedAssessment: pipeline.dueForReview,
    transportConnectionGaps: summarizeTransportAccessGaps(input.places, input.features),
    topImprovementOpportunities: barriers.slice(0, 3).map((b) => b.barrierType),
    ethicsNotice:
      "Aggregated insights only. No individual tracking. No sale of personal disability data. Minimum aggregation thresholds apply before production reports. Lived-experience review recommended before public release.",
  };
}
