# Threat model (Wave 1–2 focus)

| Threat | Control |
| --- | --- |
| Forged test result | HMAC signature + result hash |
| Replay | Nonce consume |
| Stale runner | Version pin env |
| Asset version substitution | Match assetVersionId on ingest |
| Paid-plan severity influence | commercialPlanIgnored; neutrality tests |
| Cross-tenant asset access | Organisation scoping + capability checks |
| Prompt injection | AI tools explain only; cannot close/approve |
| Physical actuation | Out of scope; AURA/physical bridges refuse |

Full register lives in the AccessibilityOps platform plan risk section.
