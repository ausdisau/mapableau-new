# MapAble Care Agent Studio

Status: internal alpha, default-off, synthetic/de-identified evaluation only.

## Purpose

`/admin/ai/agent-studio` is a governed MapAble administration surface for
creating and evaluating a reusable OpenAI managed agent definition for the
MapAble Care & Support experience.

It deliberately does **not** create a ninth canonical MapAble operational
agent. The Studio derives its role and constraints from:

- `support_participation`;
- `participant_authority`;
- the canonical AI capability registry;
- capability feature flags and kill switches;
- the existing MapAble audit service.

The OpenAI hosted definition has no function tools in v0.1. Real-world
bookings, assignments, disclosures, payments, claims, consent changes,
clinical decisions and safeguarding determinations stay outside the hosted
agent.

## UI

The product surface follows a two-tab Setup / Sessions model:

- **Setup** — name, specialization, model configuration, autonomy envelope,
  communication-access status, generated TypeScript preview and capability
  readiness.
- **Sessions** — managed session list, session items, AAC-style quick phrases,
  follow-up messages and a visible human-support path.

The visual language uses the canonical MapAble teal, gold, navy and accessible
focus treatment rather than copying the OpenAI console branding.

## Managed Agents API

Server adapter:

`lib/ai/platform/agent-studio/openai-managed-agents.ts`

Endpoints used:

- `POST /v1/agents`;
- `POST /v1/agents/sessions`;
- `GET /v1/agents/sessions?agent_id=...`;
- `GET /v1/agents/sessions/{session_id}`;
- `GET /v1/agents/sessions/{session_id}/items`;
- `POST /v1/agents/sessions/{session_id}/events`.

Secrets remain server-side. The adapter reads:

```bash
OPENAI_API_KEY=
OPENAI_PROJECT_ID=
```

and sends the Agents beta header from the server. Browser code never receives
either credential.

## Feature flag

```bash
MAPABLE_AGENT_STUDIO_ENABLED=false
```

The page may be reviewed while the flag is off, but API execution fails closed.

## Data boundary

Every session request must declare:

```text
synthetic_or_deidentified
```

The Studio is not an approved production participant-data pathway.

Audit events record identifiers, configuration metadata and prompt length, not
raw prompt content.

## Authority model

The v0.1 Studio exposes:

- A0 Explain — allowed;
- A1 Draft — allowed;
- A2 Recommend — allowed after deterministic hard filtering;
- A3 Prepare — approval required;
- A4 Execute — disabled;
- A5 High-impact autonomy — prohibited.

Operator-entered specialization text is subordinate to server-appended MapAble
governance instructions.

## Communication access

The Sessions composer includes large-target AAC-style quick phrases. Voice
calibration is shown as a prototype adapter only; it is not connected to
canonical authority and no speech confidence score is treated as consent,
capacity or safety evidence.

## Validation before enabling

1. Confirm the canonical agent registry validates.
2. Configure an OpenAI project-scoped server key and explicit
   `OPENAI_PROJECT_ID`.
3. Run `pnpm type-check`, `pnpm lint`, and targeted agent-studio tests.
4. Complete keyboard, screen reader, magnification, large-text and high-contrast
   review.
5. Verify Vercel Preview environment variables without exposing secrets.
6. Exercise managed agent creation and synthetic session/message exchange.
7. Confirm no hosted function tools are present.
8. Review audit metadata for minimisation.
9. Keep production participant data out of this Studio until a separate
   privacy, consent, security and operational release gate is approved.

## Relation to other MapAble AI paths

- `/admin/ai/agents` remains the canonical Agentic Nerve Centre governance
  view.
- The Mission Runtime and Governed Action Kernel remain the authority and
  execution boundaries for governed MapAble actions.
- The Care support transformer remains a deterministic draft/guardrail pipeline.
- This Studio is a hosted reasoning/session evaluation surface only.
