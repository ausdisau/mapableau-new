import {
  NDIS_COMPLIANCE_ACTIONS_URL,
  NDIS_PROVIDER_REGISTER_URL,
  parseDirectoryActivity,
  type DirectoryActivity,
} from "@/lib/provider/finder/evidence";
import { auditSupportIntelligence } from "@/lib/support-intelligence/audit";
import {
  isCapabilityEnabled,
  supportIntelligenceFlags,
} from "@/lib/support-intelligence/config/feature-flags";
import { getCached, setCached, cacheKey } from "@/lib/support-intelligence/cache";
import { buildProvenance } from "@/lib/support-intelligence/provenance";
import type {
  Claim,
  EvidenceState,
  HumanReviewReason,
  Provenance,
  SupportIntelligenceDenied,
} from "@/lib/support-intelligence/types";

export type RegulatoryLookupInput = {
  abn?: string | null;
  providerName?: string | null;
  directoryActive?: unknown;
  sourceDate?: string | null;
  actorUserId?: string | null;
};

export type RegulatoryLookupResult =
  | {
      ok: true;
      registration: EvidenceState;
      enforcement: EvidenceState;
      directoryActivity: DirectoryActivity;
      claims: Claim[];
      provenance: Provenance[];
      officialCheckUrls: string[];
      humanReviewRequired: boolean;
      humanReviewReasons: HumanReviewReason[];
    }
  | SupportIntelligenceDenied;

/** Synthetic conflict ABNs for acceptance tests only. */
export const SYNTHETIC_REG_CONFLICT_ABN = "00000000000";

/**
 * Regulatory Evidence Gateway — public monitoring only.
 * Never invents live Commission registration or enforcement outcomes.
 */
export async function lookupRegulatoryEvidence(
  input: RegulatoryLookupInput,
): Promise<RegulatoryLookupResult> {
  if (!isCapabilityEnabled("regulatory")) {
    return {
      ok: false,
      reasonCode: supportIntelligenceFlags.killSwitch
        ? "kill_switch"
        : "capability_disabled",
      message: "Regulatory Evidence Gateway is disabled (fail-closed).",
    };
  }

  const ck = cacheKey([
    "reg",
    input.abn ?? "",
    input.providerName ?? "",
    String(input.directoryActive ?? ""),
    input.sourceDate ?? "",
  ]);
  const cached = getCached<Exclude<RegulatoryLookupResult, SupportIntelligenceDenied>>(ck);
  if (cached) return cached;

  const directoryActivity = parseDirectoryActivity(input.directoryActive);
  const claims: Claim[] = [
    {
      field: "directory_activity",
      value: directoryActivity,
      state:
        directoryActivity === "unknown"
          ? "unknown"
          : directoryActivity === "active_in_source"
            ? "declared"
            : "declared",
      note: "Imported directory activity is not live Commission registration.",
      checkedAt: new Date().toISOString(),
    },
    {
      field: "commission_registration",
      value: null,
      state: "unknown",
      evidenceUrl: NDIS_PROVIDER_REGISTER_URL,
      note: "Live registration must be confirmed via the official register.",
      checkedAt: new Date().toISOString(),
    },
    {
      field: "enforcement_actions",
      value: null,
      state: "unknown",
      evidenceUrl: NDIS_COMPLIANCE_ACTIONS_URL,
      note: "Public enforcement lists are advisory; human review required for conflicts.",
      checkedAt: new Date().toISOString(),
    },
  ];

  const humanReviewReasons: HumanReviewReason[] = [];
  if (input.abn === SYNTHETIC_REG_CONFLICT_ABN) {
    claims.push({
      field: "commission_registration",
      value: "conflict_fixture",
      state: "conflict",
      note: "Synthetic fixture: directory active vs conflict signal.",
      checkedAt: new Date().toISOString(),
    });
    humanReviewReasons.push("regulatory_conflict");
  }

  if (input.sourceDate) {
    const ageMs = Date.now() - new Date(input.sourceDate).getTime();
    if (Number.isFinite(ageMs) && ageMs > 365 * 24 * 60 * 60 * 1000) {
      claims.push({
        field: "directory_freshness",
        value: input.sourceDate,
        state: "stale",
        note: "Directory source date older than 12 months.",
        checkedAt: new Date().toISOString(),
      });
      humanReviewReasons.push("stale_registration_signal");
    }
  }

  const provenance = [
    buildProvenance({
      sourceKind: "ndis_commission_public",
      sourceUrl: NDIS_PROVIDER_REGISTER_URL,
      raw: {
        abnPresent: Boolean(input.abn),
        directoryActivity,
      },
      licenseAndReuse: "Official public register links — no scraped private records",
    }),
  ];

  const result: Exclude<RegulatoryLookupResult, SupportIntelligenceDenied> = {
    ok: true,
    registration: humanReviewReasons.includes("regulatory_conflict")
      ? "conflict"
      : "unknown",
    enforcement: "unknown",
    directoryActivity,
    claims,
    provenance,
    officialCheckUrls: [
      NDIS_PROVIDER_REGISTER_URL,
      NDIS_COMPLIANCE_ACTIONS_URL,
    ],
    humanReviewRequired: humanReviewReasons.length > 0,
    humanReviewReasons,
  };

  if (result.humanReviewRequired) {
    await auditSupportIntelligence({
      action: "support_intel.reg.conflict_queued",
      actorUserId: input.actorUserId,
      entityType: "RegulatoryEvidence",
      entityId: input.abn ?? input.providerName ?? undefined,
      metadata: { reasons: humanReviewReasons },
    });
  } else {
    await auditSupportIntelligence({
      action: "support_intel.reg.lookup",
      actorUserId: input.actorUserId,
      entityType: "RegulatoryEvidence",
      entityId: input.abn ?? input.providerName ?? undefined,
      metadata: { directoryActivity },
    });
  }

  setCached(ck, result, 10 * 60 * 1000);
  return result;
}
