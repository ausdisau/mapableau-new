# Prompt 07 — Resilient Offline Accessible Navigation

## Objective

Extend offline navigation with accessible UI patterns and resilience tests: network loss during route, app restart, expired evidence, corrupt region package — while never presenting offline snapshots as current operational truth.

## Non-goals

- Claiming offline routes are verified current
- Silent fallback to stale data without user-visible state
- Replacing server-side routing authority

## Prerequisites

- Prompt 04 merged (evidence-aware personalised routing)
- Existing: `lib/accesscast/offline-store-contract.ts`, `mobile-contracts/schemas/accesscast-offline.ts`, `apps/android/`

## Files to create / modify

| Action | Path |
|--------|------|
| Extend | `lib/accesscast/offline-store-contract.ts` |
| Extend | `mobile-contracts/schemas/accesscast-offline.ts` |
| Extend | `lib/accesscast/states.ts`, `lib/accesscast/rules.ts` |
| Create | `lib/navigate/offline/region-pack-validator.ts` |
| Create | `lib/navigate/offline/route-resilience.ts` |
| Extend | `components/accesscast/AccessCastCard.tsx` — offline/stale UI |
| Create | `tests/navigate/offline/network-loss-mid-route.test.ts` |
| Create | `tests/navigate/offline/app-restart.test.ts` |
| Create | `tests/navigate/offline/expired-evidence.test.ts` |
| Create | `tests/navigate/offline/corrupt-region-pack.test.ts` |
| Extend | `tests/accesscast/offline.test.ts` |
| Create | `tests/a11y/offline-navigation.spec.ts` (Playwright) |

## Accessibility requirements

| Requirement | Implementation |
|-------------|----------------|
| Contrast | WCAG 2.2 AA; use theme tokens |
| Reduced motion | Honour `prefers-reduced-motion`; extend `tests/a11y/accessibility-panel.spec.ts` patterns |
| Voice control | No voice-only workflows; all actions keyboard/touch reachable |
| Switch access | Focus order predictable; no focus traps in offline modal |
| Landscape / tablet | Responsive layouts; test at 768px+ breakpoints |
| Large text | Support 200% zoom; reflow at 320px |
| Screen reader labels | `aria-label` / `aria-live` for offline state changes |
| Offline state | `showAsCurrent: false` always; explicit stale/expired copy |

## Data model / API changes

- Region pack schema version + checksum validation
- `offlineClaim: saved_snapshot_only` (existing contract)
- Route state persisted encrypted locally; restored on restart with freshness evaluation
- Corrupt pack → safe failure with recovery prompt (re-download)

## Tests required

| Scenario | Test file |
|----------|-----------|
| Network loss mid-route | `tests/navigate/offline/network-loss-mid-route.test.ts` |
| App restart | `tests/navigate/offline/app-restart.test.ts` |
| Expired evidence | `tests/navigate/offline/expired-evidence.test.ts` |
| Corrupt region package | `tests/navigate/offline/corrupt-region-pack.test.ts` |
| Offline never current | `tests/accesscast/offline.test.ts` |
| a11y regression | `tests/a11y/offline-navigation.spec.ts` |

## Docs to write

- Update `docs/accesscast/OFFLINE_VISIT_PACK.md`
- Update `mobile-contracts/MOBILE_SCREEN_MAP.md`

## Commit message (exact)

```
feat: add resilient offline accessible navigation
```

## Verification checklist

- [ ] `pnpm typecheck`
- [ ] `pnpm test tests/navigate/offline tests/accesscast`
- [ ] `pnpm exec playwright test tests/a11y/offline-navigation.spec.ts`
- [ ] Offline UI shows stale/expired state clearly
- [ ] axe scan on offline surfaces passes

## Rollback notes

Disable offline region pack download; AccessCast snapshot-only mode remains.
