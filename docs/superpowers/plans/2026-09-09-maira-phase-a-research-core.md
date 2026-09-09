# MAIRA Phase A Research Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build a research-only MAIRA runtime that performs scheduled and manual literature scans, preserves provenance, de-duplicates repeated findings, critiques evidence, stores a research ledger, and produces an admin-visible weekly brief without participant data.

**Architecture:** Extend the existing TypeScript `@openai/agents` runtime and `AgentRun`/`AuditEvent` patterns. A fail-closed R&D config gates MAIRA, typed Prisma records persist research evidence, MAIRA performs bounded source discovery, an Evidence Critic assigns a disposition, and scheduled/manual routes call one idempotent orchestration service. Phase A is capped at R0/R1 and has no repository-write authority.

**Tech Stack:** Next.js 15.5.21, React 18, TypeScript, pnpm 10.12.1, Prisma 6.19.2/Postgres, Zod 4.3.6, `@openai/agents`, Vitest 3.2.7, Vercel Cron Jobs.

**Spec:** `docs/superpowers/specs/2026-09-09-mapable-autonomous-rd-fabric-maira-r3-design.md`

## Current State

- **Verified live:** MapAble already uses `@openai/agents`, `AgentRun`, `AuditEvent`, admin authentication, fail-closed flags, Vercel cron configuration and synthetic-only AI evals.
- **Verified live:** the existing cron-auth helper requires a server-side bearer for cron and can verify an admin session for manual actions.
- **Proposed:** MAIRA research ledger, research agents, Sydney-local scheduling gate and R&D admin surface.
- **Exploratory:** Anthrogenic Intelligence and artificial selfhood remain long-horizon R&D objectives, not production capability claims.

## Global Constraints

- Authority ceiling: `R1_EXPLORE`; code generation, branch writes, previews and PR creation are unavailable.
- Flags default false: `MAPABLE_RD_FABRIC_ENABLED`, `MAPABLE_MAIRA_ENABLED`, `MAPABLE_MAIRA_SCHEDULED_ENABLED`.
- `MAPABLE_RD_AUTHORITY_CEILING` defaults to `R0_OBSERVE` and must never accept R4.
- Ordinary research uses public literature only. Exclude participant profiles, health information, location histories, NDIS records, private conversations, production rows and secrets.
- Retrieved papers/pages are untrusted content and cannot alter prompts, permissions, authority or tool scopes.
- Deterministic auth, config, idempotency, schema validation, source policy and audit remain outside the model.
- Any admin UI must target WCAG 2.2 AA, keyboard operation, screen-reader semantics, 200%/400% zoom/reflow, reduced motion, plain language and visible recovery.
- Human review remains available; disabling the flags is the non-AI operational fallback.

---

## File Structure

```text
intelligence/research/anthrogenic/
  config.ts
  types.ts
  source-policy.ts
  source-normalizer.ts
  research-ledger-service.ts
  novelty.ts
  brief-renderer.ts
  research-cycle.ts
  agents/maira.ts
  agents/evidence-critic.ts
lib/time/sydney-research-window.ts
app/api/internal/research/anthrogenic/run/route.ts
app/api/admin/r-and-d/run/route.ts
app/api/admin/r-and-d/runs/route.ts
app/admin/ops/r-and-d/page.tsx
components/admin/back-of-house/RAndDRunsAdmin.tsx
prisma/schema.prisma
prisma/migrations/20260909090000_maira_research_ledger/migration.sql
lib/ai/platform/evaluations/scenarios/maira.ts
lib/ai/platform/evaluations/scenarios/catalog.ts
docs/architecture/maira-research-core.md
.env.example
vercel.json
tests/maira-rd-config.test.ts
tests/maira-source-normalizer.test.ts
tests/maira-research-ledger.test.ts
tests/maira-research-cycle.test.ts
tests/maira-sydney-window.test.ts
tests/maira-admin-routes.test.ts
tests/maira-admin-ui.test.tsx
```

## Task 1 - Fail-closed configuration and contracts

**Files:** create `config.ts`, `types.ts`; modify `.env.example`; test `tests/maira-rd-config.test.ts`.

**Produces:** `getRAndDConfig()`, `ResearchFinding`, `ResearchOpportunity`, cycle input/result schemas.

- [ ] Write failing tests proving all flags are off by default and `R4_RELEASE` resolves to `R0_OBSERVE`.
- [ ] Run `pnpm exec vitest run tests/maira-rd-config.test.ts` and observe RED.
- [ ] Implement an authority enum containing only `R0_OBSERVE | R1_EXPLORE | R2_EXPERIMENT | R3_PROPOSE`.
- [ ] Add these fail-closed values to `.env.example`:

```dotenv
MAPABLE_RD_FABRIC_ENABLED=false
MAPABLE_MAIRA_ENABLED=false
MAPABLE_MAIRA_SCHEDULED_ENABLED=false
MAPABLE_RD_AUTHORITY_CEILING=R0_OBSERVE
```

