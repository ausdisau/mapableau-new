import type { CanonicalClaimStatus } from "@/lib/ndis-gateway/domain/claim-status";
import type { EvidenceRef } from "@/lib/ndis-gateway/domain/evidence";
import type { FundingRoute } from "@/lib/ndis-gateway/domain/funding-route";
import type { PriceLimitRef } from "@/lib/ndis-gateway/domain/pricing";

export type CanonicalClaimSourceType =
  | "booking"
  | "care_shift"
  | "timesheet"
  | "ndis_invoice"
  | "billing_invoice"
  | "legacy_invoice"
  | "manual";

export type CanonicalClaimLine = {
  lineNumber: number;
  supportItemCode: string;
  supportDescription: string;
  serviceStartDate: string;
  serviceEndDate: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  gstIncluded: boolean;
  priceLimitRef?: PriceLimitRef | null;
  evidence?: EvidenceRef[];
};

export type CanonicalClaimProvider = {
  organisationId: string;
  name: string;
  abn: string | null;
  ndisRegistrationNumber: string | null;
  registrationClaimed: boolean;
};

export type CanonicalClaimParticipant = {
  mapableUserId: string;
  /** Masked only in ordinary domain views — never store raw here in Wave 1+. */
  ndisNumberMasked: string | null;
  displayName?: string | null;
};

export type CanonicalClaimTotals = {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
};

/**
 * Canonical claim shape shared by portal and provider engines.
 * Wave 2 adds encrypted snapshots; Wave 1 defines the type only.
 */
export type CanonicalNdisClaim = {
  id?: string;
  schemaVersion: "1";
  status: CanonicalClaimStatus;
  fundingRoute: FundingRoute;
  sourceType: CanonicalClaimSourceType;
  sourceId: string;
  provider: CanonicalClaimProvider;
  participant: CanonicalClaimParticipant;
  servicePeriod: {
    start: string;
    end: string;
  };
  lines: CanonicalClaimLine[];
  totals: CanonicalClaimTotals;
  correlationId?: string;
  payloadHash?: string;
  metadata?: Record<string, unknown>;
};
