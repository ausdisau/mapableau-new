# Civic Rollback

## Immediate kill switch

```bash
MAPABLE_CIVIC_ENABLED=false
```

All Civic APIs return 404. Admin pages show disabled state. Memory store is process-local and discarded on restart.

## Per-pillar

Set individual `MAPABLE_CIVIC_*_ENABLED=false` flags. Wave 1 only uses `ASSET_REGISTRY`.

## Database

Migration `20260716160000_civic_asset_registry` is additive. Leave tables dormant when flags are off. Do not drop in production without a dedicated change window.

## Prisma persistence

Wave 1 defaults to `MAPABLE_CIVIC_USE_MEMORY=true`. Setting `MAPABLE_CIVIC_USE_MEMORY=false` without a completed dual-write path will not persist — keep memory mode until a follow-up PR wires Prisma repositories.
