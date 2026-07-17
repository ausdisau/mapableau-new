#!/usr/bin/env tsx
import { runAccessOpsScript } from "./accessops/_shared";

void runAccessOpsScript({
  name: "backfill-asset-ownership",
  category: "backfill",
  summary: "Assess ownership backfill readiness without inventing owners.",
});
