import { MAPABLE_AGENT_MANIFESTS } from "./manifests";
import type { MapAbleAgentId, MapAbleAgentManifest } from "./types";

const byId = new Map<MapAbleAgentId, MapAbleAgentManifest>(
  MAPABLE_AGENT_MANIFESTS.map((m) => [m.id, m])
);

export function listMapAbleAgents(): MapAbleAgentManifest[] {
  return [...byId.values()];
}

export function getMapAbleAgent(
  id: string
): MapAbleAgentManifest | undefined {
  return byId.get(id as MapAbleAgentId);
}

export function requireMapAbleAgent(id: string): MapAbleAgentManifest {
  const agent = getMapAbleAgent(id);
  if (!agent) {
    throw new Error(`MAPABLE_AGENT_NOT_REGISTERED:${id}`);
  }
  return agent;
}

export function listMapAbleAgentIds(): MapAbleAgentId[] {
  return listMapAbleAgents().map((a) => a.id);
}
