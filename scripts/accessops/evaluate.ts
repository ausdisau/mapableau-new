#!/usr/bin/env tsx
import { runAccessOpsScript } from "./_shared";

void runAccessOpsScript({
  name: "accessops-evaluate",
  category: "evaluate",
  summary: "Evaluate AccessOps readiness gates without enabling external feeds.",
});
