# Decision engine

Entry: `evaluateAccessDecision` / `calculatePersonalFit`.

Rules:
1. Required failures → `blocked`
2. Required unknowns (including `value: "unknown_operational"`) → `unknown`
3. Preference / live / alternate-route constraints → `suitable_with_conditions`
4. Else → `suitable`

Accreditation baseline never overrides personal requirements.
AI cannot change status.
