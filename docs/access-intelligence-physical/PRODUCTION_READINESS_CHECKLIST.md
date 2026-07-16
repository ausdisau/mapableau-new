# Production readiness checklist — before live mode

Do not set `ACCESS_INTELLIGENCE_PHYSICAL_LIVE_ENABLED=true` until every item is checked for the target venue. Supervised pilot success is a prerequisite ([SAFETY_CASE.md](./SAFETY_CASE.md)).

## Safety & control

- [ ] Safety Kernel unit tests green (fail-closed, prohibited immutability)
- [ ] Agent contract tests prove no adapter execute imports
- [ ] Action state machine + idempotency tests green
- [ ] Hazard log reviewed; Sev≥4 items mitigated or formally accepted
- [ ] Threat model review signed for this venue
- [ ] Kill switch drill completed (IR-01) within 5 minutes
- [ ] Dual-control procedure documented for enabling live flag

## Modes & config

- [ ] Demo and shadow validated on staging with `mock: true` adapters
- [ ] Supervised pilot met [SLOS.md](./SLOS.md) for agreed window
- [ ] Live flag defaults off in all non-live envs
- [ ] Mode banners verified in UI
- [ ] Env separation: no shared BMS credentials with demo

## Adapters & hardware

- [ ] Real adapter `connected: true` only on allowlisted network
- [ ] BACnet/MQTT/WoT/ROS scaffolds audited — unused protocols disabled
- [ ] Read-only status path tested separately from execute
- [ ] Timeout/uncertain-state playbook (IR-07) rehearsed with venue
- [ ] [REAL_HARDWARE_ROADMAP.md](./REAL_HARDWARE_ROADMAP.md) gates complete

## Privacy & observability

- [ ] Trust Kernel field-level sharing verified for venue workflows
- [ ] No passport bodies in logs/metrics (denylist + sample audit)
- [ ] Metrics/alerts from [OBSERVABILITY.md](./OBSERVABILITY.md) wired
- [ ] Data retention for observations/actions agreed

## Product & a11y

- [ ] Fictional Harbour copy not used as production twin for this venue
- [ ] Text route instructions always present
- [ ] WCAG 2.2 AA pass on physical routes; live-region restraint checked
- [ ] Non-evac / non-compliance disclaimers visible

## Ops

- [ ] On-call + venue ops roster current
- [ ] Rollback plan tested ([DEPLOYMENT.md](./DEPLOYMENT.md))
- [ ] Prisma migrations applied and reversible strategy known
- [ ] Legal/venue agreement covers remote actuation scope

## Sign-off

| Role | Name | Date |
|------|------|------|
| Safety lead | | |
| Eng manager | | |
| Venue ops lead | | |
| Privacy lead | | |

Only after sign-off may live mode be enabled for the scoped placeIds.
