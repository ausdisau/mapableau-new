# Real hardware roadmap

Physical Systems ships with **labelled mocks** and **disconnected scaffolds**. Do not claim live BMS/lift/door integration until the gates below are done. Core `ACCESS_INTELLIGENCE_BMS_URL` is **status read / propose-only**, not Action Gateway execute.

## Current state

| Capability | Status |
|------------|--------|
| Harbour Civic twin + engines | Implemented in Core |
| Mock BMS / lift / door | Planned under `physical/adapters` — demo only |
| HTTP BMS live status | Optional Core read adapter |
| BACnet / MQTT / WoT / ROS | Scaffolds only — **not connected** |
| Live dispatch | Disabled by default |

## Before connecting real BMS

1. Supervised pilot SLOs met on mocks ([SLOS.md](./SLOS.md)).
2. Network architecture: allowlisted VPN/OT DMZ; no public BMS.
3. Credential vault + rotation; least-privilege points only.
4. Point map: each twin element ↔ validated BACnet object / MQTT topic / WoT TD.
5. Read-only soak (≥2 weeks) with freshness/unknown behaviour proven.
6. Write points explicitly allowlisted; prohibited points in registry.
7. SSRF and URL allowlist hardened ([THREAT_MODEL.md](./THREAT_MODEL.md) T9).
8. Venue change window + rollback to local-only control.

## Before connecting real lift interface

1. OEM/integrator API contract (not scraped UI).
2. Interlocks: fire recall, maintenance, overload — kernel denials tested.
3. Outage incident pipeline bidirectional with twin.
4. No auto-dispatch during fire/evac modes (prohibited + interlock).
5. On-site procedure for stranded passenger (human ops, not agent).

## Before connecting real door / access control

1. Time-bounded unlock only; no permanent hold-open from agent.
2. Effect-radius limits (single door / airlock policy).
3. Audit export compatible with venue security SIEM.
4. Tailgating / security policy reviewed with venue (H01/H14).
5. Fail-secure vs fail-safe behaviour documented per door; kernel matches.

## Scaffold enablement order

```
1) Typed scaffolds + CI "not_connected" asserts
2) Read-only MQTT/BACnet telemetry in shadow
3) Supervised execute on non-life-safety test points
4) Supervised door/lift in controlled hours
5) Live autonomy level 5 only per checklist — still kernel-gated
```

## Explicit non-goals (near term)

- Silent Adaptive Building environment changes without approval
- Robot (ROS) public-space autonomy
- Emergency evacuation control
- Legal compliance certification via twin scores

## Exit criteria to say “hardware connected”

- Adapter `mock: false` and `connected: true` in production for named placeIds
- Checklist signed ([PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md))
- Live flag still off until product explicitly enables it
- Docs/README updated — remove “not connected” only for that venue/protocol

## Related

[DEVICE_ADAPTERS.md](./DEVICE_ADAPTERS.md) · [DEPLOYMENT.md](./DEPLOYMENT.md) · [SAFETY_CASE.md](./SAFETY_CASE.md)
