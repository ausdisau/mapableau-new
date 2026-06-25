import contracts from "@/lib/contracts/sample-contracts.json";
import type { ContractDefinition } from "@/lib/contracts/types";

export function loadContractsByTrigger(trigger: ContractDefinition["trigger"]) {
  return (contracts as ContractDefinition[]).filter((c) => c.trigger === trigger);
}

export function getContractByCode(code: string) {
  return (contracts as ContractDefinition[]).find((c) => c.code === code);
}
