# MapAble ACSS — Vercel Gap Matrix

**Phase:** 0 — Forensic audit

## Current Vercel architecture

| Capability | Current |
|------------|---------|
| Web | Next.js 15.5 App Router on Vercel |
| API | ~758 Route Handlers under `app/api/` |
| Middleware / Edge | `middleware.ts` (JWT, CSP, hosts) |
| Cron | One job: `/api/admin/ingest/ndis-providers` |
| AI SDK | `ai` v6 + `@ai-sdk/*` |
| AI Gateway | Used via model gateway + `AI_GATEWAY_API_KEY` |
| Observability | `@vercel/speed-insights`, PostHog |
| Blob | Not used |
| Queues | Not used |
| Workflow (Vercel product) | Not used |
| Fluid Compute | Not explicitly configured in repo |
| Marketplace integrations | Not declared in `vercel.json` |

## Recommended Vercel architecture

```text
Next.js App Router (KEEP)
  ├── Route Handlers / limited Server Actions (KEEP)
  ├── Middleware auth/CSP (KEEP)
  ├── Vercel AI SDK + AI Gateway via Model Gateway (EXTEND)
  ├── Vercel Cron for scheduled ticks (EXTEND carefully)
  ├── Speed Insights / existing PostHog (KEEP)
  ├── Optional: Blob as StorageAdapter backend (OPTIONAL)
  ├── Optional: Queues / Workflow as WorkflowEngine adapters (OPTIONAL / INVESTIGATE)
  └── External: Neon Postgres, Temporal-or-durable DB workflows, S3/Supabase storage, SendGrid/Twilio/Stripe
```

## Gap matrix

| Capability | Current | Vercel Native Option | Migration Required | Risk |
| ---------- | ------- | -------------------- | ------------------ | ---- |
| Web | Next 15 App Router | Next on Vercel | No | Low |
| API | Route Handlers | Functions / Fluid | No (tune `maxDuration`) | Low–Med |
| AI | AI SDK + Gateway | AI SDK + Gateway | Extend gateway only | Low |
| Long-running tasks | In-memory + Temporal source (no Temporal pkgs in package.json) | Workflow / Fluid / external worker | **Investigate** Temporal packaging; abstract WorkflowEngine | **High** |
| Background jobs | Domain queues, webhook enqueue, watch ticks | Queues or Cron + durable DB | Prefer DB-backed jobs; Queues optional | Med |
| Workflows | Prisma `WorkflowRun` + Temporal files | Vercel Workflow optional | Adapter pattern; don’t rewrite missions onto Vercel Workflow day-one | Med |
| Cron | 1 cron | Vercel Cron | Add ACSS crons only after durable stores | Low |
| Storage | local / s3 / supabase | Blob optional | Optional Blob backend behind interface | Med (ephemeral FS) |
| Database | Neon Postgres + Prisma | Serverless Postgres (Neon) | Keep; pooler/`DIRECT_URL` discipline | Med |
| Observability | Speed Insights + PostHog + AuditEvent | Vercel Observability optional | Extend audit correlation IDs | Low |
| Edge runtime | Middleware edge; most APIs Node | Edge where safe | Don’t force Edge for Prisma-heavy routes | Med |
| Realtime | `apps/realtime-server` | External / separate | Keep external to serverless request path | Med |
| MCP stdio | Cursor/dev hosts | N/A on Vercel Functions | Keep external | Low |
| Local filesystem docs | `.data/documents` local mode | Blob/S3 | **Must not** rely on local disk in production Vercel | **High** |

## Classification of major runtimes

| Path | Compatibility |
|------|-----------------|
| `app/api/**` Route Handlers | VERCEL-NATIVE / COMPATIBLE |
| `middleware.ts` | VERCEL-NATIVE (Edge) |
| `lib/prisma.ts` + Neon | VERCEL-COMPATIBLE (pooler) |
| `lib/ai/platform/**` request-scoped | VERCEL-COMPATIBLE |
| In-memory mission/action stores | VERCEL-COMPATIBLE WITH ADAPTATION (lose state across isolates — **must durable**) |
| `lib/storage` local backend | NOT SUITABLE FOR SERVERLESS production |
| `lib/workflows/temporal/temporal-worker.ts` | EXTERNAL SERVICE REQUIRED (worker process) |
| `mcp/*/server.ts` stdio | EXTERNAL SERVICE REQUIRED |
| `apps/realtime-server` | EXTERNAL SERVICE REQUIRED |
| Browser automation / native binaries | NOT found as first-class prod path; amalgamation may differ |

## Technology verdicts

| Technology | Verdict |
|------------|---------|
| Next.js | **USE** |
| Vercel Functions / Route Handlers | **USE** |
| Vercel Fluid Compute | **OPTIONAL** (long AI routes) |
| Vercel Workflow | **REQUIRES INVESTIGATION** — optional adapter after portable interface |
| Vercel Queues | **OPTIONAL** |
| Vercel Cron | **USE** (expand carefully) |
| Vercel Blob | **OPTIONAL** (storage adapter) |
| Vercel AI SDK | **USE** (already) |
| Vercel AI Gateway | **USE** (already) |
| PostgreSQL (Neon) | **USE** |
| External workers (Temporal/realtime) | **USE** where serverless unfit |
| Custom Kubernetes | **DO NOT USE** |
| BullMQ/Inngest | **DO NOT USE** unless proven need (absent today) |

## Env discrepancy (record only)

- Code: `DOCUMENT_STORAGE_BACKEND`  
- `.env.example`: `DOCUMENT_STORAGE_MODE`  
Implementation > documentation.
