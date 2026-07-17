#!/usr/bin/env tsx
import { runAccessOpsScript } from "./accessops/_shared";

void runAccessOpsScript({
  name: "backfill-access-features",
  category: "backfill",
  summary: "Assess feature observation backfill readiness using safe identifiers only.",
});
