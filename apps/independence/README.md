# MapAble Independence Suite (`apps/independence`)

Accessibility-first Expo + React Native AdaptAble Home / Independence Suite,
intaken from `ausdisau/MapAble` `apps/mobile` into the **platform SoR**
(`ausdisau/mapableau-new`) under family-based amalgamation.

See [docs/strategy/AUSDISAU_AMALGAMATION.md](../../docs/strategy/AUSDISAU_AMALGAMATION.md).

## Relation to Companion

| App | Path | Role | Expo |
| --- | --- | --- | --- |
| Companion | `apps/companion` | Care/Visit Pack / Stop AURA (workers & participants on shift) | SDK ~52 |
| Independence | `apps/independence` | Today / Home / Indy / More participant independence UX | SDK ~57 |

Both install **independently** (not in the root pnpm workspace) until React/Expo
generations are unified. Do not mix their `node_modules`.

## MapAble platform API

Live place search uses this repo’s `GET /api/access/search` via
`src/runtime/mapableApi.ts`.

```bash
cp .env.example .env
# EXPO_PUBLIC_MAPABLE_API_URL=http://localhost:3000
# EXPO_PUBLIC_ACCESSIBOOKS_URL=https://accessibooks.example  # media SoR deep link
```

## Run

```bash
cd apps/independence
npm install
npm start
npm run typecheck
```

## Prototype boundaries

No live smart-home control, emergency dispatch, production AccessiBooks catalogue
(in-app), or authenticated native session exchange yet. AccessiBooks opens via
media SoR deep link when configured.
