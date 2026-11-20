# Safety boundary — My Day Resilience Simulator

## Permanent deny flags (always false in code)

| Constant | Meaning |
|---|---|
| `autoBooking` | Never create real bookings |
| `autoReschedule` | Never auto-reschedule supports or trips |
| `liveWorkerScreening` | Never query NWSD or claim verified clearance |
| `governmentApi` | No government API calls from this module |
| `externalPayments` | No payment execution |
| `realParticipantData` | Synthetic fixtures only in this phase |
| `emergencyDispatch` | No emergency services dispatch |
| `autoAssignment` | Never auto-assign workers |

## Enablement

`isMyDayResilienceEnabled()` requires `MAPABLE_MY_DAY_RESILIENCE_ENABLED=true` **and** `NODE_ENV !== "production"`. The dashboard page returns `notFound()` when disabled.

## Evidence rules

- Unknown hard requirements stay unknown / unavailable.
- Fictional or declared evidence cannot become verified inside the simulator.
- Declined recovery proposals cannot reappear.
- `canBook`, `canExecute`, and `canDispatch` remain false.

## Kill criteria

Stop if the module writes canonical care/transport/billing SoRs, enables permanent denies, presents synthetic workers as real, or ships with production flags on.

## Production claims

`productionClaim: "none"` on plans and receipts. WCAG 2.2 AA is a design target, not a certification claim.
