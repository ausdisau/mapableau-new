# Wave 11 — Standing recovery instructions

Standing instructions are:

- **Narrow**: scoped to a domain (`care`, `transport`, ...).
- **Revocable**: `revokeStandingInstruction` moves the row to `revoked`.
- **Rechecked at execution**: `evaluateStandingInstruction` runs every time.
- **Never authorising Wave-10-prohibited actions**: `NEVER_APPROVE` from AURA plus `EMERGENCY_ACTION_SLUGS` plus `FINANCIAL_PROHIBITED_ACTION_SLUGS`.
- **Human-authored only**: `assertInstructionAuthoredByHuman` refuses machine-generated instructions.
- **Never higher than `medium_reversible`**: `maxAutoApprovalRiskTier="high_irreversible"` is refused.

An expired instruction never authorises. A prohibition on the participant profile ALWAYS overrides any allow-list in the instruction.
