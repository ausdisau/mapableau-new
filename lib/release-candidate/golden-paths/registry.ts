export type GoldenPathId =
  | "path-a-participant-onboarding"
  | "path-b-provider-worker-onboarding"
  | "path-c-care-service"
  | "path-d-transport-service"
  | "path-e-disruption-recovery"
  | "path-f-access-journey"
  | "path-g-complaint-appeal"
  | "path-h-data-rights-exit";

export type GoldenPathStepStatus = "executable" | "blocked_missing_wave";

export interface GoldenPathStep {
  id: string;
  label: string;
  status: GoldenPathStepStatus;
  dependencies: readonly string[];
  requiredSafeguards: readonly string[];
  prohibitedActions: readonly string[];
  blockerIds: readonly string[];
}

export interface GoldenPathContract {
  id: GoldenPathId;
  label: string;
  participantDataPolicy: "synthetic-only";
  steps: readonly GoldenPathStep[];
}

const COMMON_WAVE20_SAFEGUARD = "Wave 20 constitutional invariant check";
const COMMON_PROHIBITED_ACTIONS = [
  "real participant data access",
  "production integration activation",
  "automatic payment or claim approval",
] as const;

export const GOLDEN_PATHS: readonly GoldenPathContract[] = [
  {
    id: "path-a-participant-onboarding",
    label: "Participant onboarding",
    participantDataPolicy: "synthetic-only",
    steps: [
      executableStep(
        "identity-and-consent",
        "Create synthetic identity and consent context",
        ["lib/auth/current-user.ts", "lib/consent/consent-service.ts"],
      ),
      blockedStep("constitutional-invariants", COMMON_WAVE20_SAFEGUARD, [
        "waves-18-20-absent",
        "wave-20-constitutional-invariants-absent",
      ]),
    ],
  },
  {
    id: "path-b-provider-worker-onboarding",
    label: "Provider worker onboarding",
    participantDataPolicy: "synthetic-only",
    steps: [
      executableStep("provider-scope", "Resolve provider tenant scope", [
        "lib/tenancy/context/tenant-context.ts",
      ]),
      blockedStep(
        "workforce-authority",
        "Wave 16 workforce allocation / credential authority",
        ["waves-14-16-absent", "pack-a-incomplete"],
      ),
    ],
  },
  {
    id: "path-c-care-service",
    label: "Care service",
    participantDataPolicy: "synthetic-only",
    steps: [
      executableStep(
        "care-request-contract",
        "Validate care request contract",
        ["lib/care/care-booking-service.ts"],
      ),
      blockedStep("worker-allocation", "Wave 16 worker allocation", [
        "waves-14-16-absent",
        "pack-a-incomplete",
      ]),
    ],
  },
  {
    id: "path-d-transport-service",
    label: "Transport service",
    participantDataPolicy: "synthetic-only",
    steps: [
      executableStep(
        "transport-request-contract",
        "Validate transport request contract",
        ["lib/validation/transport.ts"],
      ),
      blockedStep(
        "constitutional-and-live-routing",
        "Wave 20 invariants and approved live routing",
        ["waves-18-20-absent", "wave-20-constitutional-invariants-absent"],
      ),
    ],
  },
  {
    id: "path-e-disruption-recovery",
    label: "Disruption recovery",
    participantDataPolicy: "synthetic-only",
    steps: [
      executableStep(
        "continuity-contract",
        "Validate continuity option contract",
        ["lib/continuity/recovery/option-builder.ts"],
      ),
      blockedStep("constitutional-recovery", COMMON_WAVE20_SAFEGUARD, [
        "waves-18-20-absent",
        "wave-20-constitutional-invariants-absent",
      ]),
    ],
  },
  {
    id: "path-f-access-journey",
    label: "Access journey",
    participantDataPolicy: "synthetic-only",
    steps: [
      executableStep(
        "accessops-contract",
        "Validate AccessOps advisory journey contract",
        ["lib/participation/access/journey-adapter.ts"],
      ),
      blockedStep(
        "live-accessops-feeds",
        "Approved live AccessOps feeds and Wave 20 invariants",
        ["waves-18-20-absent", "wave-20-constitutional-invariants-absent"],
      ),
    ],
  },
  {
    id: "path-g-complaint-appeal",
    label: "Complaint and appeal",
    participantDataPolicy: "synthetic-only",
    steps: [
      executableStep(
        "appeal-contract",
        "Validate complaint and appeal contract",
        ["lib/public-interest-governance"],
      ),
      blockedStep("constitutional-remedy", COMMON_WAVE20_SAFEGUARD, [
        "waves-18-20-absent",
        "wave-20-constitutional-invariants-absent",
      ]),
    ],
  },
  {
    id: "path-h-data-rights-exit",
    label: "Data rights and exit",
    participantDataPolicy: "synthetic-only",
    steps: [
      executableStep(
        "consent-portability-contract",
        "Validate consent and portability contract",
        ["lib/consent/consent-service.ts", "lib/federation"],
      ),
      blockedStep("constitutional-data-rights", COMMON_WAVE20_SAFEGUARD, [
        "waves-18-20-absent",
        "wave-20-constitutional-invariants-absent",
      ]),
    ],
  },
] as const;

