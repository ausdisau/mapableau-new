#!/usr/bin/env tsx
import { catalogSummary, runGovernanceScript } from "./_shared";

void runGovernanceScript({
  name: "governance-evaluate",
  summary:
    "Evaluate Wave 13 governance readiness across register, decisions, appeals, oversight and publication policy.",
  checks: [
    "systems_registered",
    "notices_complete",
    "appeals_independent",
    "conflicts_recused",
    "public_redaction",
    "aia_before_publish",
  ],
  live: async () => ({
    catalog: catalogSummary,
    result: "dry-run evaluation only; no publication or regulator submission",
  }),
});
