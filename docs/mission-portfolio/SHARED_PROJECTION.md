# Shared Mission Dependency Projection

**Maturity:** scaffold / internal contracts  
**Public claim:** false  
**Writers:** none — read projection only

## Purpose

Provide a cross-domain dependency view for Mission Packs without creating a second mission source of truth.

## Rules

1. Canonical Care, Transport, Billing, Consent, and Access writers remain authoritative.
2. Projections reference domain records by id/ref; they do not copy aggregates.
3. `writersInvoked` is always empty on projection DTOs.
4. Starting Work is the first producer via `projectStartingWorkDependencies`.
5. `CareOSMission` / `MissionInstance` Prisma models are not introduced here.

## Code

- Vocabulary: `lib/mission-portfolio/projection/vocabulary.ts`
- Starting Work adapter: `lib/mission-portfolio/projection/from-starting-work.ts`
- Underlying graph: `lib/pilot/starting-work/dependency-graph.ts`

## Feature flag

`MAPABLE_MISSION_FRAMEWORK_ENABLED` remains default `false`. Projection helpers are safe to unit-test without enabling the flag.
