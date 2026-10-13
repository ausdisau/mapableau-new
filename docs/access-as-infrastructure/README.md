# Access as Infrastructure

MapAble treats accessibility evidence as **infrastructure**: provider-neutral adapters, provenance-first observations, and fail-closed feature flags.

## Documents

| Doc | Purpose |
|-----|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design and data flow |
| [PROVIDERS.md](./PROVIDERS.md) | Provider catalogue |
| [FEATURE_FLAGS.md](./FEATURE_FLAGS.md) | Flag matrix |
| [SECURITY_PRIVACY.md](./SECURITY_PRIVACY.md) | Privacy and safety boundaries |
| [HARDENING.md](./HARDENING.md) | P10 readiness matrix |

## Status

Phases P01–P10 implemented in code with **all flags default OFF**. No production activation without explicit GO from hardening review.

## Quick links

- Integration gateway: `lib/integrations/access/`
- Infra deploy: `infra/open-infrastructure/`
- Tests: `tests/access-open-infrastructure/`
