# MapAble Core UI

Shared shell, navigation and hub for the MapAble Core platform — aligned with the Master Business Plan (single account, three service pillars, satellite ecosystem roadmap).

## Routes

| Route | Layout | Purpose |
|-------|--------|---------|
| `/core` | `CoreShell` | Platform hub — backbone capabilities, pillars, ecosystem roadmap, civic links |
| `/login` | `CoreShell` | Sign-in |
| Public civic pages | `(core)` route group + `CoreShell` | Transparency, accountability, algorithms, etc. |
| `/data-vault`, `/academy`, `/assessor` | `CoreShell` | Authenticated portals with public chrome |
| `/provider/*` | `PortalNav` | Provider console |
| `/dashboard`, `/admin` | `DashboardNav` + skip link | Participant control panel and admin |

## `/core` page sections

1. Hero (`CORE_HUB_HERO`) + `CoreQuickActions`
2. Core capabilities — account, billing, messaging, support
3. Service pillars — care, transport, employment
4. Ecosystem roadmap — `#ecosystem`, five satellite apps (roadmap only)
5. Community, services, civic, provider sections from `CORE_HUB_SECTIONS`

See [docs/mapable-core-ui-design.md](docs/mapable-core-ui-design.md) for IA and business-plan traceability.

## Components (`components/core/`)

- `CoreShell` — header, footer, skip link, main landmark
- `CoreHeader` / `CoreFooter` — global navigation
- `CorePageHeader` — page title block
- `CoreSection` — hub section wrapper
- `CoreHubCard` — hub grid cards (`live` or `roadmap`)
- `CoreCapabilityStrip` — four backbone tiles
- `CorePillarCard` — care / transport / employment
- `CoreEcosystemCard` — satellite roadmap tile
- `CoreRoadmapBadge` — Live / Coming soon / Beta
- `CoreQuickActions` — sign-in and control panel CTAs
- `PortalNav` — provider-style secondary nav

## Configuration

| File | Purpose |
|------|---------|
| `lib/core-ui/navigation.ts` | Hero copy, civic links, hub sections |
| `lib/core-ui/core-capabilities.ts` | Account, billing, messaging, support links |
| `lib/core-ui/pillars.ts` | Care, transport, employment pillars |
| `lib/core-ui/ecosystem.ts` | Satellite apps (roadmap) |
| `lib/core-ui/provider-nav.ts` | Provider console links |

## Accessibility

- Skip to main content on dashboard, admin and public shell
- Focus-visible rings on interactive elements
- Minimum 40px touch targets on primary nav and CTAs
- Roadmap ecosystem tiles are not keyboard-focusable (`tabIndex={-1}`)

## Tests

```bash
pnpm exec vitest run tests/mapable-core-ui.test.ts
```
