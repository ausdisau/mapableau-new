# MapAble CareOS mobile

Native Expo React Native client for Apple iPhone/iPad and Android phones/tablets.

## Stack

- Expo SDK 52 + React Native + TypeScript (strict)
- Expo Router
- EAS Build profiles: development, preview, production
- Shared packages under `packages/`
- Mobile BFF under `/api/v1/mobile/*`

## Commands

```bash
pnpm mobile:start
pnpm mobile:ios
pnpm mobile:android
pnpm mobile:test
pnpm mobile:lint
pnpm mobile:type-check
```

## Principles

Participants state goals and make consequential decisions. CareOS retrieves, compares, explains, drafts and coordinates. Existing MapAble services execute explicitly confirmed actions. Qualified humans make clinical, safeguarding, eligibility and payment decisions.

Not a WebView wrapper. Not a separate backend or auth system. Not a second source of truth.
