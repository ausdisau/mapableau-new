# ContinuityOS threat model (priority)

| Threat | Mitigation |
|--------|------------|
| False / forged failure events | Source classification, verification, audit |
| Stale or simulated availability shown as confirmed | Availability enum; shadow never `verified_available` |
| Urgency consent pressure | No emergency override flag; human lane |
| Proposal substitution / approval replay | Idempotency keys, approval hashes, fresh approval |
| Stop race | `stopState` checked before recovery work |
| IDOR / cross-tenant | Participant ownership on every read/write |
| Prompt injection | External text untrusted; no execution tools for model |
| Commercial failure suppression | Severity ignores tier; immutable signals |
