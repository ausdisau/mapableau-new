# RightsOS Rollback

## Immediate disable

Set in environment:

```
MAPABLE_RIGHTSOS_ENABLED=false
MAPABLE_PURPOSE_FIREWALL_ENABLED=false
MAPABLE_RIGHTSOS_MODE=shadow
```

All enforcement flags (`MAPABLE_RIGHTSOS_ENFORCE_*`) should be `false`.

## Per-pillar disable

| Flag | Effect |
|------|--------|
| `MAPABLE_PERSONAL_ACCESS_VAULT_ENABLED=false` | Vault UI and encryption paths dormant |
| `MAPABLE_DECISION_ROOM_ENABLED=false` | Decision Room routes return 404 |
| `MAPABLE_ACCESS_CAPSULES_ENABLED=false` | No capsule issuance |
| `MAPABLE_RECIPIENT_DUTIES_ENABLED=false` | Duty tracking read-only |
| `MAPABLE_RIGHTS_CENTRE_ENABLED=false` | `/rights` routes return 404 |
| `MAPABLE_RIGHTS_LEDGER_ENABLED=false` | Ledger UI hidden; audit events remain |

## Data

Migration tables remain dormant. No changes to `ConsentRecord` or `requireConsent`. Existing consent flows continue unchanged.

## Emergency override

`MAPABLE_RIGHTSOS_EMERGENCY_OVERRIDE_ENABLED` defaults false. Enabling requires legal review and rights officer approval.
