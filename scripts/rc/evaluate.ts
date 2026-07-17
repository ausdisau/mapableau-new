import { goldenPathMatrix } from "../../lib/release-candidate/golden-paths/registry";
import { getReleaseBlockers } from "../../lib/release-candidate/inventory/blocker-catalog";

import { isMainModule, runRcAudit } from "./_shared";

if (isMainModule(import.meta.url)) {
  runRcAudit({
    name: "evaluate",
    category: "evaluate",
    summary:
      "Evaluate RC1 exit gate honestly against missing waves and golden-path executability.",
    collect: () => {
      const blockers = getReleaseBlockers();
      const matrix = goldenPathMatrix();
      const goldenPathsFullyExecutable = matrix.every(
        (path) => path.isFullyExecutable,
      );
      const hasMissingWaves = blockers.some((blocker) =>
        [
          "waves-18-20-absent",
          "wave-20-constitutional-invariants-absent",
        ].includes(blocker.id),
      );
      const recommendation =
        hasMissingWaves || !goldenPathsFullyExecutable ? "reject" : "pass";
      return {
        recommendation,
        blockerCount: blockers.length,
        blockers,
        goldenPathSummary: {
          pathCount: matrix.length,
          fullyExecutableCount: matrix.filter((path) => path.isFullyExecutable)
            .length,
          blockedCount: matrix.filter((path) => !path.isFullyExecutable).length,
        },
        matrix,
      };
    },
  });
}
