#!/usr/bin/env tsx
import { runAccessOpsScript } from "./accessops/_shared";

void runAccessOpsScript({
  name: "audit-routing-uncertainty",
  category: "audit",
  summary: "Audit advisory route uncertainty and hard-constraint handling.",
});
