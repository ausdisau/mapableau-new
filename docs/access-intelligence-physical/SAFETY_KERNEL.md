# Safety Kernel

Executable gate between **proposed** physical actions and the Action Gateway. Complements Trust Kernel (consent / field sharing); does not replace it.

**Code (planned):** `lib/access-intelligence/physical/safety/`.

## Principles

1. **Fail-closed** — missing evidence, unknown mode, unknown device binding, or check error ⇒ **deny**.
2. **Deterministic** — pure checks over typed inputs; no LLM inside the kernel.
3. **Auditable** — every decision records check codes + allow/deny (never passport bodies).
4. **Prohibited registry is immutable** at runtime — code/data loaded as read-only; changes require reviewed release, not hot config from the agent.

## Checks (ordered)

| # | Check | Deny when |
|---|-------|-----------|
| 1 | Mode gate | `live` requested but `ACCESS_INTELLIGENCE_PHYSICAL_LIVE_ENABLED` not true; or mode unknown |
| 2 | Action schema | Payload fails Zod / unknown action type |
| 3 | Prohibited registry | Action type or parameter pattern is listed |
| 4 | Capability binding | No device binding for element; adapter `mock` when mode forbids mocks; scaffold `not_connected` |
| 5 | Twin consistency | Element/place not on Living Twin / graph |
| 6 | Freshness | Required telemetry older than threshold ⇒ treat as unknown ⇒ deny |
| 7 | Interlocks | Conflicting states (e.g. fire alarm active, evacuation mode, maintenance lockout) |
| 8 | Effect radius | Action would affect zones outside approved scope |
| 9 | Autonomy level | Requested ladder level above mode allowance |
| 10 | Approval Kernel | Passport fields required but consent/approval missing |
| 11 | Idempotency | Duplicate key already in non-retryable terminal or in-flight state handled by Gateway (kernel may pass; Gateway enforces) |
| 12 | Human approval | Supervised (and any tool with `needsApproval`) without valid approval token |

Any single deny stops evaluation early; remaining checks may still be logged for diagnostics.

## Fail-closed behaviour

- Exceptions inside a check ⇒ deny with code `kernel_internal_error`.
- Clock / dependency unavailable ⇒ deny (`dependency_unavailable`), not “assume safe”.
- Shadow mode: kernel still runs; Gateway records dry-run outcome instead of adapter execute.
- Demo mode: only labelled mock adapters may “execute”.

## Prohibited registry (immutable)

Examples of always-denied classes (non-exhaustive; registry is the source of truth):

- Override fire/life-safety systems
- Disable alarms or emergency lighting
- Unlock egress doors in conflict with fire strategy
- Continuous unattended hold-open beyond policy window
- Any command lacking an explicit twin element id
- Raw protocol frames / arbitrary BACnet/MQTT payloads from the agent
- Actions that encode diagnosis or medical instructions

Registry module exports a frozen structure. Tests assert mutation attempts throw or are no-ops.

## Outputs

```ts
type SafetyDecision = {
  allowed: boolean;
  checkCodes: string[];   // e.g. freshness_stale, prohibited_fire_override
  reasons: string[];      // plain language for Venue Ops
  autonomyLevelAllowed: 0 | 1 | 2 | 3 | 4 | 5;
};
```

Gateway refuses dispatch unless `allowed === true`.

## Related

[ACTION_STATE_MACHINE.md](./ACTION_STATE_MACHINE.md) · [THREAT_MODEL.md](./THREAT_MODEL.md) · [HAZARD_LOG.md](./HAZARD_LOG.md) · Core [TRUST_KERNEL.md](../access-intelligence/TRUST_KERNEL.md)
