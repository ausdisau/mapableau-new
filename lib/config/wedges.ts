/**
 * Feature flags for MapAble strategic wedges.
 * See docs/strategic-wedges-roadmap.md and docs/modules/wedges/README.md
 */

export const wedgesConfig = {
  /** Enable wedge UI on provider-finder, availability routes, and access-fit summaries */
  mvpEnabled: process.env.WEDGES_MVP_ENABLED !== "false",

  /** Use mock provider dataset instead of live registry API */
  useMockData: process.env.WEDGES_USE_MOCK_DATA !== "false",

  /** Persist concierge and availability submissions to Prisma (requires migration) */
  persistRequests: process.env.WEDGES_PERSIST_REQUESTS === "true",

  /** Show availability filter panel on provider-finder */
  availabilityFiltersEnabled:
    process.env.WEDGES_AVAILABILITY_FILTERS_ENABLED !== "false",

  /** Show access-fit summary on provider search results */
  accessFitEnabled: process.env.WEDGES_ACCESS_FIT_ENABLED !== "false",

  /** Enable coordinator OS expanded dashboard */
  coordinatorOsEnabled: process.env.WEDGES_COORDINATOR_OS_ENABLED !== "false",

  /** Enable PlanOps Lite route */
  planOpsLiteEnabled: process.env.WEDGES_PLANOPS_LITE_ENABLED !== "false",
} as const;

export function isWedgesMvpActive(): boolean {
  return wedgesConfig.mvpEnabled;
}
