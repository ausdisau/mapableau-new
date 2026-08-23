# MapAble Labs subdomain architecture

Status: in development

Target public host: `https://labs.mapable.com.au`

## Purpose

MapAble Labs is the public experimentation, simulation and co-design surface for emerging accessibility, mobility and personal-agency concepts. Experimental interfaces must remain visibly and technically distinct from production MapAble services and evidence.

## Initial architecture

The first release stays in the existing `ausdisau/mapableau-new` Next.js codebase so it can reuse MapAble security headers, accessibility primitives, brand assets and CI without duplicating identity or platform infrastructure.

Host routing is handled by the existing middleware:

- `labs.mapable.com.au/` rewrites internally to `/labs`
- `labs.mapable.com.au/mobility-futures` rewrites internally to `/labs/mobility-futures`
- explicit `/labs/*` routes remain directly reachable for preview/testing
- API and static-asset requests are not rewritten
- the main `mapable.com.au` host is unchanged

The host can be overridden with `MAPABLE_LABS_HOST` for controlled environments.

## Vercel deployment

Preferred initial deployment: attach `labs.mapable.com.au` as a custom domain to the same Vercel web project that deploys `ausdisau/mapableau-new`.

This avoids a second application build while preserving a distinct public origin and URL surface.

Do not attach the domain until the correct web project is identified and a preview deployment of this branch passes CI and accessibility review.

Expected Vercel sequence:

1. Identify the Vercel web project linked to `ausdisau/mapableau-new`.
2. Deploy the feature branch as Preview.
3. Verify `/labs` and `/labs/mobility-futures` on Preview.
4. Merge only after review.
5. Add `labs.mapable.com.au` to that web project in Vercel Project Settings > Domains.
6. Configure the DNS record requested by Vercel at the authoritative DNS provider.
7. Verify TLS and domain ownership in Vercel.
8. Test the custom-host rewrite at `https://labs.mapable.com.au/`.
9. Keep Labs clearly labelled experimental.

## Safety and claim boundary

Labs must never imply that experimental functions are validated or available real-world assistive systems.

Current rules:

- no physical mobility-device actuation
- no wheelchair steering, braking or propulsion control
- no exoskeleton actuation
- no clinical or safety certification claims
- no synthetic simulation observation may become live GAIS evidence
- no research participation is implied by ordinary site use
- public feedback and formal human-participant research require distinct consent models

## Accessibility

Labs targets WCAG 2.2 AA and must provide non-3D equivalents for future simulation work. Interactive studies should eventually support keyboard, touch, screen reader, switch-style interaction, reduced motion, large targets and text-based scenario alternatives.

## Current scope

Implemented in this slice:

- public Labs application shell
- Labs landing page
- Mobility Futures stream foundation
- explicit experiment-status and simulation boundaries
- host-based `labs.mapable.com.au` routing
- routing unit tests
- **Experiment Runtime** (contracts, deterministic reducer, Mobility Futures interactive journey)
- reusable Labs UI: ExperimentShell, ScenarioPlayer, ChoicePanel, AgencyTimeline, ReplayControls, FeedbackPrompt
- STANDARD VISUAL / SIMPLIFIED 2D / TEXT presentation modes
- Agency Timeline + replay comparison (client-side)
- simulation boundary tests (no GAIS evidence writes)

Deferred:

- study sessions and consent
- behavioural event logging persistence
- research dashboards
- 3D/WebXR environments
- GAIS synthetic-world adapters (read-only fixtures only today)
- formal research governance workflow
- durable research data storage

See also: `docs/architecture/mapable-labs-experiment-runtime.md`.