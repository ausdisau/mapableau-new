# Vertical and shared-feature registry

**Maturity vocabulary (portfolio):** concept → scaffold → synthetic_demo → internal_alpha → controlled_pilot → limited_release → production_supported → suspended → retired  

**ConvergenceOS seed maturity** maps concept/scaffold → `concept` / `documented` / `scaffolded` until implementation lands.

All public claims: **false**. All master flags: **default false** (documented only in this wave).

## Mission Packs (verticals)

| Key | Title | Owner | Canonical dependencies | Maturity | Flag (default false) |
| --- | --- | --- | --- | --- | --- |
| `vertical.at_continuity` | AT Continuity | AT Continuity | Equipment (absent), Continuity, Care, Transport, Billing | concept | `MAPABLE_AT_CONTINUITY_ENABLED` |
| `vertical.health_navigator` | Health Navigator | Health Navigation | Passport, Transport, AccessCast, Visit Pack, queue | concept | `MAPABLE_HEALTH_NAVIGATOR_ENABLED` |
| `vertical.home_living` | Home and Living | Home Living | Access evidence, Continuity, Care, Transport | concept | `MAPABLE_HOME_LIVING_ENABLED` |
| `vertical.foundational` | Foundational Supports | Foundational | Community info; no NDIS eligibility assumption | concept | `MAPABLE_FOUNDATIONAL_ENABLED` |
| `vertical.transitions` | Transitions | Transitions | Handoff, Continuity, Care, Transport | concept | `MAPABLE_TRANSITIONS_ENABLED` |
| `vertical.events_tourism` | Events and Tourism | Event Access | AccessPlace, AccessCast, Transport | concept | `MAPABLE_EVENTS_TOURISM_ENABLED` |
| `vertical.emergency_ready` | Emergency Ready | Emergency Ready | AT power deps; never replaces 000 | concept | `MAPABLE_EMERGENCY_READY_ENABLED` |
| `vertical.justice_advocacy` | Justice and Advocacy | Advocacy | Handoff, Visit Pack; no legal advice SoT | concept | `MAPABLE_JUSTICE_ADVOCACY_ENABLED` |
| `vertical.enterprise` | Enterprise | Enterprise | Jobs, Billing; no credit scoring | concept | `MAPABLE_ENTERPRISE_ENABLED` |
| `vertical.age_at_home` | Age at Home | Age at Home | Care/Transport/AT with **separate** aged-care funding context | concept | `MAPABLE_AGE_AT_HOME_ENABLED` |

## Shared features

| Key | Title | Maturity | Flag (default false) |
| --- | --- | --- | --- |
| `mission.framework` | Shared Mission Framework (contracts + projection) | documented | `MAPABLE_MISSION_FRAMEWORK_ENABLED` |
| `mission.service_standard` | Participant-defined Service Standard | scaffold | `MAPABLE_SERVICE_STANDARD_ENABLED` |
| `mission.service_diff` | What Changed service diff | scaffold | `MAPABLE_SERVICE_DIFF_ENABLED` |
| `mission.handoff_protocol` | Cross-provider Handoff Protocol | concept | `MAPABLE_HANDOFF_PROTOCOL_ENABLED` |
| `mission.accessible_queue` | Accessible Queue and Wait-Time Layer | concept | `MAPABLE_ACCESSIBLE_QUEUE_ENABLED` |
| `mission.human_navigators` | Human Navigator Network | concept | `MAPABLE_HUMAN_NAVIGATORS_ENABLED` |
| `mission.funding_navigator` | Plan and Funding Period Navigator | concept | `MAPABLE_FUNDING_NAVIGATOR_ENABLED` |
| `mission.outcome_reporting` | Outcome Reporting Studio | concept | `MAPABLE_OUTCOME_REPORTING_ENABLED` |
| `mission.access_wallet` | Personal Access Data Wallet | concept | `MAPABLE_ACCESS_WALLET_ENABLED` |
| `mission.reliability_statements` | Service Reliability Statement | concept | `MAPABLE_RELIABILITY_STATEMENTS_ENABLED` |

## Regulatory boundaries (summary)

- AT Continuity: organise quotes/evidence; **no** prescribe / clinical suitability / funding approval.
- Health Navigator: **no** diagnosis, triage, treatment, medication advice.
- Home and Living: **no** eligibility determination or building certification.
- Emergency Ready: **no** automatic authority contact or unverified “safe route”.
- Justice: **no** legal advice as authoritative; no auto-submit to regulators.
- Age at Home: **never** reuse NDIS price/claim logic for aged care.
