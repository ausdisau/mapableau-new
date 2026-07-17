# NDIA digital partnership application

Tracks *Connecting with NDIA systems* and *How to connect to our systems* application readiness — state only, no credentials.

## Model

`NdiaDigitalPartnershipApplication` stores:

- `status` — internal workflow
- `myIdConfigured` — boolean flag (not credentials)
- `ramConfigured` — boolean flag
- `credentialsPresent` — boolean flag (never stores secret material)

## Integration modes

`NdiaIntegrationMode` enum: `not_configured`, `manual_export`, `plan_manager_export`, `dry_run`, `approved_api_placeholder`.

Real submission remains disabled unless explicitly configured and approved (`NDIA_REAL_SUBMISSION_ENABLED=false` by default).

## Admin

`/admin/assurance/ndia-application`

See also [ndia-digital-partnership.md](./ndia-digital-partnership.md).

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- Application state in MapAble is not an NDIA partnership approval.
