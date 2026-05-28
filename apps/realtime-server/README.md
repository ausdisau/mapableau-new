# MapAble Realtime Server

WebSocket message streaming service (Socket.IO) for room-scoped chat, typing, presence, and delivery acks.

## Run

```bash
cd apps/realtime-server
pnpm install
pnpm dev
```

Default port: `4010` (`PORT` env). Health: `GET http://localhost:4010/health`

## Authentication

Pass a token in the Socket.IO handshake:

```ts
io(url, { auth: { token: "<token>" } });
```

| Mode | Env | Token format |
| ---- | --- | ------------ |
| Dev | `SOCKET_ALLOW_DEV_TOKEN=true` | `mapable.dev:<userId>` |
| Signed | `SOCKET_AUTH_SECRET=<secret>` | `<userId>.<hmac>` (use `createSocketAuthToken(userId)` in tests) |
| Legacy local | neither | plain user id string (>10 chars, alphanumeric) |

## Room naming

Allowed prefixes: `user:`, `thread:`, `provider:`, `booking:`, `support-ticket:`, `quality:`

- `user:<id>` — only that user may join
- `thread:<id>` — any authenticated client (v1)

## Client events

| Emit | Payload | Description |
| ---- | ------- | ----------- |
| `room:join` / `join` | `room: string` | Join a room |
| `room:leave` / `leave` | `room: string` | Leave a room |
| `message:publish` | `{ room, body, metadata? }` | Publish to room |
| `message:ack` | `{ messageId, room? }` | Acknowledge delivery |
| `typing` | `{ room, isTyping? }` | Typing indicator |
| `presence` | `{ room, status }` | `online` \| `offline` \| `away` |

## Server events

| Event | Description |
| ----- | ----------- |
| `room:joined` | Join succeeded |
| `room:left` | Leave succeeded |
| `message:new` | New message in room |
| `message:acked` | Ack recorded |
| `typing` | Someone is typing |
| `presence` | Presence update |
| `stream:error` | `{ code, message }` validation/auth errors |

## Environment

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `PORT` | `4010` | HTTP + WebSocket port |
| `SOCKETIO_CORS_ORIGIN` | `*` | CORS origin for Socket.IO |
| `SOCKET_AUTH_SECRET` | — | HMAC signing secret |
| `SOCKET_ALLOW_DEV_TOKEN` | — | Allow `mapable.dev:<userId>` tokens |

## Tests

```bash
pnpm test
```
