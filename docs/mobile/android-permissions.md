# Android permissions (Capacitor shell)

The Capacitor Android app loads the live MapAble web app from Vercel. Native permissions are declared in [`android/app/src/main/AndroidManifest.xml`](../../android/app/src/main/AndroidManifest.xml) and requested at runtime via [`lib/capacitor/native-bridge.ts`](../../lib/capacitor/native-bridge.ts).

## Active permissions

| Capability | Android permission | Runtime trigger | Capacitor plugin |
| --- | --- | --- | --- |
| Network | `INTERNET`, `ACCESS_NETWORK_STATE` | App launch | — |
| Location (transport, driver trips, maps) | `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` | User starts location feature | `@capacitor/geolocation` |
| Camera / document upload | `CAMERA`, `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE` (API ≤32) | User attaches photo/document | `@capacitor/camera` |
| Push notifications | `POST_NOTIFICATIONS` | User signs in and accepts notification prompt | `@capacitor/push-notifications` + FCM |

## Runtime permission flow

1. Request permission only when the user triggers the feature (Play Store policy).
2. Show an in-app rationale before the system dialog (implemented in `native-bridge.ts`).
3. Degrade gracefully when denied (manual address entry, in-app notifications only, etc.).
4. Log consent in existing MapAble audit trails where applicable.

## Firebase / FCM setup

1. Create a Firebase project and add Android app `au.com.mapable.app`.
2. Download `google-services.json` to `android/app/google-services.json` (gitignored).
3. Create a Firebase service account and set Vercel env vars:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
4. Push tokens are stored via `POST /api/notifications/push/register` after the user accepts notifications.

## Play Store declarations

- **Data safety form**: precise location, photos/files, device identifiers (FCM token), account info.
- **Foreground service**: required only if continuous background driver location tracking is added.
- **Photo/video permissions**: justify camera use for document and incident evidence upload.

## App Links

Host Digital Asset Links at `https://www.mapable.com.au/.well-known/assetlinks.json` (served by Next.js). Set `ANDROID_RELEASE_SHA256_FINGERPRINTS` in production with the release keystore SHA-256 (comma-separated if multiple).

Get fingerprint:

```bash
keytool -list -v -keystore mapable-release.keystore -alias mapable
```
