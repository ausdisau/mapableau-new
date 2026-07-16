# Purpose Firewall

The Purpose Firewall is the deterministic runtime policy engine. It evaluates `RightsDataUseRequest` and returns `RightsPolicyDecision`.

## Invariants

- Missing purpose blocks access
- Vague purpose blocks consequential access
- Models cannot produce or override decisions
- Secondary use requires a new policy decision
- Policy conflict fails closed or requires human review

## Components

| Module | Path |
|--------|------|
| Purpose registry | `lib/rights-os/purpose-registry.ts` |
| Field registry | `lib/rights-os/field-registry.ts` |
| Field compiler | `lib/rights-os/field-compiler.ts` |
| Conflict engine | `lib/rights-os/conflict-engine.ts` |
| Evaluator | `lib/rights-os/policy-evaluator.ts` |
| Explanations | `lib/rights-os/explain.ts` |

## Shadow mode

When `MAPABLE_RIGHTSOS_MODE=shadow`, evaluations are logged via `rights.policy_evaluated` audit events but never block existing `checkConsent` flows.
