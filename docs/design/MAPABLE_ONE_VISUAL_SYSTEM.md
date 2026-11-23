# MapAble One visual system (PR A)

**Status:** Provisional design tokens — ad collateral ZIP was not present in the workspace.  
**Logo:** Approved repository assets only (`public/brand/*`). Campaign logo not swapped.  
**Flag:** `MAPABLE_ONE_UNIFIED_SHELL_ENABLED` + `NEXT_PUBLIC_MAPABLE_ONE_UNIFIED_SHELL` (both default `false`).

## Evidence

See [docs/mapable-one/EVIDENCE_LEDGER_PR_A.md](../mapable-one/EVIDENCE_LEDGER_PR_A.md). Base `main` SHA at branch cut: `f89cc8f9`.

## Semantic tokens (provisional)

| Token | Hex | Use |
|-------|-----|-----|
| `--mo-ink` | `#091C40` | Primary text / chrome |
| `--mo-bg-deep` | `#061B3D` | Deep navy (restrained on dashboards) |
| `--mo-orange` | `#FF7A00` | Primary CTA on light surfaces (dark ink label) |
| `--mo-purple` | `#7047C6` | Wayfinding / secondary accent |
| `--mo-surface` | `#F7F4EF` | Page canvas |
| `--mo-focus` | `#F8C51C` | Focus ring (retained gold) |

Additive export: `mapableOneColors` in `@mapable/ui`. Legacy `mapableColors` (teal/gold) remain for flag-off.

When the flag is on, `html.mapable-one` remaps platform `--primary` / `--mapable-brand` / surface tokens and common `#005B7F` utility classes so **every route** inherits the skin without a parallel CSS framework.

## Contrast notes (not certification)

- Orange `#FF7A00` on white may fail small-text AA — CTAs use dark ink on orange.
- Purple wayfinding chips use purple text on warm surface; large UI only.
- Focus ring ≥ 3px gold on all `.mapable-one` interactive targets.
- Do **not** claim WCAG 2.2 AA certification from this scaffold.

## Layout behaviour

| Viewport | Behaviour |
|----------|-----------|
| ≥1024 (desktop) | Collapsible sidebar + top bar |
| Tablet ~768 | Two-column cards; sidebar hidden, bottom nav |
| Mobile 390 | Bottom nav (≤4 links); skip link; 44px targets |

## Screenshots

Synthetic/demo HTML (`/opt/cursor/artifacts/mapable-one/preview.html`) captured via headless Chrome:

| File | Viewport |
|------|----------|
| `desktop-1440.png` | 1440×900 |
| `tablet-768.png` | 768×1024 |
| `mobile-390.png` | 390×844 |

Live app route `/dev/mapable-one-preview` mirrors this layout when the flag is on. Zoom 200%/400%, NVDA, VoiceOver: **NOT TESTED** in this agent run.

## Rollback

Set both env flags to `false` (or unset). Root `html` loses `mapable-one`; all shells restore legacy `AuthenticatedRoleAppShell` / `DashboardAppShell` / marketing chrome.
