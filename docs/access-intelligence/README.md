# Access Intelligence

## Product purpose

Access Intelligence helps people with disabilities decide whether they can reach a place, enter the correct entrance, move through the building, use required facilities, reach an internal destination, and complete a visit under current conditions.

Accessibility is treated as a relationship between a person, a destination, a route, available evidence, and live conditions — not a universal venue property or a wheelchair icon.

## Commercial products (initial)

| Product | Entry |
|---------|-------|
| Access Intelligence Core | `/access-intelligence` |
| MapAble Trust Kernel | Consent/approval in Visit + [TRUST_KERNEL.md](./TRUST_KERNEL.md) |
| MapAble Verify | `/verify` |
| Access Intelligence Learning Lab | `/access-intelligence/learn` |
| Living Access Twin | `/access-intelligence/buildings/place-harbour-civic` |
| Pilot and Evaluation Console | `/access-intelligence/pilots` |

Future products (Journey, Work, Cities, Campus, Tourism, Developer Platform, Adaptive Building) are documented in [PRODUCT_PORTFOLIO.md](./PRODUCT_PORTFOLIO.md) — no empty shells.

## Living Building (flagship)

Four modes on one Harbour Civic Centre twin:

- Visit — `/access-intelligence/buildings/place-harbour-civic`
- Learn — Learning Lab + Interview L3 flight simulator
- Operate — `/access-intelligence/operate/place-harbour-civic`
- Improve — `/access-intelligence/improve/place-harbour-civic`

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

- **UI**: Next.js App Router pages under `app/access-intelligence/`
- **API**: streamed chat + passport + approval-gated actions under `app/api/access-intelligence/`
- **Agent**: AI SDK v6 `ToolLoopAgent` with typed tools and `Output.object` structured plans
- **Engines**: deterministic fit, confidence, and route (Dijkstra) — models may call them, not override them
- **Persistence**: demo in-memory fixtures by default; Prisma `ai_*` tables for production

```
User ↔ Access Chat (useChat)
        → POST /api/access-intelligence/chat
          → ToolLoopAgent + needsApproval write tools
            → fit-engine / route-engine / repositories
```

## File map

| Path | Role |
|------|------|
| `lib/access-intelligence/` | Schemas, engines, agent, tools, demo data, repositories |
| `components/access-intelligence/` | Workspace UI, passport editor, plan card, approvals |
| `app/access-intelligence/` | Planner, passport, place detail, B2B insights |
| `app/api/access-intelligence/` | Chat, passport, verification, barrier report |
| `tests/access-intelligence/` | Engine and tool contract tests |
| `docs/access-intelligence/` | This documentation set |
| `lib/access-intelligence/learning/` | Learning Lab schemas, state machine, rubrics, scenarios |
| `app/access-intelligence/learn/` | Learning Lab UI (practice, progress, author, facilitate) |
| `prisma/migrations/20260715120000_access_intelligence/` | DB migration |

## Setup

```bash
pnpm install
# optional AI keys for streaming chat
export AI_GATEWAY_API_KEY=...   # or GOOGLE_GENERATIVE_AI_API_KEY
export ACCESS_INTELLIGENCE_DEMO_MODE=true
pnpm dev
```

