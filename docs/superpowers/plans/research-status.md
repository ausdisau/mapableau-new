# Deep research status

## parallel-cli setup

- **Installed:** `parallel-cli` v0.9.3 via `https://parallel.ai/install.sh`
- **Path:** `~/.local/bin/parallel-cli`

## Research run

**Status:** Blocked — authentication required.

```json
{
  "error": "Parallel API key required. Set PARALLEL_API_KEY, run parallel-cli login, or pass api_key explicitly."
}
```

**Intended command:**

```bash
parallel-cli research run \
  "MapAble innovation platform: privacy architecture, accessibility evidence graph, AI governance, enterprise API commercialisation, health-access research pilot, Sydney demonstrator readiness — cross-reference Innovation Roadmap 2026-2030 principles" \
  --processor pro-fast \
  --no-wait \
  --json
```

**To complete research:** Set `PARALLEL_API_KEY` or run `parallel-cli login`, then poll:

```bash
parallel-cli research poll "$RUN_ID" -o mapable-innovation-strategy-2026 --timeout 540
```

## Cross-check fallback (used for plan authoring)

Plans were cross-checked against:

- [docs/innovation/MAPABLE_INNOVATION_PORTFOLIO.md](../innovation/MAPABLE_INNOVATION_PORTFOLIO.md)
- [docs/innovation/PORTFOLIO_ROADMAP.md](../innovation/PORTFOLIO_ROADMAP.md)
- [docs/innovation/epics/](../innovation/epics/)
- [docs/operations/CONTROLLED_PILOT_CHARTER.md](../operations/CONTROLLED_PILOT_CHARTER.md)
- Repository code anchors cited in each plan

**Strategy `.docx` files** referenced in programme materials are not in the repository. Only partial documents exist under `attached_assets/`.

## Re-run after auth

When research completes, update plans 08, 12, and 14 if the executive summary conflicts with repo SoT. Do not override verified implementation claims with strategy documents alone.

## Cross-check notes (repo SoT, 2026-09-01)

Plans were validated against repository state without external research output:

| Topic | Repo alignment | Plan adjustment |
|-------|----------------|-----------------|
| Evidence vocabulary | Three parallel vocabularies (`model_candidate`, `AI_INFERRED`, `ai_inference`) | Plan 01 + 09 mandate `packages/contracts` canonical type |
| Enterprise API path | Existing `/api/v1/access` not `/api/v1/accessibility/*` | Plan 11 extends/migrates rather than duplicates |
| MapAble+ SKU | No product name in repo | Plan 12 creates `lib/commercial/mapable-plus/` wired to existing partner billing |
| Research journey | No `ResearchJourney` model | Plan 10 defines new protocol aligned with `lib/research/` governance |
| Sydney pilot | NSW/Sydney hours in controlled pilot charter | Plan 14 preserves decision with scorecard rationale requirement |
| Privacy lanes | No four-lane enum | Plan 08 introduces `DataPurpose` atop existing `ConsentScope` |
| PostHog | LLM-only, no consent gate | Plan 08 adds sanitizer + consent middleware |
| Deep research | Blocked on API key | No conflicts detected; re-run when `PARALLEL_API_KEY` available |
