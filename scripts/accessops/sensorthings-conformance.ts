#!/usr/bin/env tsx
import { runAccessOpsScript } from "./_shared";

void runAccessOpsScript({
  name: "accessops-sensorthings-conformance",
  category: "conformance",
  summary: "Check SensorThings sensing-only conformance with tasking disabled.",
});