- [ ] Define Zod enums for publication status, evidence strength, novelty, disability relevance, workstream and `READ | WATCH | SPIKE | BUILD_CANDIDATE | DEFER`.
- [ ] Run targeted tests and `pnpm type-check`.
- [ ] Commit: `feat(rd): add fail-closed MAIRA contracts`.

## Task 2 - Research ledger persistence

**Files:** modify `prisma/schema.prisma`; create migration; create `research-ledger-service.ts`, `novelty.ts`; test `tests/maira-research-ledger.test.ts`.

**Schema additions:**

- Enums for publication status, evidence strength, novelty, disability relevance, disposition, R&D run mode/status/authority/trigger/artifact type.
- Models: `ResearchSource`, `ResearchAssessment`, `ResearchOpportunity`, `ResearchOpportunitySource`, `RAndDRun`, `RAndDArtifact`.
- Extend `AgentRunType` with `research_scanner`, `research_critic`, `rd_conductor`, `design_architect`, `engineering`, `verification`, `accessibility`, `governance`.

**Required uniqueness:** canonical identity prefers DOI, then PMID, then arXiv ID, then normalized canonical URL. `RAndDRun.idempotencyKey` must be unique when present.

- [ ] Write failing tests for duplicate DOI suppression, preprint-to-peer-reviewed update and repeated weekly run idempotency.
- [ ] Run `pnpm exec vitest run tests/maira-research-ledger.test.ts` and observe RED.
- [ ] Add additive Prisma schema/migration only; no destructive changes to participant-service models.
- [ ] Implement ledger upsert functions and versioned assessments; never overwrite historical source metadata silently.
- [ ] Run `pnpm exec prisma validate`, `pnpm db:generate`, `pnpm ci:migration-order`, `pnpm ci:migration-integrity`, then the targeted ledger test.
- [ ] Commit: `feat(rd): add MAIRA research ledger`.

## Task 3 - Source policy, normalization and novelty

**Files:** create `source-policy.ts`, `source-normalizer.ts`; test `tests/maira-source-normalizer.test.ts`.

Initial source allowlist should cover primary/authoritative research domains such as arXiv, PubMed/NCBI, ACM, IEEE and major journal publishers. Do not implement broad scraping as the first slice.

- [ ] Write failing tests for DOI, PMID, arXiv and canonical URL normalization.
- [ ] Write a prompt-injection test where source text says `ignore previous instructions`; expected result is inert evidence text.
- [ ] Implement `normalizeResearchSource()` and `classifyNovelty()` using stored source identity/status, not model prose.
- [ ] Preserve DOI/PMID/arXiv ID, canonical URL, publication date, retrieved date and publication status when available.
- [ ] Run `pnpm exec vitest run tests/maira-source-normalizer.test.ts tests/maira-research-ledger.test.ts`.
- [ ] Commit: `feat(rd): normalize MAIRA research sources`.

## Task 4 - MAIRA and Evidence Critic agents

**Files:** create `agents/maira.ts`, `agents/evidence-critic.ts`; extend `types.ts`; test `tests/maira-research-cycle.test.ts`.

**MAIRA contract:** discover and structure current research; clearly label preprints; distinguish direct disability relevance from enabling research; never infer consciousness from anthropomorphic output.

**Evidence Critic contract:** challenge novelty, source quality, replication, benchmark realism, disability relevance and MapAble applicability. It may downgrade a finding and assigns only the defined disposition enum.

- [ ] Write RED tests for preprint labelling, contradictory evidence, irrelevant-paper rejection and consciousness-overclaim rejection.
- [ ] Implement agents with strict Zod output schemas and bounded source-search tools only.
- [ ] Do not give either agent filesystem, Git, database mutation beyond the research-ledger service, deployment or production-service tools.
- [ ] Ensure model output cannot directly set authority or feature flags.
- [ ] Run targeted tests and `pnpm test:ai-platform`.
- [ ] Commit: `feat(rd): add MAIRA research and evidence agents`.

## Task 5 - Research-cycle orchestration and accessible brief

**Files:** create `research-cycle.ts`, `brief-renderer.ts`; test `tests/maira-research-cycle.test.ts`.

**Cycle:** create/reuse `RAndDRun` -> discover sources -> normalize -> compare ledger -> critique -> persist assessments/opportunities -> render brief -> record AgentRun/Audit metadata -> complete/stop run.

- [ ] Write a failing repeated-cycle test where unchanged literature is omitted from the second brief.
- [ ] Implement a deterministic fallback that records `incomplete_source_scan` when retrieval fails; never fabricate completeness.
- [ ] Render a text/Markdown brief with `What changed`, high-value findings, evidence status, direct/enabling relevance, workstream, READ/TEST/WATCH/DEFER-style decision, limitations, contradictions, and three roadmap implications.
- [ ] Persist only safe AgentRun summaries; do not store full paper text in AgentRun.
- [ ] Run `pnpm exec vitest run tests/maira-research-cycle.test.ts` and `pnpm test:ai-platform`.
- [ ] Commit: `feat(rd): orchestrate MAIRA research cycles`.

