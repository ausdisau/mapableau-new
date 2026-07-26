/**
 * Freeze-compliant pgRouting adapter seam.
 *
 * FEATURE_FREEZE: no PostGIS / pgRouting DDL and no live SQL pool wiring.
 * This module documents the future `pgr_astar` SQL shape using the same
 * mobility cost multipliers as the in-memory Dijkstra engine. When an indoor
 * PostGIS waiver exists, swap the HTTP handler to call this SQL without
 * changing the request/response contract.
 */

export type PgrAstarCostParams = {
  /** Source node id (text or bigint cast by caller). */
  startNodeId: string;
  /** Target node id. */
  endNodeId: string;
  /** Exclude stair / non-step-free edges (cost → infinity). Default true. */
  excludeStairs?: boolean;
  /** Multiplier applied when edge has a non-zero gradient. >= 1 */
  gradientPenalty?: number;
  /** Multiplier applied for high-friction surfaces. >= 1 */
  surfaceFriction?: number;
  /** Minimum clear door width in mm; narrower edges become impassable. */
  minDoorWidthMm?: number;
  /** Edge table name (future). */
  edgesTable?: string;
};

/**
 * Build a documented `pgr_astar` SQL string contract.
 * Not executed under FEATURE_FREEZE — unit-tested as a string shape only.
 */
export function buildPgrAstarSql(params: PgrAstarCostParams): string {
  const excludeStairs = params.excludeStairs ?? true;
  const gradientPenalty = Math.max(1, params.gradientPenalty ?? 1);
  const surfaceFriction = Math.max(1, params.surfaceFriction ?? 1);
  const minDoor = params.minDoorWidthMm;
  const edgesTable = params.edgesTable ?? "indoor_route_edges";

  const stairClause = excludeStairs
    ? "CASE WHEN e.step_free IS FALSE THEN -1 ELSE"
    : "CASE WHEN FALSE THEN -1 ELSE";

  const widthClause =
    minDoor != null
      ? `CASE WHEN e.minimum_width_mm IS NOT NULL AND e.minimum_width_mm < ${Number(minDoor)} THEN -1 ELSE`
      : "CASE WHEN FALSE THEN -1 ELSE";

  // Cost expression mirrors TypeScript edgeCost multipliers.
  const costExpr = `
    ${stairClause}
    ${widthClause}
      COALESCE(e.distance_metres, 1)
      * (CASE
           WHEN e.maximum_gradient IS NOT NULL AND e.maximum_gradient::float > 0
             THEN ${gradientPenalty}
           ELSE 1
         END)
      * (CASE
           WHEN e.surface_type ~* '(carpet|gravel|uneven|cobble)'
             THEN ${surfaceFriction}
           ELSE 1
         END)
    END END
  `.replace(/\s+/g, " ").trim();

  return [
    "SELECT * FROM pgr_astar(",
    `  'SELECT id, source, target, ${costExpr} AS cost, ${costExpr} AS reverse_cost, x1, y1, x2, y2 FROM ${edgesTable} e',`,
    `  (SELECT id FROM indoor_route_nodes WHERE external_id = '${params.startNodeId.replace(/'/g, "''")}'),`,
    `  (SELECT id FROM indoor_route_nodes WHERE external_id = '${params.endNodeId.replace(/'/g, "''")}')`,
    ");",
  ].join("\n");
}

/** Engine identifier emitted in plan API meta until the SQL path is live. */
export const IN_MEMORY_ENGINE = "in_memory_dijkstra" as const;
export const PGROUTING_ENGINE = "pgrouting" as const;

export type IndoorRouteEngine =
  | typeof IN_MEMORY_ENGINE
  | typeof PGROUTING_ENGINE;
