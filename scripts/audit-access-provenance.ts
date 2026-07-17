#!/usr/bin/env tsx
import { runAccessOpsScript } from "./accessops/_shared";

void runAccessOpsScript({
  name: "audit-access-provenance",
  category: "audit",
  summary: "Audit AccessOps source provenance and attribution coverage.",
});
