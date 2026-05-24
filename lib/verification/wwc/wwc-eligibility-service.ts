import type { WwcVerificationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  describeWwcRequirementReasons,
  requiresWwcForBooking,
  type WwcRequirementInput,
} from "@/lib/verification/wwc/wwc-requirement-rules";
import type { WwcBookingContext, WwcEligibilityResult } from "@/types/wwc-verification";
import {
  WWC_STATUS_ALLOWS_CHILD_SUPPORT,
  WWC_STATUS_BLOCKS_MATCHING,
} from "@/types/wwc-verification";

export function publicBadgeLabelForStatus(
  status: WwcVerificationStatus | null
): string {
  if (!status || status === "draft" || status === "pending_review") {
    return "Check in progress";
  }
  if (status === "approved" || status === "not_required") {
    return "Child-related checks complete";
  }
  if (status === "needs_more_information") {
    return "Additional information required";
  }
  return "Not available for child-related support";
}

export async function getActiveWwcVerification(workerProfileId: string) {
  return prisma.wwcVerification.findFirst({
    where: {
      workerProfileId,
      status: { in: ["approved", "not_required", "pending_review", "needs_more_information"] },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getLatestWwcVerification(workerProfileId: string) {
  return prisma.wwcVerification.findFirst({
    where: { workerProfileId },
    orderBy: { updatedAt: "desc" },
  });
}

function statusAllowsChildSupport(status: WwcVerificationStatus | null): boolean {
  if (!status) return false;
  return WWC_STATUS_ALLOWS_CHILD_SUPPORT.includes(
    status as (typeof WWC_STATUS_ALLOWS_CHILD_SUPPORT)[number]
  );
}

function statusBlocksMatching(status: WwcVerificationStatus | null): boolean {
  if (!status) return true;
  return WWC_STATUS_BLOCKS_MATCHING.includes(
    status as (typeof WWC_STATUS_BLOCKS_MATCHING)[number]
  );
}

export async function getMissingWwcRequirements(
  workerProfileId: string,
  bookingContext: WwcBookingContext & { careRequestType?: WwcRequirementInput["careRequestType"] }
): Promise<string[]> {
  const input: WwcRequirementInput = bookingContext;
  if (!requiresWwcForBooking(input)) return [];

  const missing: string[] = [];
  const verification = await getLatestWwcVerification(workerProfileId);

  if (!verification) {
    missing.push("No Working With Children Check on file");
    return missing;
  }

  if (verification.status === "pending_review" || verification.status === "draft") {
    missing.push("WWC check awaiting MapAble review");
  }
  if (verification.status === "needs_more_information") {
    missing.push("Additional WWC information required");
  }
  if (
    verification.status === "rejected" ||
    verification.status === "expired" ||
    verification.status === "suspended" ||
    verification.status === "barred"
  ) {
    missing.push(`WWC status: ${verification.status.replace(/_/g, " ")}`);
  }
  if (verification.expiresAt && verification.expiresAt < new Date()) {
    missing.push("WWC has expired");
  }

  return missing;
}

export async function canWorkerPerformChildRelatedSupport(
  workerProfileId: string,
  bookingContext: WwcBookingContext & { careRequestType?: WwcRequirementInput["careRequestType"] }
): Promise<WwcEligibilityResult> {
  const input: WwcRequirementInput = bookingContext;
  const required = requiresWwcForBooking(input);
  const reasons = describeWwcRequirementReasons(input);

  if (!required) {
    return {
      required: false,
      allowed: true,
      reasons: [],
      missingRequirements: [],
      activeVerificationStatus: null,
      publicBadgeLabel: "Not required for this booking",
    };
  }

  if (bookingContext.safeguardingRestrictionActive) {
    return {
      required: true,
      allowed: false,
      reasons,
      missingRequirements: ["Safeguarding restriction active"],
      activeVerificationStatus: null,
      publicBadgeLabel: publicBadgeLabelForStatus(null),
    };
  }

  const verification = await getLatestWwcVerification(workerProfileId);
  const status = verification?.status ?? null;
  const missing = await getMissingWwcRequirements(workerProfileId, bookingContext);

  const expired =
    verification?.expiresAt != null && verification.expiresAt < new Date();
  const allowed =
    statusAllowsChildSupport(status) &&
    !expired &&
    !statusBlocksMatching(status) &&
    missing.length === 0;

  return {
    required: true,
    allowed,
    reasons,
    missingRequirements: missing,
    activeVerificationStatus: status,
    publicBadgeLabel: publicBadgeLabelForStatus(status),
  };
}

export async function syncWorkerWwccStatus(workerProfileId: string) {
  const verification = await getLatestWwcVerification(workerProfileId);
  if (!verification) return;

  let wwccStatus: "not_provided" | "pending_review" | "verified" | "expired" | "rejected" =
    "pending_review";

  if (verification.status === "approved" || verification.status === "not_required") {
    wwccStatus =
      verification.expiresAt && verification.expiresAt < new Date()
        ? "expired"
        : "verified";
  } else if (
    verification.status === "expired" ||
    verification.status === "suspended" ||
    verification.status === "barred"
  ) {
    wwccStatus = "expired";
  } else if (verification.status === "rejected") {
    wwccStatus = "rejected";
  } else {
    wwccStatus = "pending_review";
  }

  await prisma.workerProfile.update({
    where: { id: workerProfileId },
    data: { wwccStatus },
  });
}
