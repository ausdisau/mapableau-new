# Azure DevOps Import Strategy

## Status of this pass

**Items deliberately not created** in Azure DevOps (or any work-item system):

- No Epics
- No Features
- No PBIs/Tasks

Reason: mission requires reviewable portfolio first; validate duplication, dependencies, scope, ownership, sequence. This repository has **no Azure DevOps pipelines or Boards config** (GitHub + Vercel). Azure AD OAuth ≠ Azure DevOps.

## Hierarchy

```
Epic
  → Feature
      → User Story / Product Backlog Item
          → Task
              → Test / Evidence
```

For initial import create **Epics + Features only** (4–8 Features each). Do not explode Tasks.

## Idempotent create rules

1. Search existing work items by tag `mapable-innovation` and field `ExternalKey` / title prefix `EPIC-NN` / `EPIC-NN-F#`.  
2. If found, update description from markdown; do not duplicate.  
3. Keys:
   - Epic: `mapable.epic.${NN}`
   - Feature: `mapable.feature.${NN}.${featureKey}`
4. Tags: `mapable`, `innovation`, `disability-led`, `epic-NN`, wave tag, claim-state tag.  
5. Links: Predecessor/Successor from `PORTFOLIO_DEPENDENCY_MAP.md` and `azure-devops-portfolio.json`.  
6. Custom field (recommended): `ClaimState`, `Disposition` on Features (REUSE/EXTEND/…).  
7. Area Path / Iteration: set by programme after validation — do not invent org structure here.

## Import sources

- Human-readable: `docs/innovation/epics/*.md`
- Machine: `docs/innovation/azure-devops-portfolio.json`
- Process: CSV or Azure DevOps REST + idempotent script (to be written only after validation)

## After validation (authorised write)

Record for each created item: work item ID, URL, parent, dependencies, state.  
Commit an `AZURE_DEVOPS_CREATED.md` evidence ledger — still not a production claim.

## Security note for future automation

Any import bot credentials must be least-privilege; do not embed PATs in the repo; do not allow agents to create work items without human validation flag.
