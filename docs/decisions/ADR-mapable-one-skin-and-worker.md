# ADR: MapAble One unified skin (incremental) and worker notes (later)

## Decision

Ship an **incremental visual shell** (PR A) behind default-off flags, remapping semantic tokens on `html.mapable-one` so branding is consistent across the entire platform without a second app, consent store, or finance database. Worker care-plan / progress-note workflows follow as **PR B** with a distinct flag.

Intent alias branch name from the master prompt: `feature/mapable-one-unified-skin-role-shell-20261121`. Cloud Agent branch: `cursor/mapable-one-unified-skin-3606`.

## Alternatives considered

1. **Wholesale re-platform / new monorepo** — rejected; breaks Care Scheduler, Transport, Search in-flight work and authority boundaries.
2. **Replace global tokens without a flag** — rejected; no safe rollback for production.
3. **Skin only Core/Provider/Worker** — rejected after product direction to apply the look uniformly on every page/route while still flag-gated.

## Consequences

- No schema migration in PR A.
- Does not merge or depend on Search #728 / MapAble One ops #735 `/provider/one` route.
- Campaign logo remains provisional; approved `public/brand` assets stay.
- PR B must harden shift-brief IDOR and progress-note attestation before any enablement.
