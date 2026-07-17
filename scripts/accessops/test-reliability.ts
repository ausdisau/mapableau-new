#!/usr/bin/env tsx
import { runAccessOpsScript } from "./_shared";

void runAccessOpsScript({
  name: "accessops-test-reliability",
  category: "test",
  summary: "Test reliability calculations with unknown and stale windows preserved.",
});
