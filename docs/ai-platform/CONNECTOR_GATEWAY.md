# Governed Connector Gateway (Prompt 09)

Canonical location: `lib/ai/platform/connector-gateway/`

One governed boundary between MapAble and external services.
External systems must **never** become direct tools of unrestricted AI agents.

```
Agent / Mission
      │
      ▼
Action Proposal
      │
      ▼
Governed Action Kernel (Prompt 02)
      │
      ▼
CONNECTOR GATEWAY  ──────► External System (writes)
      ▲
      │
External Source ──────────► Connector Gateway ──► Context Fabric–compatible records (reads)
```

## Flags (fail-closed)

| Flag | Default | Notes |
|------|---------|-------|
| `MAPABLE_CONNECTOR_GATEWAY_ENABLED` | `false` | Master switch — does **not** enable individual connectors |
| `MAPABLE_CONNECTOR_GATEWAY_KILL_SWITCH` | `false` | Blocks all gateway operations |
| `MAPABLE_CONNECTOR_*_ENABLED` | `false` | Per-connector fail-closed flags |
| `MAPABLE_CONNECTOR_*_KILL_SWITCH` | `false` | Per-connector kill switches |

Production flags must remain off until explicitly reviewed.

## Tool security

Agents **never** receive raw:

- API keys
- OAuth refresh tokens
- DB credentials
- Webhook secrets
- Service-admin credentials

Flow: Models → capabilities → proposals → Kernel authorises → Gateway invokes scoped adapter
with opaque credential handles. Only `role: "gateway"` may materialise credential *presence*
metadata; secret values are never returned on agent-visible surfaces.

## Read connectors

Require: `purpose`, `actor`, `tenant`, `consentScopes`, `scope`, provenance.

Returns `ConnectorCanonicalRecord[]` with `contentKind: "data"` and provenance
(`sourceSystem`, `sourceTrustClass`, `retrievedAt`, `purpose`, `actorId`,
`injectionQuarantined`). Compatible with Context Fabric when that module is present;
Prompt 09 does not add a Prisma Context Fabric store.

## Write connectors

Require a **Prompt 02 approved envelope** (`proposalId`, `approvalId`, `nonce`,
`payloadHash`, `actionKey`, `participantId`, `approvedPayload`).

The gateway **rejects**:

- Missing envelopes
- Arbitrary agent JSON writes
- Agent-role direct writes (kernel / gateway / service / human must mediate)

## Failure behaviour

- Per-attempt timeouts
- Bounded retry (`maxAttempts`, never infinite; agents must not add unbounded loops)
- Circuit breakers (closed → open → half-open)
- Health states: `healthy` | `degraded` | `unavailable` | `circuit_open` | `kill_switched` | `disabled`
- Manual fallback hints on degrade
- Tenant-scoped idempotency for write connectors that declare `idempotencySupport`

Persistence: **in-memory** health / circuit / audit / idempotency for Prompt 09.
A durable store would be **Prompt 09A** (Prisma) — not started here.

## Prompt injection

Retrieved external content (documents, provider profiles, web pages, messages,
calendar descriptions) is **DATA**, never tool instructions.

`sanitiseExternalContent` quarantines instruction-like fragments.
`refuseExternalAsToolInstruction` blocks promotion into the tool/instruction channel.

## Connector inventory (honest)

| Key | Mode | Maturity | Notes |
|-----|------|----------|-------|
| `stripe_billing` | read_write | **live** (product paths exist) | Thin gateway wrapper; live Stripe still behind product + connector flags |
| `email_sendgrid` | write | **live** helpers exist | Writes require approved envelope; mock when flags off |
| `messaging_internal` | write | **live** | Aligns with Action Kernel `send_provider_message` |
| `maps_geocode` | read | **stub** | Map layers exist in product; geocode adapter is stub-safe |
| `gais_access_read` | read | **live** Phase 0 | Purpose/consent/provenance wrap; GAIS claim state remains in_development |
| `calendar_events` | read_write | **live** internal Prisma | Descriptions sanitised as data |
| `ndia_claiming` | read_write | **exploratory** | `NdiaApiAdapter.stub` — live NDIA needs legal/account-owner decision |

Also inventoried (not registered as gateway connectors in Prompt 09): Xero, QuickBooks,
Twilio 2FA, partner webhooks, developer OAuth/API keys, MCP (`mcp/av`, `mcp/careos`),
PRODA client — remain on existing product paths; do not bypass this gateway for agent use.

## Authority

**AUTHORITY CHANGES: NONE.** No new autonomous write powers, no production enablement,
no regulated NDIA live interface.

## Related

- [GOVERNED_ACTION_KERNEL.md](./GOVERNED_ACTION_KERNEL.md) — write authorisation
- [AGENTIC_NERVE_CENTRE.md](./AGENTIC_NERVE_CENTRE.md) — agent/capability chain
- [CURRENT_STATE.md](./CURRENT_STATE.md) — maturity table
