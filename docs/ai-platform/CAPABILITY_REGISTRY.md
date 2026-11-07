# Capability registry

Every AI or AI-labelled capability registers via `lib/ai/platform/capabilities/seed.ts`.

Required fields include maturity, production claim status, feature flag, backend (deterministic | model_backed | hybrid), model identifier, prompt version, tool allowlist, data classes, authority ceiling, human-review and participant-approval requirements, budgets, evaluation suite, algorithm-register reference, kill-switch key.

Optional additive fields: `version`, `requiredConsentScopes`, `approvalExpiryMinutes`.

Design-time ARC assessments live in `lib/ai/platform/capabilities/arc-sidecar.ts` and **must not** grant runtime authority.

A feature must not be publicly described as model-backed AI unless a real model is invoked.

Navigator pilot keys (`navigator.provider_search.*`) and AURA keys (`agent.aura_harness`, `agent.aura_recognise`) are registered with flags default **false**. Runtime enforcement for Navigator uses `lib/ai/navigator/gates.ts`.

**Virtual Persona honesty:** the Care & Support Perceptual Frame (`docs/ai-platform/perceptual-frame/**`) is **synthetic contract documentation only**. It is **not** registered in `seed.ts`, has **no** production claim, and must not be described as a live AI capability. See [`VIRTUAL_PERSONA_P00_RECONCILIATION.md`](./VIRTUAL_PERSONA_P00_RECONCILIATION.md) and [`perceptual-frame/README.md`](./perceptual-frame/README.md).
