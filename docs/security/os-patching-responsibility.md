# OS Patching Responsibility

**Claim state:** REQUIRES_HUMAN_VERIFICATION

| Environment | Owner | Patching model |
| ----------- | ----- | -------------- |
| Vercel serverless | Provider-managed | Vercel platform |
| Neon Postgres | Provider-managed | Neon console |
| GitHub Actions runners | Provider-managed | GitHub |
| Developer laptops | MapAble-managed (individual) | OS vendor updates |
| Local assistive input bridge (future) | MapAble-managed / device owner | Linux evdev host; not on Vercel |
| Self-hosted services (if any) | MapAble-managed | Document per service |

MapAble application code does not patch operating systems. Responsibility is documented here for Essential Eight control 2.
