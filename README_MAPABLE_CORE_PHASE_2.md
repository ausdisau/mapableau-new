# MapAble Core — Phase 2

Phase 2 adds the operational layer on top of Phase 1: secure messaging, support tickets, documents, funding sources, invoice drafts, billing preflight, Stripe/Xero placeholders, provider booking acceptance, booking timelines, and admin operations views.

## Run

```bash
pnpm install
npx prisma migrate deploy
npx prisma db seed
pnpm dev
```

## New routes

| Area | Routes |
|------|--------|
| Messages | `/dashboard/messages`, `/provider/messages`, `/admin/messages` |
| Support | `/dashboard/support`, `/admin/support`, `/provider/support` |
| Documents | `/dashboard/documents`, `/admin/documents`, `/provider/documents` |
| Funding | `/dashboard/funding` |
| Invoices | `/dashboard/invoices`, `/admin/invoices`, `/provider/invoices` |
| Provider bookings | `/provider/bookings` |
| Admin ops | `/admin/operations` |

## Environment

See `.env.example`. Stripe and Xero are disabled unless explicitly configured.

## Limitations

- Local document storage only (`.data/documents`)
- Stripe/Xero are placeholders, not production integrations
- No NDIS API, budget checks, or live dispatch
- Virus scanning status is `not_configured` only

## Phase 3

Care/transport module depth, worker profiles, vehicles, calendar, and cross-module orchestration.
