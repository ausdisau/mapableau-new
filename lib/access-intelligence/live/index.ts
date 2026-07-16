import { isDemoMode } from "@/lib/access-intelligence/configuration";
import { DemoLiveStatusAdapter } from "@/lib/access-intelligence/live/demo-adapter";
import { HttpBmsLiveStatusAdapter } from "@/lib/access-intelligence/live/http-bms-adapter";
import type {
  LiveFeedStatus,
  LiveStatusAdapter,
  LiveStatusObservation,
  LiveStatusQuery,
  ResolvedLiveStatus,
} from "@/lib/access-intelligence/live/types";
import { feedKeyForSubject } from "@/lib/access-intelligence/live/types";
import { getLivingPersistence } from "@/lib/access-intelligence/persistence";
import { getAccessIntelligenceRepository } from "@/lib/access-intelligence/repositories";

export function getLiveStatusAdapters(): LiveStatusAdapter[] {
  const adapters: LiveStatusAdapter[] = [];

  const bmsUrl = process.env.ACCESS_INTELLIGENCE_BMS_URL?.trim();
  if (bmsUrl) {
    adapters.push(
      new HttpBmsLiveStatusAdapter({
        baseUrl: bmsUrl,
        apiKey: process.env.ACCESS_INTELLIGENCE_BMS_API_KEY,
      }),
    );
  }

  if (isDemoMode() || adapters.length === 0) {
    adapters.push(new DemoLiveStatusAdapter());
  }

  return adapters;
}

/**
 * Resolve live status with cascade:
 * 1. Live adapters (HTTP BMS → demo)
 * 2. Last-known snapshot (AiLiveStatusSnapshot / memory)
 * 3. Last-known evidence / active incident on the subject
 * 4. unavailable
 */
export async function resolveLiveStatus(query: LiveStatusQuery): Promise<ResolvedLiveStatus> {
  const adapters = getLiveStatusAdapters();

  for (const adapter of adapters) {
    const rows = await adapter.fetchObservations(query);
    const match = pickBest(rows, query);
    if (match) {
      const persistence = getLivingPersistence();
      await persistence.saveLiveSnapshot({
        placeId: match.placeId,
        elementId: match.subjectKind === "element" ? match.subjectId : undefined,
        feedKey: feedKeyForSubject(match.subjectKind, match.subjectId),
        statusPayload: {
          status: match.status,
          summary: match.summary,
          confidence: match.confidence,
          subjectKind: match.subjectKind,
          subjectId: match.subjectId,
          sourceId: match.sourceId,
          payload: match.payload,
        },
        sourceType: match.sourceKind,
        observedAt: match.observedAt,
      });
      return {
        observation: match,
        resolution: "live",
        reason: `Live observation from ${adapter.id}`,
      };
    }
  }

  const snapshotFallback = await fallBackToSnapshot(query);
  if (snapshotFallback) return snapshotFallback;

  const evidenceFallback = await fallBackToEvidence(query);
  if (evidenceFallback) return evidenceFallback;

  return {
    observation: null,
    resolution: "unavailable",
    reason: "No live feed, snapshot, or related evidence available",
  };
}

function pickBest(
  rows: LiveStatusObservation[],
  query: LiveStatusQuery,
): LiveStatusObservation | null {
  const filtered = rows.filter((row) => {
    if (row.placeId !== query.placeId) return false;
    if (query.subjectKind && row.subjectKind !== query.subjectKind) return false;
    if (query.subjectId && row.subjectId !== query.subjectId) return false;
    return true;
  });
  if (filtered.length === 0) return null;
  return filtered.sort((a, b) => b.confidence - a.confidence)[0] ?? null;
}

