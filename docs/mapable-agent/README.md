# MapAble Agent (gpt-oss runtime)

Accessible AI assistant for NDIS participants and staff, powered by **gpt-oss** through Ollama (local dev) or vLLM (production).

## Features

- Chat at `/agent` with plain-language responses
- 14 domain tools (plan parsing, billing checks, transport quotes, jobs, etc.)
- Human review queue for low-confidence and sensitive decisions
- Audit log for sensitive tool calls
- pgvector document search (RAG)
- BullMQ background embedding jobs

## Prerequisites

- Node 20+ and pnpm
- PostgreSQL with **pgvector** extension
- Redis (for BullMQ workers)
- **Ollama** (dev) or **vLLM** (prod) with gpt-oss model

### Model setup (Ollama — dev)

```bash
ollama pull gpt-oss:20b
ollama serve
```

### Model setup (vLLM — production)

```bash
vllm serve openai/gpt-oss-20b
# OpenAI-compatible API at http://127.0.0.1:8000/v1
```

## Environment

Copy from `.env.example`:

```bash
MAPABLE_AGENT_ENABLED=true
MAPABLE_AGENT_MODEL_PROVIDER=ollama   # or vllm
MAPABLE_AGENT_MODEL=gpt-oss:20b
OLLAMA_BASE_URL=http://127.0.0.1:11434
VLLM_BASE_URL=http://127.0.0.1:8000/v1
REDIS_URL=redis://127.0.0.1:6379
DATABASE_URL=postgresql://...
```

## Database

```bash
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

Enable pgvector on your Postgres instance (migration runs `CREATE EXTENSION IF NOT EXISTS vector`).

## Seed demo data

```bash
SEED_USER_ID=<your-user-cuid> pnpm exec tsx prisma/seed-mapable-agent.ts
```

## Run app

```bash
pnpm dev
# Visit http://localhost:3000/agent
```

## Background worker

```bash
docker run -d -p 6379:6379 redis:7
pnpm mapable-agent:worker
```

## Routes

| Route | Description |
|-------|-------------|
| `/agent` | Chat interface |
| `/agent/sessions/[id]` | Session history |
| `/agent/review-queue` | Staff human review (admin) |
| `/agent/tools` | Tool catalog |
| `/agent/audit` | Audit log (admin) |
| `/agent/settings` | Accessibility preferences |

## API

- `POST /api/mapable-agent/chat` — send message
- `GET/POST /api/mapable-agent/sessions` — list/create sessions
- `GET /api/mapable-agent/review-queue` — pending reviews (admin)
- `GET /api/mapable-agent/tools` — tool metadata
- `GET /api/mapable-agent/audit` — audit events (admin)
- `GET/PATCH /api/mapable-agent/settings` — user a11y settings

## Safety rules

- AI may **explain, summarise, draft, classify, recommend** only.
- AI must **not** book, approve, pay, submit, send, cancel, disclose, or escalate externally without human approval.
- Every sensitive tool call creates an **audit event**.
- Low-confidence and sensitive categories create **HumanReviewTask** records.
- Raw chain-of-thought is **never** shown to participants; optional short reasoning summary only.

## Architecture

```
app/agent/*          → UI (WCAG 2.2 AA patterns)
app/api/mapable-agent/* → API routes
lib/mapable-agent/   → orchestrator, tools, model providers, RAG
lib/queue/           → BullMQ + Redis
```

Model providers implement `ModelProvider` in `lib/mapable-agent/model/`:

- `OllamaGptOssProvider` — local dev
- `VllmGptOssProvider` — production OpenAI-compatible endpoint

## Tests

```bash
pnpm test tests/mapable-agent
```
