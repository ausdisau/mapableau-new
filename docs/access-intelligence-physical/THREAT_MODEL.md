# Threat model — Physical Systems

Scope: Access Intelligence Physical Systems on MapAbleAU (agent + Safety Kernel + Action Gateway + adapters). Assumes Core Trust Kernel threats still apply ([PRIVACY_AND_SECURITY.md](../access-intelligence/PRIVACY_AND_SECURITY.md)).

## Threats and mitigations

| ID | Threat | Impact | Mitigations |
|----|--------|--------|-------------|
| T1 | Prompt injection / jailbreak causes device command | Unauthorised actuation | Agent has no adapter imports; only `propose`; Safety Kernel + Gateway sole execute path |
| T2 | Tool smuggling bypasses approval | Actuation without human | `needsApproval` on dispatch-bound tools; supervised mode requires approval token checked by kernel |
| T3 | Mode confusion (demo/shadow treated as live) | False confidence; accidental enablement | Explicit mode banners; live requires separate env flag; mode-change audit |
| T4 | Replay / duplicate dispatch | Double unlock, conflicting lift calls | Idempotency keys; unique DB constraint; terminal-state guards |
| T5 | Stale or spoofed telemetry | Wrong advise/actuate | Freshness checks; source authenticity; fail-closed on unknown; Scout calibration rules |
| T6 | Compromised or misconfigured adapter | Arbitrary BMS commands | Adapters behind Gateway; least-privilege credentials; scaffolds disconnected; network allowlists |
| T7 | Insider abuse of Venue Ops approvals | Malicious approved action | Dual control for high-risk types; audit trail; prohibited registry; role gates |
| T8 | Passport / PII leakage via logs or metrics | Privacy harm | Observability denylist; field-level Trust Kernel; no passport in action events |
| T9 | SSRF via BMS URL config | Internal network pivot | URL allowlist; no user-supplied adapter URLs in demo; secrets in env only |
| T10 | Denial of service on Safety Kernel / Gateway | Loss of supervised control path | Rate limits; fail-closed (deny) under overload; manual venue procedures documented |
| T11 | Privilege escalation via staff assignment | Cross-venue control | `AiVenueStaffAssignment` scoped by placeId; admin review |
| T12 | Supply-chain / dependency compromise in AI SDK path | Unexpected tool behaviour | Pin versions; contract tests that agent cannot call execute; CI mode-flag tests |
| T13 | Social engineering of Concierge chat to overshare | Excess field disclosure | Field-level consent UI; minimisation defaults; approval cards show exact fields |
| T14 | Physical tailgating aided by remote unlock | Security incident | Time-bounded unlock windows; effect-radius checks; venue policy in prohibited/interlocks |
| T15 | Emergency systems interference | Life-safety hazard | Immutable prohibited registry; interlocks for alarm/evac modes |

## Trust boundaries

1. Browser / mobile client ↔ Next.js API (session auth).
2. Agent runtime ↔ deterministic engines (in-process; engines authoritative).
3. Action Gateway ↔ device network (credentials, allowlisted endpoints).
4. Demo fixtures ↔ production data (env separation).

## Out of scope (explicit)

- Certifying DDA / Premises Standards compliance.
- Emergency evacuation route approval.
- Autonomous robots in public spaces without separate safety case.

## Related

[HAZARD_LOG.md](./HAZARD_LOG.md) · [SAFETY_KERNEL.md](./SAFETY_KERNEL.md) · [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
