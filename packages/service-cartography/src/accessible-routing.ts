import type { Evidence } from './types';
import { assessEvidence } from './evidence';

export interface RouteSegment {
  id: string;
  fromId: string;
  toId: string;
  travelMinutes: number;
  open: boolean;
  /** Undefined is unknown, NOT assumed accessible. */
  hasSteps?: boolean;
  gradientPercent?: number;
  minimumClearanceMm?: number;
  evidence: Evidence;
}

export interface RouteNeeds {
  requireStepFree?: boolean;
  maximumGradientPercent?: number;
  minimumClearanceMm?: number;
}

export interface RouteResult {
  status: 'advisory_verified_route' | 'no_verified_route';
  segmentIds: string[];
  estimatedMinutes: number | null;
  excluded: Array<{ segmentId: string; reasons: string[] }>;
  /** The route still requires confirmation against real conditions before travel. */
  requiresRealWorldConfirmation: true;
}

/** Dijkstra over directed, currently verified segments. Unknown conditions fail closed. */
export function findAccessibleRoute(input: {
  originId: string;
  destinationId: string;
  segments: readonly RouteSegment[];
  needs: RouteNeeds;
  at: string;
}): RouteResult {
  const adjacency = new Map<string, RouteSegment[]>();
  const excluded: RouteResult['excluded'] = [];
  const gradientLimit = input.needs.maximumGradientPercent;
  const clearanceLimit = input.needs.minimumClearanceMm;
  if (
    (gradientLimit !== undefined && !Number.isFinite(gradientLimit)) ||
    (clearanceLimit !== undefined && !Number.isFinite(clearanceLimit))
  ) {
    return {
      status: 'no_verified_route',
      segmentIds: [],
      estimatedMinutes: null,
      excluded: [...input.segments]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((edge) => ({ segmentId: edge.id, reasons: ['invalid_access_limit'] })),
      requiresRealWorldConfirmation: true,
    };
  }
  for (const edge of [...input.segments].sort((a, b) => a.id.localeCompare(b.id))) {
    const reasons: string[] = [];
    if (!edge.open) reasons.push('closed');
    if (!assessEvidence(edge.evidence, input.at).usableForVerifiedClaim) reasons.push('unverified_or_stale');
    if (!Number.isFinite(edge.travelMinutes) || edge.travelMinutes < 0) reasons.push('invalid_travel_estimate');
    if (input.needs.requireStepFree && edge.hasSteps !== false) reasons.push('step_free_not_confirmed');
    if (input.needs.maximumGradientPercent !== undefined &&
        (!Number.isFinite(edge.gradientPercent) || edge.gradientPercent! > input.needs.maximumGradientPercent)) {
      reasons.push('gradient_not_confirmed_suitable');
    }
    if (input.needs.minimumClearanceMm !== undefined &&
        (!Number.isFinite(edge.minimumClearanceMm) || edge.minimumClearanceMm! < input.needs.minimumClearanceMm)) {
      reasons.push('clearance_not_confirmed_suitable');
    }
    if (reasons.length) { excluded.push({ segmentId: edge.id, reasons }); continue; }
    const existing = adjacency.get(edge.fromId) ?? [];
    existing.push(edge);
    adjacency.set(edge.fromId, existing);
  }
  const result: RouteResult = { status: 'no_verified_route', segmentIds: [], estimatedMinutes: null,
    excluded, requiresRealWorldConfirmation: true };
  if (!input.originId || !input.destinationId) return result;
  if (input.originId === input.destinationId) {
    return { ...result, status: 'advisory_verified_route', estimatedMinutes: 0 };
  }
  const distances = new Map<string, number>([[input.originId, 0]]);
  const predecessor = new Map<string, RouteSegment>();
  const remaining = new Set<string>([input.originId]);
  while (remaining.size) {
    const current = [...remaining].sort((a, b) => (distances.get(a) ?? Infinity) - (distances.get(b) ?? Infinity) || a.localeCompare(b))[0];
    if (current === undefined) break;
    remaining.delete(current);
    if (current === input.destinationId) break;
    for (const edge of adjacency.get(current) ?? []) {
      const nextDistance = (distances.get(current) ?? Infinity) + edge.travelMinutes;
      if (nextDistance < (distances.get(edge.toId) ?? Infinity)) {
        distances.set(edge.toId, nextDistance);
        predecessor.set(edge.toId, edge);
        remaining.add(edge.toId);
      }
    }
  }
  const total = distances.get(input.destinationId);
  if (total === undefined) return result;
  const path: string[] = [];
  const seen = new Set<string>();
  let position = input.destinationId;
  while (position !== input.originId) {
    if (seen.has(position)) return result;
    seen.add(position);
    const edge = predecessor.get(position);
    if (!edge) return result;
    path.unshift(edge.id);
    position = edge.fromId;
  }
  return { ...result, status: 'advisory_verified_route', segmentIds: path, estimatedMinutes: total };
}
