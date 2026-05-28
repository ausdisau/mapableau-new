# Participant needs assessment

Agentic needs assessment aggregates privacy-scoped participant data, streams live progress, and recommends next steps—including worker search—with PRMS confirmation gates.

## Entry points

| Surface | Path |
|---------|------|
| Dedicated UI | `/participant-needs-assess?participantId={id}&q={optional query}` |
| Co-Pilot | Ask “assess my needs” on `/ask` with demo participant enabled |
| API | `POST /api/prms/participants/{id}/needs/assess/stream` |

Demo participant id: `participant-demo-001` (mock PRMS data).

## Stream stages

1. `received_query`
2. `loaded_profile`
3. `analysed_domains`
4. `identified_gaps`
5. `recommendations`
6. `finalized`

Terminal SSE event `result` includes `summary`, `snapshot`, `recommendations`, and `draftRecords` (type `NEEDS_ASSESSMENT_SUMMARY`).

## Privacy

- No raw NDIS numbers, admin notes, or incident narratives in the snapshot.
- Saving requires participant confirmation via the existing PRMS draft/confirm flow.

## Worker search bridge

`POST /api/search/workers/stream` accepts optional `participantId`. The server merges needs-derived filters (language, service type, region, wheelchair access) after access checks.

## Auth

`assertParticipantAccess` allows:

- The participant (`user.id` matches id)
- Demo participant id for previews
- Support coordinators, family members, and admins via `canViewParticipantProfile`
