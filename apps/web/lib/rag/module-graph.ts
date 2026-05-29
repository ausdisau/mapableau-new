import type { CopilotIntentType } from "@/lib/copilot/types";

import type { ModuleId } from "./types";

/**
 * Directed dependency edges: when retrieving for `module`, also pull context
 * from each listed module (if consent allows). Forms an interdependent RAG mesh.
 */
export const MODULE_DEPENDENCIES: Record<ModuleId, ModuleId[]> = {
  prms: ["consent"],
  consent: [],
  care: ["prms", "consent", "transport", "cases", "orchestration"],
  transport: ["prms", "consent", "care", "cases", "access"],
  cases: ["prms", "consent", "care", "transport", "incidents", "billing"],
  jobs: ["prms", "consent", "transport", "calendar", "cases"],
  calendar: ["care", "transport", "jobs"],
  billing: ["prms", "consent", "care", "cases"],
  incidents: ["prms", "consent", "cases", "care", "transport"],
  access: ["prms", "consent"],
  orchestration: ["care", "transport", "jobs", "billing", "calendar", "prms", "consent"],
};

/** Modules to query for an interdependent retrieval (origin first, then deps). */
export function resolveModuleClosure(
  origin: ModuleId,
  maxModules = 6
): ModuleId[] {
  const seen = new Set<ModuleId>();
  const order: ModuleId[] = [];

  const visit = (id: ModuleId) => {
    if (seen.has(id) || order.length >= maxModules) return;
    seen.add(id);
    order.push(id);
    for (const dep of MODULE_DEPENDENCIES[id] ?? []) {
      visit(dep);
    }
  };

  visit(origin);
  return order;
}

export function copilotIntentToModule(intent: CopilotIntentType): ModuleId {
  switch (intent) {
    case "transport":
      return "transport";
    case "support":
      return "care";
    case "combined":
      return "orchestration";
    case "jobs":
      return "jobs";
    case "billing":
      return "billing";
    case "incident":
      return "incidents";
    case "places":
      return "access";
    case "ndis":
      return "prms";
    case "health":
      return "care";
    default:
      return "prms";
  }
}
