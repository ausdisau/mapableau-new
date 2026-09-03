import type { GaisAccessConditionEvent } from "@/lib/gais/conditions";
import { listAccessConditions, parseActiveAt } from "@/lib/gais/conditions";
import type { GaisFeature } from "@/lib/gais/contracts/feature";
import { listGaisFeaturesInBounds } from "@/lib/gais/service";
import { stripPrivateFields } from "@/lib/gais/service/adapters";

import {
  classifyFeatureScope,
  filterFeatureByQuery,
  groupResultsByScope,
  sortResultsDeterministically,
  type GaisQueryResultItem,
} from "./classify";
import { validateGaisQueryAst } from "./compile-ast";
import { GAIS_QUERY_DEFAULT_LIMIT, type GaisQueryScope } from "./constants";
import { haversineMetres, resolveQueryBounds } from "./geo";
import type { GaisStructuredQuery } from "./request-schema";

export type GaisQueryExecutionResult = {
  queryId: string;
  validation: {
    ok: boolean;
    errors: string[];
    warnings: string[];
  };
  scopes: Record<GaisQueryScope, GaisQueryResultItem[]>;
  events: GaisAccessConditionEvent[];
  meta: {
    claimState: string;
    evidenceScope: string;
    featureCount: number;
    eventCount: number;
    activeAt: string;
    objectives: string[];
    rankingApplied: false;
    note: string;
  };
};

export type GaisQueryDependencies = {
  loadFeatures: typeof listGaisFeaturesInBounds;
  loadEvents: typeof listAccessConditions;
};

const defaultDeps: GaisQueryDependencies = {
  loadFeatures: listGaisFeaturesInBounds,
  loadEvents: listAccessConditions,
};

function attachDistance(
  items: GaisQueryResultItem[],
  query: GaisStructuredQuery,
): GaisQueryResultItem[] {
  if (!query.location) return items;

  return items.map((item) => {
    if (item.feature.geometry.type !== "Point") return item;
    const [lng, lat] = item.feature.geometry.coordinates;
    return {
      ...item,
      distanceMetres: Math.round(
        haversineMetres(query.location!.lat, query.location!.lng, lat, lng),
      ),
    };
  });
}

function stripResultFeature(feature: GaisFeature): GaisFeature {
  return stripPrivateFields(feature);
}

/**
 * Deterministic structured GAIS query — no free-form AI, no implicit accessibility ranking.
 */
export async function executeGaisStructuredQuery(
  query: GaisStructuredQuery,
  queryId: string,
  deps: GaisQueryDependencies = defaultDeps,
): Promise<
  | { ok: true; result: GaisQueryExecutionResult }
  | { ok: false; status: number; errors: string[] }
> {
  const boundsResult = resolveQueryBounds(query);
  if (!boundsResult.ok) {
    return { ok: false, status: 400, errors: boundsResult.errors };
  }

  const astValidation = validateGaisQueryAst(query, queryId);
  if (!astValidation.ok) {
    return { ok: false, status: 400, errors: astValidation.errors };
  }

  const activeAt = parseActiveAt(query.activeAt);
  const limit = query.limit ?? boundsResult.bounds.limit ?? GAIS_QUERY_DEFAULT_LIMIT;

  const rawFeatures = await deps.loadFeatures({
    ...boundsResult.bounds,
    limit,
  });

  let items = rawFeatures
    .map(stripResultFeature)
    .filter((f) => filterFeatureByQuery(f, query))
    .map((f) => classifyFeatureScope(f, query));

  items = sortResultsDeterministically(attachDistance(items, query));

  let events: GaisAccessConditionEvent[] = [];
  if (query.includeEvents) {
    events = await deps.loadEvents({
      bounds: boundsResult.bounds,
      activeAt,
      limit: Math.min(50, limit),
    });
  }

  const scopes = groupResultsByScope(items);

  return {
    ok: true,
    result: {
      queryId,
      validation: {
        ok: true,
        errors: [],
        warnings: astValidation.warnings,
      },
      scopes,
      events,
      meta: {
        claimState: "in_development",
        evidenceScope: "published_access_places_and_community_barriers",
        featureCount: items.length,
        eventCount: events.length,
        activeAt: activeAt.toISOString(),
        objectives: query.objectives ?? [],
        rankingApplied: false,
        note:
          "Results grouped by evidence scope. No universal accessibility ranking applied.",
      },
    },
  };
}
