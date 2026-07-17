# Mission Portfolio — Domain Ownership

Extends [docs/remediation/DOMAIN_OWNERSHIP.md](../remediation/DOMAIN_OWNERSHIP.md). Mission Packs must not bypass these owners via convenience APIs.

## Canonical writers

| Concern | Owner | Models / paths |
| --- | --- | --- |
| Participant profile | Participant profile services | `ParticipantProfile` |
| Accessibility / communication prefs | Accessibility profile → Communication Passport projection | `AccessibilityProfile`, `lib/communication-passport/` |
| Consent / disclosure | Consent + Trust Fabric | `ConsentRecord`, `ParticipantAccessReceipt` |
| Care delivery | `lib/care/**` | Care request/shift/booking/agreement/log |
| Transport | `lib/transport/**` | `TransportTrip*`, `TransportQuote*` |
| Billing | `lib/billing/**` | Billing Centre invoices / service records |
| Access places / evidence | Access map + Access Intelligence evidence | `AccessPlace`, `AccessEvidenceEnvelopeRecord` |
| Interim case ops | `lib/cases/**` | `Case*` |
| Starting Work coordination | `lib/pilot/starting-work/**` | `StartingWorkJourneyProjection` (projection, not domain SoT) |
| Companion Visit Pack compile | `lib/companion/**` | compile only; no Care/Transport writes |

## Explicit non-owners

| Actor | Must not |
| --- | --- |
| Mission Pack UI | Direct Prisma writes to Care/Transport/Billing aggregates |
| AURA / AI | Consent change, worker assign, claim/payment approval, emergency contact |
| AccessCast | Write places, trips, shifts, or passport SoT |
| Provider Ops | Second writer — read projection only |
| Vertical adapters | Replace AT assessor, clinician, lawyer, or emergency authority |

## Mission coordination rule

Mission templates and dependency projections **reference** domain record IDs.  
They do **not** copy entire source records and do **not** become a parallel CareOSMission SoT without an approved ADR.

## Deferred / blocked

| Concept | Status |
| --- | --- |
| `CareOSMission` Prisma SoT | Blocked — multi-writer collision; not on main |
| Universal `MissionInstance` table | Rejected for Waves 1–2; prefer projection contracts |
| Equipment Passport persistence | Absent — AT Continuity Wave 5 |
