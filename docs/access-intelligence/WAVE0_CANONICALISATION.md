# Wave 0 — Access Intelligence canonicalisation

## Purpose

Bind Access Intelligence persistence to canonical MapAble domains before
Systems 1–10 expand:

- **AccessPlace** is the public place identity (AiAccessPlace is staging only).
- **AccessibilityProfile** remains participant preference defaults; passports extend it.
- **ConsentRecord** is durable consent for AI disclosures.
- **AuditEvent** receives consequential AI actions with `metadata.correlationId`.

## Flags

| Variable | Default | Role |
|----------|---------|------|
| `ACCESS_INTELLIGENCE_DEMO_MODE` | true | In-memory / soft entitlements |
| `ACCESS_INTELLIGENCE_USE_PRISMA` | false | Persist passports, visit plans, living twin |
| `ACCESS_INTELLIGENCE_CANONICAL_PLACE_BINDING` | true (unless `false`) | Resolve/bind AccessPlace |
| Live BMS / messaging URLs | unset | Adapters stay mock until configured |

Programme flags for later waves default **off** (see `.env.example`).

## Migrations

1. `20260715120000_access_intelligence` — `ai_*` tables
2. `20260715200000_access_intelligence_living_persistence` — living twin
3. `20260716010000_access_intelligence_billing_plans` — `ai_*` plan codes
4. `20260716120000_access_intelligence_canonical_place_binding` — FKs + consent scopes

## Backfill

```bash
pnpm exec tsx scripts/backfill-ai-access-place-binding.ts --dry-run
pnpm exec tsx scripts/backfill-ai-access-place-binding.ts --apply
```

Idempotent. Orphans are queued in dry-run output; apply creates AccessPlace rows
without inventing access features.

## Rollback

1. Set `ACCESS_INTELLIGENCE_USE_PRISMA=false` (memory repository).
2. Set `ACCESS_INTELLIGENCE_CANONICAL_PLACE_BINDING=false` to skip AccessPlace resolution.
3. Do **not** drop binding columns in the same release as cutover.

## Acceptance

- Visit plan save stores `access_place_id` matching AccessPlace.
- Consequential saves emit AuditEvent with `correlationId`.
- Consent grant can persist ConsentRecord when Prisma + non-demo.
- Paid plan does not change confidence / fit scores (entitlement invariant tests).
