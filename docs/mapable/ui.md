# MapAble Core UI

Shared shell, navigation and hub for the MapAble Core platform.

## Routes

| Route | Layout | Purpose |
|-------|--------|---------|
| `/core` | `CoreShell` | Platform hub — links to dashboard, civic pages and portals |
| `/login`, `/register` | `CoreShell` | Sign-in and account creation |
| Public civic pages | `(core)` route group + `CoreShell` | Transparency, accountability, algorithms, etc. |
| `/data-vault`, `/academy`, `/assessor` | `CoreShell` | Authenticated portals with public chrome |
| `/provider/*` | `PortalNav` | Provider console |
| `/dashboard`, `/admin` | `DashboardNav` + skip link | Participant control panel (billing centre, safety centre) and admin |

## Components (`components/core/`)

| Component | Use |
|-----------|-----|
| `CoreShell` | Header, footer, skip link, main landmark |
| `CoreHeader` / `CoreFooter` | Global navigation |
| `CorePageHeader` | Page title, eyebrow, description |
| `CorePageContainer` | `default` (max-w-6xl) or `narrow` (max-w-3xl) page padding |
| `CoreHubCard` | Hub grid cards on `/core` |
| `CoreCivicNav` | Sub-nav from `CORE_CIVIC_LINKS` on civic pages |
| `CoreRecordCard` | Bordered list/detail cards |
| `CoreEmptyState` | Empty lists with optional CTA |
| `CoreMetricsGrid` | Key/value metrics (replaces raw JSON `<pre>`) |
| `CoreProseBlock` | Long-form charter or article body |
| `CoreAuthForm` | Login/register form shell with loading and errors |
| `CoreAuthLinks` | Cross-links between `/login` and `/register` |
| `PortalNav` | Provider-style secondary nav |

## Civic page template

Public accountability pages under `app/(core)/` should follow:

```tsx
<CorePageContainer variant="narrow">
  <CoreCivicNav />
  <CorePageHeader eyebrow="Public accountability" title="..." description="..." />
  {items.length === 0 ? (
    <CoreEmptyState title="..." description="..." />
  ) : (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id}>
          <CoreRecordCard title={...} meta={...}>...</CoreRecordCard>
        </li>
      ))}
    </ul>
  )}
</CorePageContainer>
```

Auth pages use `CorePageContainer variant="narrow"`, `CorePageHeader`, and `CoreAuthForm` with `AccessibleFormField` + `formInputClass` from `components/forms/`.

## Configuration

`lib/core-ui/navigation.ts` — civic links, hub sections  
`lib/core-ui/provider-nav.ts` — provider console links

## Accessibility

- Skip to main content on dashboard, admin and public shell
- Focus-visible rings on interactive elements
- Minimum 40px touch targets on primary nav links (`min-h-11` on auth submit and form inputs)
