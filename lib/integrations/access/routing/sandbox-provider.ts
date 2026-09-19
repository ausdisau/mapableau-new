/**
 * Sandbox routing provider — wraps existing navigate planner.
 */

import { planAccessibleRoutes } from "@/lib/access/navigate/route-planner";
import { getSandboxGraph } from "@/lib/access/navigate/fixture/sandbox-graph";
import { openInfrastructureFlags } from "@/lib/integrations/access/flags";

import { buildRouteEvidenceSummary } from "./evidence-summary";
import type {
  AccessibleRouteProvider,
  AccessibleRouteRequest,
  AccessibleRouteResult,
} from "./types";

export class SandboxRouteProvider implements AccessibleRouteProvider {
  readonly providerId = "sandbox";

  isEnabled(): boolean {
    return openInfrastructureFlags.accessibleRouting;
  }

  async planRoute(request: AccessibleRouteRequest): Promise<AccessibleRouteResult> {
    if (!this.isEnabled()) {
      throw new Error("Accessible routing disabled");
    }
    const graph = getSandboxGraph();
    const plan = planAccessibleRoutes({
      graph,
      fromNodeId: request.fromNodeId,
      toNodeId: request.toNodeId,
      constraints: request.constraints,
      objectives: request.objectives,
    });
    const primaryPath = plan.paths[0];
    const segments = primaryPath?.segments ?? [];
    const evidenceSummary = buildRouteEvidenceSummary(this.providerId, segments);
    return { plan, evidenceSummary };
  }
}

export const sandboxRouteProvider = new SandboxRouteProvider();
