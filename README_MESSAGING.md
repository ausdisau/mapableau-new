# MapAble Communication Centre

Postgres (via Prisma) is the **source of truth** for messages. Realtime (Supabase Broadcast or Socket.IO gateway) is used for live delivery, typing, read receipts, and presence only.

## Routes

| Route | Audience |
|-------|----------|
| `/messages` | Participants / general inbox |
| `/messages/[threadId]` | Thread view |
| `/messages/group/new` | Create group chat |
| `/provider/messages` | Provider organisation |
| `/worker/messages` | Support workers |
| `/driver/messages` | Drivers |
| `/support/messages` | Support desk (escalation tools) |

## API

- `GET /api/messages/inbox`
- `POST /api/messages/threads`
- `GET /api/messages/threads/[threadId]`
- `POST /api/messages/threads/[threadId]/messages` — persist then broadcast
- `POST /api/messages/threads/[threadId]/read`
- `POST /api/messages/threads/[threadId]/mute`
- `POST /api/messages/threads/[threadId]/participants`
- `POST /api/messages/threads/[threadId]/report`
- `POST /api/messages/threads/[threadId]/escalate/support-ticket`
- `POST /api/messages/threads/[threadId]/escalate/complaint`
- `POST /api/messages/threads/[threadId]/escalate/incident`
- `POST /api/messages/block-user`

## Realtime

- Default: in-memory adapter (dev/tests)
- `REALTIME_DRIVER=supabase` + Supabase env → broadcast adapter
- `REALTIME_DRIVER=socketio` + `apps/realtime-server` → Socket.IO gateway

Set `REALTIME_DRIVER` and run `pnpm --dir apps/realtime-server dev` for production-style sockets.

## Database

Migration: `prisma/migrations/20260525000000_communication_centre`

Tables: `conversation_threads`, `conversation_participants`, `communication_messages`, `message_receipts`, `message_attachments`, `message_reports`, `thread_mutes`, `blocked_chat_users`, `message_events`.

Legacy Phase 2 `Conversation` / `Message` models remain for backward compatibility.

## Security

- Role permissions (`message:read`, `message:send`)
- Consent checks for support coordinators messaging participants
- Document Vault permission on attachments
- Audit logging on sensitive thread types and escalations

## Accessibility

Three-panel desktop layout; single-panel mobile; keyboard-navigable inbox; labelled composer; `aria-live` for new messages and typing; skip link to latest message; status labels not colour-only.
