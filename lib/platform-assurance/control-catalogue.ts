export type RegistrationControlSeed = {
  code: string;
  title: string;
  description: string;
  category: string;
  complianceControlCode: string | null;
  requirementSourceKey: string;
  ownerRole: string;
};

/** Initial registration readiness control catalogue (opinion inventory, not certification). */
export const REGISTRATION_CONTROL_SEEDS: RegistrationControlSeed[] = [
  {
    code: "PA-GOV-001",
    title: "Governance and accountability",
    description: "Board and management ownership of platform assurance.",
    category: "governance",
    complianceControlCode: null,
    requirementSourceKey: "ndis_mandatory_registration",
    ownerRole: "platform_assurance_officer",
  },
  {
    code: "PA-SCOPE-001",
    title: "Digital platform scope assessment",
    description:
      "Versioned questionnaire and legal review for marketplace functions.",
    category: "scope",
    complianceControlCode: null,
    requirementSourceKey: "ndis_platform_providers",
    ownerRole: "platform_assurance_officer",
  },
  {
    code: "PA-SCREEN-001",
    title: "Worker screening checks",
    description:
      "Risk-assessed roles have current screening evidence or explicit unavailable state.",
    category: "worker_screening",
    complianceControlCode: null,
    requirementSourceKey: "ndis_mandatory_registration",
    ownerRole: "provider_manager",
  },
  {
    code: "PA-BAN-001",
    title: "Banning-order checks",
    description:
      "Banning-order status recorded; missing check must not display as passed.",
    category: "worker_screening",
    complianceControlCode: null,
    requirementSourceKey: "ndis_omi_platform_providers_2023",
    ownerRole: "provider_manager",
  },
  {
    code: "PA-INC-001",
    title: "Incident management evidence",
    description: "Reportable incident pathways and evidence retention.",
    category: "incidents",
    complianceControlCode: null,
    requirementSourceKey: "ndis_mandatory_registration",
    ownerRole: "platform_assurance_officer",
  },
  {
    code: "PA-COMP-001",
    title: "Complaints management",
    description: "Accessible complaints process and evidence pack.",
    category: "complaints",
    complianceControlCode: null,
    requirementSourceKey: "ndis_mandatory_registration",
    ownerRole: "platform_assurance_officer",
  },
  {
    code: "PA-FEE-001",
    title: "Fee and commission transparency",
    description: "Participant-facing fee disclosure for marketplace functions.",
    category: "fees",
    complianceControlCode: null,
    requirementSourceKey: "ndis_omi_platform_providers_2023",
    ownerRole: "platform_assurance_officer",
  },
  {
    code: "PA-REL-001",
    title: "Service relationship disclosure",
    description:
      "Clarity on who engages the worker and who is responsible for delivery.",
    category: "relationships",
    complianceControlCode: null,
    requirementSourceKey: "ndis_omi_platform_providers_2023",
    ownerRole: "platform_assurance_officer",
  },
  {
    code: "PA-PRIV-001",
    title: "Privacy and information management",
    description: "Purpose-limited consent and record retention.",
    category: "privacy",
    complianceControlCode: null,
    requirementSourceKey: "ndis_mandatory_registration",
    ownerRole: "platform_assurance_officer",
  },
  {
    code: "PA-SEC-001",
    title: "Platform security",
    description: "Security readiness evidence for assurance packs.",
    category: "security",
    complianceControlCode: null,
    requirementSourceKey: "ndis_mandatory_registration",
    ownerRole: "mapable_administrator",
  },
];
