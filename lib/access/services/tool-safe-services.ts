/**
 * Tool-safe deterministic domain services.
 * UI / HTTP / future MCP / A2A must call these — not bury behaviour in React.
 */

import { z } from "zod";

import {
  listAccessQuests,
  normalizeQuestAnswer,
  type AccessQuest,
} from "@/lib/access/quests";
import {
  projectObservationToPublicFeature,
  type PublicAccessFeature,
} from "@/lib/access/interop";
import {
  type NormalizedObservation,
} from "@/lib/integrations/access/contracts";
import { openInfrastructureFlags } from "@/lib/integrations/access/flags";
import {
  importProjectSidewalkLabel,
  type SidewalkImportResult,
} from "@/lib/integrations/access/project-sidewalk";
import {
  overtureBaseGeographyProvider,
  type BaseGeographyFeature,
  type GeographyQuery,
} from "@/lib/integrations/access/overture";
import { mapPanoramaxItemToObservation } from "@/lib/integrations/access/panoramax";

export const actorContextSchema = z
  .object({
    actorRef: z.string().min(1),
    /** Never put diagnosis / passport contents here. */
    permissionScope: z.enum(["public", "contributor", "operator", "system"]),
  })
  .strict();

export type ActorContext = z.infer<typeof actorContextSchema>;

export function listAccessQuestsService(actor: ActorContext): AccessQuest[] {
  actorContextSchema.parse(actor);
  if (!openInfrastructureFlags.accessQuests) {
    throw new Error("Access Quests disabled");
  }
  return listAccessQuests();
}

export function submitAccessObservationService(
  actor: ActorContext,
  payload: unknown,
): NormalizedObservation {
  actorContextSchema.parse(actor);
  return normalizeQuestAnswer(payload);
}

export function normalizePanoramaxEvidenceService(
  actor: ActorContext,
  payload: unknown,
): NormalizedObservation {
  actorContextSchema.parse(actor);
  if (!openInfrastructureFlags.enabled) {
    throw new Error("Open infrastructure disabled");
  }
  return mapPanoramaxItemToObservation(payload);
}

export function importProjectSidewalkService(
  actor: ActorContext,
  payload: unknown,
): SidewalkImportResult {
  actorContextSchema.parse(actor);
  if (!openInfrastructureFlags.projectSidewalk) {
    throw new Error("Project Sidewalk disabled");
  }
  return importProjectSidewalkLabel(payload);
}

export async function getBaseGeographyService(
  actor: ActorContext,
  query: GeographyQuery,
): Promise<BaseGeographyFeature[]> {
  actorContextSchema.parse(actor);
  return overtureBaseGeographyProvider.getFeatures(query);
}

export function projectPublicAccessFeatureService(
  actor: ActorContext,
  observation: NormalizedObservation,
  featureId: string,
): PublicAccessFeature {
  actorContextSchema.parse(actor);
  if (!openInfrastructureFlags.publicInteropApi) {
    throw new Error("Public interop API disabled");
  }
  return projectObservationToPublicFeature(observation, featureId);
}