async function fallBackToSnapshot(query: LiveStatusQuery): Promise<ResolvedLiveStatus | null> {
  const persistence = getLivingPersistence();

  if (query.subjectKind && query.subjectId) {
    const snapshot = await persistence.getLiveSnapshot(
      query.placeId,
      feedKeyForSubject(query.subjectKind, query.subjectId),
    );
    if (snapshot) return observationFromSnapshot(snapshot);
  }

  const all = await persistence.listLiveSnapshots(query.placeId);
  const filtered = all.filter((s) => {
    const payload = s.statusPayload;
    if (query.subjectId && payload.subjectId !== query.subjectId) return false;
    if (query.subjectKind && payload.subjectKind !== query.subjectKind) return false;
    return true;
  });
  if (filtered.length === 0) return null;
  const latest = filtered.sort(
    (a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime(),
  )[0];
  return latest ? observationFromSnapshot(latest) : null;
}

function observationFromSnapshot(snapshot: {
  placeId: string;
  elementId?: string;
  feedKey: string;
  statusPayload: Record<string, unknown>;
  sourceType: string;
  observedAt: string;
}): ResolvedLiveStatus {
  const payload = snapshot.statusPayload;
  const status =
    typeof payload.status === "string" ? (payload.status as LiveFeedStatus) : "unknown";
  const summary =
    typeof payload.summary === "string"
      ? payload.summary
      : "Last-known live status snapshot.";
  const subjectKind =
    payload.subjectKind === "feature" ||
    payload.subjectKind === "element" ||
    payload.subjectKind === "segment" ||
    payload.subjectKind === "place"
      ? payload.subjectKind
      : snapshot.elementId
        ? "element"
        : "place";
  const subjectId =
    typeof payload.subjectId === "string"
      ? payload.subjectId
      : snapshot.elementId ?? snapshot.feedKey;

  return {
    observation: {
      placeId: snapshot.placeId,
      subjectKind,
      subjectId,
      status,
      summary,
      observedAt: snapshot.observedAt,
      sourceKind: "last_known",
      sourceId:
        typeof payload.sourceId === "string" ? payload.sourceId : snapshot.sourceType,
      confidence:
        typeof payload.confidence === "number"
          ? Math.max(0.2, payload.confidence * 0.75)
          : 0.35,
      payload,
    },
    resolution: "last_known_snapshot",
    reason: "No live feed; using last-known snapshot",
  };
}

async function fallBackToEvidence(query: LiveStatusQuery): Promise<ResolvedLiveStatus | null> {
  if (!query.subjectId) return null;

  try {
    const repo = getAccessIntelligenceRepository();
    const graph = await repo.readAccessGraph(query.placeId);
    const feature = graph.features.find((f) => f.id === query.subjectId);
    const element = graph.elements.find((e) => e.id === query.subjectId);

    if (feature) {
      const evidence = graph.evidence.find((e) => feature.evidenceIds.includes(e.id));
      if (evidence) {
        return {
          observation: {
            placeId: query.placeId,
            subjectKind: "feature",
            subjectId: query.subjectId,
            status: "unknown",
            summary:
              evidence.description ??
              evidence.title ??
              "Last-known evidence only (no live status).",
            observedAt: evidence.capturedAt,
            sourceKind: "last_known",
            sourceId: evidence.id,
            confidence: Math.min(0.55, feature.confidence),
            payload: { evidenceId: evidence.id, kind: evidence.type },
          },
          resolution: "last_known_evidence",
          reason: "Fell back to last-known evidence on the twin",
        };
      }
    }

    if (element) {
      const linkedFeature = graph.features.find((f) => f.elementId === element.id);
      const evidence = linkedFeature
        ? graph.evidence.find((e) => linkedFeature.evidenceIds.includes(e.id))
        : undefined;
      if (evidence) {
        return {
          observation: {
            placeId: query.placeId,
            subjectKind: "element",
            subjectId: query.subjectId,
            status: "unknown",
            summary:
              evidence.description ??
              evidence.title ??
              "Last-known evidence only (no live status).",
            observedAt: evidence.capturedAt,
            sourceKind: "last_known",
            sourceId: evidence.id,
            confidence: Math.min(0.55, linkedFeature?.confidence ?? 0.4),
            payload: { evidenceId: evidence.id, elementId: element.id },
          },
          resolution: "last_known_evidence",
          reason: "Fell back to last-known evidence on the twin",
        };
      }
    }

    const incidents = await repo.getLiveIncidents(query.placeId);
    const incident = incidents.find(
      (i) =>
        i.status === "active" &&
        (i.elementId === query.subjectId ||
          i.affectedEdgeIds.some((edgeId) => edgeId.includes(query.subjectId!))),
    );
    if (incident) {
      return {
        observation: {
          placeId: query.placeId,
          subjectKind: query.subjectKind ?? "element",
          subjectId: query.subjectId,
          status: "unavailable",
          summary: incident.description,
          observedAt: incident.reportedAt,
          sourceKind: "last_known",
          sourceId: incident.id,
          confidence: 0.5,
          payload: { incidentId: incident.id, severity: incident.severity },
        },
        resolution: "last_known_evidence",
        reason: "Fell back to active live incident on the subject",
      };
    }
  } catch {
    return null;
  }

  return null;
}

export type {
  LiveFeedSourceKind,
  LiveFeedStatus,
  LiveStatusAdapter,
  LiveStatusObservation,
  LiveStatusQuery,
  ResolvedLiveStatus,
} from "@/lib/access-intelligence/live/types";
export { feedKeyForSubject } from "@/lib/access-intelligence/live/types";
export { DemoLiveStatusAdapter } from "@/lib/access-intelligence/live/demo-adapter";
export { HttpBmsLiveStatusAdapter } from "@/lib/access-intelligence/live/http-bms-adapter";
