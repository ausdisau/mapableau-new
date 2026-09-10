# Repository Lint Hygiene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the current repository-wide `app/api` ESLint failures without changing runtime behaviour or weakening lint policy.

**Architecture:** Treat each lint finding as a source-formatting/code-hygiene defect, not a feature change. Modify only files reported by the current `pnpm lint:app-api` baseline, prefer import reordering and removal of genuinely unused imports, and preserve all route behaviour.

**Tech Stack:** Next.js 15, TypeScript, ESLint 8, pnpm 10.

**Spec:** Current GitHub Actions `CI` lint failure on `main` / PR #586 baseline.

## Global Constraints

- Do not change ESLint rules or `--max-warnings 0`.
- Do not use broad repository-wide `eslint --fix`.
- Do not alter route authentication, validation, response shapes, or business logic.
- One file group per commit where practical.
- Verify `pnpm lint:app-api`, `pnpm type-check`, and affected route tests before declaring success.

---

### Task 1: Capture and freeze the failing baseline

**Files:**
- Modify only if needed for evidence: none.

**Interfaces:**
- Consumes: current `pnpm lint:app-api` output.
- Produces: exact failing file/error inventory used by later tasks.

- [ ] **Step 1:** Run `pnpm lint:app-api` on an isolated branch/worktree based on `main`.
- [ ] **Step 2:** Confirm the failures reproduce and record the exact file/line/rule list.
- [ ] **Step 3:** Compare the inventory with PR #586 CI to ensure the failure is baseline debt rather than NPTM-introduced.

### Task 2: Fix unused imports only

**Files:**
- Modify only files in the frozen baseline with `@typescript-eslint/no-unused-vars` findings.

**Interfaces:**
- Consumes: baseline inventory from Task 1.
- Produces: routes with unused imports removed and no behaviour change.

- [ ] **Step 1:** For each unused import, identify the exact symbol and confirm it has no runtime reference.
- [ ] **Step 2:** Remove only that import binding.
- [ ] **Step 3:** Run ESLint on the modified file and confirm the specific error disappears.
- [ ] **Step 4:** Run `pnpm type-check` after the group.
- [ ] **Step 5:** Commit with a lint-only message.

### Task 3: Fix import ordering only

**Files:**
- Modify only files in the frozen baseline with `import/order` findings.

**Interfaces:**
- Consumes: existing imports and `.eslintrc.cjs` ordering rules.
- Produces: semantically identical route modules with compliant import ordering.

- [ ] **Step 1:** Reorder imports according to the repository ESLint rule without changing imported symbols.
- [ ] **Step 2:** Run ESLint on each modified group and confirm zero errors for those files.
- [ ] **Step 3:** Run `pnpm type-check`.
- [ ] **Step 4:** Commit the import-order-only change.

### Task 4: Verify repository lint recovery

**Files:**
- No production files unless verification exposes a missed baseline item.

**Interfaces:**
- Consumes: Tasks 2-3 changes.
- Produces: CI evidence that the original 33 `app/api` lint errors are gone.

- [ ] **Step 1:** Run `pnpm lint:app-api` and require zero errors.
- [ ] **Step 2:** Run `pnpm lint` and record any remaining failures outside `app/api` separately.
- [ ] **Step 3:** Run `pnpm type-check`.
- [ ] **Step 4:** Open a draft PR against `main` and inspect GitHub Actions.
- [ ] **Step 5:** Do not merge until checks show the lint fix did not create unrelated regressions.
