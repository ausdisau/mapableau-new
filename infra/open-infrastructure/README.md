# MapAble Open Infrastructure

Operational boundary for Access-as-Infrastructure external providers (Panoramax, Open311, SensorThings, etc.).

All capabilities are **flag-gated** and default **OFF**. See `env.example` and `docs/access-as-infrastructure/FEATURE_FLAGS.md`.

## Contents

- `architecture.md` — deployment topology
- `env.example` — placeholder environment variables (no secrets)
- `services/panoramax/` — Panoramax API deploy artefact
- `compose/docker-compose.panoramax.yml` — reference compose for Coolify

## Principles

- MapAble R2 remains SoR for **private** community evidence
- External object stores are provider-scoped; no dual canonical stores
- Panoramax→R2 direct coupling is **unverified** — use S3-compatible `FS_URL` per Panoramax docs
