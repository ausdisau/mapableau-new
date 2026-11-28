# Community infrastructure: web, mobile and desktop delivery

**Reviewed:** 28 November 2026, Australia/Sydney.

**Status:** Web implementation in development; native and desktop adaptations proposed.

## Objective and current state

The task is to provide a MapAble data layer for accessible parking, toilets and public spaces, using OpenStreetMap data and Leaflet web presentation, with Mapbox, Mapify and AnyWhereMap in the roles established by their capability checks. Discovery or visualisation results must retain their source limitations; they cannot substitute for measured accessibility evidence.

The current change targets a bounded OSM snapshot, a public GeoJSON response at `GET /api/access/community-infrastructure`, and a web interface with an equivalent text list. The implementation report must establish which parts pass testing and are deployed. This document records inspected package metadata and proposed platform adaptations; it is not evidence of native builds or production availability.

| Surface          | Inspected repository evidence                                                                                                                                                                                                                             | Consequence                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Web              | The agreed target is the existing MapAble website and Leaflet layer.                                                                                                                                                                                      | Complete and verify this vertical slice first.                                                                         |
| Places prototype | [Package](../../apps/places/package.json) declares Expo `~57.0.21`, React Native `0.86.3`, React `19.2.3`, React Native Web and AsyncStorage. [README](../../apps/places/README.md) describes an isolated prototype with optional read-only place import. | Existing candidate for a public-infrastructure screen; dependency declarations do not prove a successful native build. |
| Companion        | [Package](../../apps/companion/package.json) declares Expo `~52.0.0`, React Native `0.76.3`, React `18.3.1`, SecureStore and notifications. [README](../../apps/companion/README.md) describes a native shell and separate visit-pack scope.              | Different dependency generation: assess compatibility before sharing platform packages.                                |
| Electron         | No desktop build was inspected for this task.                                                                                                                                                                                                             | A thin desktop shell is a proposed adaptation only.                                                                    |

Do not create a parallel native application for this data-layer change. Preserve the web pathway for participants who do not use a smartphone.

## Shared architecture and data contract

Keep geometry validation, feature categories, evidence-state rules, filtering and source attribution in platform-neutral TypeScript. UI modules own rendering and focus behaviour. Separate transport, storage and map-renderer adapters from domain decisions; avoid importing browser globals or native modules into shared logic.

All proposed clients consume the same public API. Validate its returned contract, preserve source-native identifiers and display source/retrieval dates. Unknown access attributes remain unknown. A cached or imported feature cannot acquire a stronger verification status through a renderer change. Keep evidence-state rules deterministic and source changes auditable; human review resolves conflicting reports. Extend the existing contract deliberately when needed rather than maintain incompatible copies.

Mapbox can be a configurable presentation service where its SDK, terms and credentials suit the selected platform. Preserve provider-neutral GeoJSON and OSM attribution. No renderer choice proves a continuous accessible route or available parking bay.

## Proposed React Native adaptation

Reuse the public-data contract and domain logic within an existing app after its ownership and dependency compatibility are assessed. Render a native results list, filters and feature details. **Do not place Leaflet DOM components in a native component tree.** Select a native map renderer separately if it adds participant value; the list must remain fully usable without it.

Implement labels, roles, selected states, meaningful focus order, text scaling and restrained result announcements using APIs supported by the app's pinned React Native version. Verify VoiceOver, TalkBack, hardware keyboard and switch navigation on devices. The [React Native accessibility documentation](https://reactnative.dev/docs/accessibility) explains platform differences; web accessibility results do not establish native behaviour.

No background geolocation is required. Start with named study windows or an explicit search location. A future foreground location option needs a clear purpose, consent, denial recovery and a usable manual alternative; it must not gate facility discovery.

## Proposed Electron adaptation and security

Reuse the web UI in a thin shell if desktop packaging becomes a defined requirement. Keep the renderer isolated and sandboxed, disable Node integration, validate IPC senders and inputs, and expose only narrowly scoped preload operations. Do not expose raw Node, filesystem, shell or generic IPC access to page content. Restrict navigation and validate external URLs. These controls follow [Electron's security guidance](https://www.electronjs.org/docs/latest/tutorial/security).

Use the same HTTPS public-data endpoint. Desktop packaging must not create another facility database, authentication stack or evidence policy. Assess inherited site scripts and permissions before packaging; a website's availability does not establish desktop readiness.

## Offline behaviour, privacy and failure recovery

Proposed offline support caches **only permitted public GeoJSON and its attribution**, with retrieval date, dataset version and an explicit stale state. Keep cache quotas and deletion controls. A refresh failure preserves the previous valid snapshot and explains its age; a malformed response cannot replace it. First-use offline failure needs an accessible empty state.

Do not prefetch public OSM tiles or offer offline-area downloads against `tile.openstreetmap.org`. Its [tile policy](https://operations.osmfoundation.org/policies/tiles/) distinguishes ordinary HTTP caching from prohibited bulk/offline prefetch. A separate provider with explicit offline rights would require a separate decision.

Exclude private notes, participant profiles, diagnoses and travel histories from this public cache. Existing Companion visit packs have different data and protection requirements; do not mix them into the infrastructure adapter.

## Performance method and test plan

Apply the selected React Native performance skill's measure → optimise → re-measure → validate cycle. Establish a baseline for the actual filter, list-scroll, detail-opening and cold-start interactions before optimisation. Record commit timing, expensive components, re-render counts, frame behaviour, memory and data volume where relevant. Validate timing-sensitive changes in release-like builds.

Do not add memoisation, replace state management or change compiler settings based on component-tree size alone. Inspect pinned library versions before choosing APIs. Use targeted profiling to justify virtualisation or other changes, then repeat the same interaction and revert ineffective modifications. No native profiling was performed for this document.

## Platform-neutral acceptance criteria and delivery gates

1. A participant can find and compare all three infrastructure categories through a labelled list without map gestures, speech, GPS or an account.
2. Feature details expose source evidence, dates, unknowns and access restrictions consistently across clients.
3. API/schema failures, empty results, stale data and missing map tiles have readable recovery states.
4. Web testing targets WCAG 2.2 AA; each later platform separately passes keyboard/switch and screen-reader journeys with participant evaluation.
5. Public-data attribution survives filtering, caching and export; no unapproved source becomes a live feed.
6. Proposed owners are the Access engineering lead for the contract, platform maintainers for adapters, and participant reviewers for usability. These roles must be assigned before expansion.

Complete the web checks first. A later native or desktop task must name its host app, compatibility work, tested devices, measured performance targets and release owner. No native binary, Electron scaffold, external contact or production deployment is delivered by this adaptation brief.
