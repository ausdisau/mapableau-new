# ContinuityOS Threat Model (summary)

Highest-priority threats and gates:

| Threat | Prevention | Release gate |
|--------|------------|--------------|
| False restored / inaccessible replacement | Hard-requirement checks; postconditions; false-recovery flag | Scenario H |
| Urgency disclosure overshare | Field minimisation; no emergency auto-override | Rights review |
| Family-violence contact leakage | Specialist playbook; suppress supporter notify | Scenario G |
| Stop race | `assertMissionNotStopped` on recovery paths | Stop integration |
| Proposal substitution | Hash + fresh approval via AURA path | Wave 6 |
| Cross-tenant IDOR | Participant ownership on every API | Ownership tests |
| Forged failure events | verificationStatus rejected_forged | Unit test |
| Commercial failure suppression | Severity independent of tier | Policy test |
| Model execution | Shadow mode; permanent auto flags false | Config defaults |

Full matrix lives in the ContinuityOS architecture plan (Section 31).
