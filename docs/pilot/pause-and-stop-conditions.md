# Pause and stop conditions

Pause reasons include safety trigger, incident, complaint, limit breach, operational, regulatory, change freeze, manual, other.

## Rules

- Pause / resume require human rationale.
- `resumeRequiresDecision` defaults true — AI must never auto-resume.
- Stop-condition evaluator feeds safety signals; operators acknowledge triggers.
