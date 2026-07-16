# Civic Security Threat Model (Wave 1 scope)

| Threat | Prevention (Wave 1) | Detection | Response |
| --- | --- | --- | --- |
| Poisoned public data | No public publication; licence gate on source link | Audit on register/seed | Disable flag; retire source |
| Forged operator event | Incidents disabled | n/a Wave 1 | Keep disabled |
| AccessPlace duplication | External refs + FK only | Tests for stable key / ref integrity | Reject writes |
| Paid ranking / confidence boost | Invariant rejects `paidConfidenceBoost` / score keys | Unit tests | 422 |
| Participant journey leak | No journey APIs; projection omits personal fit | Code review + tests | Kill switch |
| Prompt injection | No Civic AI tools in Wave 1 | n/a | Keep disabled |
| Cross-tenant leakage | Org-scoped listing; capability checks | Tests | 403 |

Release gate: Observatory / incidents / simulation remain off until dedicated security review.
