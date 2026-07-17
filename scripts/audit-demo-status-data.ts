#!/usr/bin/env tsx
import { runAccessOpsScript } from "./accessops/_shared";

void runAccessOpsScript({
  name: "audit-demo-status-data",
  category: "audit",
  summary: "Audit demo status data so test-only records are labelled clearly.",
});
