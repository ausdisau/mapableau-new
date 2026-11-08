-- DESIGN PROPOSAL ONLY. NOT RUN AGAINST NEON OR PRODUCTION.
-- MapAbleID v0.3 schema proposal — reconcile with Prisma before any apply.
-- Apply only to an isolated empty/schema-only development branch after owner approval.
-- Does NOT alter neon_auth.*, legacy users, or copy production personal data.
-- Prefer linking to existing User.id; never auto-link solely by email.

BEGIN;

CREATE TABLE IF NOT EXISTS identity_subject_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  issuer text NOT NULL,
  external_subject text NOT NULL,
  state text NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending','verified','revoked')),
  verified_at timestamptz,
  linked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer, external_subject),
  CHECK (state <> 'verified' OR verified_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_identity_subject_links_user
  ON identity_subject_links(user_id);

CREATE TABLE IF NOT EXISTS identity_service_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  service_id text NOT NULL,
  audience text NOT NULL,
  role text NOT NULL,
  valid_until timestamptz,
  revoked_at timestamptz,
  granted_by_user_id text,
  granted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_identity_service_entitlements_user
  ON identity_service_entitlements(user_id, service_id);

CREATE TABLE IF NOT EXISTS identity_delegation_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_user_id text NOT NULL,
  delegate_user_id text NOT NULL,
  service_id text,
  resource text NOT NULL,
  purpose text NOT NULL,
  allowed_operations text[] NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  audit_reference text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (participant_user_id <> delegate_user_id),
  CHECK (array_length(allowed_operations, 1) > 0)
);
CREATE INDEX IF NOT EXISTS idx_identity_delegation_participant
  ON identity_delegation_grants(participant_user_id, expires_at);

CREATE TABLE IF NOT EXISTS identity_consent_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  purpose text NOT NULL,
  policy_version text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('granted','declined','withdrawn')),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  actor_user_id text
);
CREATE INDEX IF NOT EXISTS idx_identity_consent_user_purpose
  ON identity_consent_receipts(user_id, purpose, recorded_at DESC);

CREATE TABLE IF NOT EXISTS identity_security_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text,
  actor_user_id text,
  event_type text NOT NULL,
  service_id text,
  correlation_id uuid NOT NULL,
  event_at timestamptz NOT NULL DEFAULT now(),
  outcome text NOT NULL CHECK (outcome IN ('allowed','denied','queued_review')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_identity_security_user_time
  ON identity_security_events(user_id, event_at DESC);

CREATE TABLE IF NOT EXISTS identity_recovery_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  channel text NOT NULL CHECK (channel IN ('password_reset','human_review','alternate_factor')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_review','completed','rejected','cancelled')),
  accessible_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  reviewer_user_id text,
  notes_sanitised text
);
CREATE INDEX IF NOT EXISTS idx_identity_recovery_user_status
  ON identity_recovery_requests(user_id, status);

COMMIT;
