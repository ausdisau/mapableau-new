#!/usr/bin/env tsx
import { runAccessOpsScript } from "./accessops/_shared";

void runAccessOpsScript({
  name: "audit-access-freshness",
  category: "audit",
  summary: "Audit status and source freshness without treating stale data as current.",
});
