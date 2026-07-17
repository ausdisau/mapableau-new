# Wave 8 migration runbook

**Status:** Wave 8 Phase 32 — schema and data backfill sequence. **Dry-run first.**

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.**
- **Hub-and-spoke ≠ unrestricted sharing.**
- **Env ≠ entitlement ≠ assurance ≠ registration.**
- **Pilot ≠ GA.** Migration does not activate production tenants.
- **Policies are versioned;** historical records retain historical policy.
- **Unknown health ≠ healthy.**
- **Critical integrations fail closed.**
- **No AI may** activate tenants, approve regulatory interpretations, expand rings, approve GA, or override cross-tenant controls.

## Preconditions

1. Wave 8 Prisma migration applied in target environment.
2. All tenancy audit scripts pass or exceptions documented.
3. `--dry-run` completed; report reviewed by named human.

## Sequence

1. **Backfill tenant fields** — `tenantKey`, `tenantStatus`, `dataIsolationMode` on existing `Organisation` rows (default `draft` / `shared_schema_strict`).
2. **Seed policy profiles** — assign default `TenantPolicyProfile` per org class.
3. **Create entitlement rows** — `inactive` until human activation.
4. **Seed quota profiles** — conservative defaults.
5. **Register services** — `ServiceCatalogueEntry` for critical paths.
6. **Verify runtime gate** — confirm env + entitlement + assurance + GA layers deny in production for non-approved tenants.

## Audit scripts (all support `--dry-run`)

```bash
pnpm tenancy:audit-ownership
pnpm tenancy:audit-isolation
pnpm tenancy:audit-admin-bypass
pnpm tenancy:audit-unscoped-queries
pnpm tenancy:audit-cache
pnpm tenancy:audit-queues
pnpm tenancy:audit-files
pnpm tenancy:audit-encryption
pnpm platform:evaluate-entitlements
pnpm platform:evaluate-assurance
```

Reports write to `artifacts/tenancy/` or `artifacts/platform/`.

## Rollback

- Do not delete `Organisation` rows.
- Revert entitlement activations and status transitions via audited API — not raw SQL.
- See [assurance migration runbook](../assurance/assurance-migration-runbook.md) for Wave 6 tables.

## See also

- [Wave 8 overview](./wave-8-governed-production-scale.md)
- [Tenant onboarding](./tenant-onboarding.md)
