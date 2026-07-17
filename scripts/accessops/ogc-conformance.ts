#!/usr/bin/env tsx
import { runAccessOpsScript } from "./_shared";

void runAccessOpsScript({
  name: "accessops-ogc-conformance",
  category: "conformance",
  summary: "Check OGC API Features read-only profile and privacy filtering.",
});
