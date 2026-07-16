# VisionAccessOS — Current state

**Inspected / authored:** 2026-07-16  
**Branch basis:** `cursor/vision-access-contracts-synthetic-c71c` against `main`

## On main before Wave 1

| Domain | Location | VisionAccess decision |
| ------ | -------- | --------------------- |
| Places | `AccessPlace` + features / sources | Canonical place; Vision links `placeId` only |
| Floor plans | `AccessFloorPlan`, indoor platform | Compose; never silent edit |
| Reviews / photos | `AccessPlaceReviewPhoto`, `lib/storage/access-media.ts` | Reuse moderation path later; not Wave 1 media |
| Moderation | `AccessModerationQueue` | Future `entityType=vision_evidence_bundle` |
| Audit | `AuditEvent` | Event **names** defined; no media in metadata |
| Consent | `ConsentRecord` | Compose RightsOS purposes when merged |
| Preferences | `AccessibilityProfile` | Presentation preferences — not Passport |
| Indoor multimodalGuidance | Text guidance modes | Keep separate from camera multimodal |
| Mobile contracts | `mobile-contracts/` | Non-production; CareOS-oriented |
| Access Lens product | Unmerged PR #260 | Extended / absorbed into `/access-lens` here |
| AURA multimodal | Unmerged #267–#277 | Compose via adapters later |
| Living Access Twin | Unmerged Access Intelligence | Fixture twin comparison deferred |

## Delivered in Wave 1

| Deliverable | Flag / gate | Notes |
| ----------- | ----------- | ----- |
| Shared contracts | Code always present | Candidates, geometry (provisional), evidence bundle schema |
| Device capability profile | Simulator tier 0 | Runtime ladder helpers |
| Capture purpose registry | `vision.synthetic_demo` only | Others registered, not enabled |
| Feature + hazard taxonomy | Constants | Pilot allowlist documented |
| Candidate state machine | Unit tested | Forbidden `detected → verified` |
| Feature flags | All default **false** | Permanent offs for face ID, auto-publish, etc. |
| Audit event names | Constants only | No production emitters with media |
| Synthetic Harbour Civic scene | Demo UI | List + decorative overlay |
| Docs | `docs/vision-access/` | README, CURRENT_STATE, ARCHITECTURE |

## Explicit non-claims

- Not production-ready vision
- Not navigation safety
- Not measurement accuracy validation
- Not model confidence = truth
- No facial recognition or disability inference
- No cloud inference enabled
- No Prisma models / migrations in Wave 1

## Next waves (summary)

| Wave | Focus |
| ---- | ----- |
| 2 | Broader synthetic fixtures + twin compare fixtures |
| 3 | Native still capture bridge + local lifecycle |
| 4 | On-device object + OCR allowlist (local-only) |
| 5 | Depth + guided measurement lab |
| 6+ | Mapper survey, moderation, Ops/Civic, live research |
