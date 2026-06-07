# NDIA sandbox validation (Tier 3)

Validate OAuth submit and status poll against NDIA sandbox **after** partner onboarding.

## Environment (sandbox only)

```env
NDIS_CLAIM_SUBMISSION_ENABLED=true
NDIA_READINESS_ENABLED=true
NDIA_PILOT_ENABLED=true
NDIA_PROVIDER_ADAPTER_MODE=http
NDIA_REAL_SUBMISSION_ENABLED=true
NDIA_PROVIDER_API_BASE_URL=https://<sandbox-host>
NDIA_PROVIDER_TOKEN_URL=https://<sandbox-token>/oauth/token
NDIA_PROVIDER_API_CLIENT_ID=<sandbox-client-id>
NDIA_PROVIDER_API_CLIENT_SECRET=<sandbox-secret>
NDIA_CLAIM_STATUS_POLL_ENABLED=true
NDIA_PARTICIPANT_API_ENABLED=false
NDIA_PROVIDER_REQUIRE_HUMAN_APPROVAL=true
```

## Pre-flight

1. Run `pnpm check:integrations-env` with sandbox flags.
2. Confirm admin integrations health (`ndia` adapter token probe).
3. Confirm governance approval on file ([ndia-pilot-approval.md](./ndia-pilot-approval.md)).
4. Map OpenAPI field names via `NDIA_PAYLOAD_FORMAT`, `NDIA_RESPONSE_*` if sandbox responses differ.

## Verification sequence

1. Provider UI: dry-run → submit one test claim → refresh status.
2. Batch path: export agency-managed batch with live adapter (not portal CSV).
3. Review audit logs on `NdiaProviderClaimAudit`.
4. Run unit tests: `pnpm test tests/ndia-provider-claiming.test.ts tests/ndis-direct-claiming.test.ts tests/ndia-governance.test.ts`

## Exit criteria

- Sandbox submit + status poll succeed
- Structured errors (`NdiaApiError`) handled in UI
- No production credentials in preview/dev environments
