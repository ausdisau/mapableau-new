#!/usr/bin/env tsx
import { runGovernanceScript, scanFiles } from "./governance/_shared";

void runGovernanceScript({
  name: "audit-governance-tenant-scope",
  summary:
    "Audit admin governance routes for tenant scope or explicit national scope.",
  checks: ["tenant_or_national_scope", "participant_self_scope"],
  live: async () => ({
    scopeChecks: scanFiles({
      roots: [
        "lib/public-interest-governance",
        "app/api/admin/governance",
        "app/api/participant",
      ],
      extensions: [".ts"],
      pattern: /tenantId|nationalScope|scope=national|participantUserId/,
    }),
  }),
});
