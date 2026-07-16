/**
 * MapAble uses Prisma against PostgreSQL without Supabase RLS in the default stack.
 * All sensitive access MUST be enforced in application services:
 * - lib/auth/guards.ts and lib/auth/permissions.ts (RBAC)
 * - ConsentRecord checks (e.g. lib/support-coordinator/consent-gate.ts)
 * - lib/messages/message-access-policy.ts (thread participants)
 * - Document access via lib/storage/document-storage-service.ts
 * - lib/academy/authz/capabilities.ts (Academy capabilities)
 *
 * MapAble Academy tables (`academy_*`) also ENABLE Postgres RLS as defence in depth
 * (see migration 20260714020000_mapable_academy_mvp). Table owners (typical Prisma
 * connections) bypass RLS; use a non-owner role + `app.current_user_id` GUC for RLS tests.
 *
 * If migrating other domains to Supabase RLS, mirror these policies in SQL and keep server-side checks.
 */
export const RLS_POLICY_NOTES = {
  participantDocuments: "participant can only read own documents",
  providerDocuments: "provider scoped to organisation membership",
  messages: "conversation participants only",
  auditLogs: "admin and authorised quality roles",
  academyEnrolments: "learner own rows; provider via app-layer org membership",
  academyCredentials: "own rows or publicDisplay opt-in for verify",
} as const;
