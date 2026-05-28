# MapAble Core UI — design spec

Short design reference for the `/core` platform hub. Source: MapAble Master Business Plan (Australian Disability Ltd).

## Information architecture

1. **Hero** — Eyebrow, single-account narrative, sign-in / control panel CTAs
2. **MapAble Core** — Account, billing, messaging, support (capability strip)
3. **Service pillars** — Care, transport, employment (live deep links)
4. **Ecosystem roadmap** (`#ecosystem`) — Independence, Moves, Emergency, Foods, News (roadmap only)
5. **Existing hub sections** — Community, Your services, Public accountability, Platform transparency, For providers & partners
6. **Footer note** — Social-enterprise framing

## Components (`components/core/`)

| Component | Purpose |
|-----------|---------|
| `CoreShell` | Page frame, skip link, landmarks |
| `CorePageHeader` | Hero title block |
| `CoreQuickActions` | Sign in / control panel |
| `CoreSection` | Section wrapper with `id`, title, description |
| `CoreCapabilityStrip` | Four backbone tiles |
| `CorePillarCard` | Care / transport / employment |
| `CoreEcosystemCard` | Satellite roadmap tile |
| `CoreHubCard` | Generic hub tile (`live` link or `roadmap` non-focusable) |
| `CoreRoadmapBadge` | Live / Coming soon / Beta |

## Configuration (`lib/core-ui/`)

| File | Content |
|------|---------|
| `navigation.ts` | `CORE_HUB_HERO`, civic links, `CORE_HUB_SECTIONS` |
| `core-capabilities.ts` | Account, billing, messaging, support routes |
| `pillars.ts` | Three service offerings + secondary links |
| `ecosystem.ts` | Five satellite apps, `status: 'roadmap'` |

## Business plan traceability

| BP concept | UI surface | Route |
|------------|------------|-------|
| Single account identity | Capability: Account | `/dashboard` |
| Billing & subscriptions | Capability: Billing | `/dashboard/billing` |
| Unified inbox | Capability: Messaging | `/dashboard/messages` |
| Support | Capability: Support | `/dashboard/safety/support` |
| Care offering | Pillar | `/dashboard/care` |
| Transport offering | Pillar | `/dashboard/transport` |
| Employment (Jobs) | Pillar | `/dashboard/jobs` |
| Satellite apps | Ecosystem roadmap | No `href` (Coming soon) |
| Transparency / accountability | Existing hub sections | Civic routes |

## Accessibility & copy constraints

- Roadmap tiles: `aria-disabled`, `tabIndex={-1}`, not in tab order
- Live tiles: focus ring, min 40px targets on primary actions
- No copy implying automatic NDIS claim or Commission submission
- Plan-managed vs Stripe billing stays documented in `docs/billing.md`

## Tests

`tests/mapable-core-ui.test.ts` guards config structure (ecosystem count, pillar hrefs, capability routes, hero copy).
