# Capability model

**Claim state: PROPOSED / IN DEVELOPMENT**

## Core idea (IMPLEMENTED)

MapAble Home is capability-first, not device-first. Endpoints expose typed capability kinds (`TURN_ON`, `LOCK`, `REPORT_AVAILABILITY`, …) with risk class, minimum autonomy level, confirmation and delegation rules.

## Autonomy levels (IMPLEMENTED)

`H0_OBSERVE` → `H5_ROUTINE_ORCHESTRATION`

## Risk classes (IMPLEMENTED)

`LOW` | `MODERATE` | `HIGH` | `SAFETY_CRITICAL`

`SAFETY_CRITICAL` and commissioning / share-device paths are **NOT SUPPORTED** for execute in P0.

## State confidence (IMPLEMENTED)

`KNOWN` | `STALE` | `UNKNOWN` | `UNAVAILABLE`

Unknown lift/charger state must not become “available”.

## Privacy zones (IMPLEMENTED)

`SHARED` | `PERSONAL` | `HIGHLY_PRIVATE` | `SECURITY_SENSITIVE`
