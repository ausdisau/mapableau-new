#!/usr/bin/env tsx
import { runAccessOpsScript } from "./accessops/_shared";

void runAccessOpsScript({
  name: "audit-webhook-readiness",
  category: "audit",
  summary: "Audit webhook destination safety and disabled production-delivery readiness.",
});
