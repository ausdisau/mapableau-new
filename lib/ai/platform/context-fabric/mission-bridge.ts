/**
 * Light Mission Runtime bridge — query fabric context when flags on.
 * Does not recreate Mission Runtime; never invents verified facts from inference.
 */

import type { EvidenceBundle, EvidenceItem } from "@/lib/ai/platform/missions/types";
import { isContextFabricEnabled } from "@/lib/config/context-fabric";

import { queryMissionContext } from "./query";
import type { MapAbleContextRecord } from "./types";

export function mergeFabricContextIntoEvidence(input: {
  missionId: string;
  participantId: string;
  actorId: string;
  tenantId?: string;
  consentScopes: string[];
  evidence: EvidenceBundle;
}): EvidenceBundle {
  if (!isContextFabricEnabled()) return input.evidence;

  const tenantId = input.tenantId ?? "default";
  const result = queryMissionContext({
    missionId: input.missionId,
    participantId: input.participantId,
    tenantId,
    consentScopes: input.consentScopes,
    actor: {
      actorId: input.actorId,
      role: "participant",
      tenantId,
    },
  });

  if (!result.fabricEnabled || result.records.length === 0) {
    return input.evidence;
  }

  const next: EvidenceBundle = {
    ...input.evidence,
    verified: [...input.evidence.verified],
    participantSupplied: [...input.evidence.participantSupplied],
    systemSupplied: [...input.evidence.systemSupplied],
    inferred: [...input.evidence.inferred],
    stale: [...input.evidence.stale],
    missing: [...input.evidence.missing],
  };

  for (const record of result.records) {
    const item = contextRecordToEvidenceItem(record);
    if (record.sourceType === "model_inference") {
      next.inferred.push(item);
    } else if (
      record.sourceType === "participant_declared" ||
      record.sourceType === "community_observation"
    ) {
      next.participantSupplied.push(item);
    } else if (
      record.verificationStatus === "verified" &&
      (record.sourceType === "verified_system_record" ||
        record.sourceType === "authenticated_provider_record" ||
        record.sourceType === "public_authoritative_source")
    ) {
      next.verified.push({ ...item, verified: true });
    } else {
      next.systemSupplied.push(item);
    }

    if (
      record.freshnessStatus === "stale" ||
      record.freshnessStatus === "expired"
    ) {
      next.stale.push({ ...item, stale: true });
    }
  }

  for (const t of result.missingTypes) {
    const key = `fabric:${t}`;
    if (!next.missing.includes(key)) next.missing.push(key);
  }

  return next;
}

function contextRecordToEvidenceItem(record: MapAbleContextRecord): EvidenceItem {
  const origin =
    record.sourceType === "model_inference"
      ? "model_inference"
      : record.sourceType === "participant_declared"
        ? "participant_input"
        : record.domain === "access"
          ? "access_observation"
          : record.sourceType === "authenticated_provider_record"
            ? "provider_record"
            : "system_record";

  return {
    id: `fabric:${record.contextId}`,
    origin,
    label: record.contextType.replace(/_/g, " "),
    detail:
      typeof record.payload.summary === "string"
        ? record.payload.summary
        : `Context ${record.contextType} from ${record.sourceAuthority}`,
    verified: record.verificationStatus === "verified",
    observationDate: record.observedAt,
    verificationState: record.verificationStatus,
    limitations: [
      `source:${record.sourceType}`,
      `freshness:${record.freshnessStatus}`,
      ...(record.sourceType === "model_inference"
        ? ["Inference only — not verified evidence"]
        : []),
    ],
    stale:
      record.freshnessStatus === "stale" ||
      record.freshnessStatus === "expired",
  };
}
