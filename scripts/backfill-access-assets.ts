#!/usr/bin/env tsx
import { runAccessOpsScript } from "./accessops/_shared";

void runAccessOpsScript({
  name: "backfill-access-assets",
  category: "backfill",
  summary: "Assess access asset backfill readiness without fabricating owners.",
});
