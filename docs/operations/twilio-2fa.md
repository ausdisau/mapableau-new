# Twilio Verify 2FA

MapAble can require SMS verification after a successful email/password check.
OAuth providers continue to use their own upstream security controls.

## Enable in Vercel

Set these variables in the Vercel project environment:

| Variable                    | Description                                                    |
| --------------------------- | -------------------------------------------------------------- |
| `TWILIO_2FA_ENABLED`        | Set to `true` to require SMS 2FA for email/password sign-in.   |
| `TWILIO_ACCOUNT_SID`        | Twilio Account SID.                                            |
| `TWILIO_AUTH_TOKEN`         | Twilio Auth Token or API credential secret with Verify access. |
| `TWILIO_VERIFY_SERVICE_SID` | Verify Service SID (`VA...`).                                  |

Redeploy after changing environment variables.

Validate configuration locally:

```bash
npx tsx scripts/check-integrations-env.ts
```

## Twilio Console setup

1. Create a [Verify Service](https://console.twilio.com/us1/develop/verify/services) in the Twilio Console.
2. Copy the Service SID (`VA…`) into `TWILIO_VERIFY_SERVICE_SID`.
3. Use your Account SID and Auth Token from the Twilio dashboard.

For production SMS in Australia, complete Twilio regulatory and sender requirements for your account.

## User requirements

When 2FA is enabled:

- **Registration** collects a mobile number and verifies it before the first sign-in.
- **Existing users** must save a phone number under **Dashboard → Security settings** (`/dashboard/settings/security`).
- Phone numbers are stored on `User.phone` in E.164 format (e.g. `+61412345678`).

If a user without a valid phone tries to sign in with email and password, login shows a message with a link to security settings.

## Flow

1. User submits email and password.
2. Server validates the password.
3. Server sends a Twilio Verify SMS to the saved phone number.
4. User submits the code.
5. Server checks the code with Twilio and issues a short-lived internal sign-in token for NextAuth credentials sign-in.

## API routes

| Route | Purpose |
| ----- | ------- |
| `POST /api/auth/twilio-2fa/start` | Validate password and send SMS |
| `POST /api/auth/twilio-2fa/verify` | Check code and return credentials token |
| `GET /api/auth/twilio-2fa/status` | Whether 2FA is enabled in this environment |
| `PATCH /api/me` | Update `phone` (normalized to E.164) |

## Related code

- `lib/auth/twilio-verify.ts` — Twilio Verify REST client
- `lib/auth/two-factor-token.ts` — Signed challenge and session tokens
- `lib/auth/credential-two-factor-client.ts` — Browser sign-in orchestration
- `app/login/LoginClient.tsx` — Login + SMS code step
- `app/register/RegisterClient.tsx` — Registration + optional SMS verification
