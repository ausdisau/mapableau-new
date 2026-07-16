# Access Intelligence Physical Systems

## Product purpose

Physical Systems extends MapAble Access Intelligence so venues can **observe**, **decide**, and (only under gated modes) **propose controlled building actions** that support accessible visits — without treating accessibility as a universal venue score or letting an LLM command devices.

It sits on the existing Living Access Twin, deterministic fit/route/confidence engines, and Trust Kernel. Harbour Civic Centre remains the flagship **fictional** twin for demos.

## Products

| Product | Role |
|---------|------|
| **Scout** | Capture and classify access observations (photo, report, feed) with provenance — never exact mm from uncalibrated photos |
| **Concierge** | Person-facing visit planning: passport + twin + fit + text routes (chat optional via ToolLoopAgent) |
| **Responsive Venue** | Venue-facing recommendations when conditions change (lift outage, closed entrance) |
| **Action Gateway** | Sole path for action lifecycle, idempotency, and mode-gated dispatch |
| **Living Twin** | Harbour Civic (and future places) graph reused from `lib/access-intelligence/living/` |
| **Venue Ops** | Staff console for incidents, proposed actions, approvals, audit |
| **Simulator** | Safe rehearsal of scenarios and actions against mocks |
| **Safety Kernel** | Fail-closed policy checks + immutable prohibited registry before any dispatch |

Trust Kernel (consent / field sharing) remains in Core; Physical Systems adds Safety Kernel for **physical actuation** risk.

## How to run the demo

```bash
pnpm install
export ACCESS_INTELLIGENCE_DEMO_MODE=true
# optional chat
export AI_GATEWAY_API_KEY=...   # or GOOGLE_GENERATIVE_AI_API_KEY
pnpm dev
```

Open:

- Core Living Building: `/access-intelligence/buildings/place-harbour-civic`
- Physical surfaces (as implemented): `/access-intelligence/physical/scout`, `…/plan`, `…/simulator`, `…/actions`

Tests:

```bash
pnpm test tests/access-intelligence
pnpm test tests/access-intelligence/physical
```

## Environment variables

| Variable | Purpose |
|----------|---------|
| `ACCESS_INTELLIGENCE_DEMO_MODE` | Demo defaults (default on unless `false`/`0`) |
| `ACCESS_INTELLIGENCE_PHYSICAL_MODE` | `demo` \| `shadow` \| `supervised` \| `live` — **`live` ignored unless enable flag set** |
| `ACCESS_INTELLIGENCE_PHYSICAL_LIVE_ENABLED` | Must be `true` to allow live mode (default unset/false) |
| `ACCESS_INTELLIGENCE_USE_PRISMA` | Opt-in Prisma persistence |
| `ACCESS_INTELLIGENCE_MODEL` / `AI_MODEL` | Agent model id |
| `AI_GATEWAY_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` | Chat provider |
| `ACCESS_INTELLIGENCE_BMS_URL` | Optional **read** HTTP BMS status (not actuation) |
| `ACCESS_INTELLIGENCE_BMS_API_KEY` | Optional Bearer for BMS status |
| `ACCESS_INTELLIGENCE_PHYSICAL_SSE` | Enable SSE realtime fallback (`true`/`false`) |

See also Core env table in [`../access-intelligence/README.md`](../access-intelligence/README.md).

## Fictional / demo warning

**Harbour Civic Centre is fictional.** Measurements, incidents, and simulated BMS/lift/door responses do not represent a real building. Do not treat demo actions as live hardware control. Live mode is disabled by default and must not be enabled without [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md).

## Related docs

| Doc | Topic |
|-----|-------|
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Architecture detection, reuse, migration, tests |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Layers, autonomy ladder, agent path |
| [SAFETY_KERNEL.md](./SAFETY_KERNEL.md) | Fail-closed checks |
| [ACTION_STATE_MACHINE.md](./ACTION_STATE_MACHINE.md) | Action lifecycle |
| [DEVICE_ADAPTERS.md](./DEVICE_ADAPTERS.md) | Mocks and future scaffolds |
| [THREAT_MODEL.md](./THREAT_MODEL.md) | Threats and mitigations |
| [HAZARD_LOG.md](./HAZARD_LOG.md) | Hazard register |
| [SAFETY_CASE.md](./SAFETY_CASE.md) | How modes prove safety |
| [CONSENT_AND_PRIVACY.md](./CONSENT_AND_PRIVACY.md) | Field-level sharing |
| [LIVING_ACCESS_TWIN.md](./LIVING_ACCESS_TWIN.md) | Harbour Civic twin |
| [OBSERVATION_AND_EVIDENCE.md](./OBSERVATION_AND_EVIDENCE.md) | Source types |
| [ROUTING.md](./ROUTING.md) | Dijkstra reuse |
| [OBSERVABILITY.md](./OBSERVABILITY.md) | Metrics, no passport logs |
| [SLOS.md](./SLOS.md) | Supervised pilot SLOs |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Env separation, rollback |
| [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) | Playbooks |
| [ACCESSIBILITY.md](./ACCESSIBILITY.md) | WCAG 2.2 AA |
| [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md) | Before live |
| [REAL_HARDWARE_ROADMAP.md](./REAL_HARDWARE_ROADMAP.md) | Before BMS/lift/door |

Core Access Intelligence docs: [`../access-intelligence/`](../access-intelligence/).
