# MapAble ACSS — Vercel Infrastructure

**Phase:** 0 — Repository Discovery  
**Rule:** Prefer Vercel-native where compatible; keep ACSS domain logic portable via adapters.

---

## 1. Deployment model

| Item | Finding |
|------|---------|
| Hosting | **Vercel** (Next.js framework preset) |
| Config | [`vercel.json`](../../vercel.json) |
| Framework field | `"framework": "nextjs"` |
| Speed Insights | `@vercel/speed-insights` in `package.json` |
| Project dir | No checked-in `.vercel/` at repo root |
| Regions | Not pinned in `vercel.json` (platform defaults apply) |

[`next.config.ts`](../../next.config.ts) includes Vercel-aware build settings (`VERCEL` env, OOM/CPU tuning, security headers).

---

## 2. `vercel.json` (as of discovery)

```json
{
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/admin/ingest/ndis-providers",
      "schedule": "15 17 * * *"
    }
  ],
  "headers": [
    /* CORS for /api/* → mapable.com.au and peer.mapable.com.au */
  ]
}
```

### Cron jobs

| Path | Schedule | Purpose |
|------|----------|---------|
| `/api/admin/ingest/ndis-providers` | `15 17 * * *` (daily) | NDIS provider ingest |

Cron auth helpers live under admin ingest / `lib/admin` patterns (see ingest tests). Additional product “cron-like” behaviours may exist as scheduled API ticks (e.g. mission watch) but are **not** all registered in `vercel.json`.

### Headers

- Default API CORS origin: `https://mapable.com.au`
- Host-conditioned CORS for `peer.mapable.com.au`

---

## 3. Functions / runtime

| Pattern | Usage |
|---------|--------|
| Next.js Route Handlers | Primary serverless/edge-compatible API surface (`app/api/**`) |
| Middleware | Edge JWT/CSP (`middleware.ts`) |
| `maxDuration` | Used on selected long routes (e.g. Slack chat bot) |
| Server Actions | Available; Route Handlers dominate AI/mission APIs |

AI mission / action / guardian APIs (flag-gated):

- `app/api/ai/agents/**`
- `app/api/ai/missions/**`
- `app/api/ai/actions/**`
- `app/api/ai/guardian/**`
- `app/api/ai/context/**`
- `app/api/navigator/pilot/**`

---

## 4. AI Gateway (Vercel)

Environment (from [`.env.example`](../../.env.example)):

| Variable | Role |
|----------|------|
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key (comments also mention `VERCEL_AI_GATEWAY_API_KEY` in interpreter seams) |

Model resolution order is implemented in [`lib/ai/platform/models/gateway.ts`](../../lib/ai/platform/models/gateway.ts):

1. Kill switches  
2. Capability backend selection  
3. Self-hosted gpt-oss (`@ai-sdk/openai-compatible`) when configured  
4. Vercel AI Gateway (`gateway(modelId)` from AI SDK)  
5. Google (`@ai-sdk/google`)  
6. Deterministic fallback  

Allowlist: [`lib/ai/platform/models/registry.ts`](../../lib/ai/platform/models/registry.ts).

---

## 5. Storage

| Option | Status |
|--------|--------|
| **Vercel Blob** (`@vercel/blob`) | **Not present** in `package.json`; no usage found |
| Document storage | [`lib/storage/document-storage-service.ts`](../../lib/storage/document-storage-service.ts) — backends `local` \| `s3` \| `supabase` via **`DOCUMENT_STORAGE_BACKEND`** (code). **Discrepancy:** [`.env.example`](../../.env.example) documents `DOCUMENT_STORAGE_MODE=local` — implementation wins (`DOCUMENT_STORAGE_BACKEND`) |
| Secure documents | [`lib/platform/secure-document-service.ts`](../../lib/platform/secure-document-service.ts) + Prisma `Document*` |