Open [http://localhost:3000/access-intelligence](http://localhost:3000/access-intelligence).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `ACCESS_INTELLIGENCE_DEMO_MODE` | Default `true` unless set to `false`/`0` |
| `ACCESS_INTELLIGENCE_MODEL` / `AI_MODEL` | Model id (falls back to `SEARCH_INTERPRETER_MODEL`) |
| `AI_PROVIDER` | Provider hint (`google` default) |
| `AI_GATEWAY_API_KEY` / `VERCEL_AI_GATEWAY_API_KEY` | Vercel AI Gateway |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Direct Google provider |
| `ACCESS_INTELLIGENCE_MAX_STEPS` | Agent step limit (default 12) |
| `ACCESS_INTELLIGENCE_USE_PRISMA` | Opt-in Prisma Living persistence (also requires demo mode off) |
| `ACCESS_INTELLIGENCE_ALLOW_DEMO_ROLE_PREVIEW` | When demo on, honour `x-access-role` for Operate/Improve (default on; set `false` to disable) |
| `ACCESS_INTELLIGENCE_BMS_URL` | Optional HTTP BMS base URL (`/live-status`) |
| `ACCESS_INTELLIGENCE_BMS_API_KEY` | Optional Bearer token for BMS adapter |
| `ACCESS_INTELLIGENCE_PLAN` | Entitlement plan override (`community` … `enterprise`) |
| `ACCESS_INTELLIGENCE_ALLOW_PILOT_DEMO` | Soft-open pilot API when demo mode is off |

## How to run

- App: `pnpm dev`
- Tests: `pnpm test tests/access-intelligence`
- Typecheck: `pnpm type-check`
- Lint: `pnpm lint`

## Modules

| Route | Purpose |
|-------|---------|
| `/access-intelligence` | Ask Access chat + demo scenarios |
| `/access-intelligence/explore` | Search without chat |
| `/access-intelligence/passport` | Access Passport editor |
| `/access-intelligence/visit-plans` | Saved visit plans |
| `/access-intelligence/pulse` | Access Pulse barrier reports |
| `/access-intelligence/venue-studio` | Venue evidence gaps + remediation |
| `/access-intelligence/places/[id]` | Place evidence detail |
| `/access-intelligence/insights` | B2B partner preview |

## Demo mode

When demo mode is on:

- Four synthetic places including **MapAble Community Hub**
- Passports and audit events live in memory
- Write tools persist demo verification requests and barrier reports only
- Live status uses a clearly marked demo mock adapter
- No live venue messaging, TfNSW, or real lift feeds are connected

## Related docs

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [AI_AGENT.md](./AI_AGENT.md)
- [PRIVACY_AND_CONSENT.md](./PRIVACY_AND_CONSENT.md)
- [ACCESSIBILITY.md](./ACCESSIBILITY.md)
- [DATA_MODEL.md](./DATA_MODEL.md)
- [SAFETY_AND_GOVERNANCE.md](./SAFETY_AND_GOVERNANCE.md)
- [LEARNING_LAB.md](./LEARNING_LAB.md)
- [SCENARIO_AUTHORING.md](./SCENARIO_AUTHORING.md)
- [LEARNING_GOVERNANCE.md](./LEARNING_GOVERNANCE.md)

## How to add a place

1. Add place, elements, features, evidence, nodes, and edges to `lib/access-intelligence/demo-data.ts`, or
2. Insert into Prisma `ai_access_places` (+ related tables) and implement the Prisma repository mapping.

## How to add an access feature

Attach an `AccessFeature` to a `BuildingElement` with `sourceType`, `observedAt`, `evidenceIds`, and `confidence`. Never mark AI inference as a calibrated measurement.

## How confidence is calculated

`confidence-engine.ts` combines:

- source reliability defaults
- evidence age vs feature freshness windows
- corroboration
- dispute/conflict penalties
- coverage completeness
- live feed recency

Returns 0–100 plus plain-language label: high / moderate / limited / very limited.

## How fit is calculated

`fit-engine.ts`:

1. Evaluate every **required** requirement → match / fail / unknown
2. Any required failure → `blocked`
3. Else any required unknown → `unknown`
4. Else preference failures or live conditions → `suitable_with_conditions`
5. Else → `suitable`
6. Preference weights (`preferred=3`, `helpful=1`) score personal fit after gates

## How routing works

`route-engine.ts` runs Dijkstra on edges that pass hard passport constraints (steps, width, gradient, lift, barriers, incidents). Cost adds distance, gradient, narrowness, surface, sensory, uncertainty, and temporary condition penalties. Text step instructions are always returned.

## How action approvals work

Write tools set `needsApproval: true`. The UI shows recipient, purpose, fields/questions, and Approve/Cancel via `addToolApprovalResponse`. Dedicated REST endpoints also require `approved: true`. Audit events record outcome.

## Privacy and safety rules

See [SAFETY_AND_GOVERNANCE.md](./SAFETY_AND_GOVERNANCE.md).

## Limitations

- Demo places are synthetic
- Live lift/venue messaging is not integrated
- Prisma adapter is schema-ready; demo repository is the runtime default
- Chat requires configured AI keys; engines work without them

## Production integration roadmap

1. Seed real venues into `ai_*` tables (or map from `AccessPlace`)
2. Implement Prisma repository behind `ACCESS_INTELLIGENCE_USE_PRISMA`
3. Connect venue messaging for verification requests
4. Connect building BMS / lift status feeds for incidents
5. Optional PostGIS geometries for outdoor segments
6. Human assessor workflow for disputed evidence
