# MapAble Local Access Guides

**Status:** pilot implementation scaffold / Ku-ring-gai reference implementation  
**Public claim:** none until source ingestion, verification and product review are complete

## Proposition

MapAble Local Access Guides are the public-facing projection of MapAble Access Infrastructure for a local government area and its precincts.

They answer four questions:

1. What accessibility infrastructure and accessible places exist here?
2. Can a person complete the journey they need to make?
3. What evidence supports each accessibility claim?
4. What barriers remain, and what remediation is planned or verified?

Local Access Guides are not a second place registry. `AccessPlace` remains the canonical public-place identity source of truth. Guides compile verified and appropriately labelled evidence from `AccessCapability`, `AccessObservation`, journey evaluation, accreditation presentation and council audit data.

## Design rules

1. **No second place source of truth.** Imported council, KMZ/KML and open-data records must reconcile to `AccessPlace`.
2. **Unknown is first-class.** Missing evidence is `unknown`, never silently treated as accessible or inaccessible.
3. **Evidence before labels.** Every published accessibility attribute carries provenance, freshness and confidence/dispute state.
4. **Accreditation is presentation, not personal compatibility.** Bronze/Silver/Gold may support discovery but must not decide whether a place works for a particular person.
5. **Whole journey matters.** A destination may perform strongly while the path to it remains unusable.
6. **Local government reporting is a projection.** Council audit, barrier and remediation views should be generated from the same evidence substrate where possible.

## Ku-ring-gai pilot scope

The first reference guide targets Ku-ring-gai and establishes the reusable contract for a Greater Sydney rollout.

Initial asset families:

- libraries
- civic buildings
- parks and open space
- inclusive and accessible playgrounds
- pools and aquatic facilities
- public toilets
- accessible parking
- beaches / foreshores where relevant
- footpaths
- pedestrian crossings
- kerb ramps
- priority accessible routes

The current public seed layer is intentionally incomplete. Asset existence and accessibility verification are separate states.

## Evidence states

Local Access Guide presentations should map canonical provenance states into clear public language:

| Canonical state | Guide language |
| --- | --- |
| `verified` | Verified |
| `observed` | Observed |
| `venue_reported` | Reported by venue/operator |
| `community_reported` | Community reported |
| `unknown` | Unknown / audit required |
| `outdated` | Stale / re-verification required |
| `disputed` | Disputed |

## URL architecture

```text
/guides
/guides/nsw
/guides/nsw/greater-sydney
/guides/nsw/ku-ring-gai
/guides/nsw/ku-ring-gai/gordon
/guides/nsw/ku-ring-gai/lindfield
/guides/nsw/ku-ring-gai/pymble
/guides/nsw/ku-ring-gai/st-ives
/guides/nsw/ku-ring-gai/turramurra
/guides/nsw/ku-ring-gai/roseville
```

## Core guide projections

A council guide should eventually expose:

- accessibility infrastructure map
- verified accessible places
- public toilets and accessible parking
- inclusive playgrounds, parks, libraries and civic facilities
- evidence freshness and provenance
- known barriers and temporary disruptions
- MapAble accreditation presentation
- whole-journey examples and preflight
- council remediation progress
- community verification and correction channels
- annual accessibility metrics suitable for DIAP reporting

## Data flow

```text
legacy MapAble KML/KMZ       council/open data       field/community audits
          |                        |                        |
          +------------ candidate observations -----------+
                                   |
                         reconcile against AccessPlace
                                   |
                            AccessObservation
                                   |
                            AccessCapability
                                   |
             +---------------------+---------------------+
             |                                           |
       Local Access Guide                         Council audit view
```

## Pilot acceptance criteria

The Ku-ring-gai slice is ready for broader Sydney replication when:

- council/public data imports do not create a parallel place registry;
- evidence state is visible on every accessibility claim;
- `unknown` remains distinguishable from a barrier;
- venue accreditation is visually separated from personal compatibility;
- public guide content is usable without a map;
- the same asset/evidence contract can represent footpaths, crossings and kerb ramps;
- accessibility tests cover keyboard, screen reader labelling and non-map fallback;
- no public production claim is made for incomplete or unverified council coverage.

## Source inputs for this pilot

- existing MapAble Google My Maps / KML synchronisation pipeline
- MapAble Access Infrastructure and Access Intelligence Next contracts
- MapAble Accreditation Assessment & Evaluation Criteria
- Ku-ring-gai accessibility infrastructure seed dataset developed for the pilot
- future council and NSW open-data feeds, each with explicit source ledger and licence review

## Next implementation steps

1. Add a typed Local Access Guide projection contract in `lib/access/guides/`.
2. Add a static Ku-ring-gai seed fixture behind a feature flag.
3. Add `/guides/nsw/ku-ring-gai` with list-first accessibility and optional map enhancement.
4. Add importer adapters that emit observations rather than overwriting place truth.
5. Add council audit-gap views for footpaths, crossings and kerb ramps.
6. Add automated accessibility and evidence-integrity tests.