function executableStep(
  id: string,
  label: string,
  dependencies: readonly string[],
): GoldenPathStep {
  return {
    id,
    label,
    status: "executable",
    dependencies,
    requiredSafeguards: ["tenant scope", "explicit consent", "auditability"],
    prohibitedActions: COMMON_PROHIBITED_ACTIONS,
    blockerIds: [],
  };
}

function blockedStep(
  id: string,
  label: string,
  blockerIds: readonly string[],
): GoldenPathStep {
  return {
    id,
    label,
    status: "blocked_missing_wave",
    dependencies: blockerIds,
    requiredSafeguards: [
      "tenant scope",
      "explicit consent",
      COMMON_WAVE20_SAFEGUARD,
    ],
    prohibitedActions: COMMON_PROHIBITED_ACTIONS,
    blockerIds,
  };
}

export function getGoldenPath(id: GoldenPathId): GoldenPathContract {
  const path = GOLDEN_PATHS.find((candidate) => candidate.id === id);
  if (!path) {
    throw new Error(`UNKNOWN_GOLDEN_PATH:${id}`);
  }
  return path;
}

export function isFullyExecutable(path: GoldenPathContract): boolean {
  return path.steps.every((step) => step.status === "executable");
}

export function validateGoldenPathContract(path: GoldenPathContract): string[] {
  const errors: string[] = [];
  if (path.participantDataPolicy !== "synthetic-only") {
    errors.push(`${path.id}: participantDataPolicy must be synthetic-only`);
  }
  if (path.steps.length === 0) {
    errors.push(`${path.id}: at least one step is required`);
  }
  for (const step of path.steps) {
    if (step.requiredSafeguards.length === 0) {
      errors.push(`${path.id}/${step.id}: requiredSafeguards missing`);
    }
    if (step.prohibitedActions.length === 0) {
      errors.push(`${path.id}/${step.id}: prohibitedActions missing`);
    }
    if (
      step.status === "blocked_missing_wave" &&
      step.blockerIds.length === 0
    ) {
      errors.push(
        `${path.id}/${step.id}: blocked_missing_wave requires blockerIds`,
      );
    }
  }
  return errors;
}

export function goldenPathMatrix() {
  return GOLDEN_PATHS.map((path) => ({
    id: path.id,
    label: path.label,
    stepCount: path.steps.length,
    blockedStepCount: path.steps.filter(
      (step) => step.status === "blocked_missing_wave",
    ).length,
    isFullyExecutable: isFullyExecutable(path),
    blockers: Array.from(
      new Set(path.steps.flatMap((step) => step.blockerIds)),
    ).sort(),
  }));
}
