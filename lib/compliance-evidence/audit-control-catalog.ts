/**
 * Dual-track audit control catalog — SOC 2 TSC and IRAP/ISM.
 * Source of truth for docs/compliance/*.md and database seeding.
 */

export type AuditControlStatus =
  | "not_started"
  | "implemented"
  | "needs_review"
  | "gap_open"
  | "tested";

export type AuditTrack = "soc2" | "irap";

export type AuditControlDefinition = {
  code: string;
  title: string;
  track: AuditTrack;
  criterion: string;
  status: AuditControlStatus;
  owner: string;
  testFrequency: string;
  evidencePaths: string[];
  testProcedure: string;
  gaps: string[];
  /** Related control in the other track (crosswalk). */
  crosswalk?: string;
  remediationPhase?: string;
};

export const AUDIT_DISCLAIMER =
  "MapAble is not SOC 2 certified and has not completed an IRAP assessment. This catalog supports readiness only.";

export const SOC2_CONTROLS: AuditControlDefinition[] = [
  {
    code: "CC1.1",
    title: "Integrity and ethical values",
    track: "soc2",
    criterion: "CC1.1",
    status: "needs_review",
    owner: "Executive / Board",
    testFrequency: "annual",
    evidencePaths: ["docs/compliance/policies/information-security-policy.md"],
    testProcedure: "Review signed policy, code of conduct acknowledgment records.",
    gaps: ["Formal information security policy not yet published"],
    crosswalk: "ISM-0001",
  },
  {
    code: "CC6.1",
    title: "Logical access — authentication",
    track: "soc2",
    criterion: "CC6.1",
    status: "needs_review",
    owner: "Engineering",
    testFrequency: "continuous",
    evidencePaths: [
      "lib/api/auth-handler.ts",
      "lib/auth/permissions.ts",
      "middleware.ts",
    ],
    testProcedure:
      "Sample API routes; verify session required. Re-run security IDOR test suite.",
    gaps: [
      "Unauthenticated routes: ledger, mapable/ask, PRMS",
      "IDOR on care shifts, transport bookings, incidents",
    ],
    crosswalk: "ISM-1410",
    remediationPhase: "Phase 0–1",
  },
  {
    code: "CC6.2",
    title: "User registration and deprovisioning",
    track: "soc2",
    criterion: "CC6.2",
    status: "implemented",
    owner: "Operations",
    testFrequency: "quarterly",
    evidencePaths: ["prisma/schema.prisma", "app/api/admin/"],
    testProcedure: "Sample joiner/mover/leaver tickets; verify org membership removed.",
    gaps: ["No documented offboarding runbook"],
    crosswalk: "ISM-1504",
  },
  {
    code: "CC6.3",
    title: "Role-based access",
    track: "soc2",
    criterion: "CC6.3",
    status: "implemented",
    owner: "Engineering",
    testFrequency: "quarterly",
    evidencePaths: ["lib/auth/permissions.ts", "lib/auth/roles.ts"],
    testProcedure: "Export permission matrix; test denied access for each role.",
    gaps: ["Privileged access review cadence not operationalized"],
    crosswalk: "ISM-1504",
  },
  {
    code: "CC6.6",
    title: "System boundaries",
    track: "soc2",
    criterion: "CC6.6",
    status: "needs_review",
    owner: "Engineering",
    testFrequency: "annual",
    evidencePaths: [
      "docs/compliance/subprocessor-register.md",
      "docs/operations/neon.md",
    ],
    testProcedure: "Review architecture diagram vs production deploy.",
    gaps: ["No formal system boundary diagram in repo"],
    crosswalk: "ISM-1635",
  },
  {
    code: "CC6.7",
    title: "Encryption of confidential data",
    track: "soc2",
    criterion: "CC6.7",
    status: "needs_review",
    owner: "Engineering",
    testFrequency: "continuous",
    evidencePaths: ["lib/crypto/ndis.ts", ".env.example"],
    testProcedure: "Verify NDIS_ENCRYPTION_KEY required in production; test encrypt/decrypt.",
    gaps: [
      "Dev fallback key in lib/crypto/ndis.ts",
      "Limited field-level encryption scope",
    ],
    crosswalk: "ISM-0457",
    remediationPhase: "Phase 3",
  },
  {
    code: "CC7.1",
    title: "Vulnerability management",
    track: "soc2",
    criterion: "CC7.1",
    status: "gap_open",
    owner: "Engineering",
    testFrequency: "continuous",
    evidencePaths: [".github/workflows/"],
    testProcedure: "Semgrep CI reports; dependency audit; annual pen test.",
    gaps: ["No SAST/dependency CI", "Semgrep not gated in pipeline"],
    crosswalk: "ISM-1657",
    remediationPhase: "Phase 3",
  },
  {
    code: "CC7.2",
    title: "Security monitoring and logging",
    track: "soc2",
    criterion: "CC7.2",
    status: "implemented",
    owner: "Engineering",
    testFrequency: "continuous",
    evidencePaths: [
      "lib/audit/audit-event-service.ts",
      "app/api/admin/audit-events/route.ts",
    ],
    testProcedure: "Export audit sample; verify sensitive key redaction.",
    gaps: ["No SIEM, alerting, or log integrity controls"],
    crosswalk: "ISM-1405",
  },
  {
    code: "CC7.3",
    title: "Security incident response",
    track: "soc2",
    criterion: "CC7.3",
    status: "needs_review",
    owner: "Security / Operations",
    testFrequency: "annual",
    evidencePaths: [
      "lib/incidents/incident-service.ts",
      "docs/safety.md",
    ],
    testProcedure: "Table-top exercise; review IR plan and breach notification procedure.",
    gaps: [
      "Product incident flow exists; security IR plan not published",
      "No Notifiable Data Breaches workflow",
    ],
    crosswalk: "ISM-0123",
  },
  {
    code: "CC8.1",
    title: "Change management",
    track: "soc2",
    criterion: "CC8.1",
    status: "needs_review",
    owner: "Engineering",
    testFrequency: "continuous",
    evidencePaths: ["prisma/schema.prisma"],
    testProcedure: "Sample PRs with review; link deploy to Vercel production.",
    gaps: ["ChangeManagementRecord model not wired to releases"],
    crosswalk: "ISM-1657",
  },
  {
    code: "CC9.1",
    title: "Vendor and subprocessor risk",
    track: "soc2",
    criterion: "CC9.1",
    status: "needs_review",
    owner: "Operations / Legal",
    testFrequency: "annual",
    evidencePaths: [
      "docs/compliance/subprocessor-register.md",
      "lib/security-readiness/framework-service.ts",
    ],
    testProcedure: "Review vendor SOC 2 reports; record risk assessment memos.",
    gaps: ["Subprocessor assessments incomplete"],
    crosswalk: "ISM-1635",
  },
  {
    code: "P3.1",
    title: "Privacy — collection and consent",
    track: "soc2",
    criterion: "P3.1 / Privacy",
    status: "implemented",
    owner: "Product",
    testFrequency: "quarterly",
    evidencePaths: [
      "lib/consent/consent-service.ts",
      "docs/modules/consent.md",
    ],
    testProcedure: "Sample consent grants/revokes in AuditEvent.",
    gaps: ["Records of processing activities not documented"],
    crosswalk: "ISM-1546",
  },
  {
    code: "P4.1",
    title: "Privacy — retention and disposal",
    track: "soc2",
    criterion: "P4.1 / Privacy",
    status: "gap_open",
    owner: "Engineering",
    testFrequency: "quarterly",
    evidencePaths: ["lib/compliance-evidence/control-service.ts"],
    testProcedure: "Run retention job; verify deletion audit trail.",
    gaps: ["Data retention is dry-run only — no actual deletion"],
    crosswalk: "ISM-1546",
    remediationPhase: "Phase 2",
  },
  {
    code: "A1.1",
    title: "Availability — capacity and recovery",
    track: "soc2",
    criterion: "A1.1",
    status: "needs_review",
    owner: "Engineering",
    testFrequency: "annual",
    evidencePaths: [
      "lib/disaster-recovery/dr-service.ts",
      "docs/operations/neon.md",
    ],
    testProcedure: "DR exercise record; Neon PITR restore test.",
    gaps: ["DR mostly scaffolding; no measured SLA reporting"],
    crosswalk: "ISM-1511",
  },
];

