# Wave 11 — Recovery execution

Executions run under the same Wave 10 patterns:

- Deterministic idempotency key (`sha256(planId::attempt::inputHash::nonce)`).
- Strict state machine (`draft` → `simulated` → `approved` → `executing` → `completed` / `failed` / `execution_unknown` / `compensated` / `cancelled`).
- `execution_unknown` is a real state. Silent success claims are never permitted.
- Failed steps require a compensating action (`compensating_action` step).

Executions do NOT extend AURA's write authority. If a plan step would call an action beyond the specialist's allow-list, the execution refuses.
