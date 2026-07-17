#!/usr/bin/env tsx
import { runAccessOpsScript } from "./accessops/_shared";

void runAccessOpsScript({
  name: "audit-partner-api-scope",
  category: "audit",
  summary: "Audit partner API scope coverage and tenant-safe DTO boundaries.",
});
