import type { ConsentScope } from "@/lib/prms/types";

import type { ModuleId } from "./types";

const MODULE_REQUIRED_SCOPES: Record<ModuleId, ConsentScope[]> = {
  prms: ["profile_sharing"],
  consent: [],
  care: ["profile_sharing"],
  transport: ["transport_sharing"],
  cases: ["profile_sharing"],
  jobs: ["profile_sharing"],
  calendar: ["profile_sharing"],
  billing: ["billing_plan_manager"],
  incidents: ["profile_sharing"],
  access: ["profile_sharing"],
  orchestration: ["profile_sharing", "transport_sharing"],
};

export function requiredScopesForModule(moduleId: ModuleId): ConsentScope[] {
  return MODULE_REQUIRED_SCOPES[moduleId] ?? [];
}

export function canRetrieveModule(
  moduleId: ModuleId,
  grantedScopes: ConsentScope[]
): boolean {
  const required = requiredScopesForModule(moduleId);
  if (required.length === 0) return true;
  if (moduleId === "orchestration") {
    return required.some((s) => grantedScopes.includes(s));
  }
  return required.every((s) => grantedScopes.includes(s));
}
