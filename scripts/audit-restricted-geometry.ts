#!/usr/bin/env tsx
import { runAccessOpsScript } from "./accessops/_shared";

void runAccessOpsScript({
  name: "audit-restricted-geometry",
  category: "audit",
  summary: "Audit restricted geometry exposure in public and partner projections.",
});
