# Pilot Runbook

Operational guide for the MapAble RightsOS partner pilot. Run in **shadow** mode first; enable supervised enforcement per programme only after Scenario walkthroughs pass.

## Environment setup

```bash
MAPABLE_RIGHTSOS_ENABLED=true
MAPABLE_RIGHTSOS_MODE=shadow
MAPABLE_PURPOSE_FIREWALL_ENABLED=true
MAPABLE_RIGHTS_CENTRE_ENABLED=true
MAPABLE_RIGHTS_LEDGER_ENABLED=true
MAPABLE_DECISION_ROOM_ENABLED=true
MAPABLE_ACCESS_CAPSULES_ENABLED=true
MAPABLE_PERSONAL_ACCESS_VAULT_ENABLED=true
MAPABLE_RECIPIENT_DUTIES_ENABLED=true
# Per-programme enforcement — all false until Wave 7
MAPABLE_RIGHTSOS_ENFORCE_ACCESS=false
```

## Scenario scripts

| ID | Scenario | Pass criteria |
| -- | -------- | ------------- |
| A | Venue access capsule | Diagnosis denied; participant review; audit logged |
| B | Transport handover | Medical history denied; duties attached |
| C | Decision Room dissent | Dissent visible; participant record final |
| D | Ledger revocation | Active lease revoked; manifest export |
| E | Recipient attestation | Honest wording; receipt stored |
| F | Employment adjustment | Functional requirements only |
| G | Vault export/recovery | Manifest export; recovery path tested |

## Shadow period metrics

- Target: 95% of shadow evaluations complete without evaluator errors
- Monitor: `rights.policy_evaluated` audit volume and error rate
- Kill criteria: evaluator exceptions > 5% over 7 days → disable `MAPABLE_PURPOSE_FIREWALL_ENABLED`

## Wave 7 enforcement rollout

Enable one programme at a time:

1. `MAPABLE_RIGHTSOS_MODE=supervised`
2. `MAPABLE_RIGHTSOS_ENFORCE_ACCESS=true` (pilot venue partner)
3. Verify no regression on existing `checkConsent` flows
4. Repeat for transport, jobs, care as partners ready

## Rollback

Set `MAPABLE_RIGHTSOS_ENABLED=false`. See [ROLLBACK.md](./ROLLBACK.md).

## Contacts

- Programme lead — scope and partner onboarding
- Privacy Officer — PIA and attestation copy
- Security — vault and capsule review

## Related

- [README.md](./README.md)
- [CURRENT_STATE.md](./CURRENT_STATE.md)
