# Mobile architecture decision

## Decision

**Use Expo (React Native) + TypeScript + Expo Router + EAS Build** as the sole production mobile client for MapAble CareOS on iOS and Android.

## Context

- Repository is a pnpm/TypeScript/Next.js platform with Zod contracts and CareOS services already in TypeScript.
- `agent/careos-platform-completion` establishes a canonical mission schema.
- No maintained Flutter application exists.
- Capacitor Android branches wrap the website in a WebView — explicitly disallowed.

## Consequences

- Share Zod contracts, design tokens, feature flags, and validation schemas via workspace packages.
- Never import Prisma, server secrets, OpenAI keys, payment secrets, or private infrastructure into the mobile bundle.
- Domain execution remains on existing MapAble/CareOS APIs; mobile is a first-class client, optionally via thin BFF composition routes.
- Do not maintain Expo and Flutter in parallel.
