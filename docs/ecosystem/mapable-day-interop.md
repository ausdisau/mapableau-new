# MapAble Day interoperability (preview)

Canonical Day work lives in [ausdisau/MapAble PR #32](https://github.com/ausdisau/MapAble/pull/32). This repository does **not** ship `/dashboard/day` on the current feature branch baseline.

## Hub behaviour

- Ecosystem service `day` is labelled **planned** with `href: null`.
- Primary nav shows “My Day (planned)” rather than a broken route.

## Future typed service references

When Day is available, handoffs should carry:

- service identifier
- source record identifier
- participant authority
- required permission
- requested action
- source evidence status
- confirmation requirement
- failure and recovery state
- audit event reference

No silent rescheduling, worker replacement, transport booking, employment disclosure or payment from Day handoffs.
