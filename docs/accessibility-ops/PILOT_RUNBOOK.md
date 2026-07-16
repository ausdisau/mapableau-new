# Pilot runbook — shadow mode

## Scope (synthetic)

1. AURA / mission UI component (`pilot.digital.aura_mission_ui`)
2. Design-system Button dependency
3. Offline Visit Pack PDF
4. Harbour Civic Centre + western lift
5. Venue verification workflow
6. Accessible transport request
7. Access-summary partner widget

## Seed

```bash
# With ops flags enabled (dev defaults or env)
pnpm exec tsx -e "import { seedAccessibilityOpsPilot } from './lib/accessibility-ops'; seedAccessibilityOpsPilot().then(r => console.log(JSON.stringify({assetCount: Object.keys(r.assets).length, evals: r.evaluations.length, blocking: r.blocking}, null, 2)))"
```

Or open `/accessibility-ops/pilot` (admin) and use the seed action.

## Measures

Detected cannot_tell / manual_review rates, false confidence avoidance (blocking=false), evidence completeness, AccessibilityOps keyboard access.

## Kill

Stop if automated results are treated as compliance, or if lived-experience overrides begin.
