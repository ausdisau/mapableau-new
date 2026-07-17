#!/usr/bin/env tsx
import { runAccessOpsScript } from "./accessops/_shared";

void runAccessOpsScript({
  name: "backfill-indoor-graph",
  category: "backfill",
  summary: "Assess indoor graph backfill readiness without publishing routes.",
});
