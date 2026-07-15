# Access Intelligence — Privacy and Consent

## Principles

1. Functional requirements only — no diagnosis as a requirement.
2. Data minimisation into agent tools (no userId leaked into passport tool payloads).
3. Field-level `shareWithVenue` and purpose-bound sharing.
4. Explicit approval before venue contact, barrier publish, or passport share.
5. Audit events record action, actor, purpose, fields, recipient, outcome.

## Sensitive writes

| Action | Approval surface |
|--------|------------------|
| Venue verification | Chat approval card + `/verification-requests` |
| Barrier report | Access Pulse approval + `/barrier-reports` |
| Passport share | Chat approval |

## Logging

Do not log passport contents, medical notes, full chats, or secrets. Prefer error codes.

## Production role gates

Venue Studio documents `venue_owner_or_admin` with demo bypass. Wire organisation membership before enabling live venue edits.
