import { hasPermission, type Permission } from "@/lib/auth/permissions";
import type { UserRole } from "@/types/mapable";

import type { AgentContext, MapAbleAgentId } from "./agent-types";
import { AgentPermissionError } from "./agent-errors";
import { getAgentConfig } from "./agent-registry";

const AGENT_PERMISSIONS: Partial<Record<MapAbleAgentId, Permission[]>> = {
  participant_support: ["booking:read:self", "invoice:read:self"],
  provider_operations: ["care:read:org", "invoice:read:org"],
  quality_safeguards: ["incident:read:self", "provider_quality:read"],
  billing_pricing: ["invoice:read:self", "invoice:read:org"],
  provider_finder: ["search:providers"],
  telehealth_intake: ["profile:read:self"],
  privacy_consent: ["consent:manage:self"],
  admin_copilot: ["admin:dashboard"],
};

export function assertAgentRoleAccess(
  agentId: MapAbleAgentId,
  context: AgentContext
): void {
  const config = getAgentConfig(agentId);
  const role = context.role as UserRole;
  if (!config.allowedRoles.includes(role) && role !== "mapable_admin") {
    throw new AgentPermissionError(
      `Role ${context.role} cannot use the ${config.displayName} agent.`
    );
  }
}

export function assertAgentPermissions(
  agentId: MapAbleAgentId,
  context: AgentContext
): void {
  assertAgentRoleAccess(agentId, context);
  const required = AGENT_PERMISSIONS[agentId] ?? [];
  for (const perm of required) {
    if (!hasPermission(context.role as UserRole, perm)) {
      throw new AgentPermissionError(`Missing permission: ${perm}`);
    }
  }
}

export function assertToolPermission(
  permission: Permission | undefined,
  context: AgentContext
): void {
  if (!permission) return;
  if (!hasPermission(context.role as UserRole, permission)) {
    throw new AgentPermissionError(`Tool requires permission: ${permission}`);
  }
}
