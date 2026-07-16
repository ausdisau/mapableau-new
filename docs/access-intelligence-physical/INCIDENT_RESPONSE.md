# Incident response — Physical Systems

Playbooks for supervised/live pilots. Core Access Intelligence privacy incidents still follow platform privacy process.

## Severity

| Sev | Examples |
|-----|----------|
| 1 | Unauthorised actuation; live flag compromise; fire-system interaction attempt; passport mass leak |
| 2 | Repeated double-dispatch caught by idempotency; sustained timeout leaving uncertain door state; SLO burn critical |
| 3 | Single failed supervised action with clear audit; Scout mislabel corrected |
| 4 | Demo confusion / copy issues |

## IR-01 — Kill switch (suspected unsafe dispatch)

1. Set `ACCESS_INTELLIGENCE_PHYSICAL_LIVE_ENABLED=false`.
2. Force mode `shadow` or `demo` in env; redeploy/restart as required.
3. Confirm Gateway rejects new `queued`→`dispatching` transitions.
4. Notify venue ops; switch to manual procedures.
5. Preserve action event logs; do not delete evidence.
6. Postmortem within 48 h for Sev-1/2.

## IR-02 — Unauthorised or unexpected actuation

1. Execute IR-01.
2. Identify action id, actor, approval token, adapter result.
3. Physically verify door/lift state with on-site staff.
4. Rotate adapter credentials; revoke staff sessions if account abuse.
5. File hazard H01/H05 update; legal/privacy as needed.

## IR-03 — Idempotency failure (double execute)

1. Disable dispatch (IR-01).
2. Quarantine offending action type.
3. Patch unique constraint / Gateway guard; add regression test.
4. Re-enable only after supervised dry-run passes.

## IR-04 — Stale telemetry wrong advice (no actuation)

1. Mark feed degraded; force freshness deny.
2. Publish venue incident on twin (Core live incident).
3. Concierge: show unknown/blocked — no invented access.
4. Fix adapter clock/source; document in observation log.

## IR-05 — Privacy / passport in logs

1. Scrub logging pipeline; rotate any exposed sinks.
2. Count as SLO violation (0 budget).
3. Notify privacy owner; assess breach duties.
4. Add CI denylist test for passport keys in log fixtures.

## IR-06 — Mode confusion / demo treated as real

1. Strengthen fictional banners; disable misleading “success” copy.
2. Train venue staff; update README warning.
3. Sev typically 3–4 unless actions were live.

## IR-07 — Adapter timeout uncertain state

1. Leave action `timed_out`; do not auto-retry unlock.
2. On-site verify; manual secure.
3. Ops may create **new** draft retry with new idempotency key only after verify.

## Contacts

Maintain a pilot roster: safety lead, venue ops lead, eng on-call, privacy lead. Do not embed personal phone numbers in repo docs — use the internal roster.

## Related

[HAZARD_LOG.md](./HAZARD_LOG.md) · [THREAT_MODEL.md](./THREAT_MODEL.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)
