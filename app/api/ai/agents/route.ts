import {
  listMapAbleAgents,
  validateMapAbleAgentRegistry,
} from "@/lib/ai/platform/agents";
import { getAiCapability } from "@/lib/ai/platform/capabilities/registry";
import { isCapabilityKilled } from "@/lib/ai/platform/policies/kill-switches";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const validation = validateMapAbleAgentRegistry();
  const agents = listMapAbleAgents().map((agent) => {
    const capabilities = agent.capabilityKeys.map((key) => {
      const cap = getAiCapability(key);
      return {
        key,
        registered: Boolean(cap),
        backend: cap?.backend ?? null,
        featureFlag: cap?.featureFlag ?? null,
        killSwitchKey: cap?.killSwitchKey ?? null,
        killSwitchEngaged: isCapabilityKilled(key),
        authorityCeiling: cap?.authorityCeiling ?? null,
        humanReviewRequired: cap?.humanReviewRequired ?? null,
        participantApprovalRequired: cap?.participantApprovalRequired ?? null,
      };
    });

    const backends = new Set(
      capabilities.map((c) => c.backend).filter(Boolean)
    );

    return {
      id: agent.id,
      version: agent.version,
      name: agent.name,
      description: agent.description,
      role: agent.role,
      domains: agent.domains,
      authorityCeiling: agent.authorityCeiling,
      requiredConsentScopes: agent.requiredConsentScopes,
      requiredHumanReviewFor: agent.requiredHumanReviewFor,
      prohibitedActions: agent.prohibitedActions,
      fallbackAgentId: agent.fallbackAgentId,
      evaluationSuite: agent.evaluationSuite,
      owner: agent.owner,
      lastReview: agent.lastReview,
      backendMix: [...backends],
      capabilities,
    };
  });

  return jsonOk({
    operationalAgentCount: agents.length,
    registryValid: validation.ok,
    validationIssues: validation.issues,
    agents,
  });
}
