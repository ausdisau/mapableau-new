#!/usr/bin/env tsx
import { runAccessOpsScript } from "./accessops/_shared";

void runAccessOpsScript({
  name: "audit-open-data-privacy",
  category: "audit",
  summary: "Audit open-data privacy filtering for participant and restricted geometry fields.",
});
