# Platform Assurance

Internal regulatory readiness and worker-trust inventory for MapAble.

## Non-claims

MapAble has **not** declared that it is:

- an NDIS-registered digital platform;
- legally compliant with NDIS Practice Standards;
- certified or approved by any regulator.

Scope assessment results are structured **review opinions** for human and legal review. They are not legal advice.

## Feature flags

| Flag | Default | Purpose |
|------|---------|---------|
| `PLATFORM_ASSURANCE_ENABLED` | `false` | Admin assurance centre + APIs |
| `WORKER_TRUST_CENTRE_ENABLED` | `false` | Worker gap report (also available when assurance flag is on) |

Client-supplied headers cannot enable these capabilities.

## Surfaces

- UI: `/admin/platform-assurance` (+ sources, scope, controls, workers)
- APIs: `/api/admin/platform-assurance/*`
- Domain: `lib/platform-assurance/`, `lib/worker-trust/gap-report.ts`

## Related docs

- [Wave 0 consolidation](./WAVE0_CONSOLIDATION.md)
- [NDIS digital platform scope](./NDIS_DIGITAL_PLATFORM_SCOPE.md)
- [Registration control matrix](./REGISTRATION_CONTROL_MATRIX.md)
- [Worker trust](./WORKER_TRUST.md)
