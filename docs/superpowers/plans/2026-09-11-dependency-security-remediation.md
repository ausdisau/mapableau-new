# Dependency Security Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the current unresolved high/critical production dependency advisories for Next.js, MapLibre GL, Sharp, and fast-uri without allowlisting critical findings or weakening the security gate.

**Architecture:** Remediate each advisory chain independently, preferring direct dependency upgrades first and narrowly scoped package-manager overrides only where upstream packages do not yet expose a safe compatible version. Preserve the existing application APIs and verify build, type-check, targeted regression tests, and `ci:prod-audit` after each dependency family.

**Tech Stack:** Next.js 15, pnpm 10, MapLibre GL, Sharp, OpenAI Agents SDK / MCP SDK, GitHub Actions.

**Spec:** Current GitHub Actions `Security` workflow `ci:prod-audit` failure reporting seven unresolved high/critical production advisories.

## Global Constraints

- Do not add security allowlist entries for the reported critical/high advisories unless a reviewed upstream-unfixable exception is explicitly approved.
- Do not perform unrelated major framework migrations.
- Preserve lockfile reproducibility with `pnpm install --frozen-lockfile` after regeneration.
- Verify application type-check, production build, affected map tests, OpenAI/MCP tests, and `pnpm ci:prod-audit`.
- Keep dependency families in reviewable commits so regressions can be bisected.

---

### Task 1: Reproduce and map advisory chains

**Files:**
- Inspect: `package.json`, `pnpm-lock.yaml`, `scripts/ci/check-prod-audit.ts`, `security/advisory-allowlist.json`.

**Interfaces:**
- Consumes: current production dependency graph and audit output.
- Produces: exact vulnerable package versions, patched version ranges, and parent dependency chains.

- [ ] **Step 1:** Run `pnpm ci:prod-audit` on an isolated branch/worktree based on `main` and confirm all seven findings.
- [ ] **Step 2:** Inspect package metadata/advisories to identify first patched versions for `next`, `maplibre-gl`, `sharp`, and `fast-uri`.
- [ ] **Step 3:** Trace each vulnerable package to its direct parent with `pnpm why` / lockfile inspection.
- [ ] **Step 4:** Record compatibility constraints before changing versions.

### Task 2: Remediate Next.js and Sharp chain

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: patched compatible Next.js/Sharp versions from Task 1.
- Produces: dependency graph with the two Next.js critical advisories and Sharp high advisory removed.

- [ ] **Step 1:** Add or update a dependency-security regression assertion if the repository audit harness supports package/version expectations; otherwise use the failing `ci:prod-audit` output as the RED gate.
- [ ] **Step 2:** Upgrade Next.js to the smallest compatible patched release in the current major line; allow transitive Sharp to follow unless an explicit override is necessary.
- [ ] **Step 3:** Regenerate the lockfile.
- [ ] **Step 4:** Run `pnpm type-check`, targeted Next.js tests, and `pnpm build`.
- [ ] **Step 5:** Run `pnpm ci:prod-audit` and confirm those advisory IDs disappear.
- [ ] **Step 6:** Commit only this dependency family.

### Task 3: Remediate MapLibre GL

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: patched MapLibre version from Task 1.
- Produces: map stack with the critical MapLibre advisory removed.

- [ ] **Step 1:** Upgrade `maplibre-gl` to the smallest compatible patched version.
- [ ] **Step 2:** Regenerate the lockfile.
- [ ] **Step 3:** Run map/accessibility rendering and routing tests plus `pnpm type-check`.
- [ ] **Step 4:** Run `pnpm ci:prod-audit` and confirm the MapLibre advisory disappears.
- [ ] **Step 5:** Commit the MapLibre-only remediation.

### Task 4: Remediate fast-uri through OpenAI/MCP dependency chain

**Files:**
- Modify: `package.json` only if direct/parent dependency or pnpm override is required.
- Modify: `pnpm-lock.yaml`.

**Interfaces:**
- Consumes: `@openai/agents -> @openai/agents-core -> @modelcontextprotocol/sdk -> ajv -> fast-uri` chain.
- Produces: dependency graph with all three fast-uri high advisories removed while preserving Agents/MCP behaviour.

- [ ] **Step 1:** Determine whether upgrading `@openai/agents`, `@modelcontextprotocol/sdk`, or `ajv` naturally selects a patched `fast-uri`.
- [ ] **Step 2:** Prefer parent-package upgrades; if no compatible upstream path exists, add the narrowest pnpm override for a patched `fast-uri` and document why.
- [ ] **Step 3:** Regenerate the lockfile.
- [ ] **Step 4:** Run OpenAI agent/MCP tests, `pnpm type-check`, and production build.
- [ ] **Step 5:** Run `pnpm ci:prod-audit` and require all three fast-uri advisories to disappear.
- [ ] **Step 6:** Commit the fast-uri-chain remediation.

### Task 5: Whole-branch verification

**Files:**
- No additional production changes unless a regression is directly caused by the dependency upgrades.

**Interfaces:**
- Consumes: Tasks 2-4 dependency graph.
- Produces: security-remediation PR evidence.

- [ ] **Step 1:** Run `pnpm install --frozen-lockfile` from a clean checkout.
- [ ] **Step 2:** Run `pnpm ci:prod-audit` and require zero unresolved high/critical advisories covered by this plan.
- [ ] **Step 3:** Run `pnpm type-check`, relevant unit/integration tests, and production build.
- [ ] **Step 4:** Open a draft PR against `main` and inspect Security, CI, Semgrep, Migrations, Accessibility and Quality checks.
- [ ] **Step 5:** Do not merge until the security gate is green and any framework/map/agent regressions are resolved.
