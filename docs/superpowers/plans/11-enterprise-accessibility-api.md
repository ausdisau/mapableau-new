# Prompt 11 — Enterprise Accessibility Intelligence API

## Objective

Create versioned MapAble enterprise accessibility intelligence API for councils, transport operators, hospitals, universities, airports, venues, and mobility applications — with provenance on every response and no participant-level mobility profiles.

## Non-goals

- Passport endpoints on public API
- Unverified data without provenance labels
- PII or participant journey export

## Prerequisites

- Prompt 01 + 06 merged (verified graph pipeline)
- Prompt 08 merged (privacy lanes)
- Portfolio epic: [E13 Access API](../innovation/epics/13-access-api.md)

## API surface

| Route prefix | Resources |
|--------------|-----------|
| `/api/v1/accessibility/*` | Accessibility features with provenance |
| `/api/v1/routes/*` | Route accessibility assessments |
| `/api/v1/barriers/*` | Temporary barriers (extend `/api/go/barriers` patterns) |
| `/api/v1/places/*` | Places with accessible entrances |

Extend existing [`app/api/v1/access/route.ts`](../../app/api/v1/access/route.ts) — do not duplicate; migrate/enrich.

## Provenance (every response field)

| State | Meaning |
|-------|---------|
| `verified` | Independently verified |
| `authoritative` | Official source |
| `community_confirmed` | Community report, moderated |
| `inferred` | AI or model inference |
| `stale` | Past expiry |
| `unknown` | No evidence |

## Files to create / modify

| Action | Path |
|--------|------|
| Create | `app/api/v1/accessibility/[...path]/route.ts` |
| Create | `app/api/v1/routes/[...path]/route.ts` |
| Create | `app/api/v1/barriers/[...path]/route.ts` |
| Extend | `app/api/v1/places/route.ts` |
| Create | `lib/api/v1/accessibility/` — handlers, DTOs, provenance mappers |
| Extend | `lib/api/developer/partner-api-key-service.ts` |
| Create | `lib/api/v1/middleware/tenant-isolation.ts` |
| Create | `lib/api/v1/middleware/rate-limit.ts` |
| Create | `lib/api/v1/middleware/audit-log.ts` |
| Create | `lib/api/v1/webhooks/partner-events.ts` |
| Create | `lib/api/v1/openapi/accessibility-api.yaml` |
| Create | `tests/api/v1/accessibility/cross-tenant-isolation.test.ts` |
| Create | `tests/api/v1/accessibility/provenance-required.test.ts` |
| Create | `tests/api/v1/webhooks/lift-outage-reroute.test.ts` |

## Platform capabilities

- API authentication (partner API keys)
- Tenant isolation
- Rate limits per licence tier
- Scoped permissions (`places_read`, `routes_read`, `barriers_write`, etc.)
- Audit logging on all access
- Pagination (cursor-based)
- OpenAPI documentation

## Webhook example

```
Hospital reports lift outage (signed partner event)
  → MapAble validates signature
  → accessibility event created/updated
  → affected routes recalculated
  → consumer navigation updated (via existing notify path)
```

## Tests required

- Cross-tenant isolation: tenant A cannot read tenant B resources
- Every accessibility field includes provenance object
- Unauthenticated requests rejected
- Rate limit enforced
- Webhook signature validation rejects tampered events
- Partner barrier event triggers route recalculation (integration)

## Docs to write

- `docs/developer-api/accessibility-v1.md`
- Update `docs/careos/developer-platform.md`

## Commit message (exact)

```
feat: expose governed accessibility intelligence API
```

## Verification checklist

- [ ] `pnpm typecheck`
- [ ] `pnpm test tests/api/v1/accessibility`
- [ ] OpenAPI spec validates
- [ ] Security review for tenant isolation
- [ ] No passport fields in API responses (automated scan)

## Rollback notes

Disable v1 accessibility routes via feature flag; existing `/api/v1/access` stub remains.
