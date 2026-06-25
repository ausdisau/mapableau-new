import type { AttestationRecord } from "@/lib/contracts/types";
import { hashEvidenceObject } from "@/lib/contracts/hash";

export function createAttestation(params: {
  actorType: string;
  actorRef: string;
  claimType: string;
  evidence: unknown;
  verificationStatus?: AttestationRecord["verificationStatus"];
}): AttestationRecord {
  return {
    actorType: params.actorType,
    actorRef: params.actorRef,
    claimType: params.claimType,
    evidenceHash: hashEvidenceObject(params.evidence),
    timestamp: new Date().toISOString(),
    verificationStatus: params.verificationStatus ?? "pending",
  };
}
