# Wave 11 — Escalation

`escalateContinuityCase({ reason })` moves a case to `awaiting_approval` (or raises priority to `urgent` when a transition is not legal). Reasons:

- `no_safe_option`
- `participant_unable_to_decide`
- `delegate_required`
- `safeguarding_threshold` — hand-off to a human. AURA cannot close.
- `financial_authority_required` — hand-off to a billing coordinator.
- `emergency_boundary_reached` — hand-off to a human safety officer.
- `coordinator_requested`

AURA cannot close a safeguarding case, alter consent, delegate authority, or dispatch emergency services. When any of those thresholds is reached, the case escalates.
