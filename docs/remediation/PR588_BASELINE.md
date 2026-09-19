# PR #588 RED baseline

This branch exists to remove the repository-wide `app/api` ESLint failures without weakening lint policy.

The failing baseline reproduced by GitHub Actions on PR #586 reported 33 errors in `app/api`, consisting of `import/order` findings and three unused `z` imports. The affected files were:

- `app/api/access/navigate/route/route.ts`
- `app/api/access/places/[placeId]/quick-observation/route.ts`
- `app/api/admin/ads/creatives/route.ts`
- `app/api/admin/ads/operations/route.ts`
- `app/api/ads/clicks/route.ts`
- `app/api/ads/impressions/route.ts`
- `app/api/ads/placements/route.ts`
- `app/api/ai/context/mission/[missionId]/route.ts`
- `app/api/ai/missions/[missionId]/preview/route.ts`
- `app/api/ai/missions/[missionId]/replan/route.ts`
- `app/api/ai/missions/plan/route.ts`
- `app/api/go/barriers/route.ts`
- `app/api/go/location/session/route.ts`
- `app/api/go/profile/route.ts`
- `app/api/go/routes/[id]/evidence/route.ts`
- `app/api/go/routes/[id]/reroute/route.ts`
- `app/api/go/routes/[id]/route.ts`
- `app/api/go/routes/plan/route.ts`
- `app/api/research/co-design/programmes/route.ts`

Expected GREEN condition: `pnpm lint:app-api` reports zero errors with the existing `.eslintrc.cjs` rules unchanged, and `pnpm type-check` remains green.
