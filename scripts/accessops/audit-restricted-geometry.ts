#!/usr/bin/env tsx
import { runAccessOpsScript } from "./_shared";

void runAccessOpsScript({
  name: "accessops-audit-restricted-geometry",
  category: "audit",
  summary: "Audit that restricted geometry is stripped from public projections.",
});
