import type {
  BillingFundingSourceType,
  FundingSourceType,
} from "@prisma/client";

import { billingFundingTypeToFundingRoute } from "@/lib/ndis-gateway/compatibility/from-billing-funding";
import { fundingSourceTypeToFundingRoute } from "@/lib/ndis-gateway/compatibility/from-funding-source";
import { fundingRouteToFundingSourceType } from "@/lib/ndis-gateway/compatibility/to-funding-source-type";
import {
  allowsRegisteredProviderDirectClaim,
  type FundingRoute,
} from "@/lib/ndis-gateway/domain/funding-route";
import type {
  ClaimValidationFinding,
  NdiaProviderClaimPayload,
} from "@/lib/ndia-provider-claiming/types";
import { prisma } from "@/lib/prisma";

/**
 * Compatibility facade over lib/ndis-gateway billing funding maps.
 * Never defaults unsupported types to ndis_agency_managed.
 */
export function mapBillingFundingType(
  type: BillingFundingSourceType | null | undefined
): FundingSourceType | undefined {
  return fundingRouteToFundingSourceType(billingFundingTypeToFundingRoute(type));
}

function fundingTypeToRoute(
  fundingType: FundingSourceType | null | undefined
): FundingRoute {
  return fundingSourceTypeToFundingRoute(fundingType);
}

/**
 * Funding rules for registered-provider direct claiming.
 * Only NDIA-managed (agency-managed) is allowed; self/plan/private/unknown block.
 */
export function validateFundingForProviderClaim(
  fundingType: FundingSourceType | null | undefined
): ClaimValidationFinding[] {
  const findings: ClaimValidationFinding[] = [];
  const route = fundingTypeToRoute(fundingType);

  if (!allowsRegisteredProviderDirectClaim(route)) {
    switch (route) {
      case "plan_managed":
        findings.push({
          code: "plan_managed",
          severity: "error",
          message:
            "Plan-managed participants are claimed by the plan manager, not via registered provider direct claiming.",
        });
        break;
      case "self_managed":
        findings.push({
          code: "self_managed",
          severity: "error",
          message:
            "Self-managed participants must be invoiced to the participant, not submitted as registered-provider NDIA claims.",
        });
        break;
      case "private_pay":
        findings.push({
          code: "private_pay",
          severity: "error",
          message:
            "Private-pay invoices must not be submitted as NDIA provider claims.",
        });
        break;
      case "unknown":
        findings.push({
          code: "funding_unknown",
          severity: "error",
          message:
            "Funding type is missing or not recognised. Correct the funding source before creating a provider claim.",
        });
        break;
      case "ndia_managed":
        break;
      default: {
        const _exhaustive: never = route;
        void _exhaustive;
        findings.push({
          code: "funding_unknown",
          severity: "error",
          message:
            "Funding type is missing or not recognised. Correct the funding source before creating a provider claim.",
        });
      }
    }
    return findings;
  }

  findings.push({
    code: "agency_managed_ok",
    severity: "warning",
    message:
      "Agency-managed funding is the typical path for registered provider NDIA claims.",
  });
  return findings;
}

export async function validateClaimPayload(
  payload: NdiaProviderClaimPayload,
  organisationId: string
): Promise<ClaimValidationFinding[]> {
  const findings: ClaimValidationFinding[] = [];

  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
  });
  if (!org) {
    findings.push({
      code: "org_missing",
      severity: "error",
      message: "Organisation not found.",
    });
    return findings;
  }

  if (!org.ndisRegistrationClaimed || !org.ndisRegistrationNumber) {
    findings.push({
      code: "provider_not_registered",
      severity: "error",
      message:
        "Organisation must have NDIS registration claimed and a registration number on file.",
    });
  }

  if (payload.provider.ndisRegistrationNumber !== org.ndisRegistrationNumber) {
    findings.push({
      code: "registration_mismatch",
      severity: "error",
      message: "Claim registration number does not match organisation record.",
    });
  }

  if (!payload.participant.ndisNumber) {
    findings.push({
      code: "participant_ndis_missing",
      severity: "error",
      message:
        "Participant NDIS number is required. Add it to the participant profile (encrypted at rest).",
    });
  }

  if (payload.lines.length === 0) {
    findings.push({
      code: "no_lines",
      severity: "error",
      message: "At least one claim line with a support item code is required.",
    });
  }

  for (const line of payload.lines) {
    if (!line.supportItemCode?.trim()) {
      findings.push({
        code: "missing_support_item",
        severity: "error",
        message: `Line ${line.lineNumber}: missing NDIS support item code.`,
      });
    } else {
      const item = await prisma.ndisSupportItem.findUnique({
        where: { code: line.supportItemCode },
      });
      if (!item?.active) {
        findings.push({
          code: "unknown_support_item",
          severity: "warning",
          message: `Line ${line.lineNumber}: support item ${line.supportItemCode} not in active catalogue.`,
        });
      } else if (
        item.priceCapCents != null &&
        line.unitPriceCents > item.priceCapCents
      ) {
        findings.push({
          code: "price_above_cap",
          severity: "error",
          message: `Line ${line.lineNumber}: unit price exceeds catalogue cap for ${line.supportItemCode}.`,
        });
      }
    }
    if (line.quantity <= 0) {
      findings.push({
        code: "invalid_quantity",
        severity: "error",
        message: `Line ${line.lineNumber}: quantity must be positive.`,
      });
    }
  }

  return findings;
}

export function hasBlockingFindings(findings: ClaimValidationFinding[]): boolean {
  return findings.some((f) => f.severity === "error");
}
