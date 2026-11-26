import type { Evidence } from './types';
import { uniqueSorted } from './types';
import { assessEvidence } from './evidence';

export type ServiceNodeKind = 'service' | 'place' | 'transport' | 'resource' | 'goal';
export interface ServiceNode {
  id: string;
  kind: ServiceNodeKind;
  active: boolean;
  evidence: Evidence;
}
export interface ServiceLink {
  fromId: string;
  toId: string;
  relation: 'requires' | 'connects_to' | 'offered_at';
}
export interface DependencyPlan {
  status: 'verified_dependencies' | 'needs_review';
  /** Dependencies first, then goal/target. Does not execute any service. */
  orderedNodeIds: string[];
  missingNodeIds: string[];
  unverifiedNodeIds: string[];
  cycles: string[][];
}

/** Analyse required service chains, without assuming proximity or a listing makes a service usable. */
export function planServiceDependencies(input: {
  targetId: string;
  nodes: readonly ServiceNode[];
  links: readonly ServiceLink[];
  at: string;
}): DependencyPlan {
  const nodes = new Map(input.nodes.map((node) => [node.id, node]));
  const requires = new Map<string, string[]>();
  for (const link of input.links) {
    if (link.relation !== 'requires') continue;
    const list = requires.get(link.fromId) ?? [];
    list.push(link.toId);
    requires.set(link.fromId, list);
  }
  const missing = new Set<string>();
  const unverified = new Set<string>();
  const visited = new Set<string>();
  const visiting: string[] = [];
  const ordered: string[] = [];
  const cycles: string[][] = [];
  function visit(id: string): void {
    const loopIndex = visiting.indexOf(id);
    if (loopIndex >= 0) {
      cycles.push([...visiting.slice(loopIndex), id]);
      return;
    }
    if (visited.has(id)) return;
    const node = nodes.get(id);
    if (!node) { missing.add(id); return; }
    visiting.push(id);
    if (!node.active || !assessEvidence(node.evidence, input.at).usableForVerifiedClaim) unverified.add(id);
    for (const dep of uniqueSorted(requires.get(id) ?? [])) visit(dep);
    visiting.pop();
    visited.add(id);
    ordered.push(id);
  }
  visit(input.targetId);
  return {
    status: !missing.size && !unverified.size && !cycles.length ? 'verified_dependencies' : 'needs_review',
    orderedNodeIds: ordered,
    missingNodeIds: uniqueSorted([...missing]),
    unverifiedNodeIds: uniqueSorted([...unverified]),
    cycles,
  };
}
