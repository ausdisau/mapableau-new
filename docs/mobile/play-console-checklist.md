# Google Play Console checklist (MapAble Android)

Use this checklist when submitting `au.com.mapable.app` to Google Play. Operational steps are completed in [Google Play Console](https://play.google.com/console).

## App identity

| Item | Value |
| --- | --- |
| Package name | `au.com.mapable.app` |
| App name | MapAble |
| Privacy policy URL | `https://mapable.com.au/privacy` |
| Support email | `support@mapable.com.au` |
| Category | Health & Fitness or Medical (confirm with product) |

## Store listing assets

- [ ] Short description (80 chars max)
- [ ] Full description (4000 chars max)
- [ ] Phone screenshots (min 2, 16:9 or 9:16)
- [ ] 512×512 hi-res icon (from `assets/icon-only.png`)
- [ ] Feature graphic 1024×500 (optional but recommended)

## Data safety form

Declare data collected/processed:

| Data type | Collected | Shared | Purpose |
| --- | --- | --- | --- |
| Email, name, account info | Yes | No | Authentication, service delivery |
| Precise location | Yes (optional) | No | Transport, accessible places |
| Photos / files | Yes (optional) | No | Documents, incident evidence |
| Device or other IDs | Yes | No | FCM push token |
| App interactions | Yes | No | In-app notifications, audit |

- [ ] Data encrypted in transit (HTTPS)
- [ ] Users can request data deletion (document process)
- [ ] Privacy policy link verified live

## Content rating

- [ ] Complete IARC questionnaire in Play Console
- [ ] Note user-generated content (messages, reviews) if applicable
- [ ] Note health/disability support context for accurate rating

## Technical compliance

| Requirement | Status |
| --- | --- |
| Target API 34+ | Met (`targetSdkVersion 36`) |
| 64-bit support | Met (Capacitor default) |
| App signing by Google Play | Enable Play App Signing on first upload |
| Release AAB | `./android/gradlew -p android bundleRelease` |

## Pre-upload verification

- [ ] Signed release AAB built with production keystore
- [ ] `google-services.json` present for push-enabled builds
- [ ] `ANDROID_RELEASE_SHA256_FINGERPRINTS` set on Vercel
- [ ] Auth QA checklist signed off ([android-auth-qa.md](./android-auth-qa.md))
- [ ] Admin release checklist at `/admin/app-store-release` shows ready

## Upload

1. **Internal testing** — upload AAB, add team emails
2. Review pre-launch report (crashes, policy warnings)
3. Fix blockers before closed testing
