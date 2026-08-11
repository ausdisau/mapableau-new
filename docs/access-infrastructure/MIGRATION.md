# Legacy field migration map

**Status:** additive coexistence — do not remove legacy fields in this phase

| Old field / model | Canonical replacement | Migration status |
| --- | --- | --- |
| `AccessibilityProfile.*` JSON prefs | Presentation SoT; may seed Passport with consent | Coexist |
| `CareAccessNeed` | Passport requirements + Care adapter (Phase 3) | Legacy dual-read as preference-only soft signal in Care adapter; never diagnosis; still unused by score-based matching factors |
| `CareRequest.accessRequirementsSummary` | Passport + disclosure for workers | Coexist |
| `Vehicle.wheelchairAccessible` / feature booleans | `AccessCapability` via transport projection | Coexist; map in adapter |
| `VehicleAccessibilityEvidence` | Observation / capability projection input | Coexist |
| `Job.accessibilityFeatures` JSON | Workplace `AccessCapability` (Phase 4) | Coexist |
| `WorkplaceAccessibilityEvidence` | Capability projection input | Coexist |
| `EmployerAccessibilityCommitment` | Marketing claim — not capability truth | Keep separated |
| Programme Communication Passport | Fallback when AccessPassport empty | Adapter dual-read |

Deprecation requires production data impact analysis and Access Infrastructure Council review.
