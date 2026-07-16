# AURA Waves 7–10 Implementation Plan

## Checkpoints

| Checkpoint | Wave | Gate |
|------------|------|------|
| A | 7 complete | `evaluateWave7ReleaseGate` |
| B | 8 | `evaluateWave8ReleaseGate` (requires W7) |
| C | 9 | `evaluateWave9ReleaseGate` (requires W8) |
| D | 10 | `evaluateWave10ReleaseGate` (requires W9); physical mode defaults to `demo` |

## Authority

- Model ceiling: L3_PROPOSE  
- Application write: L4 via Waves 4–5 only  
- Physical: L5_SUPERVISED_PHYSICAL_COORDINATION via Safety Kernel only — model never receives L5  

## Modules

- Wave 7: `lib/aura/world-model`, `interoperability`, `guardian` (gap-fill)
- Wave 8: `lib/aura/credentials`, `access-capsules`, `agent-coordination`, `human-assistance`
- Wave 9: `lib/aura/reliability`, `civic`, `regional-twin`, `infrastructure-simulator`, predictive guardian extension
- Wave 10: `lib/aura/physical` — capability registry, Safety Kernel, gateway, simulator

## Flags

See `.env.example`. All new flags default `false`. Permanent: WoT actions, SensorThings tasking, physical/payment/claim/clinical actions remain false unless separately signed off.
