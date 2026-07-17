import type { ReleaseBlocker } from "./types";

export const RC1_RELEASE_BLOCKERS: ReleaseBlocker[] = [
  {
    id: "waves-14-16-absent",
    title: "Waves 14-16 / Pack A are absent from the RC1 base",
    severity: "blocker",
    evidence: [
      "docs/releases/rc1/architecture-decision-record.md records Waves 14-16 as absent.",
      "docs/participation/wave-17.md states Pack A Waves 14-16 are absent in this branch.",
    ],
    requiredAction:
      "Land Pack A Waves 14-16 or explicitly rebase RC1 on a branch where they are complete.",
  },
  {
    id: "waves-18-20-absent",
    title: "Waves 18-20 are absent",
    severity: "blocker",
    evidence: [
      "docs/releases/rc1/architecture-decision-record.md records Waves 18-20 as absent.",
      "The repository does not contain a Wave 20 constitutional domain module.",
    ],
    requiredAction:
      "Complete Waves 18-20 and re-run the release-candidate inventories, golden paths, and exit gate.",
  },
  {
    id: "wave-20-constitutional-invariants-absent",
    title: "Wave 20 constitutional invariants are absent",
    severity: "blocker",
    evidence: [
      "docs/releases/rc1/architecture-decision-record.md forbids inventing Wave 18-20 core domains inside RC1.",
      "Existing constitutional-safeguards modules are Phase 12 preview/safeguards, not Wave 20 invariants.",
    ],
    requiredAction:
      "Introduce the approved Wave 20 constitutional invariant model and tests before RC1 can pass.",
  },
  {
    id: "pack-a-incomplete",
    title: "Pack A is incomplete",
    severity: "blocker",
    evidence: [
      "Wave 17 participation docs rely on Wave 16 workforce allocation adapter stubs.",
      "Golden paths that require workforce allocation cannot be fully executable on this branch.",
    ],
    requiredAction:
      "Complete Pack A dependencies and replace adapter stubs with authoritative services.",
  },
];

export function getReleaseBlockers(): ReleaseBlocker[] {
  return RC1_RELEASE_BLOCKERS.map((blocker) => ({
    ...blocker,
    evidence: [...blocker.evidence],
  }));
}
