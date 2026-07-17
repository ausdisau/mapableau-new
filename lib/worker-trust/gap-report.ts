import type { WorkerCredentialStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Explicit trust display states for gap reporting.
 * Missing checks must never be shown as passed / verified.
 */
export type WorkerTrustDisplayState =
  | "verified_current"
  | "verified_expiring"
  | "expired"
  | "check_pending"
  | "check_unavailable"
  | "disputed"
  | "suspended"
  | "prohibited"
  | "not_required"
  | "human_review_required"
  | "not_provided";

export type WorkerTrustGapRow = {
  workerProfileId: string;
  displayName: string;
  organisationId: string;
  active: boolean;
  screening: WorkerTrustDisplayState;
  wwcc: WorkerTrustDisplayState;
  firstAid: WorkerTrustDisplayState;
  insurance: WorkerTrustDisplayState;
  verification: WorkerTrustDisplayState;
  trustCredentialSummary: {
    pending: number;
    verified: number;
    expired: number;
    revoked: number;
    mockIssuerCount: number;
  };
  gapCodes: string[];
};

const EXPIRING_SOON_MS = 30 * 24 * 60 * 60 * 1000;

export function mapCredentialStatusToTrustState(
  status: WorkerCredentialStatus,
  options?: { screeningAdapterAvailable?: boolean }
): WorkerTrustDisplayState {
  const adapterAvailable = options?.screeningAdapterAvailable ?? false;

  switch (status) {
    case "verified":
      return "verified_current";
    case "expired":
      return "expired";
    case "pending_review":
      return "check_pending";
    case "rejected":
      return "human_review_required";
    case "not_provided":
      return adapterAvailable ? "not_provided" : "check_unavailable";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/** Hard rule: verified_current is the only state that may be described as passed. */
export function isTrustCheckPassed(state: WorkerTrustDisplayState): boolean {
  return state === "verified_current";
}

export async function buildWorkerTrustGapReport(options?: {
  organisationId?: string;
  take?: number;
  /** Live NDIS Worker Screening Database is not connected in this PR. */
  screeningAdapterAvailable?: boolean;
}): Promise<{
  generatedAt: string;
  screeningAdapterAvailable: boolean;
  disclaimer: string;
  rows: WorkerTrustGapRow[];
  summary: {
    workers: number;
    withGaps: number;
    screeningUnavailable: number;
    screeningNotPassed: number;
  };
}> {
  const screeningAdapterAvailable =
    options?.screeningAdapterAvailable ?? false;
  const take = options?.take ?? 200;

  const workers = await prisma.workerProfile.findMany({
    where: {
      ...(options?.organisationId
        ? { organisationId: options.organisationId }
        : {}),
    },
    take,
    orderBy: { updatedAt: "desc" },
    include: {
      trustCredentials: true,
    },
  });

  const rows: WorkerTrustGapRow[] = workers.map((worker) => {
    const screening = mapCredentialStatusToTrustState(
      worker.workerScreeningStatus,
      { screeningAdapterAvailable }
    );
    const wwcc = mapCredentialStatusToTrustState(worker.wwccStatus, {
      screeningAdapterAvailable,
    });
    const firstAid = mapCredentialStatusToTrustState(worker.firstAidStatus, {
      screeningAdapterAvailable: true,
    });
    const insurance = mapCredentialStatusToTrustState(worker.insuranceStatus, {
      screeningAdapterAvailable: true,
    });
    const verification = mapCredentialStatusToTrustState(
      worker.verificationStatus,
      { screeningAdapterAvailable: true }
    );

    const trustCredentialSummary = {
      pending: worker.trustCredentials.filter((c) => c.status === "pending")
        .length,
      verified: worker.trustCredentials.filter((c) => c.status === "verified")
        .length,
      expired: worker.trustCredentials.filter((c) => c.status === "expired")
        .length,
      revoked: worker.trustCredentials.filter((c) => c.status === "revoked")
        .length,
      mockIssuerCount: worker.trustCredentials.filter(
        (c) => c.verificationMethod === "mock"
      ).length,
    };

    const gapCodes: string[] = [];
    if (!isTrustCheckPassed(screening)) gapCodes.push("screening_not_passed");
    if (screening === "check_unavailable") {
      gapCodes.push("screening_adapter_unavailable");
    }
    if (!isTrustCheckPassed(wwcc) && wwcc !== "not_required") {
      gapCodes.push("wwcc_not_passed");
    }
    if (verification === "check_pending" || verification === "not_provided") {
      gapCodes.push("verification_incomplete");
    }
    if (trustCredentialSummary.mockIssuerCount > 0) {
      gapCodes.push("mock_trust_credential");
    }
    if (
      worker.trustCredentials.some(
        (c) =>
          c.status === "verified" &&
          c.expiresAt &&
          c.expiresAt.getTime() < Date.now() + EXPIRING_SOON_MS &&
          c.expiresAt.getTime() > Date.now()
      )
    ) {
      gapCodes.push("credential_expiring");
    }

    return {
      workerProfileId: worker.id,
      displayName: worker.displayName,
      organisationId: worker.organisationId,
      active: worker.active,
      screening,
      wwcc,
      firstAid,
      insurance,
      verification,
      trustCredentialSummary,
      gapCodes,
    };
  });

  const withGaps = rows.filter((r) => r.gapCodes.length > 0).length;

  return {
    generatedAt: new Date().toISOString(),
    screeningAdapterAvailable,
    disclaimer:
      "Worker trust gap report. Missing or unavailable checks are never shown as passed. No live screening or banning-order API is connected in this release. Mock trust credentials are flagged explicitly.",
    rows,
    summary: {
      workers: rows.length,
      withGaps,
      screeningUnavailable: rows.filter((r) => r.screening === "check_unavailable")
        .length,
      screeningNotPassed: rows.filter((r) => !isTrustCheckPassed(r.screening))
        .length,
    },
  };
}
