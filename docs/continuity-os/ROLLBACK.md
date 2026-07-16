# ContinuityOS Rollback

## Immediate disable

Set server-side:

```
MAPABLE_CONTINUITY_OS_ENABLED=false
MAPABLE_LIFE_EVENTS_ENABLED=false
MAPABLE_SERVICE_FAILURE_DETECTION_ENABLED=false
MAPABLE_RECOVERY_OPTIONS_ENABLED=false
MAPABLE_RECOVERY_HANDOFFS_ENABLED=false
MAPABLE_CONTINUITY_MODE=shadow
```

All ContinuityOS APIs return 404 when disabled. No client parameter can re-enable.

## Permanent prohibitions (keep false)

```
MAPABLE_RECOVERY_AUTOMATIC_ASSIGNMENT_ENABLED=false
MAPABLE_RECOVERY_AUTOMATIC_CANCELLATION_ENABLED=false
MAPABLE_RECOVERY_AUTOMATIC_PAYMENT_ENABLED=false
MAPABLE_RECOVERY_CLINICAL_ACTIONS_ENABLED=false
MAPABLE_RECOVERY_PHYSICAL_ACTIONS_ENABLED=false
```

## Data

Migration is additive. Tables may remain empty unused. Do not delete participant recovery receipts without RightsOS / deletion process.
