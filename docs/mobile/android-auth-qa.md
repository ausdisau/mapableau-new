# Android auth QA checklist

Run on a **physical Android device** using a **signed release build** (`pnpm android:bundle` or Android Studio release APK).

Record results in the table below before Play Store submission.

## Environment (Vercel production)

| Variable | Expected value |
| --- | --- |
| `NEXTAUTH_URL` | `https://www.mapable.com.au` |
| `PASSKEY_ORIGIN` | `https://www.mapable.com.au` |
| `PASSKEY_RP_ID` | `mapable.com.au` |
| Google OAuth redirect | `https://www.mapable.com.au/api/auth/callback/google` |

## Test matrix

| Flow | Steps | Pass | Device / Android | Notes |
| --- | --- | --- | --- | --- |
| Email/password login | Open app → `/login` → sign in with test account | ☐ | | |
| Session persistence | Kill app → reopen → still signed in | ☐ | | |
| Google OAuth | Tap Google → complete consent → land on dashboard | ☐ | | |
| Forgot password email | Request reset → open link from email | ☐ | | Link may open Chrome until App Links verified |
| Password reset | Complete reset form → sign in with new password | ☐ | | |
| Passkey registration | Dashboard → Profile → Add passkey | ☐ | | Often fails in WebView; document fallback |
| Passkey sign-in | Log out → Login with passkey | ☐ | | |
| Logout | Sign out → protected routes redirect to login | ☐ | | |
| Push opt-in | Sign in → accept notification prompt → token registered | ☐ | | Requires `google-services.json` + Firebase env |
| Deep link (App Links) | Open `https://www.mapable.com.au/dashboard` from email/Notes | ☐ | | Requires verified assetlinks.json |

## Known limitations

- **Passkeys in WebView**: Android WebView WebAuthn support is inconsistent. If passkeys fail, ship v1 with email + Google OAuth only.
- **Email links**: Password reset links open in the app only after Digital Asset Links verification (release cert SHA-256 in Vercel env).
- **OAuth in WebView**: Ensure Google Cloud Console authorized redirect URIs match `www.mapable.com.au` exactly.

## Sign-off

| Role | Name | Date |
| --- | --- | --- |
| QA | | |
| Product | | |
| Engineering | | |
