# Wave 11 — Recovery plans

A `RecoveryPlan` is an ORDERED list of `RecoveryPlanStep`s. Draft → simulate → (participant/delegate/coordinator approvals) → approved → executing → completed / failed / execution_unknown / cancelled.

Simulation MUST NOT perform any external write. `simulateRecoveryPlan` records `simulationJson.externalWritesPerformed = 0`.

Step kinds are enumerated in `RecoveryPlanStepKind`. Steps that would mutate external systems (`create_substitute_booking`, `reschedule_existing`, `reserve_capacity`, `cancel_with_approval`) require explicit approval.

`no_op` and `handoff_to_human` are ALWAYS allowed and encouraged when a safe option is unclear.
