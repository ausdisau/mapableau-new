import type { PlatformGapSeverity } from "@/lib/platform-gaps/types";

export type PublicLaunchChecklistItem = {
  code: string;
  category: string;
  title: string;
  description: string;
  /** Severity when mirrored into platform gap analysis */
  gapSeverity: PlatformGapSeverity;
  /** Repo-relative runbook path (served under /docs/runbooks/launch/[code]) */
  runbookPath: string;
};

export function launchRunbookPath(code: string): string {
  return `/docs/runbooks/launch/${code}`;
}

export function getLaunchChecklistMeta(code: string): {
  runbookPath: string;
  gapSeverity: PlatformGapSeverity;
} {
  const item = PUBLIC_LAUNCH_CHECKLIST.find((c) => c.code === code);
  return {
    runbookPath: item?.runbookPath ?? launchRunbookPath(code),
    gapSeverity: item?.gapSeverity ?? "medium",
  };
}

const RAW_CHECKLIST: Omit<PublicLaunchChecklistItem, "runbookPath">[] = [
  {
    code: "INCIDENT_ESCALATION",
    category: "safeguards",
    title: "Incident escalation tested",
    description:
      "Safeguarding and incident paths tested end-to-end with evidence (Care, transport, peer).",
    gapSeverity: "critical",
  },
  {
    code: "DR_EXERCISE",
    category: "resilience",
    title: "Disaster recovery exercise completed",
    description: "DR exercise completed with restore evidence and runbook sign-off.",
    gapSeverity: "high",
  },
  {
    code: "ONCALL_ESCALATION_TREE",
    category: "operations",
    title: "Oncall and escalation tree documented",
    description:
      "Named oncall roster, escalation tree, and after-hours contact paths published internally.",
    gapSeverity: "critical",
  },
  {
    code: "STATUS_COMMS_CHANNEL",
    category: "operations",
    title: "Status and incident comms channel ready",
    description:
      "Status page or equivalent channel for public incident communication is configured and tested.",
    gapSeverity: "medium",
  },
  {
    code: "DISPATCH_RUNBOOK",
    category: "operations",
    title: "Dispatch runbook documented",
    description: "Transport/dispatch operations runbook documented and linked from admin ops.",
    gapSeverity: "high",
  },
  {
    code: "SUPPORT_SLA_PUBLISHED",
    category: "operations",
    title: "Support SLAs published",
    description:
      "Participant, provider, and worker support tiers with response targets published in-product or help centre.",
    gapSeverity: "medium",
  },
  {
    code: "PROVIDER_ONBOARDING_RUNBOOK",
    category: "operations",
    title: "Provider onboarding runbook",
    description:
      "Verified path from signup → org verification → Provider Cloud → Care enabled, with support macros.",
    gapSeverity: "high",
  },
  {
    code: "MOBILE_A11Y_TEST",
    category: "mobile",
    title: "Mobile accessibility test pass",
    description: "Mobile accessibility testing completed with documented results.",
    gapSeverity: "high",
  },
  {
    code: "MOBILE_PRIVACY_LABELS",
    category: "mobile",
    title: "App store privacy labels drafted",
    description: "App store privacy nutrition labels drafted and reviewed for mobile releases.",
    gapSeverity: "medium",
  },
  {
    code: "WEB_A11Y_AUDIT",
    category: "accessibility",
    title: "Public web accessibility audit",
    description:
      "WCAG-oriented audit of public marketing and authenticated core flows with remediation plan for blockers.",
    gapSeverity: "high",
  },
  {
    code: "PRIVACY_POLICY_LIVE",
    category: "legal",
    title: "Privacy policy published",
    description: "Current privacy policy published and linked from signup, footer, and app settings.",
    gapSeverity: "critical",
  },
  {
    code: "TERMS_OF_SERVICE_LIVE",
    category: "legal",
    title: "Terms of service published",
    description: "Terms of service published and acceptance captured on registration where required.",
    gapSeverity: "critical",
  },
  {
    code: "CONSENT_FLOWS_REVIEWED",
    category: "legal",
    title: "Consent flows reviewed",
    description:
      "Care, peer, and data-sharing consent copy reviewed for NDIS and Australian privacy expectations.",
    gapSeverity: "high",
  },
  {
    code: "STRIPE_PRODUCTION_VERIFIED",
    category: "infrastructure",
    title: "Stripe production verified",
    description:
      "Live Stripe keys, webhook endpoints, Connect, and subscription prices verified in production.",
    gapSeverity: "critical",
  },
  {
    code: "PROD_INTEGRATIONS_HEALTHY",
    category: "infrastructure",
    title: "Critical integrations healthy in production",
    description:
      "Stripe, Postgres, MapLibre, and NDIA readiness connectors report healthy in production admin.",
    gapSeverity: "critical",
  },
  {
    code: "BACKUP_RESTORE_VERIFIED",
    category: "infrastructure",
    title: "Backup and restore verified",
    description: "Database backup policy exercised with successful restore test and documented RPO/RTO.",
    gapSeverity: "high",
  },
  {
    code: "OBSERVABILITY_ALERTS",
    category: "infrastructure",
    title: "Observability and alerting live",
    description:
      "Error monitoring, uptime checks, and alert routing configured for production with oncall linkage.",
    gapSeverity: "high",
  },
  {
    code: "LOAD_CAPACITY_REVIEW",
    category: "infrastructure",
    title: "Load and capacity review",
    description:
      "Load or capacity review completed for expected launch traffic (Vercel, database, rate limits).",
    gapSeverity: "medium",
  },
  {
    code: "SECURITY_CONTROLS_REVIEWED",
    category: "security",
    title: "Security controls reviewed",
    description:
      "Admin security readiness frameworks reviewed; critical gaps tracked or waived with evidence.",
    gapSeverity: "high",
  },
  {
    code: "PEER_MODERATION_READY",
    category: "community",
    title: "Peer support moderation ready",
    description:
      "Peer community moderation policy, tooling, and moderator coverage ready for public participants.",
    gapSeverity: "high",
  },
  {
    code: "PUBLIC_BETA_EXIT_REVIEW",
    category: "governance",
    title: "Public beta exit review",
    description:
      "Beta cohort feedback reviewed; known P0/P1 defects triaged with explicit launch acceptance.",
    gapSeverity: "high",
  },
  {
    code: "PUBLIC_LAUNCH_GO_NO_GO",
    category: "governance",
    title: "Public launch go / no-go",
    description:
      "Executive or product council sign-off recorded with date, scope, and known accepted risks.",
    gapSeverity: "critical",
  },
];

export const PUBLIC_LAUNCH_CHECKLIST: PublicLaunchChecklistItem[] =
  RAW_CHECKLIST.map((item) => ({
    ...item,
    runbookPath: launchRunbookPath(item.code),
  }));

export const PUBLIC_LAUNCH_CHECKLIST_CODES = PUBLIC_LAUNCH_CHECKLIST.map(
  (item) => item.code
);
