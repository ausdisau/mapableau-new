# MapAble — migrated to the unified repository

> **This standalone repository has been amalgamated into `ausdisau/MapAble`.**
>
> The canonical codebase is now: **https://github.com/ausdisau/MapAble**
>
> The former contents of this repository are preserved under `apps/web` in the unified repository. New development, pull requests, documentation updates, Replit work, deployment changes, and issue tracking should target `ausdisau/MapAble`.

## Migration record

- Standalone source repository: `ausdisau/mapableau-new`
- Final imported `main` commit: `e0a8b6907b25b23eda82fcbc3b722c088861b704`
- Canonical destination: `ausdisau/MapAble`
- Destination path: `apps/web`
- Mobile/AdaptAble application: `apps/mobile`

The source tree at the migration commit is preserved in the unified repository, together with its Git history through the subtree import. This repository remains available as a historical reference, but it is no longer the canonical development target.

## Continue development

Use the unified repository and work in the relevant application directory:

- `apps/web` — MapAble web platform
- `apps/mobile` — AdaptAble Home / Independence Suite Expo + React Native app

See the unified repository's root README and `docs/repository-amalgamation.md` for the current layout and development commands.

## Family amalgamation strategy (org-wide)

This branch adds documentation and staging seeds for family-based amalgamation
across `ausdisau` repositories (platform / simulation / media). See
[docs/strategy/AUSDISAU_AMALGAMATION.md](docs/strategy/AUSDISAU_AMALGAMATION.md).

Per the migration above, the **platform system of record** is `ausdisau/MapAble`
(`apps/web`, `apps/mobile`). Branch additions such as `apps/independence/` and
`amalgamation/` should be reconciled with the unified repository layout before
continuing platform work on this remote.
