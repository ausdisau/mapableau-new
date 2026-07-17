# Wave 17 — Inclusive life planner architecture and risk plan

**Branch:** `feat/wave-17-inclusive-life-planner`  
**Base:** `feat/wave-13-public-interest-governance` @ Wave 13 tip  
**Note:** Pack A Waves 14–16 are not present in this repository. Wave 17 proceeds from Wave 13 and does not weaken Waves 2–13. Wave 16 workforce allocation hooks remain adapter stubs until that wave lands.

**Governing principle:** A meaningful life cannot be generated from an engagement score. The participant defines what matters.

## Reuse (no parallel systems)

| Existing                                          | Role                                                     |
| ------------------------------------------------- | -------------------------------------------------------- |
| `ParticipationGoal`                               | Extended — participant wording remains authoritative     |
| `CalendarEvent`, `Booking`                        | Linked by ID from plan steps — never duplicated          |
| `AccessPlace`, `AccessAsset`, `AccessJourneyPlan` | Access evidence and whole-journey planning               |
| `ConsentDirective`, AURA execution                | Disclosure and bounded agent prep                        |
| Wave 11 continuity                                | Disruption recovery on material access/transport failure |

## Non-goals

- Loneliness / social isolation / engagement / attendance scores
- Inferring interests from diagnosis, support category, or stereotypes
- Public attendance lists or social graphs
- Advertising profiles
- Assuming NDIS funding eligibility
- Auto-booking or spending without authority
