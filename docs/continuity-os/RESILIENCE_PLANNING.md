# Resilience and Pre-Mortem Planning

**Service:** `lib/continuity-os/resilience.ts`  
**API:** `POST /api/life-events/[missionId]/resilience`

Returns single points of failure, unconfirmed dependencies, stale evidence, timing conflicts, missing alternatives, participant actions, and non-AI contacts.

- `participantScore` is always `null`
- Does not predict participant behaviour
- Does not start live monitoring
- Preferences inform option ranking later; they are not consent
