import type { RegulatoryAuthorityClass } from "@prisma/client";

/**
 * Seed catalogue for RegulatorySourceVersion.
 * Research cut-off / retrieval date: 2026-07-16.
 * Authority classes prevent treating drafts as enacted law.
 */
export type RegulatorySourceSeed = {
  sourceKey: string;
  title: string;
  publisher: string;
  sourceUri: string;
  versionLabel: string;
  publicationDate: string | null;
  retrievedAt: string;
  authorityClass: RegulatoryAuthorityClass;
  summary: string;
  contentHash: string;
};

export const REGULATORY_SOURCE_SEEDS: RegulatorySourceSeed[] = [
  {
    sourceKey: "ndis_platform_providers",
    title: "Platform providers (NDIS Commission)",
    publisher: "NDIS Quality and Safeguards Commission",
    sourceUri:
      "https://www.ndiscommission.gov.au/rules-and-standards/quality-practice/platform-providers",
    versionLabel: "page-2026-05-26",
    publicationDate: "2026-05-26T00:00:00.000Z",
    retrievedAt: "2026-07-16T00:00:00.000Z",
    authorityClass: "implementation_guidance",
    summary:
      "Commission guidance on platform providers and mandatory registration direction from 1 July 2026. Not a substitute for final registration instruments.",
    contentHash: "ndis-platform-providers-2026-07-16",
  },
  {
    sourceKey: "ndis_mandatory_registration",
    title: "Mandatory registration reform hub",
    publisher: "NDIS Quality and Safeguards Commission",
    sourceUri:
      "https://www.ndiscommission.gov.au/about-us/ndis-commission-reform-hub/mandatory-registration",
    versionLabel: "page-2026-07-02",
    publicationDate: "2026-07-02T00:00:00.000Z",
    retrievedAt: "2026-07-16T00:00:00.000Z",
    authorityClass: "implementation_guidance",
    summary:
      "Transition to mandatory registration for SIL and platform providers beginning 1 July 2026; further guidance expected.",
    contentHash: "ndis-mandatory-registration-2026-07-16",
  },
  {
    sourceKey: "ndis_omi_platform_providers_2023",
    title: "Own Motion Inquiry into Platform Providers — Insights Report",
    publisher: "NDIS Quality and Safeguards Commission",
    sourceUri:
      "https://www.ndiscommission.gov.au/sites/default/files/2023-09/Own%20Motion%20Inquiry%20into%20Platform%20Providers%20-%20Insights%20Report_0.pdf",
    versionLabel: "insights-2023-09",
    publicationDate: "2023-09-04T00:00:00.000Z",
    retrievedAt: "2026-07-16T00:00:00.000Z",
    authorityClass: "implementation_guidance",
    summary:
      "Inquiry definition of platform provider (profile-based connection of participants with workers). Historical insight; not automatic law.",
    contentHash: "ndis-omi-platforms-2023-09",
  },
  {
    sourceKey: "w3c_vc_data_model_2_0",
    title: "Verifiable Credentials Data Model v2.0",
    publisher: "W3C",
    sourceUri: "https://www.w3.org/TR/vc-data-model-2.0/",
    versionLabel: "REC-2025-05-15",
    publicationDate: "2025-05-15T00:00:00.000Z",
    retrievedAt: "2026-07-16T00:00:00.000Z",
    authorityClass: "published_standard",
    summary:
      "W3C Recommendation for VC data model. Securing mechanisms and exchange protocols are separate ADRs.",
    contentHash: "w3c-vc-dm-2.0-2025-05-15",
  },
  {
    sourceKey: "w3c_act_rules_format_1_1",
    title: "ACT Rules Format 1.1",
    publisher: "W3C",
    sourceUri: "https://www.w3.org/TR/act-rules-format-1.1/",
    versionLabel: "REC-2026-02-05",
    publicationDate: "2026-02-05T00:00:00.000Z",
    retrievedAt: "2026-07-16T00:00:00.000Z",
    authorityClass: "published_standard",
    summary:
      "Rule-format baseline for accessibility test documentation. Not a compliance certificate for MapAble.",
    contentHash: "w3c-act-1.1-2026-02-05",
  },
  {
    sourceKey: "w3c_wai_adapt_symbols",
    title: "WAI-Adapt: Symbols Module",
    publisher: "W3C",
    sourceUri: "https://www.w3.org/TR/adapt-symbols/",
    versionLabel: "CR-2023-01-05",
    publicationDate: "2023-01-05T00:00:00.000Z",
    retrievedAt: "2026-07-16T00:00:00.000Z",
    authorityClass: "candidate_recommendation",
    summary:
      "Candidate Recommendation Snapshot. Experimental only in MapAble; must not be treated as final Recommendation.",
    contentHash: "w3c-adapt-symbols-cr-2023-01-05",
  },
  {
    sourceKey: "gtfs_schedule",
    title: "GTFS Schedule Reference",
    publisher: "gtfs.org",
    sourceUri: "https://gtfs.org/documentation/schedule/reference/",
    versionLabel: "living-spec",
    publicationDate: null,
    retrievedAt: "2026-07-16T00:00:00.000Z",
    authorityClass: "published_standard",
    summary:
      "Empty or 0 wheelchair accessibility fields mean unknown, not accessible.",
    contentHash: "gtfs-schedule-2026-07-16",
  },
  {
    sourceKey: "omf_cds_1_1_0",
    title: "Curb Data Specification 1.1.0",
    publisher: "Open Mobility Foundation",
    sourceUri:
      "https://github.com/openmobilityfoundation/curb-data-specification/releases/tag/1.1.0",
    versionLabel: "1.1.0",
    publicationDate: "2025-10-27T00:00:00.000Z",
    retrievedAt: "2026-07-16T00:00:00.000Z",
    authorityClass: "published_standard",
    summary:
      "CDS curb zones and regulations. MapAble accessibility extensions are organisational design choices.",
    contentHash: "omf-cds-1.1.0",
  },
  {
    sourceKey: "dsapt_amendment_2025_exposure",
    title: "Disability Standards for Accessible Public Transport Amendment 2025 — Exposure Draft",
    publisher:
      "Department of Infrastructure, Transport, Regional Development, Communications, Sport and the Arts",
    sourceUri:
      "https://www.infrastructure.gov.au/have-your-say/exposure-draft-reform-disability-standards-accessible-public-transport-2002-transport-standards",
    versionLabel: "exposure-draft-2025",
    publicationDate: "2025-10-10T00:00:00.000Z",
    retrievedAt: "2026-07-16T00:00:00.000Z",
    authorityClass: "draft",
    summary:
      "Exposure draft for Transport Standards reforms. Consultation closed; not yet in-force amended standards. Must not be treated as enacted.",
    contentHash: "dsapt-amendment-2025-exposure",
  },
  {
    sourceKey: "aviation_disability_standards_dev",
    title: "Aviation accessibility — developing Aviation Disability Standards",
    publisher:
      "Department of Infrastructure, Transport, Regional Development, Communications, Sport and the Arts",
    sourceUri:
      "https://www.infrastructure.gov.au/infrastructure-transport-vehicles/transport-accessibility/aviation-accessibility",
    versionLabel: "co-design-in-progress",
    publicationDate: null,
    retrievedAt: "2026-07-16T00:00:00.000Z",
    authorityClass: "consultation_proposal",
    summary:
      "Aviation-specific disability standards in co-design following Aviation White Paper. Not yet law.",
    contentHash: "aviation-a11y-dev-2026-07-16",
  },
];

/** Authority classes that must never drive production legal state alone. */
export const NON_ENACTED_AUTHORITY_CLASSES: RegulatoryAuthorityClass[] = [
  "draft",
  "candidate_recommendation",
  "consultation_proposal",
  "implementation_guidance",
  "organisational_policy",
  "mapable_design_choice",
];

export function isEnactedAuthority(
  authorityClass: RegulatoryAuthorityClass
): boolean {
  return authorityClass === "enacted_requirement";
}
