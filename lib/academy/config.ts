import { z } from "zod";

export const academyConfigSchema = z.object({
  enabled: z.boolean().default(true),
  issuerName: z.string().default("MapAble Academy"),
  /** Days until Certificate of Completion expires; null = no expiry. */
  defaultCredentialExpiryDays: z.number().int().positive().nullable().default(365),
  publicCredentialsRequireOptIn: z.boolean().default(true),
});

export type AcademyConfig = z.infer<typeof academyConfigSchema>;

export function getAcademyConfig(): AcademyConfig {
  return academyConfigSchema.parse({
    enabled: process.env.ACADEMY_ENABLED !== "false",
    issuerName: process.env.ACADEMY_ISSUER_NAME ?? "MapAble Academy",
    defaultCredentialExpiryDays: process.env.ACADEMY_CREDENTIAL_EXPIRY_DAYS
      ? Number(process.env.ACADEMY_CREDENTIAL_EXPIRY_DAYS)
      : 365,
    publicCredentialsRequireOptIn:
      process.env.ACADEMY_PUBLIC_CREDENTIALS_REQUIRE_OPT_IN !== "false",
  });
}

/** Capability strings stored on AcademyMembership.entitlements */
export const ACADEMY_ENTITLEMENTS = [
  "academy:learn",
  "academy:provider:admin",
  "academy:studio:author",
  "academy:review:disability_led",
  "academy:review:compliance",
  "academy:review:clinical",
  "academy:assess:assigned",
  "academy:admin",
  "academy:audit:read",
] as const;

export type AcademyEntitlement = (typeof ACADEMY_ENTITLEMENTS)[number];

export const CAPABILITY_LEVEL_DISCLAIMER =
  "Bronze, Silver and Gold are MapAble capability levels only. They are not Australian Qualifications Framework (AQF) qualifications, Statements of Attainment, or nationally recognised training outcomes.";

export const COMPLETION_CERTIFICATE_LABEL = "Certificate of Completion";

export const STANDARD_CREDENTIAL_TYPE =
  "MapAble Academy Certificate of Completion — non-accredited professional development.";

export const COMPLIANCE_SUPPORT_DISCLAIMER =
  "MapAble Academy learning records support workforce capability and may inform provider quality practices. They do not guarantee NDIS compliance.";

export const HIS_THEORY_LABEL = "Theory component";

export const HIS_PRACTICAL_WARNING =
  "Completion of this online theory component does not make a worker eligible to deliver high-intensity support. Participant-specific training and assessment by an appropriately qualified assessor are required.";
