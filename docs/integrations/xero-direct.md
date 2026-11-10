# Direct Xero adapter (MapAble)

**Status:** Opt-in via `XERO_DIRECT_ENABLED=false`. Legacy placeholders remain when disabled. Never auto-authorise/send invoices.

## OAuth

- Multi-tenant authorisation code flow (not silent client-credentials)
- Custom Connection is optional and owner-selected only
- Start: `GET /api/integrations/xero/oauth/start?organisationId=…`
- Callback: `GET /api/integrations/xero/oauth/callback`
- Tenant selection required when multiple organisations are linked

## Required per-org config (`BillingIntegrationConnection.configJson`)

- `accountCode` (sales)
- `taxType`
- `contactId` (liable party)
- optional `itemCode`, `currency` (default AUD)

Do not invent chart-of-accounts, tax, or contact values.

## Draft invoices

Creates `Type: ACCREC`, `Status: DRAFT` only after evidence/billing review gates in callers.
Duplicate exports blocked by `IntegrationExternalMapping` + idempotency key.

## Webhooks

HMAC-SHA256 `x-xero-signature` with `XERO_WEBHOOK_KEY`. Invalid signatures rejected.
Payloads enqueue reconciliation; authoritative invoice state is refetched.

## Owner actions for pilot

1. Xero app + Demo Company (or sandbox org)
2. OAuth callback URL ownership
3. Chart of accounts / tax / contact decisions per MapAble organisation
4. Sandbox draft create + mapping + recovery evidence
