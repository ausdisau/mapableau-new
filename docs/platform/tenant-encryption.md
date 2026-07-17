# Tenant encryption

**Status:** Wave 8 Phase 32 — profile design intent. Does **not** prove KMS custody.

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.**
- **Hub-and-spoke ≠ unrestricted sharing.**
- **Env ≠ entitlement ≠ assurance ≠ registration.**
- **Pilot ≠ GA.**
- **Policies are versioned;** historical records retain historical policy.
- **Unknown health ≠ healthy.**
- **Critical integrations fail closed** — KMS and encryption integrations deny when uncertain.
- **No AI may** activate tenants, approve regulatory interpretations, expand rings, approve GA, or override cross-tenant controls.

## TenantEncryptionProfile

`TenantEncryptionProfile` records per-tenant encryption **intent**:

- Envelope strategy (platform-managed vs BYOK intent)
- Key rotation policy reference
- Data classification tiers covered

Creating or updating a profile does **not** provision keys, rotate material, or attest FIPS/compliance.

## What Wave 8 enforces

- Secrets and integration credentials continue to use existing Wave 6 encryption paths.
- `FAIL_CLOSED_INTEGRATION_KEYS` includes KMS-related keys — if encryption integration is critical and unhealthy, dependent features deny.
- Audit script: `pnpm tenancy:audit-encryption`.

## Honest limits

- No claim of customer-managed keys in production.
- No claim that all columns are field-level encrypted.
- Profile status `unknown` or missing ≠ encrypted.

## See also

- [Tenant data isolation](./tenant-data-isolation.md)
- [Feature entitlements](./feature-entitlements.md)
