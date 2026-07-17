#!/usr/bin/env tsx
import { runAccessOpsScript } from "./_shared";

void runAccessOpsScript({
  name: "accessops-audit-status",
  category: "audit",
  summary: "Audit demo and operational status data for freshness and test-only labels.",
});
