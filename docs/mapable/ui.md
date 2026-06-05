# MapAble Core UI

Shared shell, navigation and hub for the MapAble Core platform.

## Routes

| Route | Layout | Purpose |
|-------|--------|---------|
| `/core` | `CoreShell` | Platform hub — links to dashboard, civic pages and portals |
| `/login` | `CoreShell` | Sign-in |
| Public civic pages | `(core)` route group + `CoreShell` | Transparency, accountability, algorithms, etc. |
| `/data-vault`, `/academy`, `/assessor` | `CoreShell` | Authenticated portals with public chrome |
| `/provider` | `PortalNav` | Provider control panel — org metrics, onboarding status, quick links |
| `/provider/*` | `PortalNav` | Provider console sections (care, workers, billing, etc.) |
| `/dashboard`, `/admin` | `DashboardNav` + skip link | Participant control panel (billing centre, safety centre) and admin |

## Components (`components/core/`)

- `CoreShell` — header, footer, skip link, main landmark
- `CoreHeader` / `CoreFooter` — global navigation
- `CorePageHeader` — page title block
- `CoreHubCard` — hub grid cards
- `PortalNav` — provider-style secondary nav

## Configuration

`lib/core-ui/navigation.ts` — civic links, hub sections  
`lib/core-ui/provider-nav.ts` — provider console links (control panel first)

Provider admins and transport operators land on `/provider` after sign-in (`defaultDashboardPath` in `lib/auth/roles.ts`). The control panel aggregates worker roster counts, pending invites, care inbox volume, roster gaps, and onboarding blockers via `lib/provider/provider-control-panel-service.ts`.

Users with `enterprise:console` see an **Enterprise workspace** section on the control panel (`#enterprise-workspace`). `/enterprise-provider` redirects there — the standalone enterprise home is folded into `/provider`.

## Accessibility

- Skip to main content on dashboard, admin and public shell
- Focus-visible rings on interactive elements
- Minimum 40px touch targets on primary nav links
