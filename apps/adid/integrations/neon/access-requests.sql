CREATE SCHEMA IF NOT EXISTS adid_portal;
CREATE TABLE IF NOT EXISTS adid_portal.access_request (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer text NOT NULL,
  subject text NOT NULL,
  service text NOT NULL CHECK (service IN ('ausdis', 'mapable', 'disapedia', 'accessibooks')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'referred', 'closed')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by text
);
CREATE UNIQUE INDEX IF NOT EXISTS adid_access_pending
  ON adid_portal.access_request (issuer, subject, service) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS adid_access_queue ON adid_portal.access_request (issuer, service, requested_at);
