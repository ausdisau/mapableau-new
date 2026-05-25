# MapAble Graph Intelligence Layer

Participant-controlled support intelligence built on PostgreSQL (nodes, edges, events, snapshots) — not hidden profiling. Graphs make pathways **explainable**, **editable**, **consent-aware**, and **auditable**.

## Architecture

| Layer | Location |
|-------|----------|
| Storage | `graph_nodes`, `graph_edges`, `graph_events`, `graph_snapshots` (Prisma) |
| Types | `lib/mapable-graphs/types.ts` |
| Validation | `lib/mapable-graphs/schemas.ts` (Zod) |
| Repository | `lib/mapable-graphs/repository.ts` |
| Domain graphs | `lib/mapable-graphs/graphs/*` |
| Orchestration | `lib/mapable-graphs/service.ts` |
| API | `app/api/mapable-graphs/**` |
| UI | `components/mapable-graphs/**` |

No Neo4j in MVP. Future migration path: Neo4j, Memgraph, Neptune, or vector/graph hybrid — export via `graph_snapshots` and typed edge lists.

## Graph types

- `participant_journey` — goals, preferences, functional signals, barriers
- `support_journey` — needs, recommendations, service plans
- `booking` — care, transport, employment links and dependencies
- `outcome` — what worked, feedback, complaints (no auto support reduction)
- `consent` — scopes, recipients, revocation audit
- `guardrail` — NDIS rules, policy decisions, checkpoints
- `feedback` — confirmations, edits, rejections, learning signals (no default model training)
- `provider_capability` — workers, credentials, suitability
- `assessment_evidence` — WHODAS, GMFCS, I-CAN, narratives (non-deterministic)

## Node and edge types

See `lib/mapable-graphs/types.ts` for full `NodeType` and `EdgeType` unions.

## API usage

All routes require session auth. Participant-scoped routes use `canViewParticipantProfile`.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/mapable-graphs/node` | Create node |
| PATCH | `/api/mapable-graphs/node?nodeId=` | Update node |
| POST | `/api/mapable-graphs/edge` | Create edge |
| DELETE | `/api/mapable-graphs/edge?edgeId=` | Delete edge |
| GET | `/api/mapable-graphs/:graphType/:participantId` | Full graph |
| GET | `/api/mapable-graphs/:graphType/:participantId/summary` | Participant summary |
| POST | `/api/mapable-graphs/participant-journey` | Journey actions |
| POST | `/api/mapable-graphs/support-journey` | Support pathway (+ `infer_from_query`) |
| POST | `/api/mapable-graphs/booking` | Booking graph |
| POST | `/api/mapable-graphs/outcome` | Record outcome |
| POST | `/api/mapable-graphs/consent/check` | Consent check / grant |
| POST | `/api/mapable-graphs/guardrail/evaluate` | Policy evaluation |
| POST | `/api/mapable-graphs/feedback` | Feedback signals |
| POST | `/api/mapable-graphs/assessment-evidence` | Assessment evidence |

### Example: infer support from narrative

```json
POST /api/mapable-graphs/support-journey
{
  "participantId": "<user id>",
  "action": "infer_from_query",
  "query": "I need help getting ready and getting to work."
}
```

Returns classification, guardrail decision, and `checkpointRequired` when participant confirmation is needed.

## Participant-in-the-loop protections

1. AI/copilot classification writes **draft** nodes only.
2. `REQUIRE_PARTICIPANT_CONFIRMATION` / `ESCALATE_SAFEGUARDING` from guardrail graph.
3. Service plans carry `requiresParticipantConfirmationBeforeBooking`.
4. Outcomes store `notUsedForAutoReduction: true`.
5. Assessment evidence stores `cannotDecideEligibility: true`.
6. Feedback defaults `modelTrainingDefault: false`.

## Guardrail integration

Rules load from:

1. Airtable (`AIRTABLE_NDIS_GUARDRAIL_BASE_ID`, `AIRTABLE_NDIS_GUARDRAIL_TABLE`, `AIRTABLE_API_KEY`) when configured
2. Fallback: `data/ndis-guardrails-fallback.json`

Policy outcomes: `ALLOW_AUTOMATION`, `ALLOW_DRAFT_ONLY`, `REQUIRE_PARTICIPANT_CONFIRMATION`, `REQUIRE_SCOPED_CONSENT`, `REQUIRE_HUMAN_REVIEW`, `REQUIRE_CREDENTIAL_AND_TRAINING_CHECK`, `ESCALATE_SAFEGUARDING`, `BLOCK`.

## MapAble LLM / Co-Pilot integration

`POST /api/mapable/ask` with `participantId` syncs:

1. Participant Journey Graph (goals)
2. Support Journey Graph (draft needs)
3. Guardrail evaluation + confirmation gate in `requiredConfirmations`
4. Audit event `llm.classification.synced`

Classifier: deterministic `classifySupportFromQuery` in `lib/mapable-graphs/llm-integration.ts` (aligned with Co-Pilot intent router — no external LLM required for MVP).

## CPSim / MDSim integration

```ts
import { graphService } from "@/lib/mapable-graphs/service";

const cpsim = await graphService.buildCPSimInput(participantId);
const mdsim = await graphService.buildMDSimInput(participantId);
```

- **CPSim**: support journey, booking, assessment, consent, provider capability
- **MDSim**: booking, provider capability, outcome, feedback, guardrail

Booking buffer warnings: `evaluateBookingBufferWarnings` in `lib/mapable-graphs/sim-integration.ts`.

## Privacy and consent

Graph consent scopes complement Prisma `ConsentRecord` scopes (e.g. `transport.accessibility_share`). `checkConsentForAction` checks both graph `DataScope` nodes and existing consent service.

Share modes: `once`, `always`, `deny`, plus revocation on graph `ConsentRecord` nodes.

## Database migration

After pulling, run:

```bash
pnpm exec prisma db push
# or
pnpm exec prisma migrate dev --name mapable_graph_intelligence
```

## UI components

Import from `@/components/mapable-graphs`:

- `ParticipantJourneySummary`
- `SupportJourneySummary`
- `BookingDependencyCard`
- `OutcomeProgressCard`
- `ConsentSharingCard`
- `GuardrailDecisionCard`
- `FeedbackCaptureCard`

All use large touch targets, visible focus, plain language, and `role="alert"` / `role="status"` where appropriate.
