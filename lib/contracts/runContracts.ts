import type {
  ContractDefinition,
  ContractEvaluation,
  ContractRunContext,
  ContractRule,
} from "@/lib/contracts/types";
import { createAttestation } from "@/lib/contracts/attestations";

function evaluateRule(rule: ContractRule, context: ContractRunContext): boolean {
  const val = context[rule.field];
  switch (rule.operator) {
    case "eq":
      return val === rule.value;
    case "neq":
      return val !== rule.value;
    case "in":
      return Array.isArray(rule.value) && rule.value.includes(val);
    case "exists":
      return val !== undefined && val !== null && val !== "";
    default: {
      const _exhaustive: never = rule.operator;
      return _exhaustive;
    }
  }
}

export function evaluateContract(
  contract: ContractDefinition,
  context: ContractRunContext,
): ContractEvaluation {
  const findings: { code: string; message: string }[] = [];
  for (const rule of contract.rules) {
    if (!evaluateRule(rule, context)) {
      findings.push({ code: rule.field, message: rule.message });
    }
  }
  const decision =
    findings.length === 0 ? "proceed" : findings.length > 2 ? "blocked" : "review_required";
  return { contractCode: contract.code, decision, findings };
}

export function runContractsForTrigger(
  contracts: ContractDefinition[],
  context: ContractRunContext,
) {
  const evaluations = contracts.map((contract) => evaluateContract(contract, context));
  const blocked = evaluations.some((e) => e.decision === "blocked");
  const review = evaluations.some((e) => e.decision === "review_required");
  const overall = blocked ? "blocked" : review ? "review_required" : "proceed";

  const attestations = contracts
    .filter((c) => c.requiresAttestation)
    .map((contract) => {
      const evaluation = evaluations.find((e) => e.contractCode === contract.code);
      if (!evaluation || evaluation.decision !== "proceed") return null;
      return createAttestation({
        actorType: String(context.actorType ?? "participant"),
        actorRef: String(context.actorRef ?? "anonymous"),
        claimType: contract.type,
        evidence: { contractCode: contract.code, trigger: contract.trigger },
        verificationStatus: "verified",
      });
    })
    .filter(Boolean);

  return { overall, evaluations, attestations };
}
