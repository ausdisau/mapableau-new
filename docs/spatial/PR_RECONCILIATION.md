# Geoscape Spatial Intelligence — PR reconciliation

Updated: 2026-07-20

| PR                                       | Scope                                   | Recommended action                                                  |
| ---------------------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| #367                                     | Geoscape Predictive street autocomplete | **Merge** after licence/key owner OK (rebased, flags default false) |
| #384 Access Address Intelligence         | Contracts + context API                 | Stack on #367                                                       |
| #385 Approach resolver                   | Entrance/drop-off candidates            | Stack after #384                                                    |
| #386 Provider service areas              | Coverage vs availability                | Stack after #385                                                    |
| #93 Google Places                        | Competing geocoder                      | **Defer**                                                           |
| #67 Mapbox Geocoding                     | Competing geocoder                      | **Defer**                                                           |
| #153 AusPost PAC expansion               | Overlaps main PAC                       | **Defer / supersede**                                               |
| #222 Digital Twin MVP                    | Premature twin                          | **Defer**                                                           |
| #309 Civic digital twin                  | Premature twin                          | **Defer**                                                           |
| #284 Civic Asset Registry                | Council wave                            | **Defer**                                                           |
| #282 Accessibility Ops Asset Registry    | Council/ops wave                        | **Defer**                                                           |

**Active product PR policy:** ≤3 sequential spatial product PRs.  
**Canonical Predictive client:** `lib/geoscape-predictive/**` only.
