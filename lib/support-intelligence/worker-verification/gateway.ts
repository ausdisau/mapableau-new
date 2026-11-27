import { NDIS_WORKER_SCREENING_URL } from "@/lib/provider/finder/evidence";
import { auditSupportIntelligence } from "@/lib/support-intelligence/audit";
import {
  isCapabilityEnabled,
  supportIntelligenceFlags,
} from "@/lib/support-intelligence/config/feature-flags";
import { buildProvenance } from "@/lib/support-intelligence/provenance";
import type {
  Claim,
  EvidenceState,
  HumanReviewReason,
  Provenance,
  SupportIntelligenceDenied,
} from "@/lib/support-intelligence/types";

export type WorkerVerificationInput = {
  /** MapAble worker profile id — never a scraped external screening ID. */
  workerProfileId: string;
  /** Existing internal status from WorkerProfile (opaque enum string). */
  internalScreeningStatus?: string | null;
  /** Optional display name tokens for ambiguity checks (not sent externally). */
  identityTokens?: string[];
  actorUserId: string;
  consentGranted: boolean;
  consentWithdrawn?: boolean;
};

export type WorkerVerificationResult =
  | {
      ok: true;
      screening: EvidenceState;
      claims: Claim[];
      provenance: Provenance[];
      officialCheckUrls: string[];
      humanReviewRequired: boolean;
      humanReviewReasons: HumanReviewReason[];
    }
  | SupportIntelligenceDenied;

const AMBIGUOUS_TOKEN = "ambiguous-identity-fixture";

/**
 * Worker Verification Gateway — authorised, consent-gated workflows only.
 * Does not crawl or query external worker-screening databases.
 */
export async function lookupWorkerVerification(
  input: WorkerVerificationInput,
): Promise<WorkerVerificationResult> {
  if (!isCapabilityEnabled("worker_verification")) {
    return {
      ok: false,
      reasonCode: supportIntelligenceFlags.killSwitch
        ? "kill_switch"
        : "capability_disabled",
      message: "Worker Verification Gateway is disabled (fail-closed).",
    };
  }

  if (input.consentWithdrawn) {
    await auditSupportIntelligence({
      action: "support_intel.consent.blocked",
      actorUserId: input.actorUserId,
      entityType: "WorkerVerification",
      entityId: input.workerProfileId,
      metadata: { reason: "consent_withdrawn" },
    });
    return {
      ok: false,
      reasonCode: "consent_withdrawn",
      message: "Consent withdrawn — worker verification lookup denied.",
    };
  }

  if (!input.consentGranted) {
    await auditSupportIntelligence({
      action: "support_intel.consent.blocked",
      actorUserId: input.actorUserId,
      entityType: "WorkerVerification",
      entityId: input.workerProfileId,
      metadata: { reason: "consent_missing" },
    });
    return {
      ok: false,
      reasonCode: "consent_missing",
      message: "Authorised consent is required for worker verification workflows.",
    };
  }

  const humanReviewReasons: HumanReviewReason[] = [];
  const tokens = input.identityTokens ?? [];
  if (
    tokens.some((t) => t.toLowerCase().includes(AMBIGUOUS_TOKEN)) ||
    tokens.filter(Boolean).length > 3
  ) {
    humanReviewReasons.push("ambiguous_worker_identity");
  }

  let screening: EvidenceState = "unknown";
  const status = (input.internalScreeningStatus ?? "").toLowerCase();
  if (status === "verified") screening = "declared";
  else if (status === "rejected" || status === "expired") screening = "declared";
  else if (status === "pending_review") screening = "unknown";
  else screening = "unknown";

  const claims: Claim[] = [
    {
      field: "internal_screening_status",
      value: input.internalScreeningStatus ?? null,
      state: screening,
      note:
        "MapAble-internal document workflow status only — not a live NWSD / Commission clearance assertion.",
      checkedAt: new Date().toISOString(),
      attributedTo: "mapable_worker_profile",
    },
    {
      field: "live_worker_screening",
      value: null,
      state: "unknown",
      evidenceUrl: NDIS_WORKER_SCREENING_URL,
      note: "Live screening confirmation requires authorised human pathways.",
      checkedAt: new Date().toISOString(),
    },
  ];

  if (humanReviewReasons.includes("ambiguous_worker_identity")) {
    await auditSupportIntelligence({
      action: "support_intel.wvg.ambiguous_identity",
      actorUserId: input.actorUserId,
      entityType: "WorkerVerification",
      entityId: input.workerProfileId,
      metadata: { tokenCount: tokens.length },
    });
  } else {
    await auditSupportIntelligence({
      action: "support_intel.wvg.lookup",
      actorUserId: input.actorUserId,
      entityType: "WorkerVerification",
      entityId: input.workerProfileId,
      metadata: { screening },
    });
  }

  return {
    ok: true,
    screening,
    claims,
    provenance: [
      buildProvenance({
        sourceKind: "authorised_screening",
        sourceUrl: NDIS_WORKER_SCREENING_URL,
        raw: {
          workerProfileId: input.workerProfileId,
          internalStatus: input.internalScreeningStatus ?? null,
        },
        licenseAndReuse:
          "No external screening-database crawl; internal status + official human check links only",
      }),
    ],
    officialCheckUrls: [NDIS_WORKER_SCREENING_URL],
    humanReviewRequired: humanReviewReasons.length > 0,
    humanReviewReasons,
  };
}
