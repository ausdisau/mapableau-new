#!/usr/bin/env tsx
import { runGovernanceScript, scanFiles } from "./governance/_shared";

void runGovernanceScript({
  name: "audit-public-explanations",
  summary:
    "Audit public explanation redaction and certification-claim boundaries.",
  checks: ["redaction", "no_certification_claims", "challenge_path_present"],
  live: async () => ({
    publicExplanationReferences: scanFiles({
      roots: [
        "app/transparency",
        "lib/public-interest-governance",
        "docs/governance",
      ],
      extensions: [".ts", ".tsx", ".md"],
      pattern: /redact|challenge|not certification|certificationClaimForbidden/,
    }),
  }),
});
