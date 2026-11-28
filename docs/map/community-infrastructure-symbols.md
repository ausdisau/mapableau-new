# Community infrastructure symbols

**Status:** Implemented, not independently verified in a browser.

## Decision and scope

Use three locally served, unchanged NPMap symbols as decorative category cues
on the community infrastructure cards. Text labels remain authoritative. The
Leaflet P/T/S markers and keyboard interactions remain unchanged.

This is an interface asset integration, not an accessibility assessment,
National Park Service partnership, or facility-data import.

## Source and licence evidence

Inspected on 28 November 2026. Upstream repository commit:
`27e97208c860366ab9d78dfe594a778c411661fb`.

- [NPMap Symbol Library repository](https://github.com/nationalparkservice/symbol-library)
  identifies the library as National Park Service map symbols for the web and
  documents ready-to-use SVGs in `src/standalone/`.
- [Repository licence at the inspected commit](https://github.com/nationalparkservice/symbol-library/blob/27e97208c860366ab9d78dfe594a778c411661fb/LICENSE.txt)
  provides a BSD-style three-clause redistribution licence, with Mapbox's 2013
  copyright notice, retention requirements, disclaimer and no-endorsement term.
  The exact file is copied to `public/map-symbols/nps/LICENSE.txt`.
- [NPS Map Symbols and Patterns](https://www.nps.gov/subjects/gisandmapping/map-symbols-patterns-for-nps-maps.htm)
  separately states that NPS symbols are free and in the public domain. For the
  files retrieved from GitHub, MapAble retains the repository's complete notice
  rather than replacing it with a blanket public-domain assertion.

## Imported files

| MapAble category | Upstream file                                                                                                                                                                       | Local asset                                             | Interpretation                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Parking          | [parking-black-30.svg](https://github.com/nationalparkservice/symbol-library/blob/27e97208c860366ab9d78dfe594a778c411661fb/src/standalone/parking-black-30.svg)                     | `public/map-symbols/nps/parking-black-30.svg`           | Parking category only; designation, physical usability and vacancy remain separate facts.         |
| Toilet           | [restrooms-black-30.svg](https://github.com/nationalparkservice/symbol-library/blob/27e97208c860366ab9d78dfe594a778c411661fb/src/standalone/restrooms-black-30.svg)                 | `public/map-symbols/nps/restrooms-black-30.svg`         | Toilet category only; the pictogram does not establish gender arrangements, equipment or access.  |
| Public space     | [point-of-interest-black-30.svg](https://github.com/nationalparkservice/symbol-library/blob/27e97208c860366ab9d78dfe594a778c411661fb/src/standalone/point-of-interest-black-30.svg) | `public/map-symbols/nps/point-of-interest-black-30.svg` | Generic mapped place; does not imply trees, seating, public-entry permission or accessible paths. |

The repository also contains `playground`, `community-garden`, `picnic-area`,
`benches-seating`, `wheelchair-accessible`, `assistive-listening-systems`,
`braille`, `audio-description` and `sign-language-interpretation` symbols.
They are not bundled here. A specific feature symbol requires a corresponding
source-supported fact and a clear evidence label; it must not be assigned merely
because a place belongs to a broad category.

## Accessibility and claim controls

- Symbols render at their native 30 × 30 dimensions inside the existing 44px
  decorative container. They are not controls or additional keyboard stops.
- `alt=""` and `aria-hidden="true"` prevent duplicate screen-reader output;
  the adjacent category and place names carry the accessible meaning.
- Black symbols on the light MapAble surface preserve contrast. The visible
  words and P/T/S map legend preserve meaning without dependence on colour.
- No wheelchair-accessible symbol is used as a category marker or verification
  badge. Source reports and unknown access details remain visible.
- No NPS arrowhead, seal, logo or endorsement claim is included.
- The National Public Toilet Map link is an external directory lookup. Its
  records are not represented as merged into the local dataset.

## Current implementation and architecture

`CommunityInfrastructureSymbol.tsx` uses a deterministic category-to-local-file
mapping. The participant's visible category text carries the meaning; no model
selects symbols from source text. All three images use fixed dimensions and
local paths. Human review of a new symbol's meaning and licence is required
before changing the mapping.

## Security, privacy and integrity

Each SVG was parsed as XML before copying. The imported files contain only
`svg`, `g`, `path`, `rect` and `polygon` elements. No scripts, event handlers,
DOCTYPE/entities, `foreignObject`, image resources, external references,
`href`/`src` attributes, style blocks or `url(...)` values were present.

They are served as local image files through an allowlisted category-to-path
mapping. Source text does not control asset paths, and SVG markup is not injected
into the React DOM. Copies retain the exact upstream bytes.

| File                           | Bytes | SHA-256                                                            |
| ------------------------------ | ----: | ------------------------------------------------------------------ |
| parking-black-30.svg           |   535 | `5914e1eeefca0785da0333a310687f9ea13ac47d04fe452c3b1bfdd158a259b2` |
| restrooms-black-30.svg         |   916 | `1aeff35d27680d65e4948554a298580fef0c1d6c40933c5d425540bcb748ab07` |
| point-of-interest-black-30.svg |  1074 | `ff4e38ab3ff835941ef036978c3562d60b9e005548a1b39818b48380b5d997ef` |

## Validation and maintenance

The existing community-interface tests cover text injection, source semantics,
list-first interaction and accessible labels. A regression assertion checks
that a source-supplied HTML string cannot add a new image beyond the fixed
category asset. No package dependency is added.

For future updates, inspect the new pinned commit and licence, repeat the SVG
safety check, preserve the upstream copyright/disclaimer, and update this source
table and checksums. Review any new icon's implied meaning with participants.

## Failure recovery

If a symbol fails to load, the adjacent category and place names remain the
text fallback. Source records, filters and list navigation do not depend on an
image request succeeding. A maintainer can restore the previous mapping and
asset files with a reviewed code rollback. Serving these assets locally adds
no third-party image request or participant information to the source service.
