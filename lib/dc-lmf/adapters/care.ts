import type { DclmfProjection } from "@mapable/contracts";

import { isDcLmfCareProjectionEnabled } from "@/lib/config/dc-lmf";
import { projectContext } from "@/lib/dc-lmf/projection-service";

export type CareContextProjection = {
  participantId: string;
  generatedAt: string;
  access: DclmfProjection["records"];
  baseline: DclmfProjection["records"];
  preferences: DclmfProjection["records"];
  procedures: DclmfProjection["records"];
  corrections: DclmfProjection["records"];
  limitations: string[];
};

export async function buildCareContextProjection(input: {
  participantId: string;
  actorUserId: string;
  organisationId: string;
  purpose?: string;
}): Promise<CareContextProjection> {
  if (!isDcLmfCareProjectionEnabled()) {
    throw new Error("DC_LMF_CARE_PROJECTION_NOT_ENABLED");
  }

  const projection = await projectContext({
    schemaVersion: "1.0",
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    organisationId: input.organisationId,
    purpose: input.purpose ?? "care_service_delivery",
    service: "mapable_care",
    categories: [
      "access",
      "baseline",
      "preference",
      "procedural",
      "correction",
    ],
    consentScope: "care.accessibility_share",
    maxDataClass: "person_private",
    includeContested: false,
  });

  const category = (name: DclmfProjection["records"][number]["category"]) =>
    projection.records.filter((record) => record.category === name);

  return {
    participantId: projection.participantId,
    generatedAt: projection.generatedAt,
    access: category("access"),
    baseline: category("baseline"),
    preferences: category("preference"),
    procedures: category("procedural"),
    corrections: category("correction"),
    limitations: projection.limitations,
  };
}
