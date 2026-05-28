# Phase 3 QA

## Automated tests
`pnpm test` — `tests/mapable-phase3.test.ts` covers permissions, vehicle warnings, adjustment privacy.

## Manual checks
1. Login as `participant@mapable.test` — create care request, submit, request linked transport
2. Login as `admin@mapable.test` — assign care to provider, create shift, service ops summary
3. Login as `provider@mapable.test` — accept care request
4. Create transport booking with wheelchair requirement — verify warning when vehicle mismatched
5. Apply for job without sharing adjustments — employer view shows placeholder text
6. Calendar lists care, transport, and job events

## Seed
`pnpm prisma db seed` after Phase 1+2+3 seeds.

Password for test users: same as legacy seed (`Password123!` per Phase 1 docs).
