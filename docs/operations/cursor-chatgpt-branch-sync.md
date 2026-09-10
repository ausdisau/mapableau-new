# Cursor ↔ ChatGPT (Codex) branch sync

GitHub is the only bridge between **Cursor Cloud / Cursor IDE** and
**ChatGPT (including Codex)**. There is no shared memory, MCP session, or
chat transcript across products — only commits, branches, and pull requests.

Unlike the [Cursor ↔ Replit sync](./cursor-replit-branch-sync.md), both agents
edit the **same Next.js / Vercel production surface**. There is no path-ownership
merge matrix. Coordination is branch naming + PR discipline + a shared tip
branch.

| Branch | Role |
| --- | --- |
| `main` | Production truth (Vercel). **Only** merge target for shipped work. |
| `chatgpt-main` | Integration tip ChatGPT/Codex should pull before starting work. Refreshed from `main`. |
| `cursor-main` | Existing Cursor↔Replit integration tip (not ChatGPT-specific). |
| `cursor/<topic>-****` | Cursor feature branches → PR → `main` |
| `codex/<topic>` or `chatgpt/<topic>` | ChatGPT / Codex feature branches → PR → `main` |

**Do not** invent a second source of truth. Do not mirror whole trees between
agents. Ship through PRs into `main`, then refresh `chatgpt-main`.

## Why GitHub is the bridge

| Channel | Works across Cursor ↔ ChatGPT? |
| --- | --- |
| Chat / agent memory | No |
| Local working tree | No (separate machines / sandboxes) |
| GitHub branches + PRs | **Yes** |
| GitHub Issues / PR comments | Yes (human + both agents can read) |
| ChatGPT Apps MCP (`apps/chatgpt-mcp`) | Product connector for ChatGPT Apps SDK — **not** a repo sync |

## Attribution (required)

ChatGPT often pushes as the human GitHub user (`ausdisau`). Without conventions,
Cursor cannot tell ChatGPT work from human edits.

1. **Branch prefix:** prefer `codex/` or `chatgpt/` for ChatGPT-authored work.
   Legacy `feature/` and `research/` PRs may still be ChatGPT; treat open ones as
   in-flight until merged or closed.
2. **Commit trailer** on ChatGPT commits:

   ```text
   Agent: chatgpt
   ```

   On Cursor commits:

   ```text
   Agent: cursor
   ```

3. Optional co-author line when the human also edited:

   ```text
   Co-authored-by: <human name> <email>
   ```

4. PR title/body: state which agent started the work and which should continue.

## Day-to-day protocol

### ChatGPT starts or resumes work

1. `git fetch origin && git checkout chatgpt-main && git pull --ff-only`
2. Branch: `git checkout -b codex/<short-topic>` (or `chatgpt/<short-topic>`)
3. Implement, commit with `Agent: chatgpt` trailer, push, open PR → `main`
4. In the PR body, add a **Handoff** section (see template below)

### Cursor starts or resumes work

1. `git fetch origin && git checkout main && git pull --ff-only`
2. Branch: `git checkout -b cursor/<short-topic>-****` (Cloud Agents append a suffix)
3. Before editing, run:

   ```bash
   pnpm sync:cursor-chatgpt -- report
   ```

   Review open `codex/*`, `chatgpt/*`, and related `feature/*` / `research/*` PRs
   so you do not duplicate or collide.
4. Commit with `Agent: cursor` trailer, push, open PR → `main`

### After any merge to `main`

```bash
./scripts/sync-cursor-chatgpt-branches.sh refresh-from-main --push
```

This fast-forwards `chatgpt-main` to `origin/main` and pushes it so the next
ChatGPT session starts from production truth.

### Handing a thread to the other agent

1. Push all commits and open/update the PR.
2. Paste the Handoff block into the PR (or Issue).
3. The other agent: `gh pr checkout <n>` (or fetch the head branch), read the
   Handoff, continue on **the same branch** unless a clean split is required.

## Handoff template (paste into PR body)

```markdown
## Agent handoff (Cursor ↔ ChatGPT)

- **From:** cursor | chatgpt
- **To:** chatgpt | cursor | human
- **Branch:** <head ref>
- **Base:** main @ <sha>
- **Goal:** …
- **Done:** …
- **Do not change:** … (paths / invariants)
- **Next steps:** …
- **Tests run:** …
- **Stop gates:** … (e.g. ACSS Phase 0 approval before Phase 1 code)
```

## Helper script

```bash
./scripts/sync-cursor-chatgpt-branches.sh report
./scripts/sync-cursor-chatgpt-branches.sh ensure-bridge
./scripts/sync-cursor-chatgpt-branches.sh refresh-from-main [--push]
./scripts/sync-cursor-chatgpt-branches.sh handoff-pack
```

Or via package.json:

```bash
pnpm sync:cursor-chatgpt -- report
pnpm sync:cursor-chatgpt:refresh
pnpm sync:cursor-chatgpt:refresh:push
pnpm sync:cursor-chatgpt:handoff
```

| Command | Effect |
| --- | --- |
| `report` | Ahead/behind of `chatgpt-main` vs `main`; open PRs by agent prefix; recent tips |
| `ensure-bridge` | Create `origin/chatgpt-main` from `main` if missing |
| `refresh-from-main` | Fast-forward `chatgpt-main` to `origin/main` (optional `--push`) |
| `handoff-pack` | Write a markdown snapshot under `/tmp` (and optionally artifacts) for the other agent |

## CI advisory

Workflow: `.github/workflows/sync-cursor-chatgpt-branches.yml`

- **Push to `chatgpt-main` / weekly schedule / `workflow_dispatch`:** runs `report`
  and uploads the artifact. Does **not** auto-merge into `main`.
- **`workflow_dispatch` → `refresh-from-main`:** human-gated tip refresh with push.

Never auto-merge agent feature branches into production `main` from this workflow.

## Collision rules

| Situation | Rule |
| --- | --- |
| Two open PRs touch the same files | Human picks a primary PR; the other rebases or waits |
| ChatGPT and Cursor both on `main` tip | Fine — branch from refreshed tips, not from each other’s dirty trees |
| Need shared mid-flight work | Continue on **one** feature branch; do not fork a parallel rewrite |
| Replit overlay involved | Use [cursor-replit-branch-sync.md](./cursor-replit-branch-sync.md); ChatGPT should not edit Replit-owned paths unless promoting via `ports/` |

## Related work (current bridge snapshot)

Keep this list short in PRs; the live inventory is `pnpm sync:cursor-chatgpt -- report`.

Examples of agent-prefixed open work (as of bridge setup):

- Cursor: `cursor/acss-phase0-discovery-e2ab` (ACSS Phase 0 docs — stop gate before Phase 1 code)
- Codex: `codex/accessible-care-booking`
- ChatGPT-style feature/research stacks: Companion (`feature/mapable-companion-*`), MACO (`research/maco-*`)

## Related docs

- [cursor-replit-branch-sync.md](./cursor-replit-branch-sync.md) — dual-runtime Cursor↔Replit bridge
- [docs/acss/README.md](../acss/README.md) — ACSS Phase 0 index (when present on the branch / after merge)
- [docs/chatgpt-mcp-app.md](../chatgpt-mcp-app.md) — ChatGPT Apps SDK MCP connector (product, not sync)
