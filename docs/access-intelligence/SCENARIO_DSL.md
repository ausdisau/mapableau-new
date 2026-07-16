# Scenario DSL / flight simulator

Flagship scenario: **The Interview on Level 3**.

**Engine:** [`living/flight-simulator.ts`](../../lib/access-intelligence/living/flight-simulator.ts)  
**API:** `/api/access-intelligence/scenarios/interview-level-3`  
**UI:** `/access-intelligence/learn/interview-level-3` ([`interview-flight-sim-client.tsx`](../../components/access-intelligence/living/interview-flight-sim-client.tsx))

## Stages (ordered)

orientation → prediction → investigation → decision → consequence → revision → teach_back → reflection → transfer → complete

Invalid jumps throw; prediction must precede evidence reveal.

## Shared engines

Fit (`calculatePersonalFit`) and route (`buildAccessibleRoute`) — **not** a toy Learn branch. Consequence injects `MAIN_LIFT_OUTAGE_INCIDENT`; revision targets western lift.

## Trace + mirror

`LearningTraceEvent` feed [`buildDecisionMirror`](../../lib/access-intelligence/living/decision-mirror.ts). Rubric is deterministic from structured responses + trace (not model sentiment).

## Learning Lab vs flagship

Broader Learning Lab catalogue lives under `/access-intelligence/learn`. Living Building “Learn it” opens the Interview L3 flight sim as the flagship.
