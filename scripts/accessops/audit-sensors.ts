#!/usr/bin/env tsx
import { runAccessOpsScript } from "./_shared";

void runAccessOpsScript({
  name: "accessops-audit-sensors",
  category: "audit",
  summary: "Audit sensor trust, health, calibration, and no-actuation controls.",
});
