# Care shift creator (streaming)

Provider admins can plan care shifts through a chat-style UI that streams **planning progress** (not LLM token output). Nothing is written to the database until the user confirms assignment.

## Flow

1. User sends a natural-language message on `/provider/care/shift-creator`.
2. `POST /api/care/shifts/create/stream` runs `runShiftCreatorStream` and returns SSE events.
3. The UI shows a timeline of stages and a shift draft card.
4. User confirms → `POST /api/care/bookings/[id]/assign-worker` (existing path) creates/updates `CareShift` via `assignWorkerToCareBooking`.

## API

**Endpoint:** `POST /api/care/shifts/create/stream`  
**Auth:** `care:manage:org`  
**Body:**

```json
{
  "query": "Assign Sam to medical appointment Tuesday 9am to 1pm",
  "careBookingId": "optional-booking-id"
}
```

**SSE events:**

| Event | Payload |
|-------|---------|
| `progress` | `{ stage, message, payload? }` |
| `result` | `ShiftCreatorStreamResult` |
| `error` | `{ error: string }` |

### Stages

- `received_query`
- `resolved_booking`
- `parsed_shift_details`
- `matched_worker`
- `checked_eligibility`
- `draft_ready`
- `finalized`

## Example queries

- `Assign Demo Worker One to the medical appointment booking Tuesday 9am to 1pm at Demo Medical Centre`
- `Schedule a care shift tomorrow 2pm for seed-care-booking-mvp`
- Open from a booking page with `?careBookingId=...&q=...` pre-filled

## Co-Pilot

Intent `shift_creator` matches phrases like “schedule a care shift”. Co-Pilot returns a link to `/provider/care/shift-creator` (`shiftCreatorUrl` on `/api/mapable/ask`).

## Code map

| Area | Path |
|------|------|
| Types | `lib/care/shift-creator/types.ts` |
| Parser | `lib/care/shift-creator/parse-shift-query.ts` |
| Stream service | `lib/care/shift-creator/shift-creator-stream-service.ts` |
| API route | `app/api/care/shifts/create/stream/route.ts` |
| UI | `components/care/shift-creator/*` |
| Page | `app/provider/care/shift-creator/page.tsx` |

## Tests

- `tests/shift-creator-stream-service.test.ts`
- `tests/shift-creator-stream-route.test.ts`
- `tests/copilot-intent.test.ts` (shift_creator classification)
