# MapAble National Access — GCCSA 2026 Chat-Mode Scaffold

**Status:** Draft implementation on PR #613  
**Repository:** `ausdisau/mapableau-new`  
**Branch:** `feat/access-national-gccsa-2026-chat-scaffold`  
**Target surface:** `/access` (MapLibre)  
**Explicitly out of scope:** legacy Leaflet `/accessibility-map`

## Decision

Nationalise the existing MapAble Access V2 experience rather than create a second mapping stack.

- `AccessPlace` remains canonical place identity and the place source of truth.
- Map and list continue to derive from the same ordered AccessFit result IDs.
- ABS GCCSA geometry is geographic context and filtering evidence, not a service, funding or eligibility boundary.
- OpenStreetMap remains basemap context through the existing MapLibre configuration.
- Place-level evidence remains separate and retains source state, confidence, freshness and dispute state.
- Community observations remain explicitly community-reported and never become verified merely through publication.
- UNKNOWN remains first-class and is never converted to inaccessible.

## Capital-city scope

The scaffold exposes one national release surface for:

| Capital region | GCCSA code | ABS name |
| --- | --- | --- |
| Sydney | `1GSYD` | Greater Sydney |
| Melbourne | `2GMEL` | Greater Melbourne |
| Brisbane | `3GBRI` | Greater Brisbane |
| Adelaide | `4GADE` | Greater Adelaide |
| Perth | `5GPER` | Greater Perth |
| Hobart | `6GHOB` | Greater Hobart |
| Darwin | `7GDAR` | Greater Darwin |
| Canberra / ACT | `8ACTE` | Australian Capital Territory |

Boundary data is configured for ABS ASGS Edition 4 (2026) through the ABS ArcGIS GCCSA service. The API adapter discovers a suitable layer at runtime, requests GeoJSON in WGS84, normalises field casing and fails visibly when a usable boundary cannot be obtained.

## UI scaffold

The `/access` V2 shell gains:

- a national eight-capital GCCSA selector with an “All eight capitals” state;
- MapLibre GCCSA polygons and selected-region emphasis;
- exact point-in-polygon filtering for AccessPlace coordinates;
- explicit messaging for missing coordinates and unavailable boundaries;
- mobility-aid preferences including manual wheelchair, power wheelchair, mobility scooter, walker, cane and other;
- a maximum comfortable short-distance walking preference;
- a provenance legend separating ABS boundaries, OpenStreetMap basemap context and community observations;
- a selected-place evidence panel with evidence state, confidence, freshness, disputes and individual evidence references;
- functional evidence controls that can prioritise higher confidence or restrict to verified/authoritative evidence;
- retained AccessFit, map/list parity, route handoff and report-a-change actions.

The walking-distance preference is deliberately **not** converted into a place score. It is retained for future route-segment evaluation because the current national route graph does not provide authoritative walking-distance accessibility evidence.

## Failure behaviour

The scaffold is fail-honest:

1. If an ABS boundary is unavailable, selecting a city does not silently substitute a state or approximate metropolitan box. Loaded places stay unfiltered and the UI states that the boundary is unavailable.
2. If an AccessPlace lacks coordinates, it cannot be assigned to a selected GCCSA. It is counted as unclassified and remains discoverable in the all-regions view.
3. If evidence is missing, the place remains UNKNOWN rather than being marked inaccessible.
4. Existing MapAble Go handoff remains explicitly a sandbox. This work does not claim live national accessible routing.

## WCAG 2.2 AA target

The scaffold keeps list-first access and MapLibre as an enhancement rather than the sole information channel.

Controls use native buttons, labels and selects; region state uses `aria-pressed`; status changes use existing live-region patterns; touch/keyboard targets retain the existing minimum-height convention. The Playwright Axe smoke suite is extended to include the `wcag22aa` ruleset and keyboard/pressed-state coverage for the national region controls.

This is a target pending full CI and rendered-browser verification; it is not yet an accessibility certification.

## Tests added

`tests/access-national-gccsa.test.ts` covers:

- ABS GeoJSON normalisation;
- rejection of unsupported geometry;
- point-in-GCCSA membership;
- missing-coordinate classification;
- explicit no-boundary fallback behaviour.

The existing `tests/a11y/access-experience-v2.spec.ts` is extended for WCAG 2.2 AA and GCCSA keyboard state.

## Known follow-on work before merge

- Validate the live ABS 2026 ArcGIS service response and exact layer/field contract in CI/preview.
- Resolve any TypeScript, lint, Prettier, Playwright or Vercel errors surfaced by PR checks.
- Visually inspect the Vercel preview against the retained MapAble Unified Accessible Dashboard reference.
- Replace the current “latest 200 published AccessPlace records” loader with a bounded national spatial/query strategy. The current GAIS enrichment is per-place and should not simply be raised to thousands of records.
- Add server-side spatial querying/indexing (or a precomputed GCCSA assignment) so national scale does not depend on shipping all place coordinates to the client.
- Confirm data-source licence/attribution requirements for each government/open dataset added after the boundary layer.
- Keep `/accessibility-map` frozen except for separate deprecation/redirect work.

## Merge gate

Do not merge PR #613 until:

- repository CI is green or remaining failures are confirmed pre-existing and unrelated;
- ABS live boundary loading is verified;
- `/access` is visually reviewed in the preview at desktop and mobile widths;
- map/list result parity is confirmed across all eight region selections;
- keyboard and screen-reader smoke checks pass;
- provenance labels are reviewed for claim accuracy;
- the national AccessPlace retrieval strategy is accepted for the intended release scale.
