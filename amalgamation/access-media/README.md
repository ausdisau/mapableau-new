# access-media (staging monorepo)

**Target remote:** `ausdisau/access-media`  
**Status:** Seeded under `amalgamation/access-media/` (org `createRepository` unavailable
to this agent). Publish:

```bash
cd amalgamation/access-media
git init
git add .
git commit -m "chore: seed access-media SoR from DisabilityFour and AccessiBooksREPL"
git remote add origin https://github.com/ausdisau/access-media.git
git push -u origin main
```

## Layout

- `apps/disabilityfour` — DisabilityFour+ SVOD (Express/Vite/Drizzle); screenshots stripped
- `apps/accessibooks` — AccessiBooks audiobook SPA from AccessiBooksREPL
- `docs/SSO_DEEP_LINK.md` — contract with MapAble platform SoR

## Link to platform

MapAble Independence Suite (`apps/independence`) opens AccessiBooks via
`EXPO_PUBLIC_ACCESSIBOOKS_URL` deep link — no catalogue in the platform monorepo.
