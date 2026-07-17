# ADR — Release Candidate 1 base lineage

**Status:** Accepted for RC1 track  
**Date:** 2026-07-17  
**Branch:** `release/release-candidate-1`

## Context

Post-Wave-20 prompts assume Waves 2–20 are complete. In this repository lineage:

| Wave           | Present on RC base                          |
| -------------- | ------------------------------------------- |
| 2–13           | Yes (stacked)                               |
| 14–16 (Pack A) | **Absent**                                  |
| 17             | Yes (`feat/wave-17-inclusive-life-planner`) |
| 18–20          | **Absent** (`lib/constitution` not present) |

## Decision

1. Base RC1 on tip of `feat/wave-17-inclusive-life-planner`.
2. Do **not** invent Wave 18–20 core domains inside RC1 (forbidden without constitutional change).
3. Treat missing Waves 18–20 as **release blockers / known limitations**, not as fabricated completion.
4. Consolidate authoritative contexts from Waves 8–17 that already exist; use compatibility adapters for duplicates.
5. Golden paths that require Wave 16 workforce / Wave 20 invariants are implemented as **synthetic harnesses with explicit SKIP/BLOCK markers** until those waves land.

## Consequences

RC1 exit recommendation may be **reject** or **conditional pass** if constitutional invariants and fresh-DB golden paths cannot fully run. That honesty is required by the governing principle.
