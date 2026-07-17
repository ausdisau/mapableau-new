import {
  GOLDEN_PATHS,
  goldenPathMatrix,
  validateGoldenPathContract,
} from "../../lib/release-candidate/golden-paths/registry";

import { isMainModule, printJson } from "./_shared";

export function runGoldenPaths() {
  const matrix = goldenPathMatrix();
  const validationErrors = GOLDEN_PATHS.flatMap((path) =>
    validateGoldenPathContract(path),
  );
  const summary = {
    generatedAt: new Date().toISOString(),
    pathCount: matrix.length,
    fullyExecutableCount: matrix.filter((path) => path.isFullyExecutable)
      .length,
    blockedCount: matrix.filter((path) => !path.isFullyExecutable).length,
    recommendation: "reject",
    validationErrors,
    matrix,
  };
  return summary;
}

if (isMainModule(import.meta.url)) {
  printJson(runGoldenPaths());
}
