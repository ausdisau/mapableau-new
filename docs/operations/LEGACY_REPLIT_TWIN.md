# Legacy Replit twin (quarantine)

**Status:** Quarantine in progress (family amalgamation Phase 1)  
**Canonical runtime:** Next.js App Router + Prisma in this repository root  
**Legacy paths:** `server/`, `client/`, `shared/schema.ts`, `package.replit.json`,
`migrations/` (Drizzle), `*.replit.*` configs

## Rules

1. **Do not add new product features** to `server/` or `client/`. Implement in
   `app/`, `lib/`, `components/`, and `prisma/` instead.
2. **Ports** of REPL-unique capabilities follow
   [docs/mapable-merge-gap-analysis.md](../mapable-merge-gap-analysis.md).
3. **Scripts** `dev:replit`, `build:replit`, `start:replit`, `test:replit`,
   `db:push:replit` remain for historical verification only — they are not
   the production path (Vercel + `pnpm build`).
4. When a gap-analysis port is marked **done** or **won't-do**, update the
   tracker below. When all high-priority ports are closed, delete or move the
   twin behind `docs/merge-pending/` in a dedicated follow-up PR.

## Port tracker

| # | Feature | Target | Status |
| --- | --- | --- | --- |
| 1 | AI chat guardrails & safeguarding | `lib/chat/guardrails/` (+ API routes still in `ports/`) | in progress |
| 2 | NDIS PRODA API | `lib/ndis/proda-client.ts` (+ routes in `ports/`) | in progress |
| 3 | Orb usage metering | `ports/.../lib/orb/client.ts` (needs `orb-billing` dep) | tracked |
| 4 | BECS + auto-debit | `lib/billing/auto-debit.ts` (+ routes/schema in `ports/`) | in progress |
| 5 | Grocery supplier adapters | `lib/grocery/supplier/` (+ routes/schema in `ports/`) | in progress |
| 6 | ABN lookup & validation | `lib/ndis/abn-utils.ts`, `app/api/abn/lookup` | done |
| 7 | QuickBooks Online | `lib/billing/quickbooks/` optional | won't-do unless QB tenants retained (Xero is SoR) |
| 8 | AgentMail inbox | `lib/email/agentmail.ts` (+ routes in `ports/`) | in progress |

Status values: `tracked` | `in progress` | `done` | `won't-do`

Promoted libraries live under `lib/`. Remaining Next.js route handlers and Prisma
`additions.prisma` stay in [`ports/mapableau-new/`](../../ports/mapableau-new/) until
schema merge is scheduled. See [`ports/mapableau-new/INTEGRATION.md`](../../ports/mapableau-new/INTEGRATION.md).

## Ownership

Platform engineering owns twin quarantine. Org-wide SoR:
[AUSDISAU_AMALGAMATION.md](../strategy/AUSDISAU_AMALGAMATION.md).
