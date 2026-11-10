# `@mapable/firebase`

Shared Firebase client bootstrap for **web** (`apps/web`, `apps/adid`) and **mobile** (`apps/mobile` Expo).

## Usage

```ts
import { getFirebaseApp, getFirebaseAnalytics } from "@mapable/firebase";

const app = getFirebaseApp();
const analytics = await getFirebaseAnalytics(app); // null on native / SSR
```

## Config

Copy `.env.example` values into:

- `apps/adid/.env.local` — `NEXT_PUBLIC_FIREBASE_*`
- `apps/mobile/.env` — `EXPO_PUBLIC_FIREBASE_*`

## Boundaries

- This package initialises the **client** Firebase app + optional Analytics.
- **AD.iD authentication remains Clerk.** Do not add Firebase Auth as a second identity issuer for AD.iD without a separate review.
- Never commit Admin SDK / service-account private keys.
