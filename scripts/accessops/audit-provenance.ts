#!/usr/bin/env tsx
import { runAccessOpsScript } from "./_shared";

void runAccessOpsScript({
  name: "accessops-audit-provenance",
  category: "audit",
  summary: "Audit provenance coverage and attribution readiness.",
});
