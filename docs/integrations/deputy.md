# Deputy adapter (MapAble)

**Status:** Feature-flagged (`DEPUTY_ENABLED=false`). Draft unpublished rosters only. No auto-publish, no auto payroll approval as billing acceptance.

## OAuth

- Authorise: `GET /api/integrations/deputy/oauth/start?organisationId=…`
- Callback: `GET /api/integrations/deputy/oauth/callback`
- Tokens stored encrypted on `BillingIntegrationConnection` (`provider=deputy`)
- Refresh rotates the refresh token (Deputy invalidates the previous one)

## Hostname policy

Only `{install}.{au|eu|uk|us}.deputy.com` is accepted. User-supplied API hosts are rejected (SSRF).

## Draft roster

`POST /api/v1/supervise/roster` with:

- `blnPublish: false`
- `blnForceOverwrite: 0`
- Mapped `intRosterEmployee` + `intOpunitId` only (no silent employee create)

Empty HTTP 200 → `needs_review` reconcile; never invent a roster ID.

## Timesheets / webhooks

Approved Deputy timesheets are **hints**. MapAble billing and participant acceptance remain separate human-reviewed steps.

Unsigned webhooks (default `DEPUTY_WEBHOOK_VERIFICATION_MODE=disabled`) never mutate SoT; they record reconciliation + authenticated refetch.

## Owner actions required for pilot

1. Deputy trial install + OAuth client at once.deputy.com
2. Authorised Employee ID ↔ `workerProfileId` mappings
3. Operational area (opunit) mapping per organisation
4. Sandbox create + mapping persistence + recovery test evidence
