import type { AuthorityGrant, ProposedAction } from "@mapable/contracts";
import { participantAutonomyPolicyConstraintV1Schema } from "@mapable/contracts/autonomy-policy";

export type AutonomyPolicyRestriction = {
  decision: "REQUIRE_PARTICIPANT_CONFIRMATION" | "REQUIRE_HUMAN_REVIEW";
  reasonCodes: string[];
};

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function optionalFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function optionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return undefined;
  }
  return value;
}

function sameStringSet(left: string[] | undefined, right: string[] | undefined): boolean {
  if (!left && !right) return true;
  if (!left || !right) return false;
  const normalize = (values: string[]) => [...new Set(values)].sort();
  const a = normalize(left);
  const b = normalize(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function confirmation(reasonCode: string): AutonomyPolicyRestriction {
  return {
    decision: "REQUIRE_PARTICIPANT_CONFIRMATION",
    reasonCodes: [reasonCode],
  };
}

export function evaluateAutonomyPolicyConstraint(params: {
  action: ProposedAction;
  authority: AuthorityGrant;
  now: Date;
}): AutonomyPolicyRestriction | null {
  const rawPolicy = asRecord(params.authority.constraints).autonomyPolicy;
  if (rawPolicy === undefined) return null;

  const parsed = participantAutonomyPolicyConstraintV1Schema.safeParse(rawPolicy);
  if (!parsed.success) {
    return confirmation("AUTONOMY_POLICY_INVALID");
  }

  const policy = parsed.data;
  if (policy.preparationClass === "PROHIBITED_AI_AUTHORITY") {
    return {
      decision: "REQUIRE_HUMAN_REVIEW",
      reasonCodes: ["AUTONOMY_AI_AUTHORITY_PROHIBITED"],
    };
  }

  const standing = policy.standingAuthority;
  if (standing?.enabled) {
    if (new Date(standing.expiresAt) <= params.now) {
      return confirmation("AUTONOMY_STANDING_AUTHORITY_EXPIRED");
    }
    if (standing.action !== params.action.operation) {
      return confirmation("AUTONOMY_ACTION_CHANGED");
    }
    if (standing.purpose !== params.action.purpose) {
      return confirmation("AUTONOMY_PURPOSE_CHANGED");
    }

    const input = asRecord(params.action.input);
    const exactBindings: Array<{
      expected: string | undefined;
      actual: string | undefined;
      reason: string;
    }> = [
      {
        expected: standing.providerRef,
        actual: optionalString(input.providerRef),
        reason: "AUTONOMY_PROVIDER_CHANGED",
      },
      {
        expected: standing.workerRef,
        actual: optionalString(input.workerRef),
        reason: "AUTONOMY_WORKER_CHANGED",
      },
      {
        expected: standing.recipientRef,
        actual: optionalString(input.recipientRef),
        reason: "AUTONOMY_RECIPIENT_CHANGED",
      },
    ];

    for (const binding of exactBindings) {
      if (binding.expected !== undefined && binding.expected !== binding.actual) {
        return confirmation(binding.reason);
      }
    }

    if (
      standing.dataScopes !== undefined &&
      !sameStringSet(standing.dataScopes, optionalStringArray(input.dataScopes))
    ) {
      return confirmation("AUTONOMY_DATA_SCOPE_CHANGED");
    }

    if (standing.maxAmountMinorUnits !== undefined) {
      const amount = optionalFiniteNumber(input.amountMinorUnits);
      if (amount === undefined || amount > standing.maxAmountMinorUnits) {
        return confirmation("AUTONOMY_AMOUNT_TOLERANCE_EXCEEDED");
      }
      if (
        standing.currency !== undefined &&
        optionalString(input.currency) !== standing.currency
      ) {
        return confirmation("AUTONOMY_CURRENCY_CHANGED");
      }
    }

    if (standing.maxScheduleShiftMinutes !== undefined) {
      const shift = optionalFiniteNumber(input.scheduleShiftMinutes);
      if (
        shift === undefined ||
        Math.abs(shift) > standing.maxScheduleShiftMinutes
      ) {
        return confirmation("AUTONOMY_SCHEDULE_TOLERANCE_EXCEEDED");
      }
    }

    return null;
  }

  if (policy.preparationClass === "GUARDED") {
    return confirmation("AUTONOMY_GUARDED_PREPARATION");
  }

  return null;
}
