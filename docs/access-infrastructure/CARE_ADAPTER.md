# Care adapter (Phase 3)

**Status:** implemented behind flags — `CARE_ADAPTER_STATUS.implemented = true`  
**Code:** [`lib/access/infrastructure/adapters/care/`](../../lib/access/infrastructure/adapters/care/)  
**Flags:** `MAPABLE_ACCESS_INFRASTRUCTURE_ENABLED` + `MAPABLE_ACCESS_CARE_MATCHING_ENABLED` (both required)

## Intent

- Project worker credentials/competencies → `AccessCapability` (`entityType: support_provider`)
- Compile Care-relevant requirements from Access Passport (not a second Care accessibility profile)
- Dual-read legacy `CareAccessNeed` / `accessRequirementsSummary` as **preference-only / unconfirmed** soft signals — never diagnosis
- Return explainable candidate sets via shared `evaluateCompatibility`; **never auto-assign**
- Pre-shift purpose-limited disclosure (`care_worker` / `pre_shift_brief`) + receipt
- Replacement search uses the same engine; never silent unverified substitute

## Surfaces

| Surface | Behaviour when flag on |
| --- | --- |
| `suggestCompatibleWorkers` | Pool active workers → project + evaluate with `contextTags: ["CARE"]` |
| `runCareWorkerMatch` | Annotates `rankedMatches` with `accessCompatibility` (advisory); `autoAssignWorkers` stays `false` |
| `proposeBackupCandidates` | Prefers sufficiently compatible workers; escalates high-complexity with no verified match |
| `createCareShiftFromRequest` | Confirms pre-shift disclosure; enriches `accessRequirementsSnapshot` with receipt id |
| `filterParticipantInfoForWorker` | Prefers permitted summary lines from disclosure receipt when present |
| `POST /api/access-infrastructure/care/compatibility` | Thin suggest API; audit `CARE_MATCH_PRESENTED` |

## Claim discipline

- No “guaranteed worker compatibility”
- Evidence statuses remain verified / observed / reported / unknown / outdated / disputed
- Hard eligibility remains in `lib/care/worker-eligibility.ts`
- Participant confirmation paths (`selectMatchCandidate`, backup approve) unchanged

## Explicit non-goals

- Jobs workplace adapter (Phase 4)
- Cross-vertical orchestration (Phase 5)
- My Access participant UI
- Weakening REQUIRED requirements by the system
- Destructive removal of `CareAccessNeed` (see [MIGRATION.md](./MIGRATION.md))
