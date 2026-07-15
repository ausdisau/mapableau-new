# Access Intelligence — Implementation Plan

## Detected architecture

| Area | Finding |
|------|---------|
| App | Next.js 15.5.7 App Router, React 18, TypeScript strict, paths `@/*` → repo root (no `src/`) |
| Package manager | pnpm (`pnpm-lock.yaml`, `packageManager: pnpm@10.12.1`) |
| UI | Tailwind 3.4 + shadcn-style `components/ui`, Lucide, MapAble Care tokens |
| Auth | NextAuth v4 — `requireApiSession()`, `getCurrentUser()` |
| DB | Prisma 6.19.2 + Neon/Postgres; existing `AccessibilityProfile`, `AccessPlace*`, `AuditEvent` |
| AI | `ai` 6.0.196, `@ai-sdk/react` 3.x, `@ai-sdk/google` 3.x, Zod 4 |
| Tests | Vitest 3 (`tests/**/*.test.ts(x)`). No Playwright |
| Existing page | B2B marketing stub at `/access-intelligence` — relocated to `/access-intelligence/insights` |

## Route decision

- Personal Access Intelligence workspace at `/access-intelligence`
- B2B stub preserved at `/access-intelligence/insights`
- Paths use repo root (`app/`, `lib/`, `components/`, `tests/`) not `src/`

## Files to add or modify

### Add

- `lib/access-intelligence/*` — schemas, engines, agent, tools, repositories, demo data
- `components/access-intelligence/*` — workspace UI
- `app/access-intelligence/{page,passport,places/[placeId],insights}/page.tsx`
- `app/api/access-intelligence/{chat,passport,actions/*}/route.ts`
- `tests/access-intelligence/*.test.ts`
- `docs/access-intelligence/{README,DATA_MODEL,SAFETY_AND_GOVERNANCE}.md`
- Prisma models + migration for access-intelligence entities

### Modify

- `app/access-intelligence/page.tsx` — replace stub with personal workspace
- `.env.example` — module env vars

## Database strategy

1. MVP: repository interfaces + demo adapter (in-memory fixtures)
2. Prisma models for production path when `ACCESS_INTELLIGENCE_DEMO_MODE=false`
3. PostGIS not required for MVP route graph (TypeScript Dijkstra)

## AI SDK version and APIs

- Version: `ai@6.0.196`
- `ToolLoopAgent`, `stepCountIs`, `Output.object({ schema })`
- `tool({ inputSchema, needsApproval, execute })`
- `createAgentUIStreamResponse`
- Client: `useChat` + `DefaultChatTransport` + `addToolApprovalResponse` + `lastAssistantMessageIsCompleteWithApprovalResponses`
- Model via `AI_GATEWAY_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY`, `ACCESS_INTELLIGENCE_MODEL` / `AI_MODEL` / `SEARCH_INTERPRETER_MODEL`

## Integration points

- Auth: NextAuth session for passport/writes; demo user fallback in demo mode for chat
- Model: same gateway/Google helper pattern as search interpreter
- Audit: module audit events (+ optional `AuditEvent` mirror)
- Existing `lib/access-fit` left unchanged
- No fabricated live venue/lift/transport integrations

## Assumptions

- Demo mode default for local/cloud verification without DB
- MapAble Care visual language preserved
- Chat degrades gracefully when AI keys absent
- No Playwright smoke test (framework not present)

## Implementation sequence

1. This document
2. Domain schemas, demo data, engines
3. Repositories + API routes
4. Agent + streaming chat
5. UI + passport editor + relocate B2B stub
6. Prisma models/migration
7. README / DATA_MODEL / SAFETY docs
8. Tests, type-check, lint, build
