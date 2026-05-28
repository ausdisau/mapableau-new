# SERVICE AGREEMENTS

Service agreements now follow a full auditable lifecycle backed by API routes,
state guards, revision history, and compliance gating.

## Lifecycle statuses

| Status | Meaning | Typical transition |
| --- | --- | --- |
| `draft` | Agreement authored but not yet sent | `send-for-review` |
| `sent_for_review` | Shared with participant/provider for review | `revisions`, `sign` |
| `participant_review` | Negotiation updates pending confirmation | `revisions`, `sign` |
| `signed` | Both participant + provider signatures captured | `activate` |
| `active` | Fully active agreement | `expired`, `cancelled` |
| `expired` | End date reached or manually expired | terminal |
| `cancelled` | Agreement cancelled | terminal |

## API endpoints

- `GET /api/service-agreements`
- `POST /api/service-agreements`
- `POST /api/service-agreements/[agreementId]/send-for-review`
- `POST /api/service-agreements/[agreementId]/sign`
- `POST /api/service-agreements/[agreementId]/activate`
- `POST /api/service-agreements/[agreementId]/cancel`
- `GET /api/service-agreements/[agreementId]/revisions`
- `POST /api/service-agreements/[agreementId]/revisions`
- `POST /api/service-agreements/expire-due` (admin or cron token)

## Failure modes

- Activation blocked by smart-contract compliance gate:
  - response `422` with `details.result` and findings payload.
- Invalid transition (e.g. activate before signatures, sign cancelled agreement):
  - response `400`.
- Missing agreement:
  - response `404`.

See also: `README_SMART_CONTRACT_RUNNER.md`.

