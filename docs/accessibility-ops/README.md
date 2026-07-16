# MapAble AccessibilityOps

Short name: **AccessibilityOps**

Continuous accessibility operations, assurance, regression, incident composition, remediation and evidence for the MapAble ecosystem.

## Status

Wave 1 foundation on branch `cursor/accessibility-ops-asset-registry-4343`:

- Accessibility Asset Registry (shadow)
- Versioned Rule Registry
- Shadow rule evaluation (non-blocking)
- Signed test-result ingest (Test Lab shadow)
- Composition adapters for Access Intelligence and AURA (no parallel SoT)
- Controlled pilot seed (synthetic assets)

**Not claimed:** legal compliance, production readiness, automated proof of accessibility, universal scores.

## Docs

| Doc | Purpose |
| --- | --- |
| [CURRENT_STATE.md](./CURRENT_STATE.md) | Repository inventory |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Hybrid control plane + runners |
| [ASSET_REGISTRY.md](./ASSET_REGISTRY.md) | Asset taxonomy |
| [RULE_REGISTRY.md](./RULE_REGISTRY.md) | Rule profiles and outcomes |
| [CHANGE_DETECTION.md](./CHANGE_DETECTION.md) | Planned change sources |
| [JOURNEY_IMPACT_GRAPH.md](./JOURNEY_IMPACT_GRAPH.md) | Impact projection (later waves) |
| [TEST_LAB.md](./TEST_LAB.md) | Signed runners |
| [INCIDENTS.md](./INCIDENTS.md) | Compose canonical incidents |
| [REMEDIATION.md](./REMEDIATION.md) | Remediation portfolio (later) |
| [PROCUREMENT.md](./PROCUREMENT.md) | Procurement compiler (later) |
| [RELIABILITY.md](./RELIABILITY.md) | Access reliability (later) |
| [RELEASE_GATES.md](./RELEASE_GATES.md) | Gates remain off |
| [LIVED_EXPERIENCE_REVIEW.md](./LIVED_EXPERIENCE_REVIEW.md) | Review network (later) |
| [PUBLIC_EVIDENCE.md](./PUBLIC_EVIDENCE.md) | Public transparency (later) |
| [THREAT_MODEL.md](./THREAT_MODEL.md) | Runner and tenancy threats |
| [ACCESSIBILITY.md](./ACCESSIBILITY.md) | Accessibility of AccessibilityOps |
| [PILOT_RUNBOOK.md](./PILOT_RUNBOOK.md) | Harbour / Visit Pack pilot |
| [ROLLBACK.md](./ROLLBACK.md) | Flag-based rollback |

## Flags

All server-side. Defaults off in production.

```
MAPABLE_ACCESSIBILITY_OPS_ENABLED=false
MAPABLE_ACCESSIBILITY_OPS_MODE=shadow
MAPABLE_ACCESSIBILITY_ASSET_REGISTRY_ENABLED=false
MAPABLE_ACCESSIBILITY_RULE_REGISTRY_ENABLED=false
MAPABLE_ACCESSIBILITY_TEST_LAB_ENABLED=false
MAPABLE_ACCESSIBILITY_OPS_USE_MEMORY=true
MAPABLE_ACCESSIBILITY_OPS_RUNNER_SECRET=
```

Enforcement gate flags remain false.

## Routes

- Ops UI: `/accessibility-ops`
- APIs: `/api/accessibility-ops/*`
- Internal runner: `/api/internal/accessibility-ops/test-results`

## Module

`lib/accessibility-ops/`
