# Security boundaries

**Claim state: PROPOSED / IN DEVELOPMENT**

## Participant authority (IMPLEMENTED)

Vendor permission alone never authorises an action. MapAble evaluates participant autonomy ceiling, confirmation tokens, purpose-bound delegation windows, privacy zones, and refusal.

## Confirmation (IMPLEMENTED)

Confirmation tokens expire (`CONFIRMATION_TTL_MS`). Refusal is sticky for that token.

## Real devices (NOT SUPPORTED)

`MAPABLE_HOME_ENV_REAL_DEVICE_ACTIONS_ENABLED` must remain false. Broker hard-denies non-simulator execute.

## API surface (IMPLEMENTED)

`/api/home/*` is fail-closed on flags, requires session auth, validates with Zod, and writes audit events on propose/confirm/environment reads. No vendor OAuth credentials in request bodies.

## AI (NOT SUPPORTED)

No LLM → device execution path. Any future AI may only emit typed proposals.
