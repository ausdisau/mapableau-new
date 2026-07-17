# Tenant file isolation

**Status:** Wave 8 Phase 32 — object storage namespacing intent.

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.**
- **Hub-and-spoke ≠ unrestricted sharing.**
- **Env ≠ entitlement ≠ assurance ≠ registration.**
- **Pilot ≠ GA.**
- **Policies are versioned;** historical records retain historical policy.
- **Unknown health ≠ healthy.**
- **Critical integrations fail closed.**
- **No AI may** activate tenants, approve regulatory interpretations, expand rings, approve GA, or override cross-tenant controls.

## Path convention

Uploaded artefacts (documents, exports, evidence bundles) use a tenant-prefixed path:

```
{tenantKey}/{organisationId}/{category}/{objectId}
```

`tenantKey` avoids leaking internal cuids in external storage URLs while remaining stable across org renames.

## Access control

- Presigned URLs are scoped to the requesting user's `organisationId`.
- Cross-tenant download requires break-glass with object-level audit.
- Hub operators cannot list spoke buckets without delegation or break-glass.
- Platform-wide file search is forbidden without scoped session.

## Audit

`pnpm tenancy:audit-files` reports paths missing tenant prefix or referencing another org's prefix.

## See also

- [Tenant data isolation](./tenant-data-isolation.md)
- [Tenant encryption](./tenant-encryption.md)
