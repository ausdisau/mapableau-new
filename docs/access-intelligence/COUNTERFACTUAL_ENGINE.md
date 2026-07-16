# Counterfactual engine

**Module:** [`lib/access-intelligence/living/counterfactual.ts`](../../lib/access-intelligence/living/counterfactual.ts).

Answers: “What single change would alter this outcome?”

## Mutation types

change measurement · opening hours · repair element · remove obstruction · add feature · verify unknown · resolve dispute · staff availability · alternative route · signage · hearing augmentation · quiet waiting space

## Flow

1. Evaluate decision + route on baseline twin (`evaluateDecisionForTwin`)
2. `applyMutation` returns a **new** twin (baseline unchanged)
3. Re-evaluate → `CounterfactualResult` with before/after decisions, statusChanged, newlyEligibleRoutes, resolvedUnknowns, ranking factors

## Ranking factors (transparent, not moral)

Decision-status improvement · journeys improved (coverage optional) · evidence confidence · effort band

Does not invent construction costs. Improve UI: [`mutation-studio.tsx`](../../components/access-intelligence/living/mutation-studio.tsx) via `/api/access-intelligence/mutations/preview`.
