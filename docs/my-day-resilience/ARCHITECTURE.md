# Architecture — MapAble One My Day Resilience Simulator (P07)

**Status:** In development, synthetic demonstration only.  
**Parent stack:** draft PR #27 (synthetic matching) → draft PR #26 (participant dashboard).

## Purpose

Deliver one accessible, end-to-end synthetic My Day journey that combines personal goals, communication preferences, fictional worker suitability, scoped accessibility observations, proposed transport dependencies, deterministic disruption, participant-approved recovery, and human escalation when no verified alternative exists.

## Modules

| Module | Responsibility |
|---|---|
| `flags.ts` | Default-off + production hard-disable + permanent denies |
| `types.ts` | Zod contracts: plan, evidence, events, proposals, receipts |
| `events.ts` | Append-only immutable `ScenarioEvent` log + tenant guard |
| `fixtures.ts` | Alex @ Riverbend synthetic day (work / shops / return) |
| `care-adapter.ts` | P05 continuity via `reviewFictionalWorker` only |
| `transport-adapter.ts` | P06 advisory trip disruption / recovery proposals |
| `engine.ts` | Explicit phase state machine + user decisions |
| `receipts.ts` | Explainable decision receipts + event replay |
| UI + page | Flag-gated dashboard demo; list/timeline; offline summary |

## State machine

`consent_gate` → `plan_edit` → `dependency_eval` / `scenario_ready` → `disruption_injected` → `recovery_options` → (`participant_approved` \| `human_escalation`) → `receipt_issued` → `replay_ready`

Blocked phases: `consent_denied`, `consent_withdrawn`, `cross_tenant`, `irreversible_blocked`, `no_verified_option`.

## Evidence honesty

Every `SourceEvidence` carries `fictional` | `unknown` | `declared` | `verified`. Care factor states from PR #27 map into these labels. Venue declarations are never independent verification.

## Non-goals

Real bookings, payments, auto-reschedule, emergency dispatch, live screening, government API claims, invisible cross-module sharing, second matching/ranking engine.
