# VisionAccessOS — Architecture (Wave 1 outline)

## Target architecture

**Hybrid native capture engine** (iOS / Android) returns signed typed evidence bundles into MapAble web domain services. Web/manual Level 0–1 remains a permanent fallback.

```text
Device: purpose → capture → quality → privacy → perception → depth? → geometry?
     → candidates → participant confirm → evidence bundle
Server: intake → Access Intelligence classification → moderation → place/twin projection
```

Vision models **never** receive direct write access to `AccessPlace`, Living Access Twin, incidents, or Ops findings.

## Wave 1 trust boundary

Wave 1 runs entirely in the **web application process** with **deterministic fixtures**:

- No camera permission prompts
- No upload endpoints accepting media
- No native bridge connection (`capabilityTier: 0`, `platform: simulator`)
- UI may render decorative overlays; **list view is authoritative for accessibility**

## Module boundaries

| Layer | Path | Responsibility |
| ----- | ---- | -------------- |
| Contracts | `lib/vision-access/contracts.ts` | Typed candidates, geometry, evidence |
| Taxonomy | `lib/vision-access/taxonomy.ts` | Feature / hazard / prohibited outputs |
| Purposes | `lib/vision-access/capture-purposes.ts` | Purpose → retention / upload gates |
| State machine | `lib/vision-access/candidate-state-machine.ts` | Candidate lifecycle |
| Flags | `lib/vision-access/feature-flags.ts` | Server-side enablement |
| Fixtures | `lib/vision-access/fixtures.ts` | Harbour Civic synthetic scene |
| UI | `components/access-lens/` | Accessible Access Lens surfaces |
| Routes | `app/access-lens/` | Product + demo pages |

## Integration map (future)

| System | Role |
| ------ | ---- |
| AccessPlace / FloorPlan | Place identity / plan document |
| Access Intelligence | Evidence classification, Passport/Twin compare |
| AccessibilityOps | Draft findings — model cannot close |
| Civic Access | Public asset projection — no auto publish |
| RightsOS | Purpose and field minimisation |
| Personal Access Vault | Private scans — participant controlled |
| AURA | Explain / draft — not navigation authority |
| Moderation | Human review before public observation |

## Safety invariants (enforced in contracts)

- `exactMeasurementAvailable: false` on perception candidates
- `requiresHumanConfirmation: true`
- Geometry: `provisional: true`, `notACertifiedMeasurement: true`
- Evidence bundle: `provesClaimTruth: false`
- Privacy manifest: `identityMatchingPerformed: false`
- Permanent flags off: face ID, biometrics, disability inference, background recording, auto publish / route closure / navigation / physical actions

## Feature flags

See `.env.example` (`MAPABLE_VISION_*`). Client parameters must not escalate authority or publication flags.
