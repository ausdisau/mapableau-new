# ContinuityOS architecture

## Pattern

**Hybrid control plane (Option D)**

```text
Participant UI
  -> ContinuityOS APIs
    -> RightsOS / consent checks (when available)
    -> CareOSMission (SoT)
    -> Dependency projection / failure classifier / option engine / playbooks
    -> AURA proposal link (supervised+)
    -> Existing application services (Care, Transport, Jobs, Messaging)
```

## Boundaries

| Owns | Does not own |
|------|----------------|
| Life-event types and extensions | CareShift / TransportTrip records |
| Dependency projection snapshots | Incident / complaint closure |
| Failure signals and impact versions | Clinical readiness |
| Recovery cases, options, receipts | Automatic assignment |
| Friction ledger | Participant scoring |

## Event flow (shadow)

1. Life event created on `CareOSMission` + extension
2. Dependency snapshot v1 stored
3. Failure signal recorded (shadow status)
4. Impact version created; prior plan preserved
5. Recovery options generated deterministically
6. Participant selects option
7. Proposal action link prepared (`shadow_proposal_prepared`)
8. No domain write until supervised flags + AURA/application gates

## Stop

`POST /api/life-events/[missionId]/stop` sets mission `stopState`, extension `stopped`, and cancels open recovery cases.
