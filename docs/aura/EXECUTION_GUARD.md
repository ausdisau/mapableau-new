# AURA Wave 3 — Execution Guard

`assertExecutionDisabled` / `guardWriteServiceCall` throw `AURA_EXECUTION_DISABLED`, emit `proposal.execution_attempt_detected`, and perform zero side effects. Client headers cannot enable execution. Wave 3 refuses to propose if write/delivery/physical flags are unexpectedly true.
