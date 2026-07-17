# Wave 11 — AURA service_recovery specialist

Slug: `service-recovery`. Classification: `recovery` (shared with Wave 10 account recovery, but the two specialists have separate manifests).

Allowed actions:

- `continuity.explain_options`
- `continuity.draft_recovery_plan`
- `continuity.simulate_recovery_plan`
- `continuity.open_case_from_signal`
- `continuity.escalate_to_human`
- `continuity.propose_reservation`

Prohibited actions include the standard AURA `NEVER_APPROVE` list plus:

- Emergency-service dispatch (`emergency.*`).
- Financial submits / approvals (`billing.submit_claim`, `invoices.approve`, `invoices.submit`, `claims.approve`, `claims.submit`).

Approval ceiling: `medium_reversible`. Anything higher requires human approval.

Disclaimers rendered on every specialist interaction include:

1. "Not a legal representative and does not decide financial matters."
2. "Cannot call 000 or dispatch emergency services — a human safety officer handles emergencies."
3. "Cannot auto-cancel a linked booking; a person confirms every service change."
4. "External civic feeds may be stale; recovery plans quote the feed and its freshness at execution."
