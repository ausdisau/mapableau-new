#!/usr/bin/env tsx
import { runAccessOpsScript } from "./_shared";

void runAccessOpsScript({
  name: "accessops-test-webhooks",
  category: "test",
  summary: "Test webhook signing, retry, destination safety, and production gates.",
});
