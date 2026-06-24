# MapAble — Universal Cursor meta-prompt

Copy this block at the start of any vertical implementation task. Replace `{{VERTICAL}}` with the module name (e.g. MapAble Emergency).

---

## Task

Implement **{{VERTICAL}}** as a modular MapAble vertical on this codebase. Read `docs/cursor-prompt-pack/{{SLUG}}.md` for the full spec and `docs/cursor-prompt-pack/00-shared-architecture.md` for cross-cutting rules.

## Stack (this repo — do not assume `src/`)

- **Next.js App Router** — routes under `app/`
- **TypeScript** — types in `types/`, logic in `lib/`
- **Postgres + Prisma** — `prisma/schema.prisma`, migrations under `prisma/migrations/`
- **NextAuth** — session via `lib/auth/*`, API guards in `lib/api/auth-handler.ts`
- **Tailwind** — existing design tokens and `components/ui/*` patterns
- **Zod** — `lib/validation/{{slug}}.ts`

Hosting may use Supabase for Postgres; **do not** replace Core auth with Supabase Auth.

## Non-negotiables

1. **Modular but connected** — extend Core; do not fork identity, messaging, or consent.
2. **No duplicate Core services** — reuse `createAuditEvent`, `createBooking`, notifications, consent checks.
3. **No sensitive data leakage** — participant clinical/safety data stays scoped; admins only where permission exists.
4. **Plain-language UI** — participant-facing copy at ~grade 8 reading level; Easy Read where specified.
5. **Human review** — safety-sensitive actions (emergency escalation, moderation, publishing advocacy stories) require explicit review queues or dual control where noted.
6. **Swappable adapters** — external APIs (AI summarise, speech-to-text, disaster feeds) behind `lib/adapters/*` interfaces.
7. **Confirm before commit** — voice and AI may **draft** only; participant (or authorised nominee) must confirm bookings, messages, and sharing.

## Standard deliverables per vertical

- Prisma models + migration
- `lib/{{slug}}/*` services
- `app/api/{{slug}}/**` route handlers
- `app/dashboard/{{slug}}/**` and/or `app/provider/**` pages
- `components/{{slug}}/**` accessible components
- Zod schemas + Vitest tests under `tests/`
- Seed snippet in `prisma/seed-{{slug}}.ts` or phase seed
- Dashboard nav links only when MVP UI ships

## Branch naming (cloud agents)

`cursor/{{slug}}-mvp-ce11` off `main` unless rebasing onto an open module PR is required.

## Definition of done

- `pnpm prisma validate` && `pnpm prisma generate`
- `pnpm type-check`
- `pnpm test` (new tests pass)
- Audit events for create/update/escalate/share actions
- README section or inline doc comment for adapter env vars

---
