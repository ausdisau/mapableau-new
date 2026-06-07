import { buildBatchClaimPayload } from "@/lib/ndis/claiming/build-batch-claim";
import type { NdisClaimingAdapter } from "@/lib/ndis/claiming/types";
import { isNdiaLiveSubmitAllowed } from "@/lib/ndia/shared/config";
import { NdiaApiError } from "@/lib/ndia/shared/ndia-errors";
import {
  getNdiaClaimStatus,
  submitNdiaClaimBody,
} from "@/lib/ndia/shared/ndia-http-client";
import { prisma } from "@/lib/prisma";

export class NdiaApiAdapter implements NdisClaimingAdapter {
  async submitClaimBatch(batchId: string): Promise<{ externalReference?: string }> {
    if (!isNdiaLiveSubmitAllowed()) {
      throw new NdiaApiError(
        "NDIA live submit not configured — use portal CSV export",
        "validation"
      );
    }

    const built = await buildBatchClaimPayload(batchId);
    if (!built.ok) {
      throw new NdiaApiError(built.error, "validation");
    }

    const result = await submitNdiaClaimBody(built.requestBody);

    await prisma.ndisClaimBatch.update({
      where: { id: batchId },
      data: {
        status: "submitted",
        submittedAt: new Date(),
        exportFileName: `ndia-api-${built.batchReference}`,
        exportChecksum: result.externalClaimId,
      },
    });

    await prisma.ndisClaimLine.updateMany({
      where: { batchId },
      data: { status: "submitted" },
    });

    return { externalReference: result.externalClaimId };
  }

  async getClaimStatus(externalReference: string): Promise<{ status: string }> {
    const result = await getNdiaClaimStatus(externalReference);
    return { status: result.status };
  }

  async getParticipantBudget(_participantNumber: string): Promise<unknown> {
    throw new NdiaApiError(
      "Participant budget lookup not configured",
      "validation"
    );
  }

  async getProviderRelationshipStatus(
    _participantNumber: string,
    _providerRegistrationNumber: string
  ): Promise<{ status: string }> {
    throw new NdiaApiError(
      "Provider relationship lookup not configured",
      "validation"
    );
  }
}

export const ndiaApiAdapter = new NdiaApiAdapter();