**ACSS recommendation:** Keep document metadata in Postgres; use existing storage adapters. Introduce Vercel Blob only as an additional `DOCUMENT_STORAGE` backend behind the same interface if product/ops choose it.

---

## 6. Queues / durable workflows

| Product | Status in repo |
|---------|----------------|
| **Vercel Queues** | **Missing** |
| **Vercel Workflow** | **Missing** |
| Temporal | Present under [`lib/workflows/temporal/`](../../lib/workflows/temporal/), gated by `TEMPORAL_ENABLED=false` by default |
| Prisma durable workflow | [`lib/platform/durable-workflow-service.ts`](../../lib/platform/durable-workflow-service.ts) + model `WorkflowRun` |
| n8n automation | [`lib/automation/n8n/`](../../lib/automation/n8n/), env-gated |
| Domain queues | Webhook delivery, trust/safety, safeguarding review, offline action queue, provider attention queue |

**ACSS recommendation:** Define a portable `WorkflowEngine` / queue adapter. Wire Temporal + Prisma first. Evaluate Vercel Workflow / Queues later as optional adapters — do not block Phase 1–7 on them.

---

## 7. Environment configuration (Vercel-relevant)

Large [`.env.example`](../../.env.example) (~600+ keys). Themes relevant to ACSS:

| Theme | Examples |
|-------|----------|
| Database | `DATABASE_URL`, `DIRECT_URL` (Neon pooler / direct) |
| Auth | `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, OAuth, passkeys, Twilio |
| AI platform | Many `MAPABLE_*` flags; `MAPABLE_AI_GLOBAL_KILL_SWITCH`; agentic nerve centre flags |
| AI Gateway | `AI_GATEWAY_API_KEY`, Google / gpt-oss keys |
| Documents | `DOCUMENT_STORAGE_BACKEND` (code) vs `DOCUMENT_STORAGE_MODE` (.env.example — discrepancy) |
| Temporal | `TEMPORAL_ENABLED` — Temporal **source** under `lib/workflows/temporal/` but **no `@temporalio/*` packages** in root `package.json` (investigate before relying on it) |

Secrets must remain server-side; never expose gateway keys to the client.

---

## 8. Integrations already Vercel-aligned

| Integration | Notes |
|-------------|--------|
| Next.js on Vercel | Primary deploy |
| Vercel AI SDK (`ai` v6) | Streaming + `generateObject` / `streamText` |
| Vercel AI Gateway | Via model gateway |
| Speed Insights | Dependency present |
| Cron | One registered job |

---

## 9. Vercel-first, not Vercel-locked

Target adapter boundary for ACSS:

```text
ACSS DOMAIN (portable)
        │
        ▼
INFRASTRUCTURE INTERFACES
        │
        ├── WorkflowEngine
        ├── QueueAdapter
        ├── StorageAdapter
        ├── ModelGateway   (exists)
        └── DatabaseAdapter (Prisma today)
        │
        ▼
VERCEL / CURRENT IMPLEMENTATIONS
```

Business logic for consent, autonomy, policy, and agent contracts must not import Vercel product SDKs directly.

---

## 10. Gaps vs ACSS target diagram

| ACSS target component | Vercel status |
|-----------------------|---------------|
| Next.js + Route Handlers + streaming | **Exists** |
| Cron | **Partial** (one job; expand as needed) |
| Blob storage | **Missing** (use existing storage) |
| Queues | **Missing** (use Temporal/Prisma/domain queues) |
| Durable Workflow product | **Missing** (Temporal/Prisma stand in) |
| AI Gateway | **Exists** (extend, don’t replace) |

---

## Related docs

- [00-ARCHITECTURE-AS-IS.md](./00-ARCHITECTURE-AS-IS.md)
- [02-AI-INVENTORY.md](./02-AI-INVENTORY.md)
- [10-IMPLEMENTATION-ROADMAP.md](./10-IMPLEMENTATION-ROADMAP.md)
- [`docs/operations/neon.md`](../operations/neon.md)
