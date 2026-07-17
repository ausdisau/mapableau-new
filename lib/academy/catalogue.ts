import { CONNECTED_CAPABILITY_SOURCE_VERSION } from "@/lib/connected-capability";

export interface AcademyCourseSummary {
  code: string;
  title: string;
  school: string;
  description: string;
  status: "published" | "draft";
}

/** Initial Academy schools — accessibility-first catalogue shell. */
export const ACADEMY_SCHOOLS = [
  "participant_rights",
  "communication_and_aac",
  "supported_decision_making",
  "safe_care",
  "accessible_transport",
  "assistive_technology",
  "privacy",
  "safeguarding",
  "incidents_and_complaints",
  "service_documentation",
  "employment_inclusion",
  "venue_accessibility",
  "ndis_provider_operations",
] as const;

export const DEFAULT_ACADEMY_CATALOGUE: AcademyCourseSummary[] = [
  {
    code: "COMM-AAC-101",
    title: "Communication and AAC essentials",
    school: "communication_and_aac",
    description:
      "Accessible communication practice. Completion does not equal competency.",
    status: "published",
  },
  {
    code: "RIGHTS-101",
    title: "Participant rights",
    school: "participant_rights",
    description: "Rights, dignity, and supported decision-making basics.",
    status: "published",
  },
  {
    code: "TRANSPORT-A11Y-101",
    title: "Accessible transport practice",
    school: "accessible_transport",
    description: "Power-chair compatible transport and safe assistance.",
    status: "published",
  },
  {
    code: "SAFEGUARDING-101",
    title: "Safeguarding essentials",
    school: "safeguarding",
    description: "Incident reporting and escalation (bridges Provider Academy).",
    status: "published",
  },
];

export function getAcademyCatalogueShell() {
  return {
    hostIntent: "academy.mapable.com.au",
    identityOwner: "mapable_core_sso",
    deliveryOwner: "mapable_academy",
    completionExchangeOwner: "mapable_integration",
    externalLms: {
      frappe: {
        evaluated: true,
        licence: "AGPL-3.0",
        recommendation: "deferred_adapter_only_never_deep_fork",
        enabledByDefault: false,
      },
      moodle: { recommendation: "rejected_as_primary" },
    },
    iframeEmbedding: false,
    schools: [...ACADEMY_SCHOOLS],
    courses: DEFAULT_ACADEMY_CATALOGUE,
    competencyRule:
      "Course completion must not automatically create competency.",
    sourceVersion: CONNECTED_CAPABILITY_SOURCE_VERSION,
    productionClaimState: "scaffold",
  };
}
