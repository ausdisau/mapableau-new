# AdMob (Capacitor native app)

MapAble uses [`@capacitor-community/admob`](https://github.com/capacitor-community/admob) for native banner ads in the Android shell (and iOS when added).

## Setup

1. Create an app in [Google AdMob](https://admob.google.com/) with package `au.com.mapable.app`.
2. Create a **banner** ad unit for Android.
3. Set the AdMob **app ID** in `android/app/src/main/res/values/strings.xml`:

```xml
<string name="admob_app_id">ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy</string>
```

4. Set banner unit ID in Vercel / `.env`:

```bash
NEXT_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID=ca-app-pub-xxxxxxxx/zzzzzzzzzz
NEXT_PUBLIC_ADMOB_TESTING=false   # use true with Google test IDs during development
```

## Behaviour

- Initializes AdMob and UMP consent on native app launch
- Shows an adaptive banner at the bottom on public routes
- Hides ads on sensitive routes (login, dashboard, admin, billing, etc.) — see `lib/ads/ad-page-eligibility.ts`
- Disabled when `NEXT_PUBLIC_ADMOB_ENABLED=false`

## Test ads

Google provides sample IDs (already in `strings.xml` for development):

| Item | Test ID |
| --- | --- |
| App ID | `ca-app-pub-3940256099942544~3347511713` |
| Banner | `ca-app-pub-3940256099942544/6300978111` |

Set `NEXT_PUBLIC_ADMOB_TESTING=true` to use the test banner unit automatically.

## Web vs native

- **Web (Vercel):** Google AdSense skyscrapers — see AdSense env vars (separate PR)
- **Native (Capacitor):** AdMob banners via this plugin
