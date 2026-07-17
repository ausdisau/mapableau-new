#!/usr/bin/env tsx
import { runAccessOpsScript } from "./_shared";

void runAccessOpsScript({
  name: "accessops-audit-open-data",
  category: "audit",
  summary: "Audit OGC open-data privacy filtering and disabled export gates.",
});
