# Android rollout checklist

Staged rollout plan for MapAble Android (`au.com.mapable.app`).

## Phase 1 — Internal testing

- [ ] Upload signed AAB to Play Console **Internal testing** track
- [ ] Invite engineering + product (5–20 testers)
- [ ] Verify install from Play Store link (not sideload)
- [ ] Run [android-auth-qa.md](./android-auth-qa.md) on at least 2 physical devices
- [ ] Monitor Android vitals: crashes, ANRs
- [ ] Confirm push notifications deliver for opted-in users

**Exit criteria:** Zero P0 bugs; auth flows pass; crash-free sessions > 99%

## Phase 2 — Closed beta

- [ ] Promote build to **Closed testing** track
- [ ] Add pilot participants, providers, and field workers (50–200 testers)
- [ ] Collect feedback via existing support channels
- [ ] Monitor transport location and camera permission denial rates
- [ ] Validate deep links (password reset, dashboard URLs) open in app

**Exit criteria:** No critical regressions vs web; support ticket volume acceptable

## Phase 3 — Production staged rollout

- [ ] Promote to **Production** with staged rollout:
  1. 10% — 48 hours
  2. 50% — 48 hours (if stable)
  3. 100%
- [ ] Watch crash-free rate against admin checklist (`crash_free` in app store release dashboard)
- [ ] Monitor FCM delivery failures in server logs
- [ ] Pause rollout if crash rate exceeds threshold or auth outage

## Rollback

- Halt staged rollout in Play Console
- Ship hotfix AAB with incremented `versionCode` in [`android/app/build.gradle`](../../android/app/build.gradle)
- Communicate via status page / in-app banner if auth or push is affected

## Post-launch

- [ ] Update store listing with real user screenshots
- [ ] Review Play Console **Policy status** weekly for first month
- [ ] Plan v1.1: passkey Custom Tabs fallback, offline drafts per mobile architecture doc
