import { graphRepository } from "@/lib/mapable-graphs/repository";

const CAPABILITY_KEYWORDS: Record<string, string[]> = {
  personal_care: ["personal care", "shower", "dressing"],
  manual_handling: ["manual handling", "hoist", "transfer"],
  wheelchair_transport_assistance: ["wheelchair", "accessible transport"],
  psychosocial_support: ["psychosocial", "mental health"],
  communication_support: ["communication", "aac", "plain language"],
  behaviour_support: ["behaviour", "behavior"],
  sensory_aware_support: ["sensory", "quiet", "low stimulation"],
  job_coaching: ["employment", "job coaching", "work"],
};

export async function addProvider(
  organisationId: string,
  name: string,
  participantId?: string
) {
  return graphRepository.createNode({
    graphType: "provider_capability",
    nodeType: "Provider",
    participantId,
    entityId: organisationId,
    label: name,
    status: "active",
  });
}

export async function addWorker(
  workerId: string,
  name: string,
  providerNodeId?: string
) {
  const worker = await graphRepository.createNode({
    graphType: "provider_capability",
    nodeType: "Worker",
    entityId: workerId,
    label: name,
    status: "active",
  });
  if (providerNodeId) {
    await linkWorkerToProvider(worker.id, providerNodeId);
  }
  return worker;
}

export async function addCredential(
  workerNodeId: string,
  credentialType: string,
  validUntil?: string
) {
  const cred = await graphRepository.createNode({
    graphType: "provider_capability",
    nodeType: "Credential",
    label: credentialType,
    status: "verified",
    data: { credentialType, validUntil },
  });
  await graphRepository.createEdge({
    graphType: "provider_capability",
    edgeType: "HAS_CREDENTIAL",
    fromNodeId: workerNodeId,
    toNodeId: cred.id,
  });
  return cred;
}

export async function addCapability(
  label: string,
  key: string
) {
  return graphRepository.createNode({
    graphType: "provider_capability",
    nodeType: "Capability",
    label,
    entityId: key,
    status: "active",
    data: { capabilityKey: key },
  });
}

export async function linkWorkerToProvider(
  workerNodeId: string,
  providerNodeId: string
) {
  return graphRepository.createEdge({
    graphType: "provider_capability",
    edgeType: "DELIVERED_BY",
    fromNodeId: workerNodeId,
    toNodeId: providerNodeId,
  });
}

export async function linkWorkerToCapability(
  workerNodeId: string,
  capabilityNodeId: string
) {
  return graphRepository.createEdge({
    graphType: "provider_capability",
    edgeType: "HAS_CAPABILITY",
    fromNodeId: workerNodeId,
    toNodeId: capabilityNodeId,
  });
}

export async function checkWorkerSuitability(
  workerNodeId: string,
  requiredCapabilities: string[]
): Promise<{ suitable: boolean; missing: string[]; matched: string[] }> {
  const neighbourhood = await graphRepository.getNeighbourhood(workerNodeId, 2);
  const caps = neighbourhood.nodes
    .filter((n) => n.nodeType === "Capability")
    .map((n) => String(n.entityId ?? n.data.capabilityKey ?? n.label));

  const matched = requiredCapabilities.filter((r) => caps.includes(r));
  const missing = requiredCapabilities.filter((r) => !caps.includes(r));

  return {
    suitable: missing.length === 0,
    missing,
    matched,
  };
}

export async function recordProviderReliabilitySignal(
  providerNodeId: string,
  signal: string,
  score?: number
) {
  const node = await graphRepository.getNode(providerNodeId);
  if (!node) throw new Error("Provider node not found");
  return graphRepository.updateNode(providerNodeId, {
    data: {
      ...node.data,
      reliabilitySignals: [
        ...((node.data.reliabilitySignals as unknown[]) ?? []),
        { signal, score, at: new Date().toISOString() },
      ],
    },
  });
}

export function inferRequiredCapabilities(
  supportNeedLabel: string
): string[] {
  const haystack = supportNeedLabel.toLowerCase();
  const required: string[] = [];
  for (const [cap, keywords] of Object.entries(CAPABILITY_KEYWORDS)) {
    if (keywords.some((k) => haystack.includes(k))) required.push(cap);
  }
  return required.length ? required : ["communication_support"];
}
