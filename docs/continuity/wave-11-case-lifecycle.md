# Wave 11 — Continuity case lifecycle

State machine (see `CONTINUITY_CASE_TRANSITIONS`):

```
open → triage → planning → awaiting_approval → in_recovery → monitoring → resolved → closed
                                              ↘ planning
     ↘ abandoned/closed at any non-terminal step
```

Rules:

- Cases are tenant + participant scoped. Coordinator filter honoured (`listContinuityCases({ organisationId, coordinatorId? })`).
- The `linkedCaseId` optionally connects to the existing `Case` model. Adapters MUST NOT create a duplicate incident/complaint record.
- Only a `service_recovery` specialist or an authorised human can transition a case through recovery states. AURA cannot close a safeguarding case.
