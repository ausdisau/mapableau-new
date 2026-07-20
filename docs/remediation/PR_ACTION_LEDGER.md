# PR Action Ledger — Remediation control (2026-07-20)

Source of structured actions: [`lib/convergence-os/seed/pr-action-ledger.ts`](../../lib/convergence-os/seed/pr-action-ledger.ts).

**Inspected main tip:** `6279ab9198df2ebefb15a1ec5fe22ac735d21aa1`  
**Full Phase 0 rescan:** [RESCAN_RECONCILIATION.md](./RESCAN_RECONCILIATION.md)  
**Rule:** PR descriptions are not evidence that code exists on `main`. Path searches and tests are.  
**Stack policy:** No unmerged stack may grow beyond **3** PRs (`MAX_UNMERGED_STACK_DEPTH`).

## Actions vocabulary

`merge` · `rebase` · `recreate` · `split` · `consolidate` · `supersede` · `close` · `archive` · `defer` · `retain_as_reference` · `retire_after_migration`

## Immediate control train (independent from `main`, depth 1)

Prefer independent branches from current `main`. Do **not** add a fifth PR on the Geoscape train.

| Order | PR                                          | Action                                      | Notes                                    |
| ----- | ------------------------------------------- | ------------------------------------------- | ---------------------------------------- |
| 1     | Remediation truth/controls (this programme) | `merge` when CI + review green              | Docs + readiness CI only                 |
| 2     | #382 AT Continuity                          | `rebase`/`retain` repair on existing tip    | Format + a11y OOM; flag off; leave draft |
| 3     | Runtime hardening (Phase 3)                 | Independent from `main` after #1 reviewable | CSP preview gate; no prod enforce        |

## Geoscape stack (policy breach — depth 4)

```text
#367 (main) → #384 → #385 → #386
depth: 1       2      3      4  ← exceeds MAX=3
```

| PR   | Action                                                 | Notes                                                      |
| ---- | ------------------------------------------------------ | ---------------------------------------------------------- |
| #367 | `merge` only after independent review                  | Base of train; CI green; flags default false               |
| #384 | `defer` until depth ≤3                                 | Depends on #367                                            |
| #385 | `defer` / consider `consolidate` with #384             | Depends on #384                                            |
| #386 | **`consolidate` or `split`** — must not remain depth 4 | Human retarget after merges; **do not** open another child |

### Recommended human cleanup (agent will not execute)

After each human merge, retarget dependents in GitHub UI:

1. Merge #367 into `main` (when ready) **or** squash #367+#384 into one PR from `main`.
2. Retarget #385 base to `main` (or to the consolidated tip) — Settings → base branch.
3. Retarget #386 only when stack depth would be ≤3.
4. Alternative: close #385/#386 and recreate as ≤2 independent PRs from fresh `main`.

Exact CLI (human only):

```bash
# Inspect only — do not merge from agent role
gh pr view 367 --json baseRefName,headRefName,isDraft,statusCheckRollup
gh pr view 384 --json baseRefName,headRefName
gh pr view 385 --json baseRefName,headRefName
gh pr view 386 --json baseRefName,headRefName
# Retarget example (human):
# gh pr edit 385 --base main
```

## PBS / VisionAccess / programmes

| PR                | Designation                             | Action                                                                                                                                                  |
| ----------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #379 PBS          | **Blocked / extractable future Wave 7** | Canonical owner path is `lib/pbs-operations/**`. Do not merge #379’s `lib/positive-behaviour-support/**` as Wave 7 SoT. Human: close or recreate later. |
| #383 VisionAccess | Freeze review                           | Independent from `main`; CI green; keep flags false; do not stack under Geoscape                                                                        |
| #380 / #381       | MERGED                                  | Wave 0 docs + migrate-from-zero repair                                                                                                                  |

## Closed / merged leadership slots (historical)

#330, #341, #340 — **MERGED** (no longer open merge targets).

## Refresh

Re-run `gh pr list` and update the TypeScript ledger when topology changes. Keep `SUPERSEDED_CLOSE_TARGETS` in sync with close actions. Run `pnpm exec tsx scripts/ci/check-merge-train-integrity.ts` and `pnpm ci:readiness-evidence`.
