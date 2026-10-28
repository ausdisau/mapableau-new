# Full Life Development Workflow — Cursor + Replit + GitHub + Vercel

**Source of truth:** GitHub repository `ausdisau/mapableau-new`, branch `main` after reviewed PR merge.

**Current design branch:** `design/full-life-orchestration-harness`.

## 1. Tool responsibilities

### GitHub

GitHub is the canonical coordination and review layer.

- all durable code and specifications live in the repository;
- feature work is performed on isolated branches;
- `main` is production truth after reviewed merge;
- branch / PR history is the audit trail for implementation changes;
- no AI coding surface is allowed to become an independent source of truth.

### Cursor

Cursor is the primary implementation surface for the Next.js / TypeScript production application.

Cursor-owned production paths remain:

- `app/**`
- `components/**`
- `lib/**`
- `prisma/**`
- `tests/**`
- `packages/**`
- `tsconfig.json`
- `pnpm-lock.yaml`
- `next.config.ts`

Full Life implementation should occur primarily in Cursor because the target contracts and evaluation harness live under `lib/**` and `tests/**`.

### Replit

Replit is a secondary prototyping / development client and must work through the repository’s existing dual-runtime bridge rather than fork the Full Life architecture.

Existing repo workflow already defines:

- `replit-agent` as the Replit write branch;
- `cursor-main` as the integration / read branch;
- `main` as Vercel / production truth;
- path ownership and conflict rules;
- human-gated sync actions;
- secret scanning before directional merges.

For Full Life work:

1. do not implement a parallel Full Life evaluator under Replit-only `server/**`;
2. prototype UI / interaction concepts in Replit only when they can later be promoted through the documented port / PR path;
3. when Full Life production contracts change, consume them from the GitHub branch rather than manually recreating them in Replit;
4. use `replit-agent` for Replit-owned work and promote to Next.js through the established workflow.

### Vercel

Vercel is preview / deployment verification infrastructure for the Next.js production surface.

- Git-linked feature branches may create preview deployments;
- Full Life remains shadow / advisory until explicitly activated by a later reviewed implementation;
- no production promotion is part of the constitution / contracts / scenario-specification phase;
- Vercel preview success does not by itself establish rights, accessibility, security or regulatory readiness.

The repository is currently linked to more than one Vercel project. The Next.js project must be treated as the preferred production-compatible target for this work; duplicate project configuration should be reconciled separately before production promotion.

## 2. Full Life development branch model

Recommended sequence:

```text
main
  └─ design/full-life-orchestration-harness   # constitution + contracts + scenarios
       └─ feature/full-life-harness-contracts # implementation after design approval
            └─ feature/full-life-harness-evals
                 └─ feature/full-life-job-interview-journey
```

Each implementation branch should be rebased / refreshed from current `main` before coding begins.

Do not revive the old divergent `feature/full-life-os-constitution` branch as the implementation base. Its compatible principles have been carried into the current design specification.

## 3. Cursor implementation prompt contract

When this design is approved, Cursor should be instructed to:

1. inspect current `main` before editing;
2. read:
   - `docs/full-life/CONSTITUTION.md`
   - `docs/full-life/TYPE_CONTRACTS.md`
   - `docs/full-life/HARNESS_SCENARIOS.md`
   - `docs/ai-platform/MISSION_RUNTIME.md`
   - `docs/ai-platform/GOVERNED_ACTION_KERNEL.md`
   - `docs/convergence-os/CONSTITUTION.md`
   - `docs/operations/cursor-replit-branch-sync.md`;
3. preserve current canonical ownership;
4. write tests first for Full Life contracts and hard invariants;
5. implement additive pure TypeScript contracts / evaluator functions;
6. extend the existing AI eval harness rather than add a second runner;
7. keep all runtime activation fail-closed / shadow-only;
8. run typecheck, targeted tests, AI evals, security / quality gates and accessibility checks where UI is touched;
9. create a draft PR only after local verification;
10. do not merge or promote to production without human review.

## 4. Replit workflow contract

Replit should be used in one of two modes.

### Mode A — interaction prototype

Use Replit to explore the participant experience for the canonical job-interview journey:

- “What matters right now?”
- “Need your choice”
- “Need more information”
- “Something changed”
- “Who can see this?”
- “Talk to a person”

Prototype data must be synthetic. Do not create new domain databases or authority logic in the Replit overlay.

### Mode B — repository consumer

Pull the repository through the existing `replit-agent` workflow, use current contracts as read-only design inputs, and contribute Replit-owned UI / port changes through the documented promotion path.

Before pushing Replit-originated work:

- run the repository secret scan;
- run Replit tests;
- inspect path ownership;
- promote production-impacting changes through a Cursor / Next PR rather than merging Replit-owned runtime code wholesale into `main`.

## 5. Vercel preview gate

A Full Life feature branch may be previewed only after:

- typecheck passes;
- targeted unit tests pass;
- 24 synthetic Full Life scenarios pass where applicable;
- the existing AI eval suite passes;
- no production writes occur in evaluation mode;
- no new secret or environment variable is required without explicit documentation;
- critical UI has keyboard / screen-reader / reflow checks where applicable.

Preview verification should cover the complete canonical journey rather than only page rendering.

## 6. Canonical demonstration acceptance criteria

For the Thursday job-interview journey, a reviewable implementation must demonstrate:

1. participant-authored goal is loaded from / linked to LifeIntent;
2. Mission Runtime coordinates Jobs, Care, Transport and Access without creating a duplicate mission store;
3. power-wheelchair compatibility is a hard transport constraint;
4. personal-assistance continuity is represented across the trip and interview schedule;
5. employer disclosure is minimum-necessary and participant-approved;
6. AAC / extended response time does not reduce participant authority;
7. cost / funding state is transparent and uncertainty is preserved;
8. a worker or transport failure triggers cross-domain recovery rather than isolated module failure;
9. Full Life findings are multi-dimensional and do not produce a whole-person score;
10. AURA operational-risk output is referenced, not duplicated;
11. participant can reject / revise / pause / switch to human support;
12. only current, approved, permitted proposals can reach the Governed Action Kernel;
13. audit output explains known / unknown / approved / blocked / changed state;
14. no public or internal claim exceeds what was actually verified.

## 7. Delivery evidence expected from each implementation PR

Every Full Life PR should include a concise evidence summary:

- implementation scope;
- constitutional rules affected;
- tests added / changed;
- synthetic scenarios exercised;
- accessibility checks performed;
- security / privacy implications;
- any AURA interaction;
- any new runtime flag and its default state;
- production-write status;
- Vercel preview URL if created;
- known limitations;
- rollback path;
- explicit statement of what remains simulated or unverified.

## 8. Production prohibition for this design phase

The current design branch must not:

- merge itself to `main` without review;
- deploy or promote production;
- change Vercel production aliases;
- write production data;
- enable Full Life runtime gating;
- create a new consent / authority / mission / payment system of record.
