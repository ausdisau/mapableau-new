# MapAble Stripe MCP

Model Context Protocol server for **Stripe billing** in MapAble Core. Connects Cursor (and other MCP hosts) to billing governance, funding checkout rules, configuration status, metadata previews, read-only Stripe lookups, and MapAble billing API reference — without creating payments autonomously.

## Install in Cursor

Project config is committed at `.cursor/mcp.json`. After pulling:

1. Open **Settings → Features → Model Context Protocol** and confirm `mapable-stripe` is enabled.
2. Ensure `.env` includes `STRIPE_SECRET_KEY` (and optional webhook/Connect/price IDs). Loaded via `envFile`.
3. Restart MCP or reload the window if tools do not appear.

## Run manually

```bash
pnpm mcp:stripe
# or
npx tsx mcp/stripe/server.ts
```

The server uses **stdio** transport only.

## Tools

| Tool | Purpose |
|------|---------|
| `stripe_get_billing_framework` | Governance, payment flows, PCI notes |
| `stripe_get_configuration_status` | Env readiness (no secret values) |
| `stripe_check_funding_checkout` | Whether a funding type may use Stripe Checkout |
| `stripe_build_checkout_metadata` | Preview billing-core or legacy metadata keys |
| `stripe_get_customer` | Read-only Stripe Customer retrieve |
| `stripe_get_checkout_session` | Read-only Checkout Session retrieve |
| `stripe_get_payment_intent` | Read-only PaymentIntent retrieve |
| `stripe_mapable_billing_api_reference` | Billing REST paths and UI entry points |

## Library

Shared logic lives in `lib/stripe/mcp-reference.ts` (also backed by `lib/stripe/` and `lib/billing-core/funding-logic.ts`).

## Governance

- **No** autonomous Checkout, refunds, Connect account creation, or subscription changes via MCP.
- **Plan-managed NDIS** funding must use export flows, not card checkout.
- Webhooks (`checkout.session.completed`, etc.) are the payment source of truth — not redirect URLs.
- Aligns with [billing](billing.md) and MapAble PCI rules (Stripe-hosted Checkout only).

## Environment

| Variable | Used for |
|----------|----------|
| `STRIPE_SECRET_KEY` | SDK availability and read-only Stripe API tools |
| `STRIPE_WEBHOOK_SECRET` | Reported in configuration status (webhooks run via app routes) |
| `STRIPE_PROVIDER_PRO_PRICE_ID` / `STRIPE_EMPLOYER_PRO_PRICE_ID` | Subscription price configuration status |
| `BILLING_ENABLE_STRIPE` / `STRIPE_ENABLED` | Legacy route gate (see `lib/stripe/config.ts`) |
| `MAPABLE_BASE_URL` / `NEXT_PUBLIC_APP_URL` | API reference tool base URL |

## Related

- Official Stripe plugin MCP (Cursor marketplace) — separate from this project-local server.
- AV MCP: [docs/av-mcp.md](av-mcp.md)
