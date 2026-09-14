# Review checklist

- [ ] No security workflow weakening.
- [ ] No new allowlist entries for the seven baseline advisories.
- [ ] `next` critical advisories removed.
- [ ] `sharp` high advisory removed.
- [ ] `maplibre-gl` critical advisory removed.
- [ ] all three `fast-uri` high advisories removed.
- [ ] `pnpm ci:prod-audit` passes for these findings.
- [ ] type-check/build and affected regression tests pass.
- [ ] PR remains independent of NPTM implementation.
