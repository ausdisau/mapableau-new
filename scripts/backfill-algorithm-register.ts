#!/usr/bin/env tsx
import { catalogSummary, runGovernanceScript } from "./governance/_shared";

void runGovernanceScript({
  name: "backfill-algorithm-register",
  summary:
    "Dry-run backfill plan from consequential system catalog into governed systems/register entries.",
  checks: ["dry_run_only", "no_auto_publish", "catalog_to_register_mapping"],
  live: async () => ({
    plannedWrites: catalogSummary.count,
    plannedPublications: 0,
    catalog: catalogSummary,
  }),
});
