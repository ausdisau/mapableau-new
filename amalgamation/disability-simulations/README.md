# disability-simulations (staging monorepo)

**Target remote:** `ausdisau/disability-simulations`  
**Status:** Seeded inside `mapableau-new` under `amalgamation/disability-simulations/` because
org `createRepository` is not available to this agent token. Push with:

```bash
cd amalgamation/disability-simulations
git init
git add .
git commit -m "chore: seed disability-simulations SoR from MERT, medical cases, rohan-icu"
# after creating the empty GitHub repo manually:
git remote add origin https://github.com/ausdisau/disability-simulations.git
git push -u origin main
```

## Layout

- `packages/sim-kernel` — extracted from `MERT-Engine` (`SimulationKernel`, scenarios types, dynamics modules)
- `apps/mert` — MERT Expo UI shell
- `apps/medical-cases` — port of `disability-medical-simulations`
- `apps/rohan-icu` — Breathing Room / Rohan ICU narrative app
- `docs/invariants.md` — shared doctrine

## Boundary

Education only. MapAble CareOS Life Twin remains participant-support in the platform SoR.
