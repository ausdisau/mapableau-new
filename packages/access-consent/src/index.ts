/**
 * @mapable/access-consent — disclosure purpose codes for partner integrations.
 */

export const ACCESS_INTELLIGENCE_PURPOSE_CODES = [
  "access.passport_share_preview",
  "access.visit_plan_share",
  "access.venue_message",
  "access.barrier_report",
  "access.supporter_notification",
  "transport.pickup_address",
] as const;

export type AccessIntelligencePurposeCode =
  (typeof ACCESS_INTELLIGENCE_PURPOSE_CODES)[number];

export type DisclosureGrant = {
  purposeCode: AccessIntelligencePurposeCode;
  fieldsShared: string[];
  fieldsOmitted: string[];
  recipientLabel: string;
  expiresAt: string;
};
