import type {
  AuraAgentClassification,
  AuraAgentLifecycleStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Agent registry lookups. An unregistered agent slug or an agent whose current
 * lifecycle status is not `active` MUST NOT be able to plan or execute.
 */

export interface RegisteredAgent {
  id: string;
  slug: string;
  displayName: string;
  classification: AuraAgentClassification;
  status: AuraAgentLifecycleStatus;
  currentManifestId: string | null;
  productionActivated: boolean;
}

export async function findAgentBySlug(
  slug: string,
): Promise<RegisteredAgent | null> {
  const agent = await prisma.auraAgentDefinition.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      displayName: true,
      classification: true,
      status: true,
      currentManifestId: true,
      productionActivated: true,
    },
  });
  return agent;
}

export function isAgentUsable(agent: RegisteredAgent | null): boolean {
  if (!agent) return false;
  if (agent.status !== "active") return false;
  if (!agent.currentManifestId) return false;
  return true;
}

/** Explicit list of specialist agent slugs required by the pack. */
export const SPECIALIST_AGENT_SLUGS = [
  "core",
  "care",
  "transport",
  "jobs",
  "access",
  "billing-explain-only",
  "evidence",
  "recovery",
  "accessops",
  "participation",
] as const;

export type SpecialistAgentSlug = (typeof SPECIALIST_AGENT_SLUGS)[number];

export function isBillingSpecialist(slug: string): boolean {
  return slug === "billing-explain-only";
}
