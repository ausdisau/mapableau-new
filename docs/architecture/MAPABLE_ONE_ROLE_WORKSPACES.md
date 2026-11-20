# MapAble One role workspaces

## Ownership

| Surface | Routes | Authority | Data |
|---------|--------|-----------|------|
| Search | `/search`, public directories | Public / optional auth | Source-labelled listings only |
| Core | `/dashboard`, `/care`, `/my`, participant tools | Authenticated participant | Own bookings, consent, calendar |
| Provider | `/provider/**` | `care:read:org` + org membership | Org-scoped care/transport/workers |
| Worker | `/worker/**` | `care:shift:work` + WorkerProfile | Assigned shifts/offers only |
| Admin / Driver / Employer / … | Existing role portals | Existing guards | Unchanged permissions |

## Access rules

- Workspace switcher is **navigation only**. Every destination re-runs server guards.
- Unavailable workspaces render “Not available” — never fake live metrics.
- PR A Action Centre is **read-only** projections from existing services (`getProviderControlPanelSummaryForUser`, My Day snapshot, worker shift queries).

## Flag

`MAPABLE_ONE_UNIFIED_SHELL_ENABLED` + `NEXT_PUBLIC_MAPABLE_ONE_UNIFIED_SHELL` apply the skin **platform-wide** (root `html.mapable-one`, all `AuthenticatedRoleAppShell`, `DashboardAppShell`, marketing `MapAbleAppShell`, My MapAble). Flag off restores legacy chrome on every route.

## Current vs proposed

| Area | Current | PR A | PR B |
|------|---------|------|------|
| Visual tokens | Teal/gold canonical | Provisional navy/orange/purple when flagged | Unchanged |
| Worker notes | Service log APIs | Not in PR A | Gated progress notes |
| Multi-affiliation | First WorkerProfile | Honest limitation copy | Explicit selector |
