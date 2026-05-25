# Notifications (in-app, email, SMS, web push)

MapAble delivers notifications through several channels. All channels respect per-user preferences in **Settings → Notifications** (`NotificationPreference`).

## Channels

| Channel | Provider | When it sends |
| ------- | -------- | ------------- |
| `in_app` | Postgres `Notification` rows | Always available when enabled |
| `email` | [AgentMail](https://www.agentmail.to/docs) | `AGENTMAIL_API_KEY` + `AGENTMAIL_INBOX_ID` |
| `sms` | [Twilio Messaging](https://www.twilio.com/docs/messaging) | `TWILIO_*` vars (opt-in default **off**) |
| `push` | [Pusher Beams](https://pusher.com/docs/beams) | `PUSHER_BEAMS_*` vars (opt-in default **off**) |

Set `NOTIFICATION_DISPATCH_ENABLED=false` to disable all external channels (in-app still works).

## AgentMail (email)

```env
AGENTMAIL_API_KEY=
AGENTMAIL_INBOX_ID=
# optional
AGENTMAIL_FROM_NAME=MapAble
```

Sends via `POST https://api.agentmail.to/v0/inboxes/{inbox_id}/messages/send`.

## Twilio (SMS)

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_SMS_FROM=+61...          # or use a Messaging Service:
TWILIO_MESSAGING_SERVICE_SID=
```

Australian numbers are normalised to E.164 (`+61…`). Enable SMS per category in notification settings.

## Pusher Beams (browser push)

### Service worker

`public/service-worker.js` must be served at `/service-worker.js`:

```js
importScripts("https://js.pusher.com/beams/service-worker.js");
```

### Environment

```env
PUSHER_BEAMS_INSTANCE_ID=          # server publish
PUSHER_BEAMS_SECRET_KEY=           # server only — never expose to client
NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID=  # same instance id for web SDK
```

### Client registration

Logged-in dashboard users run `BeamsPushRegistration`, which:

1. Registers `/service-worker.js`
2. Starts `@pusher/push-notifications-web`
3. Subscribes to interest `mapable-user-{userId}`

### Server publish

When `push` is enabled for a category, `notifyUser` publishes to that interest with title, body, and `deep_link` to the relevant MapAble path.

## Code entry points

- `lib/notifications/notification-service.ts` — `notifyUser`, `ensureDefaultPreferences`
- `lib/notifications/notification-dispatcher.ts` — email / SMS / push dispatch
- `lib/messages/message-notification-service.ts` — new message alerts (support category)

## Tests

```bash
pnpm exec vitest run tests/notification-dispatch.test.ts
```
