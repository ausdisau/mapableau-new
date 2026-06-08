# Android permissions (Capacitor shell)

The Capacitor Android app loads the live MapAble web app from Vercel. Native permissions are declared in `android/app/src/main/AndroidManifest.xml` and activated when matching Capacitor plugins are added.

## Planned permissions

| Capability | Android permission | When to enable | Capacitor plugin |
| --- | --- | --- | --- |
| Location (transport, driver trips, accessible places) | `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` | User starts trip tracking, map "find my location", or place check-in | `@capacitor/geolocation` |
| Camera / document upload | `CAMERA`, `READ_MEDIA_IMAGES` (API 33+), `READ_EXTERNAL_STORAGE` (API ≤32) | Incident evidence, profile documents, care notes with attachments | `@capacitor/camera`, `@capacitor/filesystem` |
| Push notifications | `POST_NOTIFICATIONS` (API 33+), `RECEIVE_BOOT_COMPLETED` (optional, for rescheduling) | Shift reminders, trip updates, safety alerts | `@capacitor/push-notifications` + FCM |

## Runtime permission flow

1. Request permission only when the user triggers the feature (Play Store policy).
2. Provide an in-app rationale before the system dialog (required for sensitive permissions).
3. Degrade gracefully when denied (e.g. manual address entry instead of GPS).
4. Log consent in existing MapAble audit trails where applicable.

## Play Store declarations

- **Data safety form**: location, photos/files, device identifiers (FCM token).
- **Foreground service**: required if continuous driver location tracking is added later.
- **Photo/video permissions**: justify camera use for document and incident evidence upload.

## Next plugin install (when ready)

```bash
pnpm add -w @capacitor/geolocation @capacitor/camera @capacitor/push-notifications
npx cap sync android
```

Then uncomment the matching `<uses-permission>` entries in `AndroidManifest.xml`.
