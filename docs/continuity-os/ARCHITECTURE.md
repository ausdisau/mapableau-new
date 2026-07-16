# ContinuityOS Architecture

## Hybrid control plane

```
Participant → ContinuityOS (life event / recovery UX)
           → CareOSMission (SoT)
           → AURA proposals (optional AI path)
           → RightsOS / Consent (disclosure)
           → Care | Transport | Jobs | Home | Equipment writers
           → AuditEvent
```

## Boundaries

| Layer | May write | Must not write |
|-------|-----------|----------------|
| ContinuityOS | Life-event extension, failure, impact, recovery case/options, handoff, receipt, friction, assessment | CareShift, TransportTrip, Booking, Refund, Incident close |
| AURA | Proposal drafts (when enabled) | Direct operational writes |
| Application services | Operational records after approval | Authority / consent forgery |

## Stop

`POST /api/life-events/[missionId]/stop` sets mission + extension to `stopped`. Recovery workers and APIs call `assertMissionNotStopped`.

## Modes

Shadow (default): detect, classify, optionise, prepare proposals — no external contact.  
Supervised: one participant-approved service action via existing adapters only when execute flags are on.
