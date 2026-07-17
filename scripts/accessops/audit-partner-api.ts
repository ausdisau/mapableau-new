#!/usr/bin/env tsx
import { runAccessOpsScript } from "./_shared";

void runAccessOpsScript({
  name: "accessops-audit-partner-api",
  category: "audit",
  summary: "Audit partner API scopes, DTO minimisation, and tenant boundaries.",
});