export const IRAP_ISM_CONTROLS: AuditControlDefinition[] = [
  {
    code: "ISM-0001",
    title: "Cyber security governance",
    track: "irap",
    criterion: "ISM-0001",
    status: "needs_review",
    owner: "Executive",
    testFrequency: "annual",
    evidencePaths: ["docs/compliance/policies/"],
    testProcedure: "Confirm authorising officer, system owner, and security roles assigned.",
    gaps: ["No IRAP system owner appointed for agency boundary"],
    crosswalk: "CC1.1",
  },
  {
    code: "ISM-1410",
    title: "Authentication hardening",
    track: "irap",
    criterion: "ISM-1410",
    status: "needs_review",
    owner: "Engineering",
    testFrequency: "continuous",
    evidencePaths: [
      "docs/operations/passkeys.md",
      "docs/operations/twilio-2fa.md",
    ],
    testProcedure: "Verify MFA enforced for privileged admin accounts.",
    gaps: ["MFA optional, not enforced for all privileged users"],
    crosswalk: "CC6.1",
    remediationPhase: "Phase 0–1",
  },
  {
    code: "ISM-1504",
    title: "Access control and privileged access",
    track: "irap",
    criterion: "ISM-1504",
    status: "needs_review",
    owner: "Engineering",
    testFrequency: "quarterly",
    evidencePaths: ["lib/auth/permissions.ts", "prisma/schema.prisma"],
    testProcedure: "Privileged access review; sample AdminAccessReview records.",
    gaps: ["AdminAccessReview model unused operationally"],
    crosswalk: "CC6.3",
  },
  {
    code: "ISM-1405",
    title: "Event logging and monitoring",
    track: "irap",
    criterion: "ISM-1405",
    status: "implemented",
    owner: "Engineering",
    testFrequency: "continuous",
    evidencePaths: ["lib/audit/audit-event-service.ts"],
    testProcedure: "Verify logs include actor, timestamp, entity; test redaction.",
    gaps: ["Logs not forwarded to central SIEM; retention not enforced"],
    crosswalk: "CC7.2",
  },
  {
    code: "ISM-0457",
    title: "Cryptographic controls",
    track: "irap",
    criterion: "ISM-0457",
    status: "needs_review",
    owner: "Engineering",
    testFrequency: "annual",
    evidencePaths: ["lib/crypto/ndis.ts"],
    testProcedure: "Confirm ASD-approved algorithms; no dev keys in production.",
    gaps: ["Production key enforcement incomplete"],
    crosswalk: "CC6.7",
    remediationPhase: "Phase 3",
  },
  {
    code: "ISM-1657",
    title: "Patching and vulnerability management",
    track: "irap",
    criterion: "ISM-1657",
    status: "gap_open",
    owner: "Engineering",
    testFrequency: "continuous",
    evidencePaths: ["package.json"],
    testProcedure: "Dependency update cadence; Semgrep/SCA in CI.",
    gaps: ["No automated dependency or SAST pipeline"],
    crosswalk: "CC7.1",
  },
  {
    code: "ISM-1635",
    title: "Supply chain and outsourced IT",
    track: "irap",
    criterion: "ISM-1635",
    status: "needs_review",
    owner: "Operations",
    testFrequency: "annual",
    evidencePaths: ["docs/compliance/subprocessor-register.md"],
    testProcedure: "Vendor risk assessment for each subprocessor.",
    gaps: ["Inherited control matrix incomplete"],
    crosswalk: "CC9.1",
  },
  {
    code: "ISM-0123",
    title: "Incident response",
    track: "irap",
    criterion: "ISM-0123",
    status: "needs_review",
    owner: "Security",
    testFrequency: "annual",
    evidencePaths: ["lib/disaster-recovery/dr-service.ts"],
    testProcedure: "Annual IR exercise with documented outcomes.",
    gaps: ["Security IR plan not separate from product safety incidents"],
    crosswalk: "CC7.3",
  },
  {
    code: "ISM-1511",
    title: "Business continuity and backup",
    track: "irap",
    criterion: "ISM-1511",
    status: "needs_review",
    owner: "Engineering",
    testFrequency: "annual",
    evidencePaths: ["docs/operations/neon.md"],
    testProcedure: "Restore test from Neon backup; document RTO/RPO.",
    gaps: ["RTO/RPO not measured"],
    crosswalk: "A1.1",
  },
  {
    code: "ISM-1546",
    title: "Data spillage and privacy",
    track: "irap",
    criterion: "ISM-1546",
    status: "implemented",
    owner: "Product",
    testFrequency: "quarterly",
    evidencePaths: [
      "lib/data-governance/export-policy.ts",
      "lib/consent/consent-service.ts",
    ],
    testProcedure: "Export role gating test; consent audit sample.",
    gaps: ["Erasure workflow not fully operational"],
    crosswalk: "P3.1",
  },
  {
    code: "ISM-1685",
    title: "Essential Eight — application control",
    track: "irap",
    criterion: "Essential Eight / ISM",
    status: "gap_open",
    owner: "Engineering",
    testFrequency: "annual",
    evidencePaths: ["next.config.ts"],
    testProcedure: "Assess E8 maturity for SaaS delivery model.",
    gaps: ["No E8 maturity assessment documented"],
    crosswalk: "CC7.1",
  },
  {
    code: "ISM-1905",
    title: "System classification boundary",
    track: "irap",
    criterion: "IRAP prerequisite",
    status: "not_started",
    owner: "Agency sponsor",
    testFrequency: "per assessment",
    evidencePaths: ["docs/compliance/irap-ism-mapping.md"],
    testProcedure: "Agency defines classification; SSP scoped to boundary.",
    gaps: ["No agency sponsor or classification decision"],
    crosswalk: "CC6.6",
  },
];

export const ALL_AUDIT_CONTROLS: AuditControlDefinition[] = [
  ...SOC2_CONTROLS,
  ...IRAP_ISM_CONTROLS,
];

export function controlsByTrack(track: AuditTrack): AuditControlDefinition[] {
  return ALL_AUDIT_CONTROLS.filter((c) => c.track === track);
}

export function controlsWithOpenGaps(): AuditControlDefinition[] {
  return ALL_AUDIT_CONTROLS.filter(
    (c) => c.status === "gap_open" || c.status === "needs_review"
  );
}
