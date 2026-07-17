#!/usr/bin/env tsx
import { catalogSummary, runGovernanceScript } from "./governance/_shared";

void runGovernanceScript({
  name: "audit-governed-systems",
  summary:
    "Audit consequential system registration catalog and register readiness.",
  checks: ["catalog_present", "owner_team_present", "incident_contact_present"],
  live: async () => ({ catalog: catalogSummary }),
});
