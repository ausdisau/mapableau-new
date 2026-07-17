import type { WorkerCredentialVerificationStatus } from "@prisma/client";

import { selfDeclaredEqualsVerified } from "@/lib/ndis-platform-trust/credentials/credential-policy";
import { prisma } from "@/lib/prisma";

export async function recordWorkerCredential(params: {
  organisationId: string;
  workerUserId: string;
  credentialType: string;
  verificationStatus?: WorkerCredentialVerificationStatus;
  expiresAt?: Date | null;
  documentId?: string | null;
  verifiedById?: string | null;
  notes?: string | null;
}) {
  const verificationStatus = params.verificationStatus ?? "self_declared";
  void selfDeclaredEqualsVerified(verificationStatus);

  return prisma.workerCredential.create({
    data: {
      organisationId: params.organisationId,
      workerUserId: params.workerUserId,
      credentialType: params.credentialType,
      verificationStatus,
      expiresAt: params.expiresAt ?? null,
      documentId: params.documentId ?? null,
      verifiedById:
        verificationStatus === "externally_verified"
          ? params.verifiedById ?? null
          : null,
      verifiedAt:
        verificationStatus === "externally_verified" ? new Date() : null,
      notes: params.notes ?? null,
    },
  });
}
