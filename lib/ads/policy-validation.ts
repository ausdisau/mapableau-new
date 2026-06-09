import type { AdAdvertiserCategory } from "@prisma/client";

import { AD_ALT_TEXT_MIN_LENGTH } from "@/lib/ads/config";

export interface PolicyValidationResult {
  passed: boolean;
  violations: string[];
}

/** Categories that must never advertise on MapAble. */
export const BANNED_ADVERTISER_CATEGORIES: string[] = [
  "gambling",
  "high_interest_lending",
  "miracle_cures",
  "weight_loss_pressure",
];

const BANNED_COPY_PATTERNS: RegExp[] = [
  /\bgambl(e|ing)\b/i,
  /\bpayday\s+loan\b/i,
  /\bmiracle\s+cure\b/i,
  /\blose\s+weight\s+fast\b/i,
  /\bndis\s+funds?\s+expir/i,
  /\bact\s+now\s+before\s+your\s+ndis\b/i,
  /\bburden\b.*\b(family|carer)\b/i,
  /\btrag(e|i)dy\b.*\b(disabled|disability)\b/i,
  /\bsuffer(s|ing)?\s+from\b/i,
  /\bfake\s+urgency\b/i,
  /\bguaranteed\s+ndis\s+approval\b/i,
];

export function validateAdvertiserCategory(
  category: AdAdvertiserCategory
): PolicyValidationResult {
  const violations: string[] = [];
  if ((BANNED_ADVERTISER_CATEGORIES as string[]).includes(category)) {
    violations.push(`Advertiser category "${category}" is not permitted.`);
  }
  return { passed: violations.length === 0, violations };
}

export function validateAdCopy(fields: {
  headline: string;
  body?: string | null;
  altText: string;
  ctaLabel: string;
}): PolicyValidationResult {
  const violations: string[] = [];
  const texts = [
    fields.headline,
    fields.body ?? "",
    fields.altText,
    fields.ctaLabel,
  ];

  if (fields.altText.trim().length < AD_ALT_TEXT_MIN_LENGTH) {
    violations.push(
      `Alt text must be at least ${AD_ALT_TEXT_MIN_LENGTH} characters for accessibility.`
    );
  }

  for (const text of texts) {
    for (const pattern of BANNED_COPY_PATTERNS) {
      if (pattern.test(text)) {
        violations.push(`Copy violates advertising policy: matched "${pattern.source}".`);
        break;
      }
    }
  }

  return { passed: violations.length === 0, violations: [...new Set(violations)] };
}

export function validateTargetingObject(
  targeting: unknown
): PolicyValidationResult {
  const violations: string[] = [];
  if (!targeting || typeof targeting !== "object") {
    violations.push("Targeting configuration is required.");
    return { passed: false, violations };
  }

  const obj = targeting as Record<string, unknown>;
  const sensitiveKeys = [
    "disabilityType",
    "disability_type",
    "diagnosis",
    "healthCondition",
    "ndisPlanValue",
    "mobilityAid",
    "supportNeeds",
    "age",
    "carerStress",
    "participantProfile",
  ];

  for (const key of Object.keys(obj)) {
    if (sensitiveKeys.includes(key)) {
      violations.push(`Targeting must not use sensitive participant data: "${key}".`);
    }
  }

  const placements = obj.placements;
  if (!Array.isArray(placements) || placements.length === 0) {
    violations.push("At least one ad placement is required.");
  }

  return { passed: violations.length === 0, violations };
}

export function validateCampaignForSubmit(campaign: {
  name: string;
  creatives: {
    headline: string;
    body: string | null;
    altText: string;
    ctaLabel: string;
    placements: string[];
  }[];
  targeting: unknown;
  category: AdAdvertiserCategory;
}): PolicyValidationResult {
  const allViolations: string[] = [];

  const cat = validateAdvertiserCategory(campaign.category);
  allViolations.push(...cat.violations);

  const tgt = validateTargetingObject(campaign.targeting);
  allViolations.push(...tgt.violations);

  if (campaign.creatives.length === 0) {
    allViolations.push("At least one creative is required before submit.");
  }

  for (const creative of campaign.creatives) {
    const copy = validateAdCopy(creative);
    allViolations.push(...copy.violations);
  }

  return {
    passed: allViolations.length === 0,
    violations: [...new Set(allViolations)],
  };
}
