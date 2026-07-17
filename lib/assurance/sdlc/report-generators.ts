import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { evaluateReleaseGates } from "@/lib/assurance/sdlc/release-gates";

export async function writeReleaseGateReport(params: {
  typeCheckPassed: boolean;
  testsPassed: boolean;
  assuranceEvaluationEnabled: boolean;
  secretsInDiff?: boolean;
  outputDir?: string;
}) {
  const gates = evaluateReleaseGates({
    typeCheckPassed: params.typeCheckPassed,
    testsPassed: params.testsPassed,
    assuranceEvaluationEnabled: params.assuranceEvaluationEnabled,
    secretsInDiff: params.secretsInDiff ?? false,
  });

  const dir = params.outputDir ?? path.join(process.cwd(), "artifacts", "assurance");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `release-gates-${Date.now()}.json`);
  const payload = {
    generatedAt: new Date().toISOString(),
    disclaimer: "Internal SDLC gate report — not a certification.",
    gates,
  };
  await writeFile(file, JSON.stringify(payload, null, 2), "utf8");
  return { file, gates };
}
