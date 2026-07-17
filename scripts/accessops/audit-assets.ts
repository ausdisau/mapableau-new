#!/usr/bin/env tsx
import { runAccessOpsScript } from "./_shared";

void runAccessOpsScript({
  name: "accessops-audit-assets",
  category: "audit",
  summary: "Audit asset lifecycle, identifiers, ownership gaps, and publication readiness.",
});
