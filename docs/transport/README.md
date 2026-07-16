# MapAble Transport

Accessibility-first transport module on Next.js + Prisma.

## Quick links

- [Product requirements](./PRODUCT_REQUIREMENTS.md)
- [Current state audit](./CURRENT_STATE_AUDIT.md)
- [Architecture decisions](./ARCHITECTURE_DECISIONS.md)
- [Implementation checklist](./IMPLEMENTATION_CHECKLIST.md)
- [API](./API.md)
- [Operations](./OPERATIONS.md)
- [Security and privacy](./SECURITY_AND_PRIVACY.md)
- [Release readiness](./RELEASE_READINESS.md)

## Source of truth

`TransportTrip` (+ request, assignment, events). `TransportBooking` is legacy.

## Verification

```bash
pnpm type-check
pnpm test
pnpm build
```

## Feature claims

`GET /api/transport/features` — server-authoritative capability registry. Public `/transport` reads from it.
