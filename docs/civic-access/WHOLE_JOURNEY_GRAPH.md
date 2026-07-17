# Whole-Journey and Last-Metres Graph

**Status:** Roadmap (Wave 3) — flag `MAPABLE_CIVIC_JOURNEY_GRAPH_ENABLED` defaults false.

## Segment chain

origin → local path → curb/pickup → accessible transport → interchange → station pathway → destination stop → drop-off → external route → entrance → internal route → exact service point → return

## Last metres

Do not reduce destination routing to a street address. Preserve drop-off side, kerb transition, correct entrance, hours, intercom, indoor destination, after-hours, and fallbacks.

## Wave 1

Harbour pilot registers path, curb, entrance, and lift assets as **dependencies for later graph wiring** — no journey planner integration yet. VisitPlan / CareOSMission remain out of scope.
