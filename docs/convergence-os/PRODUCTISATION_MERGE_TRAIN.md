# Productisation Merge Train

Advisory human-executed merge train for the **MapAble Productisation and Connected Service Programme**.

Machine seed: `lib/convergence-os/trains/productisation-merge-train.ts` (`PRODUCTISATION_MERGE_TRAIN`).

## Foundational rule

ConvergenceOS never auto-merges. Cursor agents may propose; humans approve; GitHub executes.

## Order (summary)

1. Close superseded: #289, #290, #291, #264, #287, #288
2. Merge Wave 0 registries (`cursor/canonical-repo-reconciliation-6ea8`)
3. Merge #310 Connected Capability (after rebase if needed)
4. Land security hardening PR (`cursor/api-tenant-hardening-6ea8`)
5. Rebase/merge #286 NDIS domain — adapters off
6. Merge #273 AI Expansion → then #308 Fabric bridge
7. Rebase/merge #307 Accountability
8. Split/consolidate #296–#299, #301, #309, #311 — no mega-stack
9. Communication–Workforce vertical slice
10. Native Companion foundation
11. Provider Ops read-only projection
12. Retire TransportBooking / legacy Invoice writers after migration
13. Controlled pilot (Starting Work)
14. Rescan ConvergenceOS after each merge

## Canonical conflicts to refuse

| Conflict | Canonical winner | Action |
| --- | --- | --- |
| TransportBooking vs TransportTrip | TransportTrip | retire Booking writers after migration |
| Invoice vs BillingInvoice | BillingInvoice | migrate then retire |
| Continuity tips vs ContinuityOS | ContinuityOS (single) | consolidate #301; close #287/#288 |
| VisionAccess standalone vs bridge | #308 bridge | close #291 |
| CivicAsset vs AccessOps | AccessOps adapters | consolidate #309 |
| AI legacy vs AI Next + #273 | AI Next + Expansion then consolidate namespaces | close #264 |
| CareOSMission fork vs Case | Case interim; CareOS only as extension | rebase CareOS stack |

## Exit criteria (Wave 0)

- [ ] Superseded PRs closed or supersede-labelled
- [ ] PR action ledger matches source-on-main honesty
- [ ] Public-claim registry blocks production wording for synthetic modules
- [ ] Capability seeds include productisation targets with honest `implemented: false` where packages missing
- [ ] Migration timestamp uniqueness scan green
- [ ] No product schema / feature flags enabled in Wave 0 PR
