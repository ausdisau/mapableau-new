# MapAble Go — Routing Model

**Claim state:** IN_DEVELOPMENT

## Multi-criteria routing

Route cost combines (after hard constraints):

- distanceCost + slopeCost + surfaceCost + widthCost + crossingCost + curbCost + obstructionCost + uncertaintyCost

## Hard constraints (exclude edge)

- `stairs > 0` and `profile.stairsAllowed == false`
- `widthMm < profile.minimumRequiredWidthMm`
- `longitudinalSlopePercent > profile.absoluteMaximumSlopePercent`

## Route objectives

FASTEST | SMOOTHEST | LOWEST_GRADIENT | MOST_VERIFIED | FEWEST_CROSSINGS | CUSTOM

Do not label routes "safe". Prefer: best match, high confidence, low gradient, better evidence coverage.

## Pilot graph

Slice 1 uses a labelled **sandbox fixture** (`lib/access/navigate/fixture/sandbox-graph.ts`). Claim: IMPLEMENTED_NOT_VERIFIED — not live path evidence.
