# PR Action Ledger — Productisation Wave 0

Source of structured actions: [`lib/convergence-os/seed/pr-action-ledger.ts`](../../lib/convergence-os/seed/pr-action-ledger.ts).

**Rule:** PR descriptions are not evidence that code exists on `main`. Path searches and tests are.

## Actions vocabulary

`merge` · `rebase` · `split` · `consolidate` · `supersede` · `close` · `retain_as_reference` · `retire_after_migration`

## Immediate close targets

| PR | Reason | Superseded by |
| --- | --- | --- |
| #289 | Convergence predecessor | #302 (merged) |
| #290 | Convergence Iteration 2 predecessor | #302 (merged) |
| #291 | VisionAccess standalone | #308 |
| #264 | Legacy Access Intelligence | #273 + AI Next |
| #287 | Continuity predecessor | #301 |
| #288 | Continuity predecessor | #301 |

## Near-term merge / rebase (after Wave 0 + security)

| PR | Action | Notes |
| --- | --- | --- |
| #310 | merge | Connected Capability foundation |
| #286 | rebase → merge | NDIS domain; NDIA submission off |
| #273 | merge | AI Expansion; consolidate with AI Next later |
| #308 | merge | Fabric + VisionAccess bridge |
| #307 | rebase → merge | Accountability portal |

## Do not merge unchanged

| PRs | Action |
| --- | --- |
| #296 → #298 → #299 | **split** |
| #301, #309, #311 | **consolidate** / rebase onto single Continuity + AccessOps + governance |
| #231–#255 CareOS + Expo | rebase onto `Case`; split Companion |
| #283 | **retire_after_migration** onto TransportTrip |

## Refresh

Re-run `gh pr list` and update the TypeScript ledger when topology changes. Keep `SUPERSEDED_CLOSE_TARGETS` in sync with close actions.
