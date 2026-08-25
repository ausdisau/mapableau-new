import {
  getMapAbleAgent,
  MAPABLE_OPERATIONAL_AGENT_IDS,
} from "@/lib/ai/platform/agents";
import { getAiCapability } from "@/lib/ai/platform/capabilities/registry";
import { isCapabilityKilled } from "@/lib/ai/platform/policies/kill-switches";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { id } = await context.params;
  if (
    !(MAPABLE_OPERATIONAL_AGENT_IDS as readonly string[]).includes(id)
  ) {
    return jsonError(`Unknown operational agent: ${id}`, 404);
  }

  const agent = getMapAbleAgent(id);
  if (!agent) {
    return jsonError(`Agent not registered: ${id}`, 404);
  }

  const capabilities = agent.capabilityKeys.map((key) => {
    const cap = getAiCapability(key);
    return {
      key,
      registered: Boolean(cap),
      publicName: cap?.publicName ?? null,
      backend: cap?.backend ?? null,
      featureFlag: cap?.featureFlag ?? null,
      killSwitchKey: cap?.killSwitchKey ?? null,
      killSwitchEngaged: isCapabilityKilled(key),
      authorityCeiling: cap?.authorityCeiling ?? null,
      humanReviewRequired: cap?.humanReviewRequired ?? false,
      participantApprovalRequired: cap?.participantApprovalRequired ?? false,
      evaluationSuite: cap?.evaluationSuite ?? null,
    };
  });

  return jsonOk({ agent, capabilities });
}
