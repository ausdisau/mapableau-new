/**
 * MapAble uses Prisma against PostgreSQL without Supabase RLS in the default stack.
 * All sensitive access MUST be enforced in application services:
 * - lib/auth/guards.ts and lib/auth/permissions.ts (RBAC)
 * - ConsentRecord checks (e.g. lib/support-coordinator/consent-gate.ts)
 * - lib/messages/message-access-policy.ts (thread participants)
 * - Document access via lib/storage/document-storage-service.ts
 *
 * If migrating to Supabase RLS, mirror these policies in SQL and keep server-side checks.
 */
export const RLS_POLICY_NOTES = {
  participantDocuments: "participant can only read own documents",
  providerDocuments: "provider scoped to organisation membership",
  messages: "conversation participants only",
  auditLogs: "admin and authorised quality roles",
  accountabilityPublic:
    "anonymous and authenticated users may read published accountability snapshots/metrics only; never operational Care/Transport/Jobs/incident/complaint rows",
  accountabilityAdmin:
    "accountability:prepare_snapshot / review / approve / publish enforced in lib/accountability/publication-workflow.ts with separation of duties",
  accountabilityEvidence:
    "accountability:view_source_evidence required; publicAvailability=false evidence must never appear on public routes",
} as const;
