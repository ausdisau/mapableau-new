#!/usr/bin/env tsx
import { runAccessOpsScript } from "./_shared";

void runAccessOpsScript({
  name: "accessops-wot-conformance",
  category: "conformance",
  summary: "Check WoT read-only affordances, HTTPS forms, and SSRF boundaries.",
});
