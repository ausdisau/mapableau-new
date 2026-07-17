#!/usr/bin/env tsx
import { runAccessOpsScript } from "./_shared";

void runAccessOpsScript({
  name: "accessops-audit-freshness",
  category: "audit",
  summary: "Audit source and status freshness without treating stale data as current.",
});
