#!/usr/bin/env tsx
import { loadAgenticCareDataset } from "@/lib/ai/platform/evaluations/agentic-care/dataset";

try {
  const items = await loadAgenticCareDataset();
  process.stdout.write(`Agentic Care dataset valid: ${items.length} synthetic cases\n`);
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Agentic Care dataset validation failed";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
