# MapAble PWA testing checklist

## Install

- [ ] Android Chrome — Add to Home screen
- [ ] iOS Safari / Chrome — Share → Add to Home Screen
- [ ] Desktop Chrome / Edge — Install app from address bar
- [ ] Launch in standalone display mode

## Offline

- [ ] Airplane mode shows offline banner
- [ ] Navigation shows `/offline.html` fallback
- [ ] Sensitive API responses are not cached (check Network tab)
- [ ] Service log draft saves locally and labels as unsent

## Responsive

- [ ] Bottom nav visible on mobile, safe area respected on notched devices
- [ ] No horizontal scroll at 320px width
- [ ] Provider finder list/map toggle works
- [ ] Message composer visible above safe area (keyboard test on device)
- [ ] Map fullscreen control works

## Accessibility

- [ ] Screen reader announces active tab (`aria-current`)
- [ ] Forms have visible labels and error summary on submit failure
- [ ] Status is not colour-only (text + icons)

## Notifications

- [ ] Permission is **not** requested on first page load
- [ ] Permission only after user taps “Turn on notifications” in settings
- [ ] Lock-screen text is privacy-safe (no diagnosis, addresses, plan details)

## Lighthouse targets

- PWA installable where supported
- Accessibility score 95+ on key dashboard and messages routes
- Document performance budget in release notes

## Automated

```bash
pnpm test tests/pwa
pnpm test tests/responsive
pnpm test tests/accessibility
npx tsx scripts/check-pwa-assets.ts
```