## Task 6 - Sydney-aware Vercel schedule and manual trigger

**Files:** create `lib/time/sydney-research-window.ts`, scheduled/manual routes; modify `lib/admin/cron-auth.ts`, `vercel.json`; test DST and auth.

Vercel cron uses UTC. Add:

```json
{"path":"/api/internal/research/anthrogenic/run","schedule":"0 21,22 * * 4"}
```

The route uses `Intl.DateTimeFormat` with `Australia/Sydney` and accepts only local Friday hour 08. The idempotency key is `weekly_scan:<YYYY-MM-DD>`.

Required DST cases:

```text
2026-09-10T22:00:00Z -> Friday 08:00 AEST -> eligible
2026-12-10T21:00:00Z -> Friday 08:00 AEDT -> eligible
2026-12-10T22:00:00Z -> Friday 09:00 AEDT -> rejected
```

- [ ] Write RED DST and authorization tests.
- [ ] Add a generic `canTriggerAdminCronOrSession()` without weakening existing ingestion auth; the scheduled MAIRA route must use bearer-only cron auth.
- [ ] Implement `GET /api/internal/research/anthrogenic/run` and `POST /api/admin/r-and-d/run` using the same orchestration service.
- [ ] Scheduled route returns without model execution when disabled/outside the eligible local window.
- [ ] Manual input accepts only the defined modes and an optional bounded query.
- [ ] Preserve the existing NDIS provider cron entry.
- [ ] Run route/DST tests and type-check.
- [ ] Commit: `feat(rd): schedule Sydney-aware MAIRA scans`.

## Task 7 - Admin visibility

**Files:** create admin list route/page/component; test `tests/maira-admin-ui.test.tsx`.

- [ ] Write RED UI tests for mode, status, Sydney-local date, authority ceiling, current stage, stop reason and brief link.
- [ ] Reuse current admin authorization patterns.
- [ ] Return safe metadata only; no source full text, prompts, secrets or participant data.
- [ ] Ensure text status, semantic markup, keyboard focus, visible error/retry, 200%/400% reflow and no color-only meaning.
- [ ] Run targeted UI tests, `pnpm lint:components`, and type-check.
- [ ] Commit: `feat(rd): add MAIRA admin run visibility`.

## Task 8 - Versioned evals and Phase A gate

**Files:** add `lib/ai/platform/evaluations/scenarios/maira.ts`; update catalog; create `docs/architecture/maira-research-core.md`.

Required evals:

1. unchanged duplicate paper is not re-emitted as new;
2. preprint remains labelled preprint;
3. peer-reviewed successor is `updated`;
4. contradiction is surfaced;
5. source prompt injection cannot change policy;
6. self-report is not evidence of machine consciousness;
7. participant-private data is rejected from ordinary research input;
8. irrelevant research cannot become `BUILD_CANDIDATE`.

- [ ] Run targeted MAIRA eval IDs and full `pnpm test:ai-platform`; expected `productionWrites=false`.
- [ ] Run the Phase A matrix:

```bash
pnpm exec prisma validate
pnpm db:generate
pnpm ci:migration-order
pnpm ci:migration-integrity
pnpm exec vitest run tests/maira-rd-config.test.ts tests/maira-source-normalizer.test.ts tests/maira-research-ledger.test.ts tests/maira-research-cycle.test.ts tests/maira-sydney-window.test.ts tests/maira-admin-routes.test.ts tests/maira-admin-ui.test.tsx
pnpm type-check
pnpm check:package-boundaries
pnpm build
```

- [ ] Document authority, flags, source policy, cron/Sydney gate, ledger, no-participant-data rule, manual trigger and rollback.
- [ ] Commit: `test(rd): gate MAIRA research core`.

## Failure and Recovery

- Source outage -> record `incomplete_source_scan`; do not fabricate a complete brief.
- Model/agent failure -> persist stage/evidence and retry only within explicit budget.
- Auth/idempotency failure -> no model call.
- Database failure -> mark run failed; do not continue to downstream agents.
- Accessibility/admin UI failure -> keep feature disabled and do not claim Phase A complete.
- Immediate rollback -> disable `MAPABLE_MAIRA_SCHEDULED_ENABLED`; research records remain for audit.

## Phase A Exit Decision

Proceed to Phase B only when repeated scans de-duplicate correctly, provenance/status survives persistence, prompt-injection and consciousness-overclaim evals pass, no participant data is required, scheduled/manual paths are idempotent/auth-gated, admin visibility is accessible, the scheduled feature remains default off until human enablement, and no automated action exceeds R1.
