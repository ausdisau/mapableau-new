# Wave 13 — Public-interest governance architecture and risk plan

**Branch:** `feat/wave-13-public-interest-governance`  
**Base:** `feat/wave-12-accessops-civic-digital-twin`  
**Governing principle:** No consequential MapAble decision should be unchallengeable, ownerless or hidden behind “the system decided.”

## Authoritative decision

Wave 13 **extends** existing scaffolds (`RegisteredAlgorithm`, `CommunityGovernanceMeeting`, `AiGovernanceIncident`, `PublicDecisionRecord`, oversight board) rather than replacing them.

| Existing | Wave 13 role |
| --- | --- |
| `RegisteredAlgorithm` | Legacy public list; synced from / linked to `GovernedSystem` + `AlgorithmRegisterEntry` |
| `PublicDecisionRecord` | Policy/governance register (org decisions) — **not** person-facing notices |
| `Complaint` | Adjacent intake; appeals may link but do not merge |
| `AiGovernanceIncident` | Extended via affected-party workflow records |
| `CommunityGovernanceMeeting` | Remains; new panels/recommendations add constituencies + conflicts |

## Remediation targets

1. Governance meetings cease to be the only “community” path — `CommunityPanel` + membership with conflicts.
2. Person-facing `DecisionNotice` + `AppealCase` state machine with independent review.
3. `AlgorithmicImpactAssessment` lifecycle required before public register publish.
4. Public `/transparency/*` surfaces with strict redaction (no secrets, prompts, PII, fraud thresholds).
5. All admin governance queries require tenant or explicit national scope.
6. Published register/history is append-only via `PublicRegisterPublication`.

## Non-claims

- Internal AIA / register entry ≠ legal, regulatory, security, accessibility or ethical certification.
- Community recommendations are advisory unless a formally approved instrument says otherwise.
- Appeals analytics must never become a participant risk score.
