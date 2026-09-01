# MapAble Native Android (`apps/android`)

Package ID: `au.com.mapable.app`

Thin client over MapAble Core. Google Play Services sit behind MapAble-owned interfaces in `core:googleplay`. Access uses **MapLibre + OpenStreetMap** — not Google Maps.

## Prerequisites

- JDK 17+
- Android SDK 35 (`ANDROID_HOME`)
- See [Development Ledger](../../docs/architecture/mapable-android-development-ledger.md)

## Build

```bash
cd apps/android
./gradlew :app:assembleDebug
./gradlew :core:common:test :core:notifications:test
```

## Server flags (fail-closed)

```bash
MAPABLE_MOBILE_API_ENABLED=false
MAPABLE_MOBILE_AUTH_EXCHANGE_ENABLED=false
MAPABLE_MOBILE_PUSH_ENABLED=false
MAPABLE_MOBILE_INTEGRITY_ENABLED=false
MAPABLE_MOBILE_FUSED_LOCATION_ENABLED=false
MAPABLE_MOBILE_TOKEN_SECRET=   # or fall back to NEXTAUTH_SECRET
```

## App Links

`public/.well-known/assetlinks.json` — replace SHA-256 fingerprints before Play release (owner).

## Modules

See ledger Phase 02–29. Expo apps under `apps/independence` and `apps/companion` remain; this is the native production path scaffold.
