# ausdisau family-based amalgamation

**Status:** Active doctrine  
**Date:** 2026-08-17  
**Canonical platform SoR:** [`ausdisau/MapAble`](https://github.com/ausdisau/MapAble) (`apps/web`, `apps/mobile`).

This repository (`ausdisau/mapableau-new`) was migrated into the unified MapAble
repository; it remains a historical reference. Strategy docs and seeds on this
branch apply org-wide and should be ported to the canonical remote where noted below.

This document is the system-of-record (SoR) map for amalgamating first-party
GitHub repositories under the `ausdisau` organisation. It implements
**family-based amalgamation**: three product families, not one mega-monorepo.

Related:

- [MapAble REPL ↔ mapableau-new gap analysis](../mapable-merge-gap-analysis.md)
- [Replit imports](../operations/replit-imports.md)
- [Operating lanes](./OPERATING_LANES.md)
- CareOS Life Twin (participant support simulation): [LIFE_TWIN.md](../careos/LIFE_TWIN.md)

---

## Three systems of record

| SoR | Canonical remote | Owns | Does not own |
| --- | --- | --- | --- |
| **Platform** | `ausdisau/MapAble` (`apps/web`, `apps/mobile`) | Care, transport, billing/NDIS, access map, CareOS, auth/consent, companion APIs, Academy courses, Independence Suite mobile | Clinical education narrative apps, SVOD, audiobook catalogue |
| **Simulation** | `ausdisau/disability-simulations` | Shared clinical education kernel, MERT UI, medical training cases, Rohan ICU narrative | Live participant support actuation, MapAble Prisma |
| **Media** | `ausdisau/access-media` | DisabilityFour+ SVOD, AccessiBooks audiobooks, shared a11y player/tokens | MapAble support workflows, NDIS claims |

Cross-SoR links are **adapters only**: deep links, SSO/consent scopes, and
optional Academy embeds of training sims. No shared production database across
families.

---

## Disposition table (public first-party repos)

| Repository | Family | Disposition |
| --- | --- | --- |
| `mapableau-new` | Platform | **Historical** — subtree imported to `ausdisau/MapAble` `apps/web`; do not treat as canonical SoR |
| `MapAble` | Platform | **Canonical unified repo** — `apps/web` + `apps/mobile` (Independence Suite) |
| `MapAbleDcademy` | Platform | **Archive** — Academy lives at `app/academy/` |
| In-tree Replit twin (`server/`, `client/`) | Platform | **Port-then-quarantine** — see gap analysis; stop new dual-stack features |
| `MERT-Engine` | Simulation | **Seed** of `packages/sim-kernel` + `apps/mert` |
| `disability-medical-simulations` | Simulation | **Port** cases onto shared kernel as `apps/medical-cases` |
| `rohan-icu` | Simulation | **Absorb** as `apps/rohan-icu` consuming kernel |
| `DystoniaICUSim` | Simulation | **Inventory then archive** |
| `Breathe-The-Weight-of-Air` | Simulation | **Inventory then archive** |
| `supersim` | Simulation | **Inventory then archive** |
| `DisabilityFour` | Media | **Absorb** as `apps/disabilityfour` |
| `AccessiBooksREPL` | Media | **Absorb** as `apps/accessibooks` |
| `AccessiBooks-01` | Media | **Archive** after media SoR README notes |
| `DiverseSpeech` | Media | **Archive** |
| `EnthroRythum` | — | **Archive** (empty) |
| `Australian-Disability-website` | — | **Archive** (empty) |

### Upstream forks (leave untouched)

Do **not** fold into product SoRs. Keep as mirrors; vendor packages only if
needed (e.g. guardrails) without repo merge:

`blt`, `Mass-Mailing-Script`, `dspy`, `openai-guardrails-js`, `any-guardrail`,
`mega-tron`, `ggml`, `health-design-system`, `.NETruntime`, `audiobookshelf`,
`librivox-catalog`, `gutendex`, `cli`.

(`AccessiBooksREPL` is first-party media product code — see disposition table —
even if its Replit template DNA resembles a fork shape.)

If a private repo appears outside this public inventory, re-run disposition
before merging.

---

## Platform intake details

### Independence Suite (`ausdisau/MapAble` `apps/mobile`)

- Canonical path in unified repo: `apps/mobile` on `ausdisau/MapAble`
- This branch also contains a copy at [`apps/independence`](../../apps/independence/) from pre-migration intake — reconcile or remove when porting to unified repo

### Replit twin quarantine

After high-priority ports from the gap analysis land (or are explicitly
won’t-do), treat `server/` and `client/` as **read-only legacy**. See
[`LEGACY_REPLIT_TWIN.md`](../operations/LEGACY_REPLIT_TWIN.md).

### Academy / Dcademy

MapAble Academy courses remain under `app/academy/`. Remote `MapAbleDcademy`
has no unique assets — archive only.

---

## Simulation SoR layout

Proposed monorepo `ausdisau/disability-simulations`:

```text
packages/sim-kernel          # SimulationKernel, DeclarativeScenarioEngine, AAC/authority
packages/sim-content-schema  # Zod/JSON scenario contracts
apps/mert
apps/medical-cases
apps/rohan-icu
docs/invariants.md           # communication failure != incapacity
```

**Boundary with CareOS:** Life Twin / support simulation in this platform repo
is participant-support only (no clinical training actuation). The simulation
SoR is education-only. Optional shared npm package; no shared DB.

Scaffold and sync notes: [`amalgamation/disability-simulations/`](../../amalgamation/disability-simulations/).

---

## Media SoR layout

Proposed monorepo `ausdisau/access-media`:

```text
apps/disabilityfour   # SVOD (Able Player, YouTube sync)
apps/accessibooks     # audiobooks SPA
packages/a11y-player  # optional shared player/tokens later
docs/sso-deep-link.md # contract with MapAble
```

Deep-link / SSO contract: [`amalgamation/access-media/docs/SSO_DEEP_LINK.md`](../../amalgamation/access-media/docs/SSO_DEEP_LINK.md)
(also mirrored at [`docs/amalgamation/access-media/SSO_DEEP_LINK.md`](../amalgamation/access-media/SSO_DEEP_LINK.md)).

---

## Explicit non-goals

- Merging all org repos into `mapableau-new`
- Long-term dual Drizzle + Prisma SoR or Replit Object Storage as platform storage
- Folding upstream research forks into product trees
- Unifying DisabilityFour brand UI into MapAble admin/participant shells

---

## Phased delivery checklist

| Phase | Outcome |
| --- | --- |
| 0 Governance | This document + links from gap analysis / replit-imports |
| 1 Platform | Independence Suite app + REPL port tracking / twin quarantine |
| 2 Simulation | `disability-simulations` monorepo seeded from MERT + cases + Rohan |
| 3 Media | `access-media` monorepo seeded from DisabilityFour + AccessiBooksREPL |
| 4 Cleanup | Archive empties/stubs; forks left; optional rename `mapableau-new` → `mapable` |

---

## Success criteria

- Owners accept this SoR map
- Independence Suite UX uses MapAble auth/APIs; REPL ports tracked done/won’t-do; no new features on legacy Express twin
- Sims: one kernel package; MERT + medical cases + Rohan share invariants tests
- Media: DisabilityFour and AccessiBooks build from one media remote; MapAble only deep-links
- Empties archived; upstream forks untouched

---

## Archive candidates (Phase 4)

Confirm content salvage, then archive on GitHub:

1. `MapAbleDcademy`
2. `EnthroRythum`
3. `Australian-Disability-website`
4. `AccessiBooks-01`
5. `DiverseSpeech`
6. `DystoniaICUSim`
7. `Breathe-The-Weight-of-Air`
8. `supersim`

Runbook: [`docs/amalgamation/ARCHIVE_RUNBOOK.md`](../amalgamation/ARCHIVE_RUNBOOK.md).
