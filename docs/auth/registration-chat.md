# Registration chat

Streaming guided registration on `/register` collects name, email, and password through a chat dialogue instead of a static form.

## Flow

1. User opens `/register` or `/register?inviteToken=...` for worker invites.
2. OAuth buttons remain available above the chat (invite acceptance via OAuth is not supported).
3. The chat auto-starts with a welcome turn via `POST /api/registration/chat`.
4. Slots are collected in order: **Name** → **Email** → **Password** (email may be locked for worker invites).
5. When complete, **Create account** calls `POST /api/register`, then credentials `signIn`, then redirects to `/dashboard` or `/worker/onboarding`.

## Streaming protocol

The chat route returns an AI SDK UI message stream with this part order:

1. `data-registrationAgent` — session id, turn index, clarification slot, filled slots, invite context
2. `data-registrationState` — collected name/email and `passwordCollected` flag (password value is never streamed)
3. Text deltas — assistant reply

### `data-registrationAgent`

| Field | Purpose |
|-------|---------|
| `sessionId` | Multi-turn session key (`sessionStorage`) |
| `turnIndex` | Monotonic turn counter |
| `status` | `needs_clarification`, `complete`, or `error` |
| `clarificationSlot` | `name`, `email`, or `password` |
| `filledSlots` | Progress checklist |
| `inviteContext` | Organisation name and masked email for worker invites |

### Slot → session mapping

| Slot | Session field | Input surface |
|------|---------------|---------------|
| `name` | `name` | Chat composer |
| `email` | `email` | Chat composer (skipped when invite locks email) |
| `password` | `password` | Masked password widget (not shown in chat bubbles) |

## Worker invites

When `inviteToken` is present:

- `RegisterClient` prefetches invite metadata from `GET /api/worker-invites/:token`.
- The chat route loads the invite and locks email to the invited address.
- Registration still uses `POST /api/register` with `inviteToken` for combined signup + invite acceptance.

## Client components

| Component | Role |
|-----------|------|
| `components/registration/RegistrationChatDialogue.tsx` | `useChat` + `DefaultChatTransport` |
| `RegistrationMessageList.tsx` | Streaming bubbles; hides sentinel user messages |
| `RegistrationSlotProgress.tsx` | Name / Email / Password checklist |
| `RegistrationPasswordInput.tsx` | Masked password field |

## Chat stream vs account creation

| Endpoint | Use |
|----------|-----|
| `POST /api/registration/chat` | Collect and validate fields across turns |
| `POST /api/register` | Create user, roles, participant profile or worker invite acceptance |

## Verification

```bash
npm test -- registration-chat
npm test -- registration-turn
```
