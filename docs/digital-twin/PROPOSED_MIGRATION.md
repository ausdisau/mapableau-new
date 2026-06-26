# Proposed Digital Twin Prisma Migration (NOT APPLIED)

This document describes a future migration to persist Digital Twin data. **No migration is included in the MVP.**

## Relationship to AccessPlace

- `TwinPlace` may reference `AccessPlace.id` via optional `accessPlaceId` foreign key
- Adapter: `lib/digital-twin/adapters/access-place-adapter.ts` (future)
- Accreditation tiers align with `AccessAccreditationTier` thresholds

## Proposed models (sketch)

```prisma
model TwinPlace {
  id                        String   @id @default(cuid())
  accessPlaceId             String?  @unique
  name                      String
  slug                      String   @unique
  placeType                 String
  // ... geo, scores, status, timestamps
  zones                     TwinZone[]
  features                  TwinFeature[]
}

model TwinZone { /* ... */ }
model TwinFeature { /* ... */ }
model TwinPathSegment { /* routeGeometry Json */ }
model TwinEvidence { /* moderation status */ }
model TwinAssessment { /* domains Json */ }
model TwinIssue { /* ... */ }
```

## Privacy-sensitive tables

- Do not store `AccessNeedProfile` contents in twin tables
- Use existing `AccessibilityProfile` + `ConsentRecord` with scoped read APIs
- Redact sensitive fields in audit metadata (see `lib/digital-twin/governance.ts`)

## PostGIS

- Store `routeGeometry` as `Unsupported("geometry")` or GeoJSON Json until PostGIS extension is confirmed on Neon

## Rollout

1. Add models alongside existing `AccessPlace`
2. Backfill from demo adapter
3. Switch API from in-memory store to Prisma
4. Enable moderation queue and file uploads
