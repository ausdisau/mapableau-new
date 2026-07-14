# @mapable/mobile

Expo React Native client for MapAble CareOS (iOS + Android).

## Scripts

```bash
pnpm mobile:start
pnpm mobile:ios
pnpm mobile:android
pnpm mobile:type-check
pnpm mobile:test
pnpm mobile:lint
```

## Notes

- Tokens are stored in SecureStore only.
- Care and Transport confirmations are separate API calls.
- Worker/coordinator modes remain fail-closed behind feature flags.
- See `docs/mobile/` for architecture, release and pilot plans.
