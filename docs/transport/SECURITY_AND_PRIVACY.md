# MapAble Transport — Security and Privacy

## Exact location protection

- Pre-assignment responses expose suburb/masked labels only (`transport-response`, access policy).
- Exact address/coordinates use AES-256-GCM via `lib/transport/transport-location-crypto.ts` when `TransportLocation` records are used.
- Key material comes from `TRANSPORT_LOCATION_ENCRYPTION_KEY` or `NEXTAUTH_SECRET` (dev fallback only). Never commit keys.
- Exact-location reads must be authorised and audited through data-access logs.

## Role boundaries

| Actor | Exact address | NDIS/funding | Evidence |
| --- | --- | --- | --- |
| Participant | Own trips | Own funding context labels | Own permitted evidence |
| Unassigned operator | Masked only | No | No |
| Accepted operator staff | After acceptance | Limited operational | Operational logs |
| Assigned driver | Within trip time window | No | Checklist/logs |
| Admin | Audited, reason-coded | Audited | Audited |

## Retention (baseline)

| Data | Retention approach |
| --- | --- |
| Exact locations | Trip window + configured retainUntil; then delete/de-identify |
| Driver heartbeat / live location | Active consented window only |
| Evidence (default logs/checklists) | Legal/NDIS/financial retention; no routine hard-delete of incidents |
| Quotes | Keep versioned amounts indefinitely for audit |
| Incidents / complaints | Immutable chronology; archive, do not silent-delete |
| Offline driver queue (client) | Local only; expire exact location cache at trip end |

## Logging and notifications

- Do not log diagnoses, full access profiles, exact addresses, or unrestricted coordinates.
- Notification/webhook payloads use masked locations.
- Trip event metadata is filtered against address/coordinate/NDIS/diagnosis keys.

## Emergency boundary

MapAble is not an emergency service. Immediate danger → call **000**.
