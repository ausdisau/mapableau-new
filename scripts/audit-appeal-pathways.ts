#!/usr/bin/env tsx
import { runGovernanceScript, scanFiles } from "./governance/_shared";

void runGovernanceScript({
  name: "audit-appeal-pathways",
  summary:
    "Audit non-retaliation, appeal state-machine and independent review pathways.",
  checks: [
    "non_retaliation",
    "state_machine",
    "reviewer_independence",
    "remedies",
  ],
  live: async () => ({
    pathwayReferences: scanFiles({
      roots: [
        "lib/public-interest-governance",
        "app/api/participant",
        "app/api/admin/governance",
      ],
      extensions: [".ts"],
      pattern:
        /nonRetaliation|canTransitionAppeal|assignIndependentReviewer|createRemedyAction/,
    }),
  }),
});
